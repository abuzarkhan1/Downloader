package com.videodownloader.app.model

enum class DownloadStatus {
    PENDING,
    DOWNLOADING,
    PAUSED,
    COMPLETED,
    FAILED,
    CANCELLED
}

data class DownloadJob(
    val id: String,
    val title: String,
    val downloadUrl: String,
    val destinationFileName: String,
    val mimeType: String,
    val totalBytes: Long = 0L,
    val downloadedBytes: Long = 0L,
    val status: DownloadStatus = DownloadStatus.PENDING,
    val progressPercent: Int = 0,
    val errorMessage: String? = null,
    val localUri: String? = null
)
