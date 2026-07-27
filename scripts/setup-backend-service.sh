#!/usr/bin/env bash
# Setup systemd service for video-downloader-backend

set -e

# Colors for logging
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[*] $1${NC}"; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; }
error() { echo -e "${RED}[x] $1${NC}"; exit 1; }
success() { echo -e "${GREEN}[+] $1${NC}"; }

# Check root
if [ "$EUID" -ne 0 ]; then
  error "Please run as root (sudo bash scripts/setup-backend-service.sh)"
fi

USER="arenax"
GROUP="arenax"
PROJECT_DIR="/home/arenax/videodwonloader"
VENV_DIR="$PROJECT_DIR/.venv312"
SERVICE_NAME="video-downloader-backend.service"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME"
PORT=8000

log "Setting up $SERVICE_NAME..."

cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Video Downloader FastAPI Backend
After=network.target

[Service]
User=$USER
Group=$GROUP
WorkingDirectory=$PROJECT_DIR
Environment="PATH=$VENV_DIR/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=$VENV_DIR/bin/python -m uvicorn main:app --host 0.0.0.0 --port $PORT
Restart=always
RestartSec=5
StandardOutput=append:/var/log/video-downloader-backend.log
StandardError=append:/var/log/video-downloader-backend.log

[Install]
WantedBy=multi-user.target
EOF

success "Created service file at $SERVICE_FILE"
touch /var/log/video-downloader-backend.log
chown $USER:$GROUP /var/log/video-downloader-backend.log

# Log rotation
log "Setting up log rotation..."
cat > "/etc/logrotate.d/video-downloader-backend" << EOF
/var/log/video-downloader-backend.log {
    rotate 7
    daily
    missingok
    notifempty
    delaycompress
    compress
    copytruncate
}
EOF

success "Configured log rotation"

log "Reloading systemd daemon..."
systemctl daemon-reload
log "Enabling and starting $SERVICE_NAME..."
systemctl enable $SERVICE_NAME
systemctl restart $SERVICE_NAME

sleep 2

# Health check
log "Performing health check on localhost:$PORT..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q '200\|404\|401\|403'; then
  success "Service is responding locally."
else
  warn "Service is running but might not be responding properly. Check status with: systemctl status $SERVICE_NAME"
fi

success "Backend service setup complete."
