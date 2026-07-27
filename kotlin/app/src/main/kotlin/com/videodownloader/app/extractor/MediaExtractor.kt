package com.videodownloader.app.extractor

import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.videodownloader.app.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.FormBody
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.net.URLEncoder
import java.util.UUID
import java.util.concurrent.TimeUnit
import java.util.regex.Pattern

object MediaExtractor {

    private const val USER_AGENT_MOBILE = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36"
    private const val USER_AGENT_IOS    = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"

    private val client = OkHttpClient.Builder()
        .connectTimeout(25, TimeUnit.SECONDS)
        .readTimeout(25, TimeUnit.SECONDS)
        .followRedirects(true)
        .build()

    private val youtubePattern   = Pattern.compile("(?:youtube\\.com/(?:watch\\?.*v=|shorts/|embed/)|youtu\\.be/)([a-zA-Z0-9_-]+)", Pattern.CASE_INSENSITIVE)
    private val tiktokPattern    = Pattern.compile("tiktok\\.com", Pattern.CASE_INSENSITIVE)
    private val instagramPattern = Pattern.compile("instagram\\.com|instagr\\.am", Pattern.CASE_INSENSITIVE)
    private val facebookPattern  = Pattern.compile("facebook\\.com|fb\\.watch|fb\\.com", Pattern.CASE_INSENSITIVE)
    private val twitterPattern   = Pattern.compile("twitter\\.com|x\\.com", Pattern.CASE_INSENSITIVE)
    private val vimeoPattern     = Pattern.compile("vimeo\\.com", Pattern.CASE_INSENSITIVE)
    private val redditPattern    = Pattern.compile("reddit\\.com|redd\\.it", Pattern.CASE_INSENSITIVE)

    suspend fun extractMediaInfo(url: String, removeWatermark: Boolean = true): MediaMetadata =
        withContext(Dispatchers.IO) {
            val cleanUrl = url.trim()
            val jobId = "job_" + UUID.randomUUID().toString().take(10)
            when {
                youtubePattern.matcher(cleanUrl).find()   -> extractYouTube(jobId, cleanUrl)
                tiktokPattern.matcher(cleanUrl).find()    -> extractTikTok(jobId, cleanUrl, removeWatermark)
                instagramPattern.matcher(cleanUrl).find() -> extractInstagram(jobId, cleanUrl)
                facebookPattern.matcher(cleanUrl).find()  -> extractFacebook(jobId, cleanUrl)
                twitterPattern.matcher(cleanUrl).find()   -> extractTwitter(jobId, cleanUrl)
                vimeoPattern.matcher(cleanUrl).find()     -> extractVimeo(jobId, cleanUrl)
                redditPattern.matcher(cleanUrl).find()    -> extractReddit(jobId, cleanUrl)
                else -> extractGenericWebMedia(jobId, cleanUrl)
            }
        }

    // ── 1. INSTAGRAM EXTRACTOR ───────────────────────────────────────────────
    private fun extractInstagramShortcode(url: String): String? {
        val pattern = Pattern.compile("(?:instagram\\.com|instagr\\.am)/(?:p|reel|reels|tv)/([a-zA-Z0-9_-]+)", Pattern.CASE_INSENSITIVE)
        val matcher = pattern.matcher(url)
        return if (matcher.find()) matcher.group(1) else null
    }

    private fun extractInstagram(jobId: String, url: String): MediaMetadata {
        var title = ""
        var author = ""
        var thumbnailUrl = ""
        var videoStreamUrl = ""
        var durationSeconds = 60L

        val shortcode = extractInstagramShortcode(url)

        // Layer 1: DDInstagram Meta Parser
        if (shortcode != null) {
            try {
                val ddHtml = fetchHtmlOrNull("https://ddinstagram.com/p/$shortcode", USER_AGENT_MOBILE)
                if (ddHtml != null) {
                    title = extractMetaProperty(ddHtml, "og:title") ?: ""
                    thumbnailUrl = extractMetaProperty(ddHtml, "og:image") ?: ""
                    val metaVideo = extractMetaProperty(ddHtml, "og:video")
                        ?: extractMetaProperty(ddHtml, "og:video:secure_url")
                    if (!metaVideo.isNullOrBlank()) videoStreamUrl = metaVideo
                }
            } catch (_: Exception) {}
        }

        // Layer 2: Instagram Embed HTML JSON Parsing
        if (videoStreamUrl.isBlank() && shortcode != null) {
            try {
                val embedHtml = fetchHtmlOrNull("https://www.instagram.com/p/$shortcode/embed/captioned/", USER_AGENT_IOS)
                if (embedHtml != null) {
                    val videoRegex = Regex(""""video_url"\s*:\s*"([^"]+)"""")
                    val match = videoRegex.find(embedHtml)
                    if (match != null) {
                        videoStreamUrl = match.groupValues[1].replace("\\u0026", "&").replace("\\/", "/")
                    }
                    if (title.isBlank()) {
                        val titleMatch = Regex(""""caption"\s*:\s*"([^"]+)"""").find(embedHtml)
                        if (titleMatch != null) title = titleMatch.groupValues[1].replace("\\n", " ")
                    }
                    if (thumbnailUrl.isBlank()) {
                        val thumbMatch = Regex(""""display_url"\s*:\s*"([^"]+)"""").find(embedHtml)
                        if (thumbMatch != null) thumbnailUrl = thumbMatch.groupValues[1].replace("\\u0026", "&").replace("\\/", "/")
                    }
                }
            } catch (_: Exception) {}
        }

        // Layer 3: oEmbed API Fallback
        if (title.isBlank() || thumbnailUrl.isBlank()) {
            try {
                val oembedJson = fetchJsonOrNull("https://api.instagram.com/oembed?url=${URLEncoder.encode(url, "UTF-8")}")
                if (oembedJson != null) {
                    if (title.isBlank()) title = oembedJson.get("title")?.asString ?: ""
                    if (author.isBlank()) author = oembedJson.get("author_name")?.asString ?: ""
                    if (thumbnailUrl.isBlank()) thumbnailUrl = oembedJson.get("thumbnail_url")?.asString ?: ""
                }
            } catch (_: Exception) {}
        }

        if (thumbnailUrl.isBlank() && shortcode != null) {
            thumbnailUrl = "https://www.instagram.com/p/$shortcode/media/?size=l"
        }

        if (title.isBlank()) title = "Instagram Reel"
        if (author.isBlank()) author = "Instagram User"

        val videoFormats = createStandardVideoFormats(videoStreamUrl.ifBlank { url }, "")
        val audioFormats = createStandardAudioFormats(videoStreamUrl.ifBlank { url })

        return MediaMetadata(
            id = jobId, title = title, description = "Instagram Reel Content",
            thumbnailUrl = thumbnailUrl, sourceUrl = url,
            platform = PlatformType.INSTAGRAM, durationSeconds = durationSeconds,
            author = author, videoFormats = videoFormats,
            audioFormats = audioFormats, subtitles = emptyList()
        )
    }

    // ── 2. YOUTUBE EXTRACTOR (Native InnerTube MWEB + Public Mirrors) ────────
    private fun extractYouTube(jobId: String, url: String): MediaMetadata {
        val matcher = youtubePattern.matcher(url)
        val videoId = if (matcher.find()) matcher.group(1) else ""

        var title = ""
        var author = ""
        var thumbnailUrl = ""
        var videoStreamUrl = ""
        var audioStreamUrl = ""
        var durationSeconds = 180L

        val videoStreamUrls = mutableListOf<Pair<String, String>>()
        val audioStreamUrls = mutableListOf<Pair<String, String>>()

        if (videoId.isNotBlank()) {
            // Layer 1: Native InnerTube MWEB Payload (Resolves direct device-bound MP4 stream URL)
            try {
                val jsonPayload = JsonObject().apply {
                    addProperty("videoId", videoId)
                    val ctx = JsonObject()
                    val clientObj = JsonObject().apply {
                        addProperty("clientName", "MWEB")
                        addProperty("clientVersion", "2.20240501.00.00")
                        addProperty("hl", "en")
                        addProperty("gl", "US")
                    }
                    ctx.add("client", clientObj)
                    add("context", ctx)
                }.toString()

                val reqBody = jsonPayload.toRequestBody("application/json".toMediaTypeOrNull())
                val request = Request.Builder()
                    .url("https://www.youtube.com/youtubei/v1/player")
                    .post(reqBody)
                    .header("User-Agent", USER_AGENT_MOBILE)
                    .header("Referer", "https://www.youtube.com/")
                    .build()

                client.newCall(request).execute().use { resp ->
                    if (resp.isSuccessful) {
                        val bodyStr = resp.body?.string()
                        if (!bodyStr.isNullOrBlank()) {
                            val jsonObj = JsonParser.parseString(bodyStr).asJsonObject
                            if (jsonObj.has("videoDetails")) {
                                val details = jsonObj.getAsJsonObject("videoDetails")
                                if (title.isBlank()) title = details.get("title")?.asString ?: ""
                                if (author.isBlank()) author = details.get("author")?.asString ?: ""
                                if (details.has("lengthSeconds")) durationSeconds = details.get("lengthSeconds")?.asLong ?: 180L
                            }
                            if (jsonObj.has("streamingData")) {
                                val streaming = jsonObj.getAsJsonObject("streamingData")
                                if (streaming.has("formats")) {
                                    val formatsArr = streaming.getAsJsonArray("formats")
                                    for (f in formatsArr) {
                                        if (f.isJsonObject) {
                                            val u = f.asJsonObject.get("url")?.asString
                                            val q = f.asJsonObject.get("qualityLabel")?.asString ?: "480p"
                                            if (!u.isNullOrBlank()) {
                                                videoStreamUrls.add(u to q)
                                                if (videoStreamUrl.isBlank()) videoStreamUrl = u
                                            }
                                        }
                                    }
                                }
                                if (streaming.has("adaptiveFormats")) {
                                    val adaptArr = streaming.getAsJsonArray("adaptiveFormats")
                                    for (f in adaptArr) {
                                        if (f.isJsonObject) {
                                            val obj = f.asJsonObject
                                            val mime = obj.get("mimeType")?.asString ?: ""
                                            val u = obj.get("url")?.asString
                                            if (!u.isNullOrBlank()) {
                                                if (mime.contains("audio")) {
                                                    val bitrate = obj.get("bitrate")?.asLong ?: 128000L
                                                    audioStreamUrls.add(u to "${bitrate / 1000}kbps")
                                                    if (audioStreamUrl.isBlank()) audioStreamUrl = u
                                                } else if (mime.contains("video/mp4")) {
                                                    val q = obj.get("qualityLabel")?.asString ?: "720p"
                                                    videoStreamUrls.add(u to q)
                                                    if (videoStreamUrl.isBlank()) videoStreamUrl = u
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (_: Exception) {}

            // Layer 2: Public Mirror Fallbacks (Piped & Invidious)
            if (videoStreamUrls.isEmpty()) {
                val mirrors = listOf(
                    "https://api.piped.video/streams/$videoId",
                    "https://pipedapi.kavin.rocks/streams/$videoId",
                    "https://pipedapi.adminforge.de/streams/$videoId",
                    "https://pipedapi.reallyaweso.me/streams/$videoId",
                    "https://inv.nadeko.net/api/v1/videos/$videoId",
                    "https://inv.tux.pizza/api/v1/videos/$videoId",
                    "https://invidious.flokinet.to/api/v1/videos/$videoId",
                    "https://yewtu.be/api/v1/videos/$videoId"
                )

                for (m in mirrors) {
                    try {
                        val json = fetchJsonOrNull(m) ?: continue

                        if (title.isBlank()) title = json.get("title")?.asString ?: ""
                        if (author.isBlank()) author = json.get("uploader")?.asString ?: ""
                        if (thumbnailUrl.isBlank()) thumbnailUrl = json.get("thumbnailUrl")?.asString ?: ""
                        if (json.has("duration")) durationSeconds = json.get("duration")?.asLong ?: 180L

                        if (json.has("videoStreams")) {
                            val streams = json.getAsJsonArray("videoStreams")
                            for (s in streams) {
                                if (!s.isJsonObject) continue
                                val obj = s.asJsonObject
                                val u = obj.get("url")?.asString ?: continue
                                if (u.isBlank()) continue
                                val q = obj.get("quality")?.asString ?: ""
                                val mimeType = obj.get("mimeType")?.asString ?: ""
                                val isVideoOnly = q.contains("video only", true) ||
                                        (mimeType.contains("video/webm") && !mimeType.contains("audio"))
                                if (!isVideoOnly && u.isNotBlank()) {
                                    videoStreamUrls.add(u to q)
                                }
                            }
                        }

                        if (json.has("audioStreams")) {
                            val aStreams = json.getAsJsonArray("audioStreams")
                            for (s in aStreams) {
                                if (!s.isJsonObject) continue
                                val obj = s.asJsonObject
                                val u = obj.get("url")?.asString ?: continue
                                if (u.isBlank()) continue
                                val bitrate = obj.get("bitrate")?.asLong ?: 0L
                                audioStreamUrls.add(u to "${bitrate / 1000}kbps")
                            }
                        }

                        if (videoStreamUrls.isNotEmpty()) break
                    } catch (_: Exception) {}
                }
            }
        }

        // Layer 3: oEmbed API Fallback for metadata
        if (title.isBlank() || author.isBlank()) {
            try {
                val oembedUrl = "https://www.youtube.com/oembed?url=${URLEncoder.encode(url, "UTF-8")}&format=json"
                val oembedJson = fetchJsonOrNull(oembedUrl)
                if (oembedJson != null) {
                    if (title.isBlank()) title = oembedJson.get("title")?.asString ?: ""
                    if (author.isBlank()) author = oembedJson.get("author_name")?.asString ?: ""
                    if (thumbnailUrl.isBlank()) thumbnailUrl = oembedJson.get("thumbnail_url")?.asString ?: ""
                }
            } catch (_: Exception) {}
        }

        if (title.isBlank()) title = if (videoId.isNotBlank()) "YouTube Video ($videoId)" else "YouTube Video"
        if (author.isBlank()) author = "YouTube Channel"
        if (thumbnailUrl.isBlank() && videoId.isNotBlank())
            thumbnailUrl = "https://img.youtube.com/vi/$videoId/hqdefault.jpg"

        val videoFormats = if (videoStreamUrls.isNotEmpty()) {
            videoStreamUrls.mapIndexed { i, (streamUrl, quality) ->
                val label = when {
                    quality.contains("1080") -> "1080p HD"
                    quality.contains("720")  -> "720p HD"
                    quality.contains("480")  -> "480p"
                    quality.contains("360")  -> "360p"
                    else -> quality.ifBlank { "Quality ${i + 1}" }
                }
                VideoFormat(
                    formatId = "yt_v_$i", qualityLabel = label, container = "mp4",
                    downloadUrl = streamUrl, bitrate = 0L, sizeBytes = 0L,
                    height = Regex("(\\d+)p").find(quality)?.groupValues?.get(1)?.toIntOrNull() ?: 0,
                    width = 0, fps = 30, mimeType = "video/mp4"
                )
            }.take(5)
        } else {
            createStandardVideoFormats(videoStreamUrl.ifBlank { url }, "")
        }

        val audioFormats = if (audioStreamUrls.isNotEmpty()) {
            audioStreamUrls.mapIndexed { i, (streamUrl, quality) ->
                AudioFormat(
                    formatId = "yt_a_$i", qualityLabel = quality.ifBlank { "Audio ${i + 1}" },
                    container = "m4a", downloadUrl = streamUrl, bitrate = 0L, sizeBytes = 0L,
                    mimeType = "audio/mp4"
                )
            }.take(3)
        } else {
            createStandardAudioFormats(audioStreamUrl.ifBlank { videoStreamUrl.ifBlank { url } })
        }

        val subtitles = listOf(
            SubtitleOption("en", "English", "https://youtube.com/sub?lang=en", "vtt", false),
            SubtitleOption("ur", "Urdu (اردو)", "https://youtube.com/sub?lang=ur", "vtt", false)
        )

        return MediaMetadata(
            id = jobId, title = title, description = "YouTube Video Content",
            thumbnailUrl = thumbnailUrl, sourceUrl = url,
            platform = PlatformType.YOUTUBE, durationSeconds = durationSeconds,
            author = author, videoFormats = videoFormats,
            audioFormats = audioFormats, subtitles = subtitles
        )
    }

    // ── 3. TIKTOK EXTRACTOR ───────────────────────────────────────────────────
    private fun extractTikTok(jobId: String, url: String, removeWatermark: Boolean): MediaMetadata {
        var title = ""
        var author = ""
        var thumbnailUrl = ""
        var videoStreamUrl = ""
        var audioStreamUrl = ""
        var durationSeconds = 45L

        try {
            val body = FormBody.Builder().add("url", url).build()
            val req = Request.Builder()
                .url("https://www.tikwm.com/api/")
                .post(body)
                .header("User-Agent", USER_AGENT_MOBILE)
                .build()
            client.newCall(req).execute().use { resp ->
                if (resp.isSuccessful) {
                    val jsonStr = resp.body?.string()
                    if (!jsonStr.isNullOrBlank()) {
                        val obj = JsonParser.parseString(jsonStr).asJsonObject
                        if (obj.get("code")?.asInt == 0 && obj.has("data")) {
                            val data = obj.getAsJsonObject("data")
                            title = data.get("title")?.asString ?: ""
                            thumbnailUrl = data.get("cover")?.asString ?: ""
                            durationSeconds = data.get("duration")?.asLong ?: 45L
                            if (data.has("author") && data.get("author").isJsonObject) {
                                author = data.getAsJsonObject("author").get("nickname")?.asString ?: ""
                            }
                            val playUrl = if (removeWatermark)
                                data.get("play")?.asString ?: data.get("hdplay")?.asString
                            else
                                data.get("wmplay")?.asString
                            if (!playUrl.isNullOrBlank()) videoStreamUrl = playUrl
                            val musicUrl = data.get("music")?.asString
                            if (!musicUrl.isNullOrBlank()) audioStreamUrl = musicUrl
                        }
                    }
                }
            }
        } catch (_: Exception) {}

        if (title.isBlank() || thumbnailUrl.isBlank()) {
            try {
                val oembedUrl = "https://www.tiktok.com/oembed?url=${URLEncoder.encode(url, "UTF-8")}"
                val oembedJson = fetchJsonOrNull(oembedUrl)
                if (oembedJson != null) {
                    if (title.isBlank()) title = oembedJson.get("title")?.asString ?: ""
                    if (author.isBlank()) author = oembedJson.get("author_name")?.asString ?: ""
                    if (thumbnailUrl.isBlank()) thumbnailUrl = oembedJson.get("thumbnail_url")?.asString ?: ""
                }
            } catch (_: Exception) {}
        }

        val tag = if (removeWatermark) " (No Watermark)" else ""
        if (title.isBlank()) title = "TikTok Video$tag"
        if (author.isBlank()) author = "TikTok Creator"

        val videoFormats = createStandardVideoFormats(videoStreamUrl.ifBlank { url }, tag)
        val audioFormats = createStandardAudioFormats(audioStreamUrl.ifBlank { videoStreamUrl.ifBlank { url } })

        return MediaMetadata(
            id = jobId, title = title, description = "TikTok Content",
            thumbnailUrl = thumbnailUrl, sourceUrl = url,
            platform = PlatformType.TIKTOK, durationSeconds = durationSeconds,
            author = author, videoFormats = videoFormats,
            audioFormats = audioFormats, subtitles = emptyList()
        )
    }

    // ── 4. TWITTER / X EXTRACTOR ──────────────────────────────────────────────
    private fun extractTwitterTweetId(url: String): String? {
        val pattern = Pattern.compile("(?:twitter\\.com|x\\.com)/(?:[^/]+/status|status)/(\\d+)", Pattern.CASE_INSENSITIVE)
        val matcher = pattern.matcher(url)
        return if (matcher.find()) matcher.group(1) else null
    }

    private fun extractTwitter(jobId: String, url: String): MediaMetadata {
        var title = ""; var author = ""; var thumbnailUrl = ""; var videoStreamUrl = ""
        val tweetId = extractTwitterTweetId(url)

        if (tweetId != null) {
            for (m in listOf("https://api.fxtwitter.com/status/$tweetId", "https://api.fixupx.com/status/$tweetId")) {
                try {
                    val fxJson = fetchJsonOrNull(m) ?: continue
                    if (!fxJson.has("tweet")) continue
                    val tweet = fxJson.getAsJsonObject("tweet")
                    title = tweet.get("text")?.asString ?: ""
                    if (tweet.has("author")) author = tweet.getAsJsonObject("author").get("name")?.asString ?: ""
                    if (tweet.has("media")) {
                        val media = tweet.getAsJsonObject("media")
                        if (media.has("videos") && media.getAsJsonArray("videos").size() > 0) {
                            val v = media.getAsJsonArray("videos")[0].asJsonObject
                            videoStreamUrl = v.get("url")?.asString ?: ""
                            if (thumbnailUrl.isBlank()) thumbnailUrl = v.get("thumbnail_url")?.asString ?: ""
                        }
                    }
                    if (videoStreamUrl.isNotBlank()) break
                } catch (_: Exception) {}
            }
        }

        if (title.isBlank()) title = "Twitter Video"
        if (author.isBlank()) author = "Twitter User"

        val videoFormats = createStandardVideoFormats(videoStreamUrl.ifBlank { url }, "")
        val audioFormats = createStandardAudioFormats(videoStreamUrl.ifBlank { url })

        return MediaMetadata(
            id = jobId, title = title, description = "Twitter Media",
            thumbnailUrl = thumbnailUrl, sourceUrl = url,
            platform = PlatformType.TWITTER, durationSeconds = 60L,
            author = author, videoFormats = videoFormats,
            audioFormats = audioFormats, subtitles = emptyList()
        )
    }

    // ── 5. FACEBOOK EXTRACTOR ─────────────────────────────────────────────────
    private fun extractFacebook(jobId: String, url: String): MediaMetadata {
        var title = ""; var author = ""; var thumbnailUrl = ""; var videoStreamUrl = ""
        val html = fetchHtmlOrNull(url, USER_AGENT_MOBILE)
        if (html != null) {
            title = extractMetaProperty(html, "og:title") ?: extractTitleTag(html) ?: ""
            author = extractMetaProperty(html, "og:article:author") ?: ""
            thumbnailUrl = extractMetaProperty(html, "og:image") ?: ""
            videoStreamUrl = extractMetaProperty(html, "og:video:secure_url")
                ?: extractMetaProperty(html, "og:video") ?: ""
        }
        if (title.isBlank()) title = "Facebook Video"
        if (author.isBlank()) author = "Facebook Page"

        val videoFormats = createStandardVideoFormats(videoStreamUrl.ifBlank { url }, "")
        val audioFormats = createStandardAudioFormats(videoStreamUrl.ifBlank { url })

        return MediaMetadata(
            id = jobId, title = title, description = "Facebook Video",
            thumbnailUrl = thumbnailUrl, sourceUrl = url,
            platform = PlatformType.FACEBOOK, durationSeconds = 120L,
            author = author, videoFormats = videoFormats,
            audioFormats = audioFormats, subtitles = emptyList()
        )
    }

    // ── 6. VIMEO & REDDIT & GENERIC ───────────────────────────────────────────
    private fun extractVimeo(jobId: String, url: String): MediaMetadata {
        var title = ""; var author = ""; var thumbnailUrl = ""; var durationSeconds = 120L
        try {
            val json = fetchJsonOrNull("https://vimeo.com/api/oembed.json?url=${URLEncoder.encode(url, "UTF-8")}")
            if (json != null) {
                title = json.get("title")?.asString ?: ""
                author = json.get("author_name")?.asString ?: ""
                thumbnailUrl = json.get("thumbnail_url")?.asString ?: ""
                durationSeconds = json.get("duration")?.asLong ?: 120L
            }
        } catch (_: Exception) {}
        if (title.isBlank()) title = "Vimeo Video"
        if (author.isBlank()) author = "Vimeo Creator"

        return MediaMetadata(
            id = jobId, title = title, description = "Vimeo Video",
            thumbnailUrl = thumbnailUrl, sourceUrl = url,
            platform = PlatformType.VIMEO, durationSeconds = durationSeconds,
            author = author, videoFormats = createStandardVideoFormats(url),
            audioFormats = createStandardAudioFormats(url), subtitles = emptyList()
        )
    }

    private fun extractReddit(jobId: String, url: String): MediaMetadata {
        var title = ""; var author = ""; var thumbnailUrl = ""; var videoStreamUrl = ""
        val html = fetchHtmlOrNull(url, USER_AGENT_MOBILE)
        if (html != null) {
            title = extractMetaProperty(html, "og:title") ?: extractTitleTag(html) ?: ""
            author = extractMetaProperty(html, "author") ?: ""
            thumbnailUrl = extractMetaProperty(html, "og:image") ?: ""
            videoStreamUrl = extractMetaProperty(html, "og:video:secure_url")
                ?: extractMetaProperty(html, "og:video") ?: ""
        }
        if (title.isBlank()) title = "Reddit Post"
        if (author.isBlank()) author = "Reddit User"

        val videoFormats = createStandardVideoFormats(videoStreamUrl.ifBlank { url }, "")
        val audioFormats = createStandardAudioFormats(videoStreamUrl.ifBlank { url })

        return MediaMetadata(
            id = jobId, title = title, description = "Reddit Media",
            thumbnailUrl = thumbnailUrl, sourceUrl = url,
            platform = PlatformType.REDDIT, durationSeconds = 60L,
            author = author, videoFormats = videoFormats,
            audioFormats = audioFormats, subtitles = emptyList()
        )
    }

    private fun extractGenericWebMedia(jobId: String, url: String): MediaMetadata {
        var title = ""; var author = ""; var thumbnailUrl = ""; var videoStreamUrl = ""
        val html = fetchHtmlOrNull(url, USER_AGENT_MOBILE)
        if (html != null) {
            val jsonLd = parseJsonLd(html)
            if (jsonLd != null) {
                title = jsonLd.get("name")?.asString ?: jsonLd.get("headline")?.asString ?: ""
                author = jsonLd.get("author")?.let {
                    if (it.isJsonObject) it.asJsonObject.get("name")?.asString
                    else if (it.isJsonArray && it.asJsonArray.size() > 0 && it.asJsonArray[0].isJsonObject)
                        it.asJsonArray[0].asJsonObject.get("name")?.asString
                    else null
                } ?: ""
                thumbnailUrl = jsonLd.get("thumbnailUrl")?.let {
                    if (it.isJsonArray && it.asJsonArray.size() > 0) it.asJsonArray[0].asString else it.asString
                } ?: ""
                videoStreamUrl = jsonLd.get("contentUrl")?.asString ?: jsonLd.get("embedUrl")?.asString ?: ""
            }
            if (title.isBlank()) title = extractMetaProperty(html, "og:title") ?: extractTitleTag(html) ?: ""
            if (author.isBlank()) author = extractMetaProperty(html, "author") ?: ""
            if (thumbnailUrl.isBlank()) thumbnailUrl = extractMetaProperty(html, "og:image") ?: ""
            if (videoStreamUrl.isBlank()) {
                videoStreamUrl = extractMetaProperty(html, "og:video:secure_url")
                    ?: extractMetaProperty(html, "og:video") ?: ""
            }
        }
        if (title.isBlank()) title = "Web Media"
        if (author.isBlank()) author = "Web Provider"

        val videoFormats = createStandardVideoFormats(videoStreamUrl.ifBlank { url }, "")
        val audioFormats = createStandardAudioFormats(videoStreamUrl.ifBlank { url })

        return MediaMetadata(
            id = jobId, title = title, description = "Web Media",
            thumbnailUrl = thumbnailUrl, sourceUrl = url,
            platform = PlatformType.GENERIC, durationSeconds = 120L,
            author = author, videoFormats = videoFormats,
            audioFormats = audioFormats, subtitles = emptyList()
        )
    }

    // ── Standard format builders (DO NOT domain-blacklist stream URLs) ────────
    private fun createStandardVideoFormats(downloadUrl: String, labelSuffix: String = ""): List<VideoFormat> {
        val urlToUse = downloadUrl.trim()
        return listOf(
            VideoFormat("1080p", "1080p HD$labelSuffix", "mp4", urlToUse, 4_500_000L, 35 * 1024 * 1024L, 1080, 1920, 30, "video/mp4"),
            VideoFormat("720p",  "720p HD$labelSuffix",  "mp4", urlToUse, 2_200_000L, 18 * 1024 * 1024L, 720,  1280, 30, "video/mp4"),
            VideoFormat("480p",  "480p$labelSuffix",     "mp4", urlToUse, 1_000_000L, 10 * 1024 * 1024L, 480,  854,  30, "video/mp4")
        )
    }

    private fun createStandardAudioFormats(downloadUrl: String): List<AudioFormat> {
        val urlToUse = downloadUrl.trim()
        return listOf(
            AudioFormat("320", "320 kbps", "mp3", urlToUse, 320L, (3.5 * 1024 * 1024).toLong(), 44100, "audio/mpeg"),
            AudioFormat("192", "192 kbps", "mp3", urlToUse, 192L, (2.2 * 1024 * 1024).toLong(), 44100, "audio/mpeg")
        )
    }

    // ── Network helpers ───────────────────────────────────────────────────────
    private fun fetchHtmlOrNull(url: String, userAgent: String = USER_AGENT_MOBILE): String? {
        return try {
            val request = Request.Builder().url(url)
                .header("User-Agent", userAgent)
                .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                .header("Accept-Language", "en-US,en;q=0.9")
                .build()
            client.newCall(request).execute().use { r -> if (r.isSuccessful) r.body?.string() else null }
        } catch (_: Exception) { null }
    }

    private fun fetchJsonOrNull(url: String): JsonObject? {
        return try {
            val request = Request.Builder().url(url)
                .header("User-Agent", USER_AGENT_MOBILE)
                .header("Accept", "application/json")
                .build()
            client.newCall(request).execute().use { r ->
                if (r.isSuccessful) {
                    val body = r.body?.string() ?: return null
                    JsonParser.parseString(body).asJsonObject
                } else null
            }
        } catch (_: Exception) { null }
    }

    private fun extractMetaProperty(html: String, propertyName: String): String? {
        val patterns = listOf(
            """<meta\s+[^>]*property=["']${Pattern.quote(propertyName)}["']\s+[^>]*content=["']([^"']+)["']""",
            """<meta\s+[^>]*content=["']([^"']+)["']\s+[^>]*property=["']${Pattern.quote(propertyName)}["']""",
            """<meta\s+[^>]*name=["']${Pattern.quote(propertyName)}["']\s+[^>]*content=["']([^"']+)["']""",
            """<meta\s+[^>]*content=["']([^"']+)["']\s+[^>]*name=["']${Pattern.quote(propertyName)}["']"""
        )
        for (p in patterns) {
            val match = Regex(p, RegexOption.IGNORE_CASE).find(html)
            if (match != null && match.groupValues[1].isNotBlank()) return match.groupValues[1].unescapeHtml()
        }
        return null
    }

    private fun extractTitleTag(html: String): String? {
        val match = Regex("""<title[^>]*>(.*?)</title>""", setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL)).find(html)
        return match?.groupValues?.get(1)?.trim()?.unescapeHtml()
    }

    private fun parseJsonLd(html: String): JsonObject? {
        val regex = Regex("""<script\s+[^>]*type=["']application/ld\+json["'][^>]*>(.*?)</script>""",
            setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL))
        for (match in regex.findAll(html)) {
            try {
                val el = JsonParser.parseString(match.groupValues[1].trim())
                if (el.isJsonObject) return el.asJsonObject
                if (el.isJsonArray && el.asJsonArray.size() > 0 && el.asJsonArray[0].isJsonObject)
                    return el.asJsonArray[0].asJsonObject
            } catch (_: Exception) {}
        }
        return null
    }

    private fun String.unescapeHtml(): String {
        return replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
            .replace("&quot;", "\"").replace("&#39;", "'").replace("&apos;", "'")
            .replace("&#x27;", "'").replace("&#x2F;", "/").replace("\\/", "/")
    }
}
