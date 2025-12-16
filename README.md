# 📚 Vocabulary Manager - Modern Chrome Extension v2.0

Modern vocabulary learning extension with AI-powered collocations, offline support, and bilingual interface.

## ✨ Features

- 🤖 **AI-Powered**: Generate collocations using Google Gemini AI
- 🔐 **Secure**: Encrypted API key storage
- 🌐 **Bilingual**: English & Vietnamese interface
- 🌙 **Dark Mode**: Light/Dark theme support
- 💾 **Offline Support**: IndexedDB caching & offline sync
- ⚡ **Modern UI**: Built with Tailwind CSS & TypeScript
- 🚀 **Fast**: Optimized with Vite build system

## 🚀 Quick Start

### 1. Install Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder: `/home/phihung0131/Documents/anki-project/vocabulary-extension/dist`

### 2. Configure Extension

1. Click the extension icon in toolbar
2. Click "Settings" button
3. Enter:
   - **Server URL**: `http://localhost:3000` (or your server URL)
   - **Google AI API Key**: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - **Theme**: Choose Light/Dark/Auto
4. Click "Save"
5. Click "Test Connection" to verify

### 3. Start Server

```bash
cd /home/phihung0131/Documents/anki-project/vocabulary-server
npm start
```

## 📖 How to Use

### Add Words

**Method 1: Context Menu**
1. Select any English text on a webpage
2. Right-click → "📚 Add to vocabulary"

**Method 2: Manual Entry**
1. Click extension icon
2. Type word in input box
3. Click "Add Word"

### Generate Collocations

1. Add multiple words to queue
2. Click "Generate Collocations"
3. Wait for AI to process
4. Collocations saved to database automatically

### Export Data

- Click "📥 Export CSV" to download vocabulary as CSV file
- Use for importing into Anki or other tools

## 🛠️ Development

### Build Extension

```bash
npm install
npm run build
```

### Watch Mode (for development)

```bash
npm run dev
```

Then reload extension in Chrome after each change.

### Project Structure

```
src/
├── background/     # Service worker
├── content/        # Content script
├── popup/          # Main popup UI
├── options/        # Settings page
├── shared/         # Shared utilities
│   ├── api/       # API clients (server, AI)
│   ├── cache/     # IndexedDB & caching
│   ├── i18n/      # Translations (en, vi)
│   ├── security/  # Encryption & keychain
│   └── utils/     # Validation, notifications, errors
└── assets/        # Styles & resources
```

## 🔧 Tech Stack

- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Modern styling
- **Dexie.js** - IndexedDB wrapper
- **i18next** - Internationalization
- **Zod** - Schema validation

## 🔐 Security Features

- ✅ API keys encrypted with Web Crypto API
- ✅ Device-specific encryption keys
- ✅ No sensitive data in source code
- ✅ MongoDB credentials in .env only

## 📝 Notes

- **Icons**: Default placeholder icons included. Replace in `public/icons/` with your own
- **Server**: Must be running for full functionality
- **API Key**: Required for AI collocation generation

## 🐛 Troubleshooting

**Extension not loading?**
- Make sure to select the `dist` folder, not the root folder
- Check Chrome console for errors

**Connection failed?**
- Verify server is running on correct port
- Check Server URL in settings
- Test connection button should show status

**AI generation fails?**
- Verify API key is correct (starts with "AIza")
- Check API key quota on Google AI Studio
- Try test connection button

## 📄 License

MIT License
