class AppError(Exception):
    """Base exception class for all custom application exceptions."""
    def __init__(self, error_code: str, message: str, status_code: int, detail: str = None):
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        self.detail = detail
        super().__init__(self.message)

# 400 Bad Request
class InvalidURLError(AppError):
    def __init__(self, message="The provided URL is invalid.", detail=None):
        super().__init__("INVALID_URL", message, 400, detail)

class UnsupportedPlatformError(AppError):
    def __init__(self, message="The platform is not supported.", detail=None):
        super().__init__("UNSUPPORTED_PLATFORM", message, 400, detail)

class InvalidDownloadRequestError(AppError):
    def __init__(self, message="Invalid download request parameters.", detail=None):
        super().__init__("INVALID_DOWNLOAD_REQUEST", message, 400, detail)

# 401 / 403
class PrivateContentError(AppError):
    def __init__(self, message="The requested content is private.", detail=None):
        super().__init__("PRIVATE_CONTENT", message, 403, detail)

class AuthenticationRequiredError(AppError):
    def __init__(self, message="Authentication is required to access this content.", detail=None):
        super().__init__("AUTHENTICATION_REQUIRED", message, 401, detail)

class PlatformBlockedError(AppError):
    def __init__(self, message="Platform has blocked the request.", detail=None):
        super().__init__("PLATFORM_BLOCKED", message, 403, detail)

# 404 Not Found
class MediaNotFoundError(AppError):
    def __init__(self, message="The requested media could not be found.", detail=None):
        super().__init__("MEDIA_NOT_FOUND", message, 404, detail)

class JobNotFoundError(AppError):
    def __init__(self, message="The requested job could not be found.", detail=None):
        super().__init__("JOB_NOT_FOUND", message, 404, detail)

# 429 Too Many Requests
class RateLimitExceededError(AppError):
    def __init__(self, message="Rate limit exceeded.", detail=None):
        super().__init__("RATE_LIMIT_EXCEEDED", message, 429, detail)

# 502 Bad Gateway
class UpstreamPlatformError(AppError):
    def __init__(self, message="Upstream platform error.", detail=None):
        super().__init__("UPSTREAM_PLATFORM_ERROR", message, 502, detail)

# 504 Gateway Timeout
class UpstreamTimeoutError(AppError):
    def __init__(self, message="Upstream platform timeout.", detail=None):
        super().__init__("UPSTREAM_TIMEOUT", message, 504, detail)

# 500 Internal Server Error
class StorageError(AppError):
    def __init__(self, message="Internal storage error.", detail=None):
        super().__init__("STORAGE_ERROR", message, 500, detail)

class ProcessingError(AppError):
    def __init__(self, message="Internal processing error.", detail=None):
        super().__init__("PROCESSING_ERROR", message, 500, detail)
