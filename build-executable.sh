#!/bin/bash

# Build script for creating standalone executables
# Run this on a machine WITH Node.js installed

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║  Projetex-Fortnox Executable Builder              ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
npm run build

# Create build directory
mkdir -p build

# Prompt for platform
echo ""
echo "Select platform to build for:"
echo "  1) Linux (x64)"
echo "  2) Windows (x64)"
echo "  3) macOS (x64)"
echo "  4) All platforms"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🔧 Building for Linux..."
        npm run build:linux
        echo ""
        echo "✅ Build complete!"
        echo "📦 Executable: ./build/projetex-fortnox-linux"
        ;;
    2)
        echo ""
        echo "🔧 Building for Windows..."
        npm run build:win
        echo ""
        echo "✅ Build complete!"
        echo "📦 Executable: ./build/projetex-fortnox-win.exe"
        ;;
    3)
        echo ""
        echo "🔧 Building for macOS..."
        npm run build:macos
        echo ""
        echo "✅ Build complete!"
        echo "📦 Executable: ./build/projetex-fortnox-macos"
        ;;
    4)
        echo ""
        echo "🔧 Building for all platforms..."
        npm run build:all
        echo ""
        echo "✅ Build complete!"
        echo "📦 Executables in: ./build/"
        ls -lh ./build/
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║  Next Steps:                                       ║"
echo "║  1. Copy the executable to your remote desktop     ║"
echo "║  2. Copy .env.example and rename to .env           ║"
echo "║  3. Configure .env with your API credentials       ║"
echo "║  4. Run the executable                             ║"
echo "╚════════════════════════════════════════════════════╝"
