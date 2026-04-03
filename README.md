# English Vocabulary Tool

A Chrome extension for learning English vocabulary — look up words, save them, and test yourself with a quiz.

## Features

- **Look up any word** — fetches definition, IPA phonetic, and translation in one click
- **Audio pronunciation** — plays native pronunciation via Google Translate TTS
- **Save words** — stores your vocabulary list locally (no account needed)
- **Search** — instantly filter your saved words
- **Quiz mode** — 4-option multiple choice; words graduate after 3 correct answers
- **Configurable translation language** — supports 10 languages (default: 简体中文)
- **Export / Import** — back up your word list as JSON so data is never lost

## Installation

### Option A — Load from source

1. Clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select the `vocab-extension/` folder

### Option B — Install from zip

1. Download `vocab-tool.zip` from [Releases](https://github.com/guest-li/vocab-ai-extension/releases)
2. Unzip it
3. Follow steps 2–4 above, selecting the unzipped folder

## Usage

| Action | How |
|---|---|
| Open popup | `Cmd+Shift+V` (Mac) / `Ctrl+Shift+V` (Windows) |
| Look up a word | Type in the input field → click **Look up** |
| Save a word | Click **Save** on the result card |
| Browse saved words | Click the **My Words** tab |
| Play pronunciation | Click the 🔊 button |
| Expand word details | Click on any word in the list |
| Search | Type in the search box on the My Words tab |
| Start a quiz | Click **Quiz** (requires 4+ saved words) |
| Change language | Use the **Translate to:** dropdown in the footer |
| Back up your data | Click **⬇ Export** to download a JSON file |
| Restore your data | Click **⬆ Import** to load a JSON backup |

## Supported Translation Languages

| Language | Code |
|---|---|
| 简体中文 | zh-CN |
| 繁體中文 | zh-TW |
| 日本語 | ja |
| 한국어 | ko |
| Español | es |
| Français | fr |
| Deutsch | de |
| Português | pt |
| Русский | ru |
| العربية | ar |

## Project Structure

```
vocab-ai-extension/
├── vocab-extension/      # Chrome extension source
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── storage.js
│   ├── styles.css
│   └── icons/
├── docs/
│   └── PRD.md            # Product requirements
├── build.sh              # Packaging script
└── .gitignore
```

## Build

Run the build script to produce a distributable zip:

```bash
bash build.sh
# → vocab-tool.zip (~16KB)
```

## APIs Used

| API | Purpose | Cost |
|---|---|---|
| [Free Dictionary API](https://dictionaryapi.dev) | Definitions, phonetics, examples | Free |
| [MyMemory Translation API](https://mymemory.translated.net) | Translation | Free |
| Google Translate TTS | Audio pronunciation | Free |

## Data & Privacy

All vocabulary data is stored in your browser's `localStorage`. Nothing is sent to any server. Uninstalling the extension deletes local data — use **Export** to back up first.

## License

MIT
