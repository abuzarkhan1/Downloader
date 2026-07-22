# ADR 001: Backend & Mobile Architecture & Compliance Strategy

## Context
The Universal Media Downloader requires multi-platform video/audio format analysis and asynchronous downloading/conversion for YouTube, TikTok, and Instagram, served to a React Native (Expo) mobile app.

## Decisions

1. **Backend Framework & Downloader Engine**:
   - FastAPI (Python 3.11+) for high-performance async API endpoints.
   - `yt-dlp` explicitly pinned version (`yt-dlp==2025.1.26`) for format extraction and downloading.
   - `ffmpeg` for audio extraction (MP3 transcoding) and video remuxing.

2. **Asynchronous Job Processing & TTL Storage**:
   - Celery with Redis broker/backend (with fallback support for FastAPI async BackgroundTasks in standalone local dev).
   - Temporary file storage directory with strict TTL cleanup (< 1 hour auto-delete, immediate deletion option post-download).
   - No permanent server-side media retention per PRD Section 4.4.

3. **Mobile Framework & State**:
   - React Native with Expo (Managed Workflow).
   - React Query for API data fetching and state handling.
   - `expo-file-system` and `expo-media-library` for downloading and saving media to local device gallery/downloads.

4. **Compliance & Rate Limiting**:
   - Mandatory first-launch disclaimer modal with timestamped local persistence (`AsyncStorage`).
   - Token-bucket rate limiting middleware on backend endpoints (IP/device based).
