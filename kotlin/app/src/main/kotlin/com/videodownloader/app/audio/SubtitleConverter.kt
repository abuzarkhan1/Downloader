package com.videodownloader.app.audio

import java.io.InputStream
import java.lang.StringBuilder

object SubtitleConverter {

    /**
     * Converts SubRip (.srt) or WebVTT (.vtt) text content into clean plain text.
     */
    fun convertToPlainText(rawContent: String): String {
        val lines = rawContent.lines()
        val result = StringBuilder()

        var isVttHeader = true

        for (line in lines) {
            val trimmed = line.trim()

            // Skip WEBVTT header
            if (isVttHeader) {
                if (trimmed.startsWith("WEBVTT") || trimmed.startsWith("Kind:") || trimmed.startsWith("Language:")) {
                    continue
                }
                if (trimmed.isEmpty()) {
                    isVttHeader = false
                    continue
                }
            }

            // Skip numeric cue identifiers
            if (trimmed.matches(Regex("^\\d+$"))) {
                continue
            }

            // Skip timestamps (e.g. 00:00:01,000 --> 00:00:04,000 or 00:00.000 --> 00:04.000)
            if (trimmed.contains("-->")) {
                continue
            }

            // Skip empty lines
            if (trimmed.isEmpty()) {
                continue
            }

            // Strip HTML / Formatting tags like <i>, <b>, <c.color...>, etc.
            val cleanLine = trimmed.replace(Regex("<[^>]*>"), "")

            if (cleanLine.isNotBlank()) {
                result.append(cleanLine).append("\n")
            }
        }

        return result.toString().trim()
    }

    /**
     * Helper to read stream and convert to plain text.
     */
    fun convertStreamToPlainText(inputStream: InputStream): String {
        val rawText = inputStream.bufferedReader().use { it.readText() }
        return convertToPlainText(rawText)
    }
}
