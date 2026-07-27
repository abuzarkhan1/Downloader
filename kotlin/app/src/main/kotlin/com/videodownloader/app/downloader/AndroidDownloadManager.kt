package com.videodownloader.app.downloader

import android.app.NotificationManager
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.app.NotificationCompat
import com.videodownloader.app.extractor.MediaExtractor
import com.videodownloader.app.model.DownloadJob
import com.videodownloader.app.model.DownloadStatus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

class AndroidDownloadManager(private val context: Context) {

    private val client = OkHttpClient.Builder()
        .connectTimeout(45, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .followRedirects(true)
        .build()

    private val activeJobs = ConcurrentHashMap<String, DownloadJob>()
    private val cancelledJobIds = ConcurrentHashMap.newKeySet<String>()

    private val _jobsState = MutableStateFlow<List<DownloadJob>>(emptyList())
    val jobsState: StateFlow<List<DownloadJob>> = _jobsState.asStateFlow()

    suspend fun enqueueDownload(
        id: String,
        title: String,
        downloadUrl: String,
        fileName: String,
        mimeType: String,
        onProgress: ((DownloadJob) -> Unit)? = null
    ): Result<Uri> = withContext(Dispatchers.IO) {

        val initialJob = DownloadJob(
            id = id, title = title, downloadUrl = downloadUrl,
            destinationFileName = fileName, mimeType = mimeType,
            status = DownloadStatus.DOWNLOADING
        )
        activeJobs[id] = initialJob
        updateStateFlow()
        startForegroundService(title, 0)

        try {
            // ── Resolve the actual stream URL ──
            var streamUrl = downloadUrl

            if (streamUrl.isBlank()) {
                throw Exception("Download URL is empty. Cannot start download.")
            }

            if (isWebpageUrl(streamUrl)) {
                // Re-extract with a DIFFERENT approach: try to get a direct CDN link
                val meta = try {
                    MediaExtractor.extractMediaInfo(streamUrl, true)
                } catch (_: Exception) { null }

                val direct = if (mimeType.startsWith("audio")) {
                    meta?.audioFormats
                        ?.firstOrNull { it.downloadUrl.isNotBlank() && !isWebpageUrl(it.downloadUrl) }
                        ?.downloadUrl
                } else {
                    meta?.videoFormats
                        ?.firstOrNull { it.downloadUrl.isNotBlank() && !isWebpageUrl(it.downloadUrl) }
                        ?.downloadUrl
                }

                if (!direct.isNullOrBlank()) {
                    streamUrl = direct
                } else {
                    throw Exception(
                        "Could not resolve a direct media stream from this link. " +
                        "The source may be unavailable or the extraction service is temporarily down."
                    )
                }
            }

            // ── Build request with proper headers ──
            val referer = when {
                streamUrl.contains("instagram") || streamUrl.contains("cdninstagram") -> "https://www.instagram.com/"
                streamUrl.contains("tiktok") || streamUrl.contains("tiktokcdn") ||
                streamUrl.contains("v16m") || streamUrl.contains("akamaized") -> "https://www.tiktok.com/"
                streamUrl.contains("twitter") || streamUrl.contains("twimg") -> "https://twitter.com/"
                streamUrl.contains("facebook") || streamUrl.contains("fbcdn") -> "https://www.facebook.com/"
                streamUrl.contains("youtube") || streamUrl.contains("googlevideo") -> "https://www.youtube.com/"
                else -> try {
                    val p = android.net.Uri.parse(streamUrl)
                    if (p.scheme != null && p.host != null) "${p.scheme}://${p.host}" else "https://www.google.com/"
                } catch (_: Exception) { "https://www.google.com/" }
            }

            val request = Request.Builder()
                .url(streamUrl)
                .header("User-Agent", "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36")
                .header("Referer", referer)
                .header("Accept", "*/*")
                .header("Accept-Language", "en-US,en;q=0.9")
                .build()

            val response = client.newCall(request).execute()

            if (!response.isSuccessful) {
                val errReason = when (response.code) {
                    403 -> "Media access forbidden (403). Link may have expired."
                    404 -> "Media stream not found (404)."
                    429 -> "Server rate limit exceeded. Please wait a moment."
                    500, 502, 503 -> "Server error (${response.code})."
                    else -> "Download connection error (${response.code})"
                }
                throw Exception(errReason)
            }

            val body = response.body ?: throw Exception("Empty response body")
            val contentType = body.contentType()?.toString()?.lowercase() ?: ""

            if (contentType.contains("text/html")) {
                throw Exception("Received HTML page instead of media. The stream link may have expired.")
            }

            val totalBytes = body.contentLength()

            // ── Determine output location ──
            val outputStream: OutputStream
            val savedUri: Uri
            var targetFile: File? = null

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val resolver = context.contentResolver
                val subDir = if (mimeType.startsWith("audio")) Environment.DIRECTORY_MUSIC
                             else Environment.DIRECTORY_MOVIES
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
                    put(MediaStore.MediaColumns.RELATIVE_PATH, "$subDir/VideoDownloader")
                    put(MediaStore.MediaColumns.IS_PENDING, 1)
                }
                val mediaCollection = if (mimeType.startsWith("audio"))
                    MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                else
                    MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)

                val uri = resolver.insert(mediaCollection, contentValues)
                    ?: resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                    ?: throw Exception("Failed to create MediaStore entry")

                outputStream = resolver.openOutputStream(uri)
                    ?: throw Exception("Failed to open output stream")
                savedUri = uri
            } else {
                val mediaDir = if (mimeType.startsWith("audio"))
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC)
                else
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES)
                val targetDir = File(mediaDir, "VideoDownloader")
                if (!targetDir.exists()) targetDir.mkdirs()
                val f = File(targetDir, fileName)
                targetFile = f
                outputStream = FileOutputStream(f)
                savedUri = Uri.fromFile(f)
            }

            // ── Stream the download ──
            var downloadedBytes = 0L
            val buffer = ByteArray(32768)
            val inputStream = body.byteStream()
            var lastProgress = 0
            var bytesRead: Int

            outputStream.use { out ->
                inputStream.use { input ->
                    while (input.read(buffer).also { bytesRead = it } != -1) {
                        if (cancelledJobIds.contains(id)) {
                            cancelledJobIds.remove(id)
                            activeJobs[id] = initialJob.copy(status = DownloadStatus.CANCELLED)
                            updateStateFlow()
                            throw Exception("Download cancelled by user")
                        }

                        out.write(buffer, 0, bytesRead)
                        downloadedBytes += bytesRead

                        val progress = if (totalBytes > 0) ((downloadedBytes * 100) / totalBytes).toInt() else 0
                        if (progress != lastProgress) {
                            lastProgress = progress
                            val updatedJob = initialJob.copy(
                                totalBytes = if (totalBytes > 0) totalBytes else downloadedBytes,
                                downloadedBytes = downloadedBytes,
                                progressPercent = progress,
                                status = DownloadStatus.DOWNLOADING
                            )
                            activeJobs[id] = updatedJob
                            updateStateFlow()
                            onProgress?.invoke(updatedJob)
                            updateServiceProgress(title, progress)
                        }
                    }
                }
            }

            if (downloadedBytes < 1024) {
                throw Exception("Download incomplete: only ${downloadedBytes} bytes received")
            }

            // ── Finalize ──
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                try {
                    context.contentResolver.update(
                        savedUri,
                        ContentValues().apply { put(MediaStore.MediaColumns.IS_PENDING, 0) },
                        null, null
                    )
                } catch (_: Exception) {}
            } else {
                targetFile?.let { f ->
                    MediaScannerConnection.scanFile(context, arrayOf(f.absolutePath), arrayOf(mimeType), null)
                }
            }

            val completedJob = initialJob.copy(
                totalBytes = if (totalBytes > 0) totalBytes else downloadedBytes,
                downloadedBytes = downloadedBytes,
                progressPercent = 100,
                status = DownloadStatus.COMPLETED,
                localUri = savedUri.toString()
            )
            activeJobs[id] = completedJob
            updateStateFlow()
            onProgress?.invoke(completedJob)
            stopServiceWithNotification(title, true)

            Result.success(savedUri)

        } catch (e: Exception) {
            val failedJob = initialJob.copy(
                status = DownloadStatus.FAILED,
                errorMessage = e.message ?: "Download failed"
            )
            activeJobs[id] = failedJob
            updateStateFlow()
            onProgress?.invoke(failedJob)
            stopServiceWithNotification(title, false)
            Result.failure(e)
        }
    }

    private fun isWebpageUrl(url: String): Boolean {
        if (url.isBlank()) return false
        val u = url.lowercase()
        val pagePatterns = listOf(
            Regex("""(?:^|//)(?:www\.)?youtube\.com/(?:watch|shorts|embed)"""),
            Regex("""(?:^|//)(?:www\.)?youtu\.be/"""),
            Regex("""(?:^|//)(?:www\.)?tiktok\.com/(?:@|[^/]+/(?:video|photo|live))"""),
            Regex("""(?:^|//)(?:www\.)?(?:instagram\.com|instagr\.am)/(?:p|reel|reels|tv)/"""),
            Regex("""(?:^|//)(?:www\.|mobile\.)?(?:twitter\.com|x\.com)/[^/]+/status"""),
            Regex("""(?:^|//)(?:www\.|m\.)?facebook\.com/.*(?:/videos/|/watch|/reel|fbid=)"""),
            Regex("""(?:^|//)(?:www\.)?fb\.watch/"""),
            Regex("""(?:^|//)(?:www\.)?vimeo\.com/\d"""),
            Regex("""(?:^|//)(?:www\.|old\.|new\.)?reddit\.com/(?:r/|user/)?.*/comments"""),
            Regex("""(?:^|//)(?:www\.)?redd\.it/""")
        )
        return pagePatterns.any { it.containsMatchIn(u) }
    }

    fun cancelDownload(id: String) {
        cancelledJobIds.add(id)
    }

    private fun updateStateFlow() {
        _jobsState.value = activeJobs.values.toList()
    }

    private fun startForegroundService(title: String, progress: Int) {
        try {
            val intent = Intent(context, DownloadForegroundService::class.java).apply {
                putExtra("title", title)
                putExtra("progress", progress)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent)
            else context.startService(intent)
        } catch (_: Exception) {}
    }

    private fun updateServiceProgress(title: String, progress: Int) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        val notification = NotificationCompat.Builder(context, "video_downloader_channel")
            .setContentTitle("Downloading: $title")
            .setContentText("$progress%")
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setProgress(100, progress, false)
            .setOngoing(true)
            .build()
        nm?.notify(1001, notification)
    }

    private fun stopServiceWithNotification(title: String, success: Boolean) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        val notification = NotificationCompat.Builder(context, "video_downloader_channel")
            .setContentTitle(title)
            .setContentText(if (success) "Download completed" else "Download failed")
            .setSmallIcon(if (success) android.R.drawable.stat_sys_download_done else android.R.drawable.ic_dialog_alert)
            .setAutoCancel(true)
            .build()
        nm?.notify((System.currentTimeMillis() % 10000).toInt(), notification)
        context.stopService(Intent(context, DownloadForegroundService::class.java))
    }
}
