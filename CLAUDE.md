# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

There is no build system, package manager, linter, or test runner. The extension is plain HTML/CSS/JS loaded directly by Chrome.

| Task | Command |
|---|---|
| Package for distribution | `bash build.sh` → produces `vocab-tool.zip` |
| Syntax-check JS | `node -c vocab-extension/popup.js` (and `storage.js`) |
| Local development | Load unpacked: `chrome://extensions` → Developer mode → **Load unpacked** → select `vocab-extension/` |
| Reload after changes | Hit the reload icon for the extension at `chrome://extensions` (no HMR) |

After changing `manifest.json` host permissions, the extension must be fully reloaded — Chrome does not pick up host-permission changes from a popup reopen alone.

## Architecture

This is a Manifest V3 Chrome extension whose **only surface is the browser-action popup** (`popup.html`). There is no background service worker, no content script, and no message passing — all logic runs inside the popup window each time it opens.

### Module boundary

Two scripts, loaded in order from `popup.html`:

1. **`storage.js`** — defines `VocabStorage`, a static-method class that is the *single* read/write path to `localStorage` under the key `vocab_words`. All persistence (add, delete, search, increment/reset `correct_count`) goes through it. The popup never touches `localStorage` directly.
2. **`popup.js`** — every other concern: tab switching, lookup orchestration, result rendering, word-list rendering, quiz state machine, audio playback, export/import, language selection. State lives in module-level globals (`currentResult`, `currentSearchQuery`, `currentAudioElement`).

When adding new persisted fields, update both the schema in `VocabStorage.addWord` (the source of truth for defaults) *and* import/export will round-trip them automatically since they re-serialize the full object.

### Word schema

```js
{
  id, word, phonetic,
  english_explanation,        // string, joined definitions across meanings
  chinese_translation,        // multiple meanings joined with '；' (Chinese semicolon)
  examples,                   // array of strings
  correct_count,              // quiz state — see below
  created_at
}
```

`chinese_translation` is **multi-meaning by design**: it can hold several alternative meanings separated by `；`. The renderer (`renderTranslationChips` / `buildTranslationChipsHtml` in `popup.js`) splits this string and renders each meaning as a separate `.translation-chip`. `splitTranslations` is intentionally lenient (also splits on `;,，`) so legacy/imported data renders cleanly.

### External APIs and what each provides

| API | Used for | Notes |
|---|---|---|
| `api.dictionaryapi.dev` | English definitions, IPA phonetic, examples | Returns 404 for unknown words — surface as user-facing error |
| `translate.googleapis.com/translate_a/single` (unofficial) | Translation **and** dictionary alternative meanings | Called with `dt=t&dt=bd`. `data[0]` is the primary translation; `data[1]` is alternative meanings grouped by part of speech. `extractTranslations` walks both and dedupes. |
| `translate.google.com/translate_tts` (unofficial) | Audio pronunciation | Used directly as `<audio>` `src` |

Both Google endpoints are unofficial. If they break, `fetchTranslation` and `playAudio` are the only call sites to update. Host permissions in `manifest.json` must list every domain we `fetch` from.

### Quiz graduation

A word is removed from the list permanently after the user gets it right 3 times. The mechanic is split across two files:

- `popup.js` `runQuiz` calls `VocabStorage.incrementCorrectCount` on a correct answer and `resetCorrectCount` on a wrong answer.
- `popup.js` `showResults` reads `correct_count` *after* the round, filters words with `correct_count >= 3` as "graduated", and calls `VocabStorage.deleteWord` on each.

When changing the threshold or the reset-on-wrong rule, both files must stay in sync.

### Build packaging

`build.sh` does **not** copy the whole `vocab-extension/` directory — it explicitly enumerates the five required files plus `icons/`. When adding a new file the extension needs at runtime, add it to the `cp` line in `build.sh` or it will be missing from the released zip.

## Reference

- Product requirements: `docs/PRD.md`
- README has user-facing install/usage docs and a feature list. Note the README's "APIs Used" table lists MyMemory; the code currently uses Google Translate's unofficial endpoint (`translate.googleapis.com`) for translations — keep README in sync if you change APIs.
