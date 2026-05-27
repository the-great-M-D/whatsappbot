#!/bin/bash
set -e

echo "=== Kaoi Bot — Oracle Cloud Setup ==="

# 1. System update
sudo apt-get update -y && sudo apt-get upgrade -y

# 2. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git build-essential \
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev

echo "Node $(node -v) installed"

# 3. Clone repo — edit this URL before running
REPO_URL="https://github.com/YOUR_USERNAME/YOUR_REPO.git"
INSTALL_DIR="/opt/kaoi"

if [ -d "$INSTALL_DIR" ]; then
    echo "Directory exists — pulling latest..."
    cd "$INSTALL_DIR" && git pull
else
    sudo git clone "$REPO_URL" "$INSTALL_DIR"
    sudo chown -R "$USER:$USER" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# 4. Install dependencies and build
npm install --legacy-peer-deps
npm run build

# 5. Create .env file — fill in your values
if [ ! -f .env ]; then
    cat > .env << 'EOF'
MONGODB_URL=your_mongodb_connection_string_here
SESSION=M_D
PREFIX=!
NAME=M_D BOT
MODS=
EOF
    echo "Created .env — edit it now: nano $INSTALL_DIR/.env"
fi

# 6. Install PM2 and start the bot
sudo npm install -g pm2
pm2 start dist/kaoi.js --name kaoi-bot
pm2 save

# 7. Set PM2 to start on reboot
pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1 | sudo bash

# 8. Open firewall port for the dashboard
sudo iptables -I INPUT -p tcp --dport 4040 -j ACCEPT
# Make it persistent
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save

echo ""
echo "=== Setup complete ==="
echo "Bot status:  pm2 status"
echo "Bot logs:    pm2 logs kaoi-bot"
echo "Restart bot: pm2 restart kaoi-bot"
echo "Dashboard:   http://$(curl -s ifconfig.me):4040"
echo ""
echo "IMPORTANT: Edit your .env file if you haven't already:"
echo "  nano $INSTALL_DIR/.env"
echo "Then restart: pm2 restart kaoi-bot"
