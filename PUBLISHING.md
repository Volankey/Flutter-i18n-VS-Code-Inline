# 📦 Publishing Guide - VS Code Marketplace

This guide will help you publish the Flutter i18n Inline Editor extension to the VS Code Marketplace.

## 🚀 Pre-Publishing Checklist

### ✅ Required Files (Already Created)
- [x] `package.json` - Extension manifest with metadata
- [x] `README.md` - Extension description and documentation
- [x] `CHANGELOG.md` - Version history and changes
- [x] `LICENSE` - License file
- [x] `icon.png` - Extension icon (128x128)
- [x] `.vscodeignore` - Files to exclude from package
- [x] `dist/extension.js` - Compiled extension code

### 📝 Before Publishing

1. **Update Publisher Name**
   ```bash
   # Edit package.json and replace "your-publisher-name" with your actual publisher ID
   ```

2. **Update Repository URLs**
   ```bash
   # Replace "your-username" in package.json and README.md with your GitHub username
   ```

3. **Test the Extension**
   ```bash
   # Press F5 in VS Code to test the extension in a new Extension Development Host window
   ```

## 🔑 Setup VS Code Publisher Account

1. **Create Azure DevOps Account**
   - Go to https://dev.azure.com
   - Sign in with Microsoft account

2. **Create Personal Access Token**
   - Go to User Settings → Personal Access Tokens
   - Create new token with **Marketplace (Manage)** scope
   - Copy the token (you'll need it later)

3. **Create Publisher**
   ```bash
   npx vsce create-publisher your-publisher-name
   ```

4. **Login to Publisher**
   ```bash
   npx vsce login your-publisher-name
   # Enter your Personal Access Token when prompted
   ```

## 📦 Package and Publish

### 🔨 Build and Package

```bash
# 1. Install dependencies
pnpm install

# 2. Build the extension
pnpm run package

# 3. Create .vsix package (optional - for testing)
npx vsce package

# 4. Test the package locally (optional)
code --install-extension flutter-i18n-vscode-inline-0.0.1.vsix
```

### 🚀 Publish to Marketplace

```bash
# Publish the extension
npx vsce publish

# Or publish with specific version
npx vsce publish 0.0.1

# Or publish pre-release version
npx vsce publish --pre-release
```

## 📊 SEO Optimization (Already Implemented)

### ✅ Package.json Optimizations
- [x] **Descriptive displayName**: "Flutter i18n Inline Editor - Translation Preview & Management"
- [x] **Rich description** with emojis and benefits
- [x] **Comprehensive keywords** (24 relevant terms)
- [x] **Proper categories**: Programming Languages, Other, Snippets, Linters
- [x] **Icon reference**: icon.png

### ✅ README.md Optimizations
- [x] **SEO-friendly title** with emojis
- [x] **Multiple badges** for credibility
- [x] **Clear value proposition**
- [x] **Feature highlights** with visual elements
- [x] **Comprehensive keywords section**
- [x] **Use case descriptions**
- [x] **Call-to-action** for ratings and stars

### ✅ Technical Optimizations
- [x] **Optimized .vscodeignore** for smaller package size
- [x] **Professional icon** in SVG format
- [x] **Detailed changelog** for version tracking
- [x] **Proper licensing** information

## 🎯 Post-Publishing Tips

### 📈 Increase Visibility
1. **Share on Social Media**
   - Twitter/X with #Flutter #VSCode hashtags
   - LinkedIn developer communities
   - Reddit r/FlutterDev, r/vscode

2. **Community Engagement**
   - Flutter Discord servers
   - Stack Overflow answers
   - Dev.to articles

3. **Documentation**
   - Create demo videos/GIFs
   - Write blog posts about the extension
   - Update Flutter community resources

### 📊 Monitor Performance
- Check VS Code Marketplace analytics
- Monitor GitHub issues and feedback
- Track download and rating trends
- Respond to user reviews promptly

## 🔄 Update Process

```bash
# 1. Update version in package.json
# 2. Update CHANGELOG.md
# 3. Build and test
pnpm run package

# 4. Publish update
npx vsce publish
```

## 🆘 Troubleshooting

### Common Issues
- **"Publisher not found"**: Make sure you've created and logged into your publisher account
- **"Package too large"**: Check .vscodeignore file to exclude unnecessary files
- **"Invalid icon"**: Ensure icon.png is valid and 128x128 pixels
- **"Missing required fields"**: Verify all required fields in package.json

### Useful Commands
```bash
# Check package contents
npx vsce ls

# Validate package
npx vsce package --no-dependencies

# Show publisher info
npx vsce show your-publisher-name

# Unpublish (use with caution)
npx vsce unpublish your-publisher-name.flutter-i18n-vscode-inline
```

---

🎉 **Congratulations!** Your extension is now ready for the VS Code Marketplace with full SEO optimization!

For more details, visit the [official VS Code publishing guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).