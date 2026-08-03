#!/usr/bin/env bash
# Setup Cloudflare Tunnel for video.marenax.site

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

# Root check
if [ "$EUID" -ne 0 ]; then
  error "Please run as root (sudo bash setup-cloudflare-tunnel.sh)"
fi

DOMAIN="video.marenax.site"
SERVICE="http://localhost:8000"
TUNNEL_NAME="oldarena"
if [ -n "$SUDO_USER" ]; then
  USER_HOME=$(eval echo "~$SUDO_USER")
else
  USER_HOME=$(eval echo "~$(whoami)")
fi
USER_CONFIG="$USER_HOME/.cloudflared/config.yml"
ETC_CONFIG="/etc/cloudflared/config.yml"

log "Checking user config at $USER_CONFIG"
if [ ! -f "$USER_CONFIG" ]; then
    error "User config $USER_CONFIG not found! Make sure you are authenticated with cloudflared."
fi

log "Backing up user config..."
cp "$USER_CONFIG" "${USER_CONFIG}.bak"

log "Injecting ingress for $DOMAIN into user config..."
# Remove existing entry if any
sed -i.tmp -e "/- hostname: $DOMAIN/{N;d;}" "$USER_CONFIG"
rm -f "$USER_CONFIG.tmp"

# Inject before "- service: http_status:404"
awk -v hostname="$DOMAIN" -v service="$SERVICE" '
  /^[[:space:]]*- service: http_status:404/ {
    print "  - hostname: " hostname
    print "    service: " service
  }
  { print }
' "${USER_CONFIG}.bak" > "$USER_CONFIG"

log "Syncing config to $ETC_CONFIG..."
mkdir -p /etc/cloudflared
cp "$USER_CONFIG" "$ETC_CONFIG"
chown root:root "$ETC_CONFIG"

log "Creating DNS route for $DOMAIN on tunnel $TUNNEL_NAME..."
if cloudflared tunnel route dns "$TUNNEL_NAME" "$DOMAIN"; then
    success "DNS route created successfully"
else
    warn "DNS route creation failed or already exists"
fi

log "Restarting cloudflared service..."
systemctl restart cloudflared

log "Testing tunnel accessibility..."
sleep 3
if curl -sI "https://$DOMAIN" | grep -q -e "HTTP/2 200" -e "HTTP/3 200" -e "HTTP/2 404" -e "HTTP/3 404" -e "HTTP/2 401" -e "HTTP/3 401" -e "HTTP/2 403" -e "HTTP/3 403" -e "HTTP/1.1 200" -e "HTTP/1.1 404"; then
    success "Tunnel is active and responding on https://$DOMAIN"
else
    warn "Could not verify tunnel response for https://$DOMAIN. It may still be propagating."
fi

success "Cloudflare tunnel setup complete!"
