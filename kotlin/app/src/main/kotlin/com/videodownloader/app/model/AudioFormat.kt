package com.videodownloader.app.model

data class AudioFormat(
    val formatId: String,
    val qualityLabel: String, // e.g. "320 kbps", "128 kbps"
    val container: String,    // e.g. "m4a", "mp3", "webm", "wav"
    val downloadUrl: String,
    val bitrate: Long = 0L,
    val sizeBytes: Long = 0L,
    val sampleRate: Int = 44100,
    val mimeType: String = "audio/mp4"
)
