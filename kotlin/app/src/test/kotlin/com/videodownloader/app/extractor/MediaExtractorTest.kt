package com.videodownloader.app.extractor

import com.videodownloader.app.model.PlatformType
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class MediaExtractorTest {

    @Test
    fun testYouTubeExtraction() = runBlocking {
        val metadata = MediaExtractor.extractMediaInfo("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        assertNotNull(metadata)
        assertEquals(PlatformType.YOUTUBE, metadata.platform)
        assertTrue(metadata.title.isNotBlank())
        assertTrue(metadata.thumbnailUrl.isNotBlank())
        assertTrue(metadata.videoFormats.isNotEmpty())
        assertTrue(metadata.audioFormats.isNotEmpty())
    }

    @Test
    fun testInstagramExtraction() = runBlocking {
        val metadata = MediaExtractor.extractMediaInfo("https://www.instagram.com/reel/C1234567890/")
        assertNotNull(metadata)
        assertEquals(PlatformType.INSTAGRAM, metadata.platform)
        assertTrue(metadata.title.isNotBlank())
        assertTrue(metadata.videoFormats.isNotEmpty())
    }

    @Test
    fun testTikTokExtraction() = runBlocking {
        val metadata = MediaExtractor.extractMediaInfo("https://www.tiktok.com/@tiktok/video/7123456789012345678")
        assertNotNull(metadata)
        assertEquals(PlatformType.TIKTOK, metadata.platform)
        assertTrue(metadata.title.isNotBlank())
        assertTrue(metadata.videoFormats.isNotEmpty())
    }

    @Test
    fun testFacebookExtraction() = runBlocking {
        val metadata = MediaExtractor.extractMediaInfo("https://www.facebook.com/watch/?v=123456789")
        assertNotNull(metadata)
        assertEquals(PlatformType.FACEBOOK, metadata.platform)
        assertTrue(metadata.title.isNotBlank())
        assertTrue(metadata.videoFormats.isNotEmpty())
    }

    @Test
    fun testTwitterExtraction() = runBlocking {
        val metadata = MediaExtractor.extractMediaInfo("https://twitter.com/jack/status/20")
        assertNotNull(metadata)
        assertEquals(PlatformType.TWITTER, metadata.platform)
        assertTrue(metadata.title.isNotBlank())
        assertTrue(metadata.videoFormats.isNotEmpty())
    }

    @Test
    fun testGenericWebExtraction() = runBlocking {
        val metadata = MediaExtractor.extractMediaInfo("https://example.com/video.html")
        assertNotNull(metadata)
        assertEquals(PlatformType.GENERIC, metadata.platform)
        assertTrue(metadata.title.isNotBlank())
        assertTrue(metadata.videoFormats.isNotEmpty())
    }

    @Test
    fun testBatchExtraction() = runBlocking {
        val urls = listOf(
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "https://www.instagram.com/reel/C1234567890/"
        )
        val results = MediaExtractor.extractBatch(urls, removeWatermark = true)
        assertEquals(2, results.size)
        assertEquals(PlatformType.YOUTUBE, results[0].platform)
        assertEquals(PlatformType.INSTAGRAM, results[1].platform)
    }
}
