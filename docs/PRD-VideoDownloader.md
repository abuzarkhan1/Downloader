# Product Requirements Document (PRD)
## Universal Media Downloader (Video + Audio Extraction App)

| Field | Value |
|---|---|
| Document Owner | Product/Founder |
| Version | 1.0 |
| Status | Draft — Source of Truth |
| Last Updated | 2026-07-22 |
| Platforms | React Native (iOS + Android) |
| Backend | Python (FastAPI) + yt-dlp |

---

## 1. Executive Summary

A mobile application that allows a user to paste a link from a supported platform (YouTube, TikTok, Instagram, and other yt-dlp-supported sites) and:

1. Fetch all available video qualities (144p → 2160p/4K, whatever the source provides), and
2. Extract and download audio only (MP3).

The user submits a URL, the app queries the backend, the backend inspects the source and returns available formats, and the user picks one to download.

---

## 2. Problem Statement

Users frequently want to save video/audio content they've already legitimately viewed (e.g., their own uploads, content shared with permission, or content under fair-use/personal-archiving norms) for offline access, but:

- Native apps (YouTube, Instagram, TikTok) do not allow direct downloads in most regions/content types.
- Existing third-party downloader web tools are ad-heavy, unreliable, and often get taken down.
- No single consistent tool handles multiple platforms with quality selection AND audio extraction in one flow.

---

## 3. Goals & Non-Goals

### 3.1 Goals
- Single link input → multi-format detection → user-selected download.
- Support **YouTube, TikTok, Instagram** at launch (P0). Extend to other yt-dlp-supported platforms as P1/P2 (Twitter/X, Facebook, Vimeo, SoundCloud, Reddit).
- Quality ladder: auto-detect and expose all resolutions the source has (144p–2160p), never fabricate qualities that don't exist in the source.
- Audio-only extraction to MP3 regardless of source platform.
- Fast perceived performance: format list returned in <5s for 90% of links.

### 3.2 Non-Goals (v1)
- No bulk/batch downloading (playlists, channels) in v1.
- No user accounts / social features in v1.
- No built-in media player/editor in v1 (only download → save to device).
- No web version in v1 (mobile-only scope per current decision).
- No livestream capture in v1.

---

## 4. CRITICAL — Legal & Compliance Section (Read First)

**This section overrides feature ambition wherever they conflict. Non-negotiable.**

### 4.1 Platform Terms of Service
YouTube, Instagram, and TikTok's Terms of Service each **prohibit downloading content** through unauthorized means, regardless of the app's own intent or personal-use framing. Building and distributing an app whose core function is circumventing this:
- Risks **cease-and-desist letters**, DMCA-style takedowns of the app/repo, and account/API bans if using official APIs elsewhere.
- Risks **app store rejection**. Both Apple App Store and Google Play routinely reject or remove apps whose primary function is downloading third-party copyrighted video content (search history: Y2Mate, TubeMate, SnapTik-style apps are banned from both stores; they distribute via APK sideload or web only).
- **Practical implication**: this app will almost certainly not be approved on Google Play or the Apple App Store under its current description. Plan for **sideloaded APK distribution** (Android only, outside Play Store) if this is meant for wide release, or treat as a **personal/internal tool** with a small, known user base.

### 4.2 Copyright
- Downloading copyrighted content you don't own or have rights to may constitute copyright infringement in most jurisdictions, independent of whether the platform's ToS is enforced.
- The app itself does not host infringing content (it's a pass-through tool), which reduces — but does not eliminate — direct liability. Contributory liability risk still exists if the app is marketed as a piracy tool.
- **Recommendation**: position and market the app strictly as a personal-archive/offline-access tool for content the user owns or has explicit rights to (own uploads, Creative Commons content, permitted shares). Add in-app disclaimers (see 4.4).

### 4.3 Regional Legal Variance
- Some countries (e.g., Germany) have stricter private-copy exceptions than others; some have none. Do not assume "personal use" is a blanket legal defense anywhere.
- If targeting Pakistan specifically: no dedicated case law on downloader apps currently known; general copyright law (Copyright Ordinance 1962, as amended) still applies to unauthorized reproduction/distribution of copyrighted works.

### 4.4 Required Product Mitigations
These are **product requirements**, not optional legal fluff:
- [ ] In-app disclaimer on first launch: user must acknowledge they will only download content they own or are authorized to use (checkbox, logged with timestamp).
- [ ] No public marketing language like "download YouTube videos free" that signals piracy intent.
- [ ] Rate-limit and do not allow bulk scraping (protects against being flagged as a mass-piracy tool).
- [ ] Do not cache/host downloaded media on your own servers longer than needed to stream to the requesting device (stream-through architecture, not a media library).
- [ ] Maintain a takedown-response process/contact even for a small app.

**Decision checkpoint for founder**: Confirm distribution strategy (Play Store submission attempt vs. direct APK / TestFlight-only / personal use) before backend infra spend, since it changes hosting/cost assumptions in Section 8.

---

## 5. Target Users & Use Cases

| Persona | Use Case |
|---|---|
| Content creator | Downloads their own posted videos across platforms to re-edit/repurpose |
| Personal archiver | Saves videos shared with them (family clips, permitted reposts) for offline viewing |
| Music/audio listener | Extracts audio from a video for offline listening (e.g., a podcast clip, a cover song shared to them) |

---

## 6. User Flow (v1)

```
1. App Home Screen
   → Single input field: "Paste link here"
   → Submit button

2. Loading State
   → Spinner + "Analyzing link..."
   → Backend call: POST /api/v1/analyze

3. Results Screen
   → Video thumbnail + title + duration + source platform icon
   → Tabs: [Video] [Audio Only]
   → Video tab: list of quality options (e.g. 2160p, 1080p, 720p, 480p, 360p, 144p) 
     — only qualities that actually exist for this video are shown, with file size estimate
   → Audio tab: single "MP3" option with file size estimate

4. User taps a quality/format
   → Confirmation of format + estimated size
   → Download button

5. Download Progress
   → Progress bar (%) — polling or WebSocket
   → Cancel option

6. Completion
   → "Saved to Downloads" confirmation
   → Options: Open file / Share / Delete
```

### 6.1 Error States (must design for)
- Invalid/unsupported URL → clear message: "This link isn't supported yet."
- Private/restricted content (e.g., private Instagram account, age-restricted YouTube) → "This content requires login and can't be processed."
- Platform blocked our request (rate-limited/IP-banned) → "Try again in a few minutes."
- No internet connection.
- Download interrupted mid-way → resume or restart option.

---

## 7. Functional Requirements

### 7.1 Link Analysis (P0)
- Accept URL from: YouTube (watch, shorts, youtu.be), TikTok (video, vm.tiktok short links), Instagram (post, reel; **not** private stories without auth in v1).
- Detect platform from URL pattern.
- Return: title, thumbnail, duration, uploader name, available video formats (resolution, container, approx. filesize, fps), available audio-only formats.

### 7.2 Video Download (P0)
- User selects a resolution; backend fetches/transcodes if needed and streams file to device.
- Supported containers: MP4 (primary). Only offer formats that don't require re-encoding when possible, to keep server load low (yt-dlp can select pre-merged or best-matching streams).
- Max resolution offered = highest available from source (do not upscale).

### 7.3 Audio Extraction (P0)
- Extract audio-only stream and convert to MP3 (192kbps default; consider 128/192/320kbps toggle as P1).
- Uses ffmpeg (via yt-dlp's postprocessor) for conversion.

### 7.4 Platform Coverage
| Platform | Priority | Notes |
|---|---|---|
| YouTube | P0 | Full quality range, most stable via yt-dlp |
| TikTok | P0 | Max ~1080p; watermark-free extraction requires specific extractor logic — flag as best-effort |
| Instagram | P0 | Max ~1080p; private content/stories need session cookies (P1 feature, requires user to log in via webview — adds legal/ToS risk, evaluate separately) |
| Twitter/X, Facebook, Vimeo, SoundCloud, Reddit | P1/P2 | Enable opportunistically since yt-dlp already supports them; no dedicated UI work needed beyond testing |

### 7.5 Non-Functional Requirements
- **Performance**: format analysis response < 5s p90, < 10s p99.
- **Reliability**: yt-dlp/extractor updates deployed within 48 hours of upstream fixes (platforms change frequently — this is an ongoing maintenance commitment, not a one-time build).
- **Scalability**: backend must handle concurrent transcoding jobs without OOM — use a job queue (see Section 8).
- **Security**: no storage of user-identifiable data beyond what's needed for the disclaimer acknowledgment (Section 4.4); no logging of downloaded content to a shared/public store.
- **Cost control**: bandwidth and compute are the main cost drivers — must have per-user rate limiting from day one (e.g., max N downloads/hour) to avoid abuse-driven cost blowouts.

---

## 8. Technical Architecture

### 8.1 High-Level Diagram
```
[React Native App (iOS/Android)]
        |
        | HTTPS REST
        v
[FastAPI Backend] ---> [Job Queue: Celery + Redis]
        |                        |
        |                        v
        |               [Worker: yt-dlp + ffmpeg]
        |                        |
        v                        v
 [Metadata Response]     [Processed file → temp storage → streamed to client → deleted]
```

### 8.2 Backend Components
- **API layer**: FastAPI (Python 3.11+)
- **Extraction engine**: `yt-dlp` (pinned version, auto-update job weekly + monitor upstream releases)
- **Media processing**: `ffmpeg` for audio conversion/container remuxing
- **Job queue**: Celery + Redis (or lightweight alternative like `arq`) — necessary because downloads/transcodes are long-running and shouldn't block the API thread
- **Temp storage**: local disk or S3-compatible bucket with short TTL (auto-delete after 1 hour or after successful client download) — do NOT build a permanent media library (legal risk, Section 4.4)
- **Rate limiting**: per-device/IP token bucket (e.g., 10 analyses/hour, 5 downloads/hour on free tier — tune based on cost data)

### 8.3 API Contract (v1)

**POST `/api/v1/analyze`**
```json
Request:
{ "url": "https://..." }

Response 200:
{
  "id": "job_abc123",
  "platform": "youtube",
  "title": "Video title",
  "thumbnail": "https://...",
  "duration_seconds": 245,
  "uploader": "Channel Name",
  "video_formats": [
    { "quality": "2160p", "ext": "mp4", "filesize_mb": 340, "fps": 30 },
    { "quality": "1080p", "ext": "mp4", "filesize_mb": 120, "fps": 30 },
    { "quality": "720p",  "ext": "mp4", "filesize_mb": 65,  "fps": 30 },
    { "quality": "480p",  "ext": "mp4", "filesize_mb": 30,  "fps": 30 },
    { "quality": "360p",  "ext": "mp4", "filesize_mb": 18,  "fps": 30 },
    { "quality": "144p",  "ext": "mp4", "filesize_mb": 6,   "fps": 30 }
  ],
  "audio_formats": [
    { "quality": "192kbps", "ext": "mp3", "filesize_mb": 5.8 }
  ]
}

Response 4xx:
{ "error_code": "UNSUPPORTED_URL" | "PRIVATE_CONTENT" | "RATE_LIMITED" | "PLATFORM_BLOCKED", "message": "..." }
```

**POST `/api/v1/download`**
```json
Request:
{ "id": "job_abc123", "format_type": "video" | "audio", "quality": "1080p" }

Response 202:
{ "download_job_id": "dl_xyz789", "status": "queued" }
```

**GET `/api/v1/download/{download_job_id}/status`**
```json
Response 200:
{ "status": "processing" | "ready" | "failed", "progress_percent": 63, "file_url": "https://.../signed-url (only when ready)" }
```

### 8.4 Mobile App Architecture (React Native)
- **Framework**: Expo (managed workflow) for faster iteration; eject to bare workflow later only if a native module absolutely requires it.
- **State management**: React Query (for API calls/caching) + minimal local state (Zustand/Context) — no need for Redux at this scope.
- **File handling**: `expo-file-system` + `expo-media-library` to save downloads to device storage/gallery.
- **Networking**: axios/fetch with retry logic for the analyze/download polling.

---

## 9. Success Metrics

| Metric | Target (first 90 days) |
|---|---|
| Analyze success rate (valid link → formats returned) | > 90% |
| Download completion rate (started → finished) | > 85% |
| p90 analyze latency | < 5s |
| Crash-free session rate | > 99% |
| Extractor breakage MTTR (mean time to repair after a platform change) | < 48 hours |

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| App store rejection | High | Plan for APK sideload / TestFlight-limited distribution; do not rely on Play Store approval |
| Platform (YT/IG/TikTok) changes breaks extractor | High, frequent | Pin yt-dlp, monitor upstream repo, maintain fast patch pipeline |
| Legal takedown / cease-and-desist | Medium-High | Follow Section 4.4 mitigations; avoid piracy-style marketing; consider legal consult before public launch |
| Server cost blowout from abuse | Medium | Rate limiting, no permanent storage, monitor bandwidth per user |
| IP bans from platforms (bot detection) | Medium | Rotate egress IPs/proxies if scaling; respect reasonable request pacing |

---

## 11. Roadmap

**Phase 0 — Backend Proof of Concept**
- FastAPI + yt-dlp local setup; validate analyze + download works for YouTube, TikTok, Instagram test links.

**Phase 1 — MVP (P0 scope, this document)**
- Full flow: analyze → select quality → download, all 3 platforms, disclaimer screen, rate limiting, job queue.

**Phase 2 — P1 Enhancements**
- Additional platforms (Twitter/X, Facebook, SoundCloud).
- MP3 bitrate selector.
- Login/session support for private Instagram content (separate legal review required first).
- Download history (local only, not server-side).

**Phase 3 — Scale/Polish**
- Push notifications on download complete.
- Background downloads.
- Distribution decision finalized (sideload vs. store-approved positioning) based on Phase 1 learnings.

---

## 12. Open Decisions (Founder Sign-off Needed)

- [ ] Distribution channel: Play Store submission attempt, direct APK, or invite-only/TestFlight?
- [ ] Marketing/positioning language finalized to stay within Section 4 guardrails.
- [ ] Backend hosting provider (DigitalOcean/Railway/Render/AWS) and budget ceiling.
- [ ] Whether to pursue Instagram private-content login flow at all (adds meaningful legal exposure — recommend deferring).

---

*This PRD is the single source of truth for scope, architecture, and constraints. Any feature request or technical decision that conflicts with Section 4 (Legal & Compliance) must be escalated and resolved before implementation.*
