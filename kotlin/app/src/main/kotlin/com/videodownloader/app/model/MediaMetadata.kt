package com.videodownloader.app.model

enum class PlatformType {
    YOUTUBE,
    TIKTOK,
    INSTAGRAM,
    FACEBOOK,
    TWITTER,
    VIMEO,
    REDDIT,
    GENERIC
}

data class MediaMetadata(
    val id: String,
    val title: String,
    val description: String = "",
    val thumbnailUrl: String = "",
    val sourceUrl: String,
    val platform: PlatformType,
    val durationSeconds: Long = 0L,
    val author: String = "",
    val videoFormats: List<VideoFormat> = emptyList(),
    val audioFormats: List<AudioFormat> = emptyList(),
    val subtitles: List<SubtitleOption> = emptyList()
)
