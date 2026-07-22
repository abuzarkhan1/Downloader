import time
import logging
from typing import Dict
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class TokenBucket:
    """
    Token Bucket Algorithm:
    - Maintains a token pool up to `capacity`.
    - Continuously refills tokens at `capacity / refill_time_seconds` tokens per second.
    """
    def __init__(self, capacity: int, refill_time_seconds: float = 3600.0):
        self.capacity = float(capacity)
        self.tokens = float(capacity)
        self.refill_rate = self.capacity / refill_time_seconds if refill_time_seconds > 0 else self.capacity
        self.last_update = time.time()

    def consume(self, tokens: float = 1.0) -> bool:
        now = time.time()
        time_passed = now - self.last_update
        self.last_update = now

        # Refill tokens based on elapsed time
        self.tokens = min(self.capacity, self.tokens + time_passed * self.refill_rate)

        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False


class RateLimiter:
    """
    Rate Limiter Manager:
    - Manages token buckets per IP and action ('analyze' vs 'download').
    - Enforces configurable limits (e.g. 10 analyses/hour, 5 downloads/hour per client IP).
    """
    def __init__(self, analyze_limit: int = 10, download_limit: int = 5, period_seconds: float = 3600.0):
        self.analyze_limit = analyze_limit
        self.download_limit = download_limit
        self.period_seconds = period_seconds
        # ip -> { "analyze": TokenBucket, "download": TokenBucket }
        self.buckets: Dict[str, Dict[str, TokenBucket]] = {}

    def get_bucket(self, ip: str, bucket_type: str) -> TokenBucket:
        if ip not in self.buckets:
            self.buckets[ip] = {}
        if bucket_type not in self.buckets[ip]:
            limit = self.analyze_limit if bucket_type == "analyze" else self.download_limit
            self.buckets[ip][bucket_type] = TokenBucket(limit, self.period_seconds)
        return self.buckets[ip][bucket_type]

    def reset(self):
        self.buckets.clear()


rate_limiter_instance = RateLimiter(analyze_limit=10, download_limit=5, period_seconds=3600.0)


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Token-bucket rate limiter middleware:
    - Enforces 10 analyses/hour, 5 downloads/hour per client IP.
    - Returns HTTP 429 { "error_code": "RATE_LIMITED", "message": "Rate limit exceeded. Try again later." }
    """
    def __init__(self, app, limiter: RateLimiter = rate_limiter_instance):
        super().__init__(app)
        self.limiter = limiter

    async def dispatch(self, request: Request, call_next) -> Response:
        # Resolve client IP address
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        elif request.client and request.client.host:
            client_ip = request.client.host
        else:
            client_ip = "127.0.0.1"

        path = request.url.path
        method = request.method

        bucket_type = None
        if method == "POST" and (path == "/api/v1/analyze" or path.endswith("/analyze")):
            bucket_type = "analyze"
        elif method == "POST" and (path == "/api/v1/download" or path.endswith("/download")):
            bucket_type = "download"

        if bucket_type:
            bucket = self.limiter.get_bucket(client_ip, bucket_type)
            if not bucket.consume(1.0):
                logger.warning(f"Rate limit exceeded for IP {client_ip} on action {bucket_type}")
                return JSONResponse(
                    status_code=429,
                    content={
                        "error_code": "RATE_LIMITED",
                        "message": "Rate limit exceeded. Try again later.",
                    },
                )

        return await call_next(request)
