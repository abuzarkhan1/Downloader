import os
import subprocess

yaml_content = """tunnel: oldarena
credentials-file: /home/arenax/.cloudflared/0ec075a7-563f-43e9-8938-25a7f9ff9039.json
protocol: http2

ingress:
  - hostname: admin.marenax.site
    service: http://localhost:80

    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
      tcpKeepAlive: 30s
      keepAliveTimeout: 90s
      keepAliveConnections: 100

  - hostname: kmi30.marenax.site
    service: http://localhost:8000
  - hostname: grafana.marenax.site
    service: http://100.123.236.33:3000
  - hostname: api.marenax.site
    service: http://localhost:80
  - hostname: tracker.marenax.site
    service: http://localhost:5050
  - hostname: app.marenax.site
    service: http://localhost:5173
  - hostname: video.marenax.site
    service: http://localhost:8000
  - service: http_status:404
"""

with open('/etc/cloudflared/config.yml', 'w') as f:
    f.write(yaml_content)

print("Config written successfully. Restarting cloudflared...")
subprocess.run(["systemctl", "restart", "cloudflared"])
subprocess.run(["systemctl", "status", "cloudflared", "--no-pager"])
