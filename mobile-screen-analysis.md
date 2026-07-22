# Mobile Screen Analysis & Redesign Spec — Universal Media Downloader

## Project Overview

- **Framework:** React Native (Expo SDK 51, Managed Workflow)
- **Navigation:** Manual state-based (`currentScreen` in `App.tsx`), no React Navigation
- **Theme:** Dark-only (`#0F172A` background), inline StyleSheet — no theme file
- **State:** `useState` + `useEffect` in root `App.tsx`, props drilled to screens
- **API:** Dual mock/real mode (`USE_MOCK` flag), polling for download progress

---

## Screen 1: HomeScreen

### File
`mobile/src/screens/HomeScreen.tsx` (327 lines)

### Purpose
Entry point — user pastes URL or picks sample link to analyze.

### UI Layout (top→bottom)

| # | Element | Description | Props/Style |
|---|---------|-------------|-------------|
| 1 | **StatusBar** | `light-content`, bg `#0F172A` | — |
| 2 | **Header** | Logo circle (indigo tint, ⚡ icon) + "Universal Downloader" title (26px, 800 weight) + subtitle "Fetch high quality video formats..." (14px, `#94A3B8`) | Centered, `marginTop: 20` |
| 3 | **Platforms Row** | "SUPPORTED PLATFORMS" label (11px, letterSpacing 1.2, `#64748B`) + 3x `PlatformBadge` (YouTube red, TikTok cyan, Instagram pink) | Centered row, `gap: 8` |
| 4 | **URL Input Card** | Card (`#1E293B`, radius 20, border `#334155`) containing: "Media URL" label → TextInput (dark bg, height 52, `#F8FAFC` text, placeholder "Paste link here...") → clear button (✕, shows when text > 0) | `shadowColor: '#000'`, `elevation: 5` |
| 5 | **Error Banner** | Conditional (inputError OR error prop). Red-tinted bg (`#EF444415`), ⚠️ icon + error text (`#FCA5A5`) | `marginBottom: 16` |
| 6 | **Submit Button** | "Analyze Link →" indigo bg (`#6366F1`), height 52, radius 14, 700 weight | Full width |
| 7 | **Demo Section** | "TRY A SAMPLE LINK" label + 3 demo chips (YouTube Nature HD 4K, TikTok No Watermark 1080p, Instagram Reel Sunset). Each is a `TouchableOpacity` with icon + label, dark semi-transparent bg | `marginTop: 8` |

### States

| State | Trigger | UI Changes |
|-------|---------|------------|
| **Default** | Fresh launch | Empty input, no error, all elements visible |
| **Input Focus** | User taps TextInput | — (keyboard opens via KeyboardAvoidingView) |
| **Input has text** | User types | Clear button (✕) appears |
| **Validation Error** | Submit with empty input | Red banner: "Please enter a media URL" |
| **API Error** | `analyzeUrl()` fails | Red banner with error message from API (UNSUPPORTED_URL, PRIVATE_CONTENT, RATE_LIMITED, PLATFORM_BLOCKED, NETWORK_ERROR) |
| **Quick Paste** | User taps demo chip | URL is set + immediately triggers `onAnalyze()` |

### User Interactions
- Type URL in TextInput (autoCapitalize none, autoCorrect false, keyboardType url)
- Tap ✕ to clear input
- Tap "Analyze Link" to submit
- Tap any demo chip for instant analyze with sample URL

### Components Used
- `PlatformBadge` (size="medium") × 3

---

## Screen 2: LoadingScreen

### File
`mobile/src/screens/LoadingScreen.tsx` (151 lines)

### Purpose
Shown during `analyzeUrl()` API call — visual feedback that analysis is in progress.

### UI Layout (top→bottom)

| # | Element | Description | Props/Style |
|---|---------|-------------|-------------|
| 1 | **StatusBar** | `light-content`, bg `#0F172A` | — |
| 2 | **Spinner** | `ActivityIndicator` (indigo `#6366F1`) inside a circular container (80×80, `#1E293B`, radius 40) + outer glow ring (90×90, border `#6366F140`) | Centered, `marginBottom: 28` |
| 3 | **Title** | "Analyzing link..." (22px, 700 weight, `#F8FAFC`) | Centered |
| 4 | **Subtext** | "Querying backend and inspecting stream formats..." (14px, `#94A3B8`) | Centered, `marginBottom: 32` |
| 5 | **URL Card** | Conditional (if url prop). Card with "TARGET URL" label + monospace URL text (`#38BDF8`, font: Menlo/monospace) | Full width, radius 14 |
| 6 | **Step Indicators** | 3-step progress: ✓ "URL validation & platform detection" (completed/green) → • "Extracting available video & audio qualities" (active/indigo) → ◦ "Calculating exact file sizes" (pending/gray) | Full width, `gap: 12` |

### States

| State | Trigger | UI Changes |
|-------|---------|------------|
| **Loading** | After Home submit | Spinner animating, steps shown |
| **No URL** | url prop empty/undefined | URL card hidden |

### User Interactions
- (No direct interaction — auto-navigates to Results or back to Home on error)

### Notes
- `onCancel` prop exists but is not rendered as a button — connected to `handleResetToHome` but no cancel UI

---

## Screen 3: ResultsScreen

### File
`mobile/src/screens/ResultsScreen.tsx` (364 lines)

### Purpose
Display analyzed media info + format selection (video or audio).

### UI Layout (top→bottom)

| # | Element | Description | Props/Style |
|---|---------|-------------|-------------|
| 1 | **Top Bar** | "← New Search" back button (`#1E293B`, radius 8) + `PlatformBadge` (size="small") | `justifyContent: 'space-between'`, padding 12/20 |
| 2 | **Media Card** | Thumbnail Image (height 180) with fallback 🎬 icon + duration badge (`rgba(15,23,42,0.85)`, monospace MM:SS) + title (17px, 700 weight) + uploader "By ..." (13px, `#94A3B8`) | Radius 18, overflow hidden, border `#334155` |
| 3 | **Tab Switcher** | Two tabs: "📹 Video (N)" and "🎵 Audio Only (N)" in a pill container. Active tab gets indigo bg + white text; inactive gets gray | bg `#1E293B`, radius 14, padding 4 |
| 4 | **Format List** | Scrollable list of format items. Each item: | gap 12 |
| 4a | *Video Format Item* | Quality badge (`#38BDF8` bg, cyan text "1080p", etc.) + ext row (e.g. "MP4", "30 FPS") + right side: "~X.X MB" + indigo "Download" button | Row, `justifyContent: 'space-between'`, radius 14, `#1E293B` |
| 4b | *Audio Format Item* | Quality badge (green `#10B981` bg/text "192kbps") + ext + "High Quality MP3" + size + green "Extract MP3" button | Same layout, green accent instead of indigo |
| 5 | **Empty State** | "No video formats found." or "No audio formats available." in muted `#64748B` | Centered, `paddingVertical: 20` |

### States

| State | Trigger | UI Changes |
|-------|---------|------------|
| **Default** | After successful analyze | Tab "Video" active, first format list shown |
| **Tab Switch** | User taps "Audio Only" | Audio formats displayed with green styling |
| **Image Error** | Thumbnail fails to load | Fallback 🎬 icon shown in `thumbnailFallback` view |
| **Empty Video** | No video_formats | "No video formats found." text |
| **Empty Audio** | No audio_formats | "No audio formats available." text |
| **New Search** | Tap "← New Search" | Returns to HomeScreen |

### User Interactions
- Tap "← New Search" to go back
- Tap Video/Audio tab to switch format lists
- Tap "Download" (video) or "Extract MP3" (audio) to start download

### Components Used
- `PlatformBadge` (size="small") × 1

---

## Screen 4: DownloadScreen

### File
`mobile/src/screens/DownloadScreen.tsx` (568 lines)

### Purpose
Download progress, completion actions, or failure recovery.

### Three Distinct States

#### State A: Downloading (progress)

| # | Element | Description |
|---|---------|-------------|
| 1 | **StatusBar** | `light-content`, bg `#0F172A` |
| 2 | **Icon Circle** | ↓ arrow in indigo circle (`#6366F1` border, 72×72, radius 36) |
| 3 | **Status Header** | "Downloading Video..." or "Downloading Audio..." (22px, 800 weight) |
| 4 | **Title Subtext** | Media title (14px, `#94A3B8`, 2 lines max) |
| 5 | **Info Tags** | Row: "Format: VIDEO/AUDIO" + "Quality: 1080p/192kbps" |
| 6 | **Progress Card** | Dynamic label (Queued... / Processing & Downloading stream... / Finalizing file save...) + percent (e.g. "67%", monospace) + progress bar (track: height 10, radius 5, `#0F172A` bg; fill: indigo `#6366F1`) |
| 7 | **Cancel Button** | "Cancel Download" — slate bg, red text (`#FCA5A5`) |

#### State B: Complete (success)

| # | Element | Description |
|---|---------|-------------|
| 1 | **Icon Circle** | ✓ checkmark in green circle (`#10B981` border) |
| 2 | **Status Header** | "Saved to Downloads" |
| 3 | **Title Subtext** | Media title |
| 4 | **Info Tags** | Same format + quality badges |
| 5 | **Saved Banner** | 📁 icon + "File saved successfully to local downloads directory & gallery." (green-tinted bg) |
| 6 | **Action Grid** | 3 buttons in row: "▶ Open File" (indigo primary, flex 1.2) + "🔗 Share" (outlined) + "🗑️ Delete" (danger outlined) |
| 7 | **Secondary Button** | "Download Another Media" (outlined, indigo text `#818CF8`) |

#### State C: Failed

| # | Element | Description |
|---|---------|-------------|
| 1 | **Icon Circle** | ✕ in red circle (`#EF4444` border) |
| 2 | **Status Header** | "Download Failed" |
| 3 | **Error Message** | Error text in red (`#FCA5A5`), centered |
| 4 | **Return Button** | "Return to Home" (same outline style as "Download Another Media") |

### States Transitions

| State | Trigger | UI Changes |
|-------|---------|------------|
| **Processing** | After format selection | Progress card visible, status "processing" |
| **Progress Update** | Polling (every 1s internal + 800ms from App.tsx) | Percent + progress bar width update; label changes at thresholds (<20% queued, 20-80% processing, >80% finalizing) |
| **Ready** | status === 'ready' or progress >= 100 | Auto downloads file via `downloadAndSaveMedia()`, shows success UI |
| **Failed** | status === 'failed' or error | Shows error message + return button |
| **Cancelled** | User taps "Cancel Download" | Calls `cancelDownload()`, navigates back to Results |
| **Delete** | User taps "Delete" + confirms | Deletes file via `FileSystem.deleteAsync()`, returns to Home |
| **Open File** | User taps "Open File" | Android: IntentLauncher; iOS/fallback: Linking.openURL |
| **Share** | User taps "Share" | `Share.share()` API |
| **Download Another** | User taps "Download Another Media" | Resets to Home |

### User Interactions
- Observe progress bar and status label
- Tap "Cancel Download" during progress
- Tap "Open File" / "Share" / "Delete" on completion
- Tap "Download Another Media" or "Return to Home"

---

## Overlay: DisclaimerModal

### File
`mobile/src/components/DisclaimerModal.tsx` (182 lines)

### Appearance
Fullscreen dark overlay (`rgba(15, 23, 42, 0.95)`) with centered modal card.

### UI Layout

| # | Element | Description |
|---|---------|-------------|
| 1 | **Title** | "Personal Media Archiving & Fair Use Terms" (20px, 700 weight) |
| 2 | **Subtitle** | "Please review and accept before using the application" (13px, `#94A3B8`) |
| 3 | **Scrollable Terms** | Dark bg (`#0F172A`), radius 12, maxHeight 200. Contains paragraph + 3 bullet certifications |
| 4 | **Checkbox** | Custom checkbox (24×24, radius 6). Unchecked: slate border; Checked: indigo bg + ✓ white |
| 5 | **Checkbox Label** | "I certify that I will only download content I own or have authorization/permission to use." |
| 6 | **Accept Button** | "I Agree & Continue" — indigo bg. Disabled (gray, opacity 0.6) when checkbox unchecked or submitting |

### States

| State | Trigger | UI Changes |
|-------|---------|------------|
| **Visible** | `disclaimerAccepted === false` | Modal rendered with `animationType="fade"` |
| **Checkbox Unchecked** | Default | Button disabled (gray) |
| **Checkbox Checked** | User taps checkbox | Button enabled (indigo) |
| **Submitting** | User taps Accept | Button disabled, timestamp saved to AsyncStorage |
| **Hidden** | `disclaimerAccepted === true` | Modal not rendered, app screens visible |

### User Interactions
- Read terms (scrollable)
- Tap checkbox to agree
- Tap "I Agree & Continue" to dismiss permanently

---

## Component: PlatformBadge

### File
`mobile/src/components/PlatformBadge.tsx` (130 lines)

### Purpose
Reusable badge showing platform icon + name with platform-specific colors.

### Variants

| Platform | Icon | Background | Text/Border Color |
|----------|------|-----------|-------------------|
| YouTube | ▶ | `#FF000020` | `#FF4D4D` / `#FF000040` |
| TikTok | 🎵 | `#00F2FE20` | `#00F2FE` / `#00F2FE40` |
| Instagram | 📸 | `#E1306C20` | `#F77737` / `#E1306C40` |
| Unknown | 🌐 | `#38BDF820` | `#38BDF8` / `#38BDF840` |

### Sizes

| Size | Padding | Radius | Icon Size | Label Size |
|------|---------|--------|-----------|------------|
| small | 8×2 | 12 | 11px | 11px |
| medium (default) | 10×4 | 20 | 14px | 13px |
| large | 14×6 | 24 | 18px | 15px |

### Props
- `platform`: 'youtube' | 'tiktok' | 'instagram' | 'unknown'
- `size?`: 'small' | 'medium' | 'large' (default: medium)
- `showLabel?`: boolean (default: true)

---

## Design System Reference

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#0F172A` | App bg, splash bg |
| Surface | `#1E293B` | Cards, tabs, items |
| Border | `#334155` | Card borders, dividers |
| Primary | `#6366F1` (Indigo) | Buttons, active tabs, progress fill |
| Success | `#10B981` (Emerald) | Audio badges, success icon, saved banner |
| Error | `#EF4444` (Red) | Error banners, failure icon |
| Text Primary | `#F8FAFC` | Headings, body text |
| Text Secondary | `#94A3B8` | Subtext, labels |
| Text Muted | `#64748B` | Section labels, placeholders |
| Text Accent | `#CBD5E1` | Input labels, progress label |
| Link/Mono | `#38BDF8` (Sky) | URL display, video quality badges |
| Error Text | `#FCA5A5` | Error messages, cancel button |
| Success Text | `#A7F3D0` | Saved banner text |

### Typography

| Size | Weight | Usage |
|------|--------|-------|
| 10px | 700 | Section labels |
| 11px | 700 | Small labels, letterSpacing 1.2 |
| 12-14px | 500-700 | Body, buttons, badges |
| 15-17px | 600-700 | Input, card titles |
| 20-22px | 700-800 | Screen headers |
| 26px | 800 | App title |
| 28-32px | bold | Icon/emoji text in circles |

### Spacing

| Value | Usage |
|-------|-------|
| 20px | Screen padding, card padding |
| 24px | Section margins, modal padding |
| 14-16px | Inner card/item padding |
| 8-12px | Tight grouping, element padding |
| 4-8px | Tiny gaps, badge padding |
| 12-14px | Border radius (cards, inputs, buttons) |
| 18-20px | Large card border radius |
| 20-36px | Circular element radius |

### Icons (all emoji-based)

- ⚡ Logo
- ▶ YouTube / Play
- 🎵 TikTok / Music
- 📸 Instagram / Camera
- 🌐 Unknown / Web
- 🎬 Video fallback
- 📁 Saved banner
- 🔗 Share
- 🗑️ Delete
- ⚠️ Error
- ✓ / ✕ Status
- → Submit arrow

---

## Navigation Flow

```
[DisclaimerModal] → (accepts) → [App starts]
                                     |
[HomeScreen] → (submit URL) → [LoadingScreen] → (analyze success) → [ResultsScreen]
                                                                         |
                                                                   (select format)
                                                                         ↓
[ResultsScreen] ← (cancel) ← [DownloadScreen (progress)]
                                     |
                          (ready) → [DownloadScreen (success)]
                          (failed) → [DownloadScreen (failure)]
                                     |
                              (Download Another / Return to Home)
                                     ↓
                                [HomeScreen]
```

### Screen Transitions
- All screens are conditionally rendered — no animations/transitions
- State resets: `handleResetToHome()` clears URL, analyzeData, downloadJobId, error

---

## Redesign Considerations

### 1. Navigation Architecture
- **Current:** Manual `currentScreen` state — works for linear 4-screen flow but no gesture navigation, no stack, no deep linking
- **Consider:** React Navigation (Native Stack) for swipe-back gestures, screen transitions, deep linking
- **Consider:** Bottom tab bar if adding History/Settings screens

### 2. Design System
- **Current:** All styles inline in `StyleSheet.create()` — duplication across files, no consistency enforcement
- **Consider:** Extract a `theme.ts` with colors, spacing, typography, shadows; use `useTheme()` hook
- **Consider:** Add light mode support — currently dark-only (`userInterfaceStyle: "dark"`)
- **Consider:** Replace emoji icons with a proper icon library (Lucide, Material, or custom SVG)

### 3. HomeScreen
- **Current:** Plain TextInput + button; demo chips look like list items
- **Consider:** Animated placeholder or floating label; "Paste" button for clipboard detection; recent URLs section; platform icons as visual filters/tags; gradient or animated background

### 4. LoadingScreen
- **Current:** Static ActivityIndicator + hardcoded steps (always show same 3 steps)
- **Consider:** Skeleton loader matching ResultsScreen layout; animated progress through steps; estimated time remaining; cancel button should be visible (currently hidden)

### 5. ResultsScreen
- **Current:** Basic list with thumbnails; tabs are simple pill buttons
- **Consider:** Grid/gallery view for thumbnails; pull-to-refresh; format comparison (quality vs size); sort/filter options; larger thumbnail preview; video preview/auto-play

### 6. DownloadScreen
- **Current:** Single progress bar; completion screen has 3 action buttons
- **Consider:** Animated circular progress indicator; estimated time remaining; background download support (notification); batch download queue; preview thumbnail during download

### 7. DisclaimerModal
- **Current:** Full dark overlay, scrollable terms, single checkbox
- **Consider:** Better visual hierarchy for terms; privacy policy link; versioned terms (re-show on update); smoother animation

### 8. PlatformBadge
- **Current:** Emoji icons, simple colored border
- **Consider:** SVG icons with proper platform brand colors; animated press state; tappable for filtering

### 9. Animations & Micro-interactions
- **Current:** Zero animations — instant screen swaps
- **Consider:** Screen transition animations (slide, fade); button press feedback (scale); progress bar easing; skeleton loading; success/failure celebration animations

### 10. Accessibility
- **Current:** No accessibility labels beyond testID
- **Consider:** `accessibilityLabel`, `accessibilityRole`, proper contrast ratios, dynamic type support, reduce motion preference

---

## File Index for AI Redesign Tool

| File | What It Contains |
|------|-----------------|
| `mobile/App.tsx` | Root — state management, nav logic, API orchestration |
| `mobile/src/screens/HomeScreen.tsx` | Home screen — URL input, demo chips |
| `mobile/src/screens/LoadingScreen.tsx` | Loading screen — spinner + step indicators |
| `mobile/src/screens/ResultsScreen.tsx` | Results — media card + video/audio format tabs |
| `mobile/src/screens/DownloadScreen.tsx` | Download — progress, success, failure states |
| `mobile/src/components/DisclaimerModal.tsx` | Legal disclaimer modal overlay |
| `mobile/src/components/PlatformBadge.tsx` | Platform badge (YT/TT/IG/Unknown) |
| `mobile/src/types/index.ts` | All TypeScript types & interfaces |
| `mobile/src/services/api.ts` | API client — analyze, download, status, file save |
| `mobile/src/services/storage.ts` | AsyncStorage wrapper for disclaimer persistence |
| `mobile/app.json` | Expo config — dark theme, splash, icons |
| `mobile/package.json` | Dependencies — expo, react-native, expo-file-system, etc. |
