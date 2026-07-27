package com.videodownloader.app.model

data class BatchJob(
    val id: String,
    val title: String,
    val jobs: List<DownloadJob> = emptyList(),
    val status: DownloadStatus = DownloadStatus.PENDING,
    val overallProgressPercent: Int = 0
)
