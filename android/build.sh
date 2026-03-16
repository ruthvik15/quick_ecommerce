#!/bin/bash

# Android Rider App - Build Script
# Quick build and deployment helper

set -e  # Exit on error

echo "🚀 Android Rider App Build Script"
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "gradle.properties" ]; then
    echo -e "${RED}Error: Please run this script from the android/ directory${NC}"
    exit 1
fi

# Function to display usage
usage() {
    echo "Usage: ./build.sh [command]"
    echo ""
    echo "Commands:"
    echo "  clean          - Clean build artifacts"
    echo "  debug          - Build debug APK"
    echo "  release        - Build release APK"
    echo "  install        - Build and install debug APK"
    echo "  run            - Build, install, and run the app"
    echo "  lint           - Run code quality checks"
    echo "  test           - Run unit tests"
    echo "  help           - Show this help message"
    echo ""
}

# Function to clean
clean() {
    echo -e "${YELLOW}🧹 Cleaning build artifacts...${NC}"
    ./gradlew clean
    echo -e "${GREEN}✓ Clean complete${NC}"
}

# Function to build debug
build_debug() {
    echo -e "${YELLOW}🔨 Building debug APK...${NC}"
    ./gradlew assembleDebug
    echo -e "${GREEN}✓ Debug APK created${NC}"
    echo -e "   Location: app/build/outputs/apk/debug/app-debug.apk"
}

# Function to build release
build_release() {
    echo -e "${YELLOW}🔨 Building release APK...${NC}"
    ./gradlew assembleRelease
    echo -e "${GREEN}✓ Release APK created${NC}"
    echo -e "   Location: app/build/outputs/apk/release/app-release.apk"
}

# Function to install
install() {
    echo -e "${YELLOW}📱 Installing debug APK...${NC}"
    ./gradlew installDebug
    echo -e "${GREEN}✓ App installed${NC}"
}

# Function to run
run() {
    echo -e "${YELLOW}▶️  Building, installing, and launching app...${NC}"
    ./gradlew installDebug
    adb shell am start -n com.ecommerce.rider/.ui.splash.SplashActivity
    echo -e "${GREEN}✓ App launched${NC}"
}

# Function to run lint
lint() {
    echo -e "${YELLOW}🔍 Running code quality checks...${NC}"
    ./gradlew lint
    echo -e "${GREEN}✓ Lint complete${NC}"
}

# Function to run tests
test() {
    echo -e "${YELLOW}🧪 Running unit tests...${NC}"
    ./gradlew test
    echo -e "${GREEN}✓ Tests complete${NC}"
}

# Main command handling
case "$1" in
    clean)
        clean
        ;;
    debug)
        build_debug
        ;;
    release)
        build_release
        ;;
    install)
        build_debug
        install
        ;;
    run)
        run
        ;;
    lint)
        lint
        ;;
    test)
        test
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        if [ -z "$1" ]; then
            echo -e "${RED}Error: No command specified${NC}"
        else
            echo -e "${RED}Error: Unknown command '$1'${NC}"
        fi
        echo ""
        usage
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Done!${NC}"
