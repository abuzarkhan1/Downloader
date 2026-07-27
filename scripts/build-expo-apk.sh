#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Expo APK Build Process..."

# Pre-flight checks
echo "🔍 Running pre-flight checks..."
cd "$(dirname "$0")/../mobile"

if ! command -v eas &> /dev/null; then
    echo "❌ eas-cli could not be found. Installing..."
    npm install -g eas-cli
fi

# Run TypeScript compilation
echo "✅ Checking TypeScript compilation..."
npx tsc --noEmit

# Set production API URL
export EXPO_PUBLIC_API_URL="https://video.marenax.site"
echo "🌐 API URL set to $EXPO_PUBLIC_API_URL"

# Trigger Expo APK build
echo "📱 Triggering EAS Build for Android (APK)..."
eas build -p android --profile preview

echo "🎉 Build process initiated successfully!"
