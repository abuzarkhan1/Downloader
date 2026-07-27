package com.videodownloader.app.model

data class VideoFormat(
    val formatId: String,
    val qualityLabel: String, // e.g. "1080p", "720p", "480p"
    val container: String,    // e.g. "mp4", "webm"
    val downloadUrl: String,
    val bitrate: Long = 0L,
    val sizeBytes: Long = 0L,
    val height: Int = 0,
    val width: Int = 0,
    val fps: Int = 0,
    val mimeType: String = "video/mp4",
    val isVideoOnly: Boolean = false
)
