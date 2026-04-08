/**
 * Main popup script for vocabulary tool
 */

// Current audio player
let currentAudioElement = null;

// API endpoints
const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const TRANSLATION_API = 'https://api.mymemory.translated.net/get';

// DOM elements
const app = document.getElementById('app');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const wordInput = document.getElementById('word-input');
const lookupButton = document.getElementById('lookup-button');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const errorDismiss = document.getElementById('error-dismiss');
const resultCard = document.getElementById('result-card');
const resultWord = document.getElementById('result-word');
const resultPhonetic = document.getElementById('result-phonetic');
const resultAudioButton = document.getElementById('result-audio-button');
const resultExplanation = document.getElementById('result-explanation');
const resultTranslation = document.getElementById('result-translation');
const resultExamples = document.getElementById('result-examples');
const saveButton = document.getElementById('save-button');
const discardButton = document.getElementById('discard-button');
const searchInput = document.getElementById('search-input');
const quizButton = document.getElementById('quiz-button');
const wordsList = document.getElementById('words-list');
const emptyState = document.getElementById('empty-state');
const quizModal = document.getElementById('quiz-modal');
const quizContainer = document.getElementById('quiz-container');
const quizMinError = document.getElementById('quiz-min-error');
const toast = document.getElementById('toast');
const langSelect = document.getElementById('lang-select');
const exportButton = document.getElementById('export-button');
const importInput = document.getElementById('import-input');

// Language preference
const LANG_KEY = 'vocab_lang';
function getTargetLang() {
  return localStorage.getItem(LANG_KEY) || 'zh-CN';
}

// Current state
let currentResult = null;
let currentSearchQuery = '';

/**
 * Initialize the extension
 */
function init() {
  setupEventListeners();
  langSelect.value = getTargetLang();
  renderMyWords();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });

  // Add Word tab
  lookupButton.addEventListener('click', handleLookup);
  wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLookup();
  });
  resultAudioButton.addEventListener('click', () => playAudio(currentResult.word));
  saveButton.addEventListener('click', handleSave);
  discardButton.addEventListener('click', handleDiscard);
  errorDismiss.addEventListener('click', hideError);

  // My Words tab — debounced search
  let searchDebounce = null;
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(renderMyWords, 150);
  });
  quizButton.addEventListener('click', startQuiz);
  langSelect.addEventListener('change', () => {
    localStorage.setItem(LANG_KEY, langSelect.value);
  });

  exportButton.addEventListener('click', handleExport);
  importInput.addEventListener('change', handleImport);
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
  // Update buttons
  tabButtons.forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Update content
  tabContents.forEach(content => content.classList.remove('active'));
  document.getElementById(`${tabName}-tab`).classList.add('active');

  if (tabName === 'my-words') {
    renderMyWords();
  }
}


/**
 * Show loading state
 */
function showLoading() {
  loadingState.classList.remove('hidden');
  errorState.classList.add('hidden');
  resultCard.classList.add('hidden');
}

/**
 * Hide loading state
 */
function hideLoading() {
  loadingState.classList.add('hidden');
}

/**
 * Show error state
 */
function showError(message) {
  errorMessage.textContent = message;
  errorState.classList.remove('hidden');
  resultCard.classList.add('hidden');
  loadingState.classList.add('hidden');
}

/**
 * Hide error state
 */
function hideError() {
  errorState.classList.add('hidden');
}

/**
 * Fetch word from dictionary API
 */
async function fetchFromDictionary(word) {
  try {
    const response = await fetch(`${DICTIONARY_API}/${word}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Word "${word}" not found in dictionary`);
      }
      throw new Error('Failed to fetch from dictionary');
    }
    return await response.json();
  } catch (error) {
    console.error('[Vocab Tool] Dictionary API error:', error);
    throw error;
  }
}

/**
 * Fetch translation from MyMemory API
 */
async function fetchTranslation(word) {
  try {
    const params = new URLSearchParams({
      q: word,
      langpair: `en|${getTargetLang()}`
    });
    const response = await fetch(`${TRANSLATION_API}?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch translation');
    }
    const data = await response.json();
    return data.responseData?.translatedText || '';
  } catch (error) {
    console.error('[Vocab Tool] Translation API error:', error);
    throw error;
  }
}

/**
 * Extract phonetic from dictionary response
 */
function extractPhonetic(dictResponse) {
  if (!dictResponse || dictResponse.length === 0) return '';
  
  const entry = dictResponse[0];
  if (entry.phonetic) {
    return entry.phonetic;
  }
  
  // Try to get from phonetics array
  if (entry.phonetics && entry.phonetics.length > 0) {
    return entry.phonetics[0].text || '';
  }
  
  return '';
}

/**
 * Extract definitions from dictionary response
 */
function extractDefinitions(dictResponse) {
  if (!dictResponse || dictResponse.length === 0) return '';
  
  const entry = dictResponse[0];
  const definitions = [];
  
  // Collect definitions from all meanings
  if (entry.meanings && entry.meanings.length > 0) {
    let defCount = 0;
    for (const meaning of entry.meanings) {
      if (meaning.definitions && meaning.definitions.length > 0) {
        const partOfSpeech = meaning.partOfSpeech || '';
        for (const def of meaning.definitions) {
          if (defCount >= 3) break; // Limit to 3 definitions
          const label = partOfSpeech ? `(${partOfSpeech})` : '';
          definitions.push(`${def.definition} ${label}`);
          defCount++;
        }
      }
      if (defCount >= 3) break;
    }
  }
  
  return definitions.join('\n\n');
}

/**
 * Extract examples from dictionary response
 */
function extractExamples(dictResponse) {
  if (!dictResponse || dictResponse.length === 0) return [];
  
  const entry = dictResponse[0];
  const examples = [];
  
  if (entry.meanings && entry.meanings.length > 0) {
    for (const meaning of entry.meanings) {
      if (meaning.definitions && meaning.definitions.length > 0) {
        for (const def of meaning.definitions) {
          if (def.example) {
            examples.push(def.example);
            if (examples.length >= 3) break;
          }
        }
      }
      if (examples.length >= 3) break;
    }
  }
  
  return examples;
}

/**
 * Handle word lookup
 */
async function handleLookup() {
  if (lookupButton.disabled) return;

  const word = wordInput.value.trim();

  if (!word) {
    showError('Please enter a word');
    return;
  }

  lookupButton.disabled = true;
  showLoading();

  try {
    console.info(`[Vocab Tool] Looking up word: "${word}"`);
    
    // Fetch from both APIs in parallel
    const [dictData, translation] = await Promise.all([
      fetchFromDictionary(word),
      fetchTranslation(word)
    ]);

    const phonetic = extractPhonetic(dictData);
    const explanation = extractDefinitions(dictData);
    const examples = extractExamples(dictData);

    currentResult = {
      word: word,
      phonetic: phonetic,
      english_explanation: explanation,
      chinese_translation: translation,
      examples: examples
    };

    displayResult();
    hideLoading();
    console.info(`[Vocab Tool] Successfully retrieved data for "${word}"`);
  } catch (error) {
    hideLoading();
    const errorMsg = error.message || 'Failed to look up word. Please check your internet connection.';
    showError(errorMsg);
    console.error('[Vocab Tool] Lookup error:', error);
  } finally {
    lookupButton.disabled = false;
  }
}

/**
 * Display the lookup result
 */
function displayResult() {
  if (!currentResult) return;

  resultWord.textContent = currentResult.word;
  resultPhonetic.textContent = currentResult.phonetic ? `/${currentResult.phonetic}/` : '';
  resultExplanation.textContent = currentResult.english_explanation;
  resultTranslation.textContent = currentResult.chinese_translation;

  // Display examples
  resultExamples.innerHTML = '';
  currentResult.examples.forEach(example => {
    const div = document.createElement('div');
    div.className = 'example-item';
    div.textContent = example;
    resultExamples.appendChild(div);
  });
  const examplesSection = resultExamples.closest('.result-section');
  if (examplesSection) {
    examplesSection.style.display = currentResult.examples.length > 0 ? '' : 'none';
  }

  resultCard.classList.remove('hidden');
}

/**
 * Handle save button
 */
function handleSave() {
  if (!currentResult) return;

  const saved = VocabStorage.addWord(currentResult);
  if (saved) {
    handleDiscard();
    showNotification('Word saved successfully!');
  } else {
    showError('Failed to save word. It may already exist.');
  }
}

/**
 * Handle discard button
 */
function handleDiscard() {
  currentResult = null;
  wordInput.value = '';
  resultCard.classList.add('hidden');
  errorState.classList.add('hidden');
}

/**
 * Show toast notification
 */
let toastTimer = null;
function showNotification(message) {
  console.info(`[Vocab Tool] ${message}`);
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2000);
}

/**
 * Export all words to a JSON file
 */
function handleExport() {
  const words = VocabStorage.getAll();
  if (words.length === 0) {
    showNotification('No words to export.');
    return;
  }
  const json = JSON.stringify(words, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vocab-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  console.info(`[Vocab Tool] Exported ${words.length} words`);
}

/**
 * Import words from a JSON file (merges, skipping duplicates)
 */
function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (!Array.isArray(imported)) throw new Error('Invalid format');
      let added = 0;
      imported.forEach(word => {
        if (word.word && VocabStorage.addWord(word) !== null) added++;
      });
      renderMyWords();
      showNotification(`Imported ${added} word${added !== 1 ? 's' : ''}.`);
      console.info(`[Vocab Tool] Imported ${added} words`);
    } catch (err) {
      showError('Import failed: invalid file format.');
      console.error('[Vocab Tool] Import error:', err);
    }
    importInput.value = '';
  };
  reader.readAsText(file);
}

/**
 * Render the my words list
 */
function renderMyWords() {
  const words = VocabStorage.search(currentSearchQuery);
  wordsList.innerHTML = '';

  if (words.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  words.forEach(word => {
    const wordItem = createWordItem(word);
    wordsList.appendChild(wordItem);
  });
}

/**
 * Create a word item element
 */
function createWordItem(word) {
  const div = document.createElement('div');
  div.className = 'word-item';
  div.dataset.wordId = word.id;

  const phonetic = word.phonetic ? `/${word.phonetic}/` : '';

  div.innerHTML = `
    <div class="word-item-header">
      <div class="word-item-title">
        <strong>${escapeHtml(word.word)}</strong>
        <span class="word-item-phonetic">${phonetic}</span>
        <button class="word-item-audio" data-word="${escapeHtml(word.word)}" title="Play pronunciation">🔊</button>
        <span class="word-item-translation-badge">${escapeHtml(word.chinese_translation)}</span>
      </div>
      <div class="word-item-actions">
        <button class="word-item-delete" data-word-id="${word.id}" title="Delete word">🗑️</button>
      </div>
    </div>
    <div class="word-item-content">
      <div class="word-item-section">
        <p>${escapeHtml(word.english_explanation)}</p>
      </div>
      ${word.examples.length > 0 ? `
        <div class="word-item-section">
          <h4>Examples</h4>
          <div class="word-item-examples">
            ${word.examples.map(ex => `<div class="word-item-example">${escapeHtml(ex)}</div>`).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Toggle expand on header click
  const header = div.querySelector('.word-item-header');
  header.addEventListener('click', (e) => {
    if (e.target.closest('.word-item-audio, .word-item-delete')) return;
    div.classList.toggle('expanded');
  });

  // Audio button
  const audioBtn = div.querySelector('.word-item-audio');
  audioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playAudio(word.word);
  });

  // Delete button — inline confirmation
  const deleteBtn = div.querySelector('.word-item-delete');
  let deleteConfirmTimer = null;
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (deleteBtn.classList.contains('confirming')) {
      clearTimeout(deleteConfirmTimer);
      VocabStorage.deleteWord(word.id);
      renderMyWords();
    } else {
      deleteBtn.classList.add('confirming');
      deleteBtn.textContent = '?';
      deleteConfirmTimer = setTimeout(() => {
        deleteBtn.classList.remove('confirming');
        deleteBtn.textContent = '🗑️';
      }, 2000);
    }
  });

  return div;
}

/**
 * Play audio for a word
 */
function playAudio(word) {
  // Stop current audio if playing
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement = null;
    document.querySelectorAll('.audio-button, .word-item-audio').forEach(btn => {
      btn.classList.remove('playing');
    });
  }

  try {
    // Use Google Translate TTS API
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word)}&tl=en&client=tw-ob`;
    
    const audio = new Audio(audioUrl);
    currentAudioElement = audio;

    // Update button states
    const buttons = document.querySelectorAll(`[data-word="${escapeHtml(word)}"]`);
    buttons.forEach(btn => btn.classList.add('playing'));

    audio.addEventListener('ended', () => {
      if (currentAudioElement === audio) {
        currentAudioElement = null;
        buttons.forEach(btn => btn.classList.remove('playing'));
      }
    });

    audio.addEventListener('error', () => {
      console.error('[Vocab Tool] Audio playback error');
      currentAudioElement = null;
      buttons.forEach(btn => btn.classList.remove('playing'));
    });

    audio.play();
    console.info(`[Vocab Tool] Playing audio for "${word}"`);
  } catch (error) {
    console.error('[Vocab Tool] Error playing audio:', error);
  }
}

/**
 * Start quiz
 */
function startQuiz() {
  const words = VocabStorage.getAll();

  if (words.length < 4) {
    quizMinError.classList.remove('hidden');
    setTimeout(() => quizMinError.classList.add('hidden'), 3000);
    return;
  }
  quizMinError.classList.add('hidden');

  const selectedWords = getRandomWords(words, Math.min(10, words.length));
  runQuiz(selectedWords);
}

/**
 * Get random words from list
 */
function getRandomWords(words, count) {
  const arr = [...words];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

/**
 * Run quiz flow
 */
function runQuiz(quizWords) {
  quizModal.classList.remove('hidden');
  let currentQuestionIndex = 0;
  const results = [];
  const allWords = VocabStorage.getAll();

  function showQuestion() {
    if (currentQuestionIndex >= quizWords.length) {
      showResults(results);
      return;
    }

    const word = quizWords[currentQuestionIndex];
    const correctTranslation = word.chinese_translation;

    // Get 3 other random translations
    const otherWords = allWords.filter(w => w.id !== word.id);
    const wrongOptions = otherWords
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.chinese_translation);

    const options = [correctTranslation, ...wrongOptions].sort(() => Math.random() - 0.5);

    const phonetic = word.phonetic ? `/${word.phonetic}/` : '';

    quizContainer.innerHTML = `
      <div class="quiz-header">
        <div class="quiz-header-row">
          <h2>Vocabulary Quiz</h2>
          <button class="quiz-quit-button button button-secondary">X</button>
        </div>
        <div class="quiz-progress">${currentQuestionIndex + 1} of ${quizWords.length}</div>
      </div>
      <div class="quiz-card">
        <div class="quiz-question">
          <div class="quiz-question-word">
            <strong class="quiz-question-term">${escapeHtml(word.word)}</strong>
            <span class="quiz-question-phonetic">${phonetic}</span>
            <button class="word-item-audio" data-word="${escapeHtml(word.word)}" title="Play pronunciation">🔊</button>
          </div>
        </div>
        <p class="quiz-instruction">Choose the correct translation:</p>
        <div class="quiz-options">
          ${options.map((option, idx) => `
            <button class="quiz-option" data-option="${escapeHtml(option)}" data-correct="${option === correctTranslation}">
              ${escapeHtml(option)}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    // Setup quit button
    const quitBtn = quizContainer.querySelector('.quiz-quit-button');
    if (quitBtn) {
      quitBtn.addEventListener('click', () => {
        quizModal.classList.add('hidden');
        switchTab('my-words');
      });
    }

    // Setup audio button
    const audioBtn = quizContainer.querySelector('.word-item-audio');
    if (audioBtn) {
      audioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playAudio(word.word);
      });
    }

    // Setup option buttons
    let answered = false;
    const optionButtons = quizContainer.querySelectorAll('.quiz-option');
    optionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;

        const isCorrect = btn.dataset.correct === 'true';
        results.push({ word, isCorrect });

        // Show feedback
        optionButtons.forEach(b => b.classList.add('disabled'));
        if (isCorrect) {
          btn.classList.add('correct');
          VocabStorage.incrementCorrectCount(word.id);
        } else {
          btn.classList.add('incorrect');
          // Find and highlight correct answer
          optionButtons.forEach(b => {
            if (b.dataset.correct === 'true') {
              b.classList.add('correct');
            }
          });
          VocabStorage.resetCorrectCount(word.id);
        }

        setTimeout(() => {
          currentQuestionIndex++;
          showQuestion();
        }, 1000);
      });
    });
  }

  showQuestion();
}

/**
 * Show quiz results
 */
function showResults(results) {
  const correctCount = results.filter(r => r.isCorrect).length;
  const graduated = results.filter(r => {
    const word = VocabStorage.getAll().find(w => w.id === r.word.id);
    return word && word.correct_count >= 3;
  });

  // Delete graduated words
  graduated.forEach(r => {
    VocabStorage.deleteWord(r.word.id);
  });

  const score = Math.round((correctCount / results.length) * 100);

  quizContainer.innerHTML = `
    <div class="quiz-results">
      <h2>${score}%</h2>
      <div class="quiz-results-message">
        You answered ${correctCount} out of ${results.length} questions correctly!
      </div>
      ${graduated.length > 0 ? `
        <div class="quiz-graduated-words">
          <h3>🎉 Graduated Words:</h3>
          <div class="quiz-graduated-words-list">
            ${graduated.map(g => escapeHtml(g.word.word)).join(', ')}
          </div>
        </div>
      ` : ''}
      <div class="quiz-button-container">
        <button class="button button-primary quiz-back-button">Back to Words</button>
      </div>
    </div>
  `;

  quizContainer.querySelector('.quiz-back-button').addEventListener('click', () => {
    quizModal.classList.add('hidden');
    switchTab('my-words');
  });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
