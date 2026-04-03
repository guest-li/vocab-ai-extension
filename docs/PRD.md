# Product Requirements Document — English Vocabulary Tool

## Overview

A Chrome extension that helps users learn English vocabulary efficiently. Users look up words, save them, and test themselves with a quiz. No backend server required — all data stored locally.

---

## Core Features

### F1 — Extension Shell
Chrome extension (Manifest V3) with a popup panel UI.

### F2 — Keyboard Shortcut
Opens popup via `Cmd+Shift+V` (Mac) / `Ctrl+Shift+V` (Windows/Linux).

### F3 — Add Word Tab
Input field + "Look up" button for entering any English word.

### F4 — Dictionary Lookup
Calls Free Dictionary API and MyMemory Translation API in parallel; shows a loading spinner while fetching.

### F5 — Result Preview
Displays a generated entry card for user review before saving.

### F6 — Save / Discard
User confirms with **Save** or dismisses with **Discard**. Save clears the card; Discard clears card and input.

### F7 — My Words Tab
Searchable, scrollable list of saved words, displayed newest-first.

### F8 — Expand Word
Clicking a saved word toggles its full entry (definition + examples).

### F9 — Delete Word
Delete button with confirmation dialog removes a word from storage.

### F10 — Error Handling
Displays a user-friendly error message if the API is unreachable or the word is not found.

### F11 — Newest-First Order
Newly saved words appear at the top of the list.

### F12 — Keyboard Shortcut Hint
Footer always shows the platform-appropriate keyboard shortcut.

### F13 — IPA Phonetics
Phonetic notation displayed on the result card and in the word list.

### F14 — Audio Pronunciation
Play button triggers audio via Google Translate TTS.

### F15 — Single Audio Playback
Only one word plays audio at a time; starting a new one stops the previous.

---

## Quiz Mode

### F16 — Quiz Button
"Quiz" button in the My Words tab launches quiz mode.

### F17 — Minimum Words
Quiz requires at least 4 saved words; shows inline error if fewer.

### F18 — Random Questions
Selects up to 10 random words; each question has 4 multiple-choice translation options.

### F19 — Answer Feedback
Correct answer highlighted green, wrong answer red; auto-advances after 1 second.

### F20 — Results Screen
Shows score percentage, graduated words, and a "Back to Words" button that returns to My Words tab.

### F21 — Word Graduation
3 correct answers → word auto-deleted from list. Wrong answer → correct_count reset to 0.

### F22 — Quiz Card Layout
Each quiz question shows word + phonetic + audio button.

---

## Dictionary Entry (A — API-Generated Content)

### A1 — Full Entry Schema
Each saved entry contains: word, IPA phonetic, up to 3 definitions with part-of-speech, translation, up to 3 example sentences.

### A2 — Free Dictionary API
Provides definitions, phonetics, and examples.
Endpoint: `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`

### A3 — MyMemory Translation API
Provides translation into the user's selected target language.
Endpoint: `https://api.mymemory.translated.net/get?q={word}&langpair=en|{lang}`

### A4 — Word Not Found Error
Shows an error message if the dictionary API returns 404.

---

## Storage (D — Data)

### D1 — localStorage Schema
Words stored in `localStorage` under key `vocab_words` as a JSON array with fields:
`id`, `word`, `phonetic`, `english_explanation`, `chinese_translation`, `examples[]`, `correct_count`, `created_at`

### D2 — Client-Side Search
Search filters across `word`, `english_explanation`, and `chinese_translation` fields, case-insensitive.

### D3 — No Backend
All data stored locally; no server or database required.

---

## Data Portability

### D4 — Export
"Export" button downloads all saved words as a JSON backup file.

### D5 — Import
"Import" button reads a JSON backup file and merges words (skipping duplicates), preserving `correct_count` and `created_at`.

---

## Language Configuration

### L1 — Configurable Target Language
User can select the translation target language from a dropdown in the footer. Default: 简体中文 (zh-CN). Selection persists across sessions.

### L2 — Supported Languages
简体中文, 繁體中文, 日本語, 한국어, Español, Français, Deutsch, Português, Русский, العربية.

---

## Observability (O — Logging)

### O1 — Log Prefix
All console messages prefixed with `[Vocab Tool]`.

### O2 — Log Levels
Uses `console.info` for normal events, `console.warn` for recoverable issues, `console.error` for failures.

### O3 — Error Logging
All API failures and storage errors appear as `console.error`.

---

## Distribution

### P1 — Build Script
`bash build.sh` produces `vocab-tool.zip` containing only the 6 required extension files.

### P2 — Package Size
Distributable zip must stay under 100KB.

### P3 — Zero Dependencies
Extension has no npm dependencies at runtime; `node_modules` is only for development tooling.
