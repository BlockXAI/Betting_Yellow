#!/bin/bash
# Nitrolite Quick Start Script
# Run this in Ubuntu WSL2 after installation

echo "🚀 Setting up Nitrolite..."

# Install dependencies
echo "📦 Installing dependencies..."
sudo apt-get update -qq
sudo apt-get install -y git docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Clone Nitrolite
cd ~
if [ -d "nitrolite" ]; then
    echo "✅ Nitrolite already cloned"
    cd nitrolite
else
    echo "📥 Cloning Nitrolite..."
    git clone https://github.com/erc7824/nitrolite.git
    cd nitrolite
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Starting Nitrolite..."
echo "   This will deploy contracts and start services"
echo ""

# Start services
docker-compose up
