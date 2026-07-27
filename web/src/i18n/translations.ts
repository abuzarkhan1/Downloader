export type Language = 'en' | 'ur';

export type TranslationKey = keyof typeof translations['en'];

export const translations = {
  en: {
    // Header & Footer
    appName: "VideoDownloader",
    appSubtitle: "Universal Media Extractor",
    disclaimer: "Disclaimer",
    legalDisclaimer: "Legal Disclaimer & Terms",
    copyright: "© 2026 Universal VideoDownloader Web. All media processed temporarily without permanent storage.",
    
    // Watermark Toggle
    removeWatermark: "Remove Watermark",
    removeWatermarkSubtitle: "TikTok & Shorts without watermark",
    watermarkRemovedBadge: "No Watermark",

    // Clipboard Prompt Banner
    clipboardBannerTitle: "Copied link detected!",
    clipboardBannerDesc: "We found a video URL on your clipboard:",
    pasteAndAnalyze: "Paste & Analyze",
    dismiss: "Dismiss",
    pasteCopiedLink: "Paste copied link",

    // Mode Selector
    singleMode: "Single Link",
    batchMode: "Batch / Playlist Mode",
    enterSingleUrl: "Media Link URL",
    enterBatchUrls: "Enter Multiple Video Links (One URL per line):",
    placeholderSingle: "Paste URL (e.g., https://www.youtube.com/watch?v=...)",
    placeholderBatch: "Paste multiple URLs here, one per line:\nhttps://www.youtube.com/watch?v=...\nhttps://www.tiktok.com/@user/video/...\nhttps://www.instagram.com/p/...",

    // HomeScreen UI
    badgeTitle: "Universal Downloader",
    heroTitlePart1: "Download Video & Audio",
    heroTitlePart2: "From Any Platform",
    heroDesc: "Paste your video link below to analyze and extract high-quality video and audio files instantly.",
    analyzeLink: "Analyze Link",
    analyzingLink: "Analyzing Link...",
    analyzeBatch: "Analyze Batch Links",
    analyzingBatch: "Analyzing Batch Links...",
    supportedPlatforms: "Supported Platforms",
    validationEnterUrl: "Please enter a video or audio URL",
    validationEnterUrls: "Please enter at least one valid URL",
    
    // Batch Mode UI
    batchTitle: "Batch Download Queue",
    batchSubtitle: "Processed {completed} of {total} links",
    downloadAll: "Download All Ready Files",
    downloadingAll: "Downloading All...",
    linksFound: "{count} links detected",
    statusPending: "Queued",
    statusAnalyzing: "Analyzing...",
    statusReady: "Ready",
    statusDownloading: "Downloading...",
    statusCompleted: "Completed",
    statusFailed: "Failed",

    // ResultsScreen UI
    downloadAnother: "Download Another",
    videoTab: "Video",
    audioTab: "Audio",
    subtitlesTab: "Subtitles",
    availableFormats: "{count} Formats Available",
    estSize: "Est. Size: {size}",
    download: "Download",
    noFormatsFound: "No formats found for this category.",

    // Audio Bitrate & Format Selector
    audioFormatLabel: "Select Audio Format",
    audioBitrateLabel: "Select Bitrate",
    downloadCustomAudio: "Download Audio ({format} @ {bitrate})",
    bitrate128: "128 kbps (Standard)",
    bitrate192: "192 kbps (High Quality)",
    bitrate320: "320 kbps (Ultra HQ)",
    formatMp3: "MP3 (Universal)",
    formatM4a: "M4A (AAC Audio)",
    formatWav: "WAV (Lossless)",

    // Subtitles & Captions Extraction
    subtitlesTitle: "Extract Subtitles & Captions",
    subtitlesDesc: "Download video captions in your preferred language and format.",
    selectLanguage: "Language",
    downloadSrt: "Download .SRT",
    downloadVtt: "Download .VTT",
    downloadTxt: "Download .TXT",
    langEn: "English",
    langUr: "Urdu (اردو)",
    langEs: "Spanish (Español)",
    langFr: "French (Français)",
    langDe: "German (Deutsch)",
    langAr: "Arabic (العربية)",
    langHi: "Hindi (हिन्दी)",
    langJa: "Japanese (日本語)",
    noSubtitlesAvailable: "No automatic subtitles detected for this video.",

    // DownloadScreen UI
    backToSearch: "Back to Search",
    downloadReady: "Your Download is Ready!",
    extractingMedia: "Extracting & Converting Media...",
    preparingJob: "Preparing Download Job...",
    downloadFailed: "Failed to Process Download",
    readyDesc: "Browser file download triggered automatically. You can also save or open the file below.",
    processingDesc: "Please wait while our backend converts and packages your high-quality file.",
    queuedDesc: "Your request is queued. Processing will begin in a moment.",
    failedDesc: "An error occurred while attempting to fetch or extract media.",
    conversionProgress: "Conversion Progress",
    savingFile: "Saving File...",
    downloadFileAgain: "Download File Again",
    openSaveFile: "Open / Save File",
    preparingDownload: "Preparing Download...",
    
    // LoadingScreen UI
    loadingMessage: "Analyzing media URL and retrieving available format qualities...",
    loadingDesc: "Fetching title, duration, uploader, and available video & audio formats.",
    cancelAnalysis: "Cancel Analysis",

    // Modals
    disclaimerModalTitle: "Terms of Service & Disclaimer",
    disclaimerAccept: "I Understand & Accept",
    errorModalTitle: "Error Encountered",
    close: "Close"
  },
  ur: {
    // Header & Footer
    appName: "ویڈیو ڈاؤن لوڈر",
    appSubtitle: "یونیورسل میڈیا ڈاؤن لوڈر",
    disclaimer: "دستبرداری",
    legalDisclaimer: "قانونی دستبرداری اور شرائط",
    copyright: "© 2026 یونیورسل ویڈیو ڈاؤن لوڈر ویب۔ تمام میڈیا عارضی طور پر کارروائی کیا جاتا ہے۔",
    
    // Watermark Toggle
    removeWatermark: "واٹر مارک ہٹائیں",
    removeWatermarkSubtitle: "ٹک ٹاک اور شارٹس بغیر واٹر مارک",
    watermarkRemovedBadge: "بغیر واٹر مارک",

    // Clipboard Prompt Banner
    clipboardBannerTitle: "کاپی شدہ لنک کا پتہ چلا!",
    clipboardBannerDesc: "آپ کے کلپ بورڈ پر ایک ویڈیو لنک ملا ہے:",
    pasteAndAnalyze: "پیسٹ کریں اور تجزیہ کریں",
    dismiss: "مسترد کریں",
    pasteCopiedLink: "کاپی شدہ لنک پیسٹ کریں",

    // Mode Selector
    singleMode: "سنگل لنک",
    batchMode: "بیچ / پلے لسٹ موڈ",
    enterSingleUrl: "میڈیا لنک یو آر ایل",
    enterBatchUrls: "متعدد ویڈیو لنکس درج کریں (ہر سطر میں ایک یو آر ایل):",
    placeholderSingle: "یو آر ایل پیسٹ کریں (مثال: https://www.youtube.com/watch?v=...)",
    placeholderBatch: "یہاں متعدد لنکس پیسٹ کریں، ہر لائن میں ایک:\nhttps://www.youtube.com/watch?v=...\nhttps://www.tiktok.com/@user/video/...\nhttps://www.instagram.com/p/...",

    // HomeScreen UI
    badgeTitle: "یونیورسل ڈاؤن لوڈر",
    heroTitlePart1: "کسی بھی پلیٹ فارم سے",
    heroTitlePart2: "ویڈیو اور آڈیو ڈاؤن لوڈ کریں",
    heroDesc: "اعلیٰ کوالٹی ویڈیو اور آڈیو فائلیں حاصل کرنے کے لیے نیچے اپنا ویڈیو لنک پیسٹ کریں۔",
    analyzeLink: "لنک کا تجزیہ کریں",
    analyzingLink: "تجزیہ ہو رہا ہے...",
    analyzeBatch: "بیچ لنکس کا تجزیہ کریں",
    analyzingBatch: "بیچ لنکس کا تجزیہ ہو رہا ہے...",
    supportedPlatforms: "معاون پلیٹ فارمز",
    validationEnterUrl: "برائے مہربانی ویڈیو یا آڈیو لنک درج کریں",
    validationEnterUrls: "برائے مہربانی کم از کم ایک درست لنک درج کریں",
    
    // Batch Mode UI
    batchTitle: "بیچ ڈاؤن لوڈ کی قطار",
    batchSubtitle: "{total} میں سے {completed} لنکس مکمل ہو چکے ہیں",
    downloadAll: "تمام تیار فائلیں ڈاؤن لوڈ کریں",
    downloadingAll: "تمام فائلیں ڈاؤن لوڈ ہو رہی ہیں...",
    linksFound: "{count} لنکس مل گئے",
    statusPending: "قطار میں",
    statusAnalyzing: "تجزیہ ہو رہا ہے...",
    statusReady: "تیار",
    statusDownloading: "ڈاؤن لوڈ ہو رہا ہے...",
    statusCompleted: "مکمل",
    statusFailed: "ناکام",

    // ResultsScreen UI
    downloadAnother: "دوسری ویڈیو ڈاؤن لوڈ کریں",
    videoTab: "ویڈیو",
    audioTab: "آڈیو",
    subtitlesTab: "ذیلی عنوانات (سب ٹائٹلز)",
    availableFormats: "{count} فارمیٹس دستیاب ہیں",
    estSize: "تخمینی سائز: {size}",
    download: "ڈاؤن لوڈ کریں",
    noFormatsFound: "اس کیٹیگری کے لیے کوئی فارمیٹ نہیں ملا۔",

    // Audio Bitrate & Format Selector
    audioFormatLabel: "آڈیو فارمیٹ منتخب کریں",
    audioBitrateLabel: "بٹ ریٹ منتخب کریں",
    downloadCustomAudio: "آڈیو ڈاؤن لوڈ کریں ({format} @ {bitrate})",
    bitrate128: "128 kbps (معیاری)",
    bitrate192: "192 kbps (اعلیٰ کوالٹی)",
    bitrate320: "320 kbps (الٹرا ایچ ڈی)",
    formatMp3: "MP3 (عالمگیر)",
    formatM4a: "M4A (اے اے سی آڈیو)",
    formatWav: "WAV (بے داغ)",

    // Subtitles & Captions Extraction
    subtitlesTitle: "ذیلی عنوانات اور کیپشنز حاصل کریں",
    subtitlesDesc: "اپنی پسندیدہ زبان اور فارمیٹ میں ویڈیو سب ٹائٹلز ڈاؤن لوڈ کریں۔",
    selectLanguage: "زبان",
    downloadSrt: ".SRT ڈاؤن لوڈ کریں",
    downloadVtt: ".VTT ڈاؤن لوڈ کریں",
    downloadTxt: ".TXT ڈاؤن لوڈ کریں",
    langEn: "انگریزی (English)",
    langUr: "اردو",
    langEs: "ہسپانوی (Español)",
    langFr: "فرانسیسی (Français)",
    langDe: "جرمن (Deutsch)",
    langAr: "عربی (العربية)",
    langHi: "ہندی (हिन्दी)",
    langJa: "جاپانی (日本語)",
    noSubtitlesAvailable: "اس ویڈیو کے لیے کوئی سب ٹائٹلز دستیاب نہیں ہیں۔",

    // DownloadScreen UI
    backToSearch: "تلاش پر واپس جائیں",
    downloadReady: "آپ کی ڈاؤن لوڈ فائل تیار ہے!",
    extractingMedia: "میڈیا ایکسٹریکٹ اور کنورٹ ہو رہا ہے...",
    preparingJob: "ڈاؤن لوڈ جاب کی تیاری ہو رہی ہے...",
    downloadFailed: "ڈاؤن لوڈ مکمل کرنے میں ناکامی",
    readyDesc: "براؤزر فائل ڈاؤن لوڈ خود بخود شروع ہو گئی ہے۔ آپ نیچے سے بھی فائل محفوظ کر سکتے ہیں۔",
    processingDesc: "برائے مہربانی انتظار کریں، ہمارا بیک اینڈ فائل کنورٹ کر رہا ہے۔",
    queuedDesc: "آپ کی درخواست قطار میں ہے۔ پروسیسنگ جلد شروع ہو جائے گی۔",
    failedDesc: "میڈیا فائل حاصل کرنے کے دوران ایک خرابی پیش آئی۔",
    conversionProgress: "تبدیلی کی پیشرفت",
    savingFile: "فائل محفوظ ہو رہی ہے...",
    downloadFileAgain: "فائل دوبارہ ڈاؤن لوڈ کریں",
    openSaveFile: "فائل کھولیں / محفوظ کریں",
    preparingDownload: "ڈاؤن لوڈ کی تیاری ہو رہی ہے...",
    
    // LoadingScreen UI
    loadingMessage: "میڈیا لنک کا تجزیہ اور کوالٹی فارمیٹس حاصل کیے جا رہے ہیں...",
    loadingDesc: "عنوان، دورانیہ، اور دستیاب ویڈیو و آڈیو فارمیٹس لوڈ ہو رہے ہیں۔",
    cancelAnalysis: "تجزیہ منسوخ کریں",

    // Modals
    disclaimerModalTitle: "سروس کی شرائط اور دستبرداری",
    disclaimerAccept: "میں سمجھ گیا اور قبول کرتا ہوں",
    errorModalTitle: "خرابی پیش آئی",
    close: "بند کریں"
  }
};
