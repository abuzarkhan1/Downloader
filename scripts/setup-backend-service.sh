#!/usr/bin/env bash
# Setup video-downloader backend:
# - Installs Python 3.12, pip, ffmpeg
# - Creates virtualenv & installs requirements
# - Configures & starts systemd service

set -e

GREEN='\033[0;32m'
BLUE='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()     { echo -e "${BLUE}[INFO]  $1${NC}"; }
success() { echo -e "${GREEN}[OK]    $1${NC}"; }
warn()    { echo -e "${YELLOW}[WARN]  $1${NC}"; }
error()   { echo -e "${RED}[ERROR] $1${NC}"; exit 1; }

# ─── Root check ───────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  error "Please run as root: sudo bash scripts/setup-backend-service.sh"
fi

USER="arenax"
GROUP="arenax"
PROJECT_DIR="/home/arenax/videodwonloader"
BACKEND_DIR="$PROJECT_DIR/backend"
VENV_DIR="$BACKEND_DIR/.venv312"
SERVICE_NAME="video-downloader-backend"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
PORT=8000

# ─── Step 1: Install system dependencies ──────────────────────
log "Updating apt package list..."
apt-get update -qq

log "Installing Python 3.12, pip, venv, ffmpeg, and build tools..."
apt-get install -y -qq \
  python3.12 \
  python3.12-venv \
  python3.12-dev \
  python3-pip \
  ffmpeg \
  curl \
  build-essential

success "System dependencies installed."

# ─── Step 2: Verify Python 3.12 ───────────────────────────────
PYTHON_BIN=$(which python3.12 2>/dev/null || true)
if [ -z "$PYTHON_BIN" ]; then
  error "Python 3.12 installation failed. Please install manually."
fi
PYTHON_VER=$($PYTHON_BIN --version 2>&1)
success "Using $PYTHON_VER at $PYTHON_BIN"

# ─── Step 3: Verify ffmpeg ────────────────────────────────────
if ! command -v ffmpeg &>/dev/null; then
  warn "ffmpeg not found after install. Some video merging features may not work."
else
  success "ffmpeg $(ffmpeg -version 2>&1 | head -1 | awk '{print $3}') installed."
fi

# ─── Step 4: Create virtualenv ────────────────────────────────
if [ ! -d "$VENV_DIR" ]; then
  log "Creating Python 3.12 virtualenv at $VENV_DIR..."
  sudo -u "$USER" $PYTHON_BIN -m venv "$VENV_DIR"
  success "Virtualenv created."
else
  success "Virtualenv already exists at $VENV_DIR — skipping creation."
fi

# ─── Step 5: Install Python requirements ──────────────────────
log "Installing Python requirements from backend/requirements.txt..."
sudo -u "$USER" "$VENV_DIR/bin/pip" install --upgrade pip -q
sudo -u "$USER" "$VENV_DIR/bin/pip" install -r "$BACKEND_DIR/requirements.txt" -q
success "Python packages installed."

# ─── Step 6: Install yt-dlp (latest) ──────────────────────────
log "Installing latest yt-dlp..."
sudo -u "$USER" "$VENV_DIR/bin/pip" install --upgrade yt-dlp -q
success "yt-dlp installed."

# ─── Step 7: Create systemd service ───────────────────────────
log "Creating systemd service at $SERVICE_FILE..."
cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Video Downloader FastAPI Backend
After=network.target

[Service]
User=$USER
Group=$GROUP
WorkingDirectory=$BACKEND_DIR
Environment="PATH=$VENV_DIR/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=$VENV_DIR/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
Restart=always
RestartSec=5
StandardOutput=append:/var/log/${SERVICE_NAME}.log
StandardError=append:/var/log/${SERVICE_NAME}.log

[Install]
WantedBy=multi-user.target
EOF

success "Service file created at $SERVICE_FILE"

# ─── Step 8: Log file & rotation ──────────────────────────────
touch /var/log/${SERVICE_NAME}.log
chown $USER:$GROUP /var/log/${SERVICE_NAME}.log

cat > "/etc/logrotate.d/${SERVICE_NAME}" <<EOF
/var/log/${SERVICE_NAME}.log {
    rotate 7
    daily
    missingok
    notifempty
    delaycompress
    compress
    copytruncate
}
EOF
success "Log rotation configured."

# ─── Step 9: Enable & start service ───────────────────────────
log "Reloading systemd daemon..."
systemctl daemon-reload
log "Enabling and starting ${SERVICE_NAME}.service..."
systemctl enable "${SERVICE_NAME}.service"
systemctl restart "${SERVICE_NAME}.service"

sleep 3

# ─── Step 10: Health check ────────────────────────────────────
log "Performing health check on http://localhost:$PORT ..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT || echo "000")
if echo "$HTTP_CODE" | grep -qE "^(200|404|401|403|422)$"; then
  success "Service is UP and responding (HTTP $HTTP_CODE)."
else
  warn "Service may not be responding yet (HTTP $HTTP_CODE). Check with:"
  warn "  systemctl status ${SERVICE_NAME}.service"
  warn "  journalctl -u ${SERVICE_NAME}.service -n 30"
fi

echo ""
success "Backend setup complete!"
echo -e "${BLUE}  Service:  systemctl status ${SERVICE_NAME}.service${NC}"
echo -e "${BLUE}  Logs:     tail -f /var/log/${SERVICE_NAME}.log${NC}"
echo -e "${BLUE}  Backend:  http://localhost:$PORT${NC}"
