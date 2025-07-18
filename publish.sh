#!/bin/bash

# 🚀 Flutter i18n VS Code Extension - Publishing Script
# This script helps you publish the extension to VS Code Marketplace

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v npx &> /dev/null; then
        print_error "npx is not installed. Please install Node.js first."
        exit 1
    fi
    
    print_success "All dependencies are installed."
}

# Check if publisher is configured
check_publisher() {
    print_status "Checking publisher configuration..."
    
    if grep -q "your-publisher-name" package.json; then
        print_error "Please update the publisher name in package.json"
        print_warning "Replace 'your-publisher-name' with your actual VS Code publisher ID"
        exit 1
    fi
    
    if grep -q "your-username" package.json; then
        print_warning "Consider updating repository URLs in package.json"
        print_warning "Replace 'your-username' with your actual GitHub username"
    fi
    
    print_success "Publisher configuration looks good."
}

# Build the extension
build_extension() {
    print_status "Building extension..."
    
    if ! pnpm run package; then
        print_error "Build failed. Please fix the errors and try again."
        exit 1
    fi
    
    if [ ! -f "dist/extension.js" ]; then
        print_error "Build output not found. Check your build configuration."
        exit 1
    fi
    
    print_success "Extension built successfully."
}

# Validate package
validate_package() {
    print_status "Validating package..."
    
    if ! npx vsce package --no-dependencies; then
        print_error "Package validation failed."
        exit 1
    fi
    
    print_success "Package validation passed."
}

# Publish to marketplace
publish_extension() {
    print_status "Publishing to VS Code Marketplace..."
    
    # Check if user wants to publish as pre-release
    if [ "$1" = "--pre-release" ]; then
        print_status "Publishing as pre-release version..."
        npx vsce publish --pre-release
    else
        npx vsce publish
    fi
    
    if [ $? -eq 0 ]; then
        print_success "🎉 Extension published successfully!"
        print_status "It may take a few minutes to appear in the marketplace."
        print_status "Check your extension at: https://marketplace.visualstudio.com/manage/publishers/"
    else
        print_error "Publishing failed. Please check the error messages above."
        exit 1
    fi
}

# Main function
main() {
    echo "🚀 Flutter i18n VS Code Extension - Publishing Script"
    echo "===================================================="
    echo ""
    
    # Parse command line arguments
    PRE_RELEASE=false
    if [ "$1" = "--pre-release" ]; then
        PRE_RELEASE=true
        print_status "Pre-release mode enabled"
    fi
    
    # Run checks and build
    check_dependencies
    check_publisher
    build_extension
    validate_package
    
    # Ask for confirmation
    echo ""
    print_warning "Ready to publish to VS Code Marketplace!"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ "$PRE_RELEASE" = true ]; then
            publish_extension --pre-release
        else
            publish_extension
        fi
    else
        print_status "Publishing cancelled."
        exit 0
    fi
    
    echo ""
    print_success "🎉 All done! Your extension is now live on the VS Code Marketplace!"
    echo ""
    print_status "Next steps:"
    echo "  1. Share your extension on social media"
    echo "  2. Monitor reviews and feedback"
    echo "  3. Update documentation if needed"
    echo "  4. Plan future updates and features"
    echo ""
    print_status "Thank you for contributing to the VS Code ecosystem! 🙌"
}

# Run the script
main "$@"