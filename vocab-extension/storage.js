/**
 * Storage module for managing vocabulary words in localStorage
 */

const STORAGE_KEY = 'vocab_words';

class VocabStorage {
  /**
   * Get the next available ID
   */
  static getNextId() {
    const words = this.getAll();
    if (words.length === 0) return 1;
    return Math.max(...words.map(w => w.id)) + 1;
  }

  /**
   * Get all words from storage
   */
  static getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[Vocab Tool] Error reading from storage:', error);
      return [];
    }
  }

  /**
   * Save a new word
   */
  static addWord(word) {
    try {
      const words = this.getAll();
      
      // Check for duplicate
      if (words.some(w => w.word.toLowerCase() === word.word.toLowerCase())) {
        console.warn(`[Vocab Tool] Word "${word.word}" already exists`);
        return null;
      }

      const newWord = {
        id: this.getNextId(),
        word: word.word,
        phonetic: word.phonetic || '',
        english_explanation: word.english_explanation || '',
        chinese_translation: word.chinese_translation || '',
        examples: word.examples || [],
        correct_count: word.correct_count || 0,
        created_at: word.created_at || new Date().toISOString()
      };

      words.unshift(newWord); // Add to beginning for newest-first order
      localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
      console.info(`[Vocab Tool] Word "${word.word}" saved successfully`);
      return newWord;
    } catch (error) {
      console.error('[Vocab Tool] Error saving word:', error);
      return null;
    }
  }

  /**
   * Delete a word by ID
   */
  static deleteWord(id) {
    try {
      const words = this.getAll();
      const filteredWords = words.filter(w => w.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredWords));
      console.info(`[Vocab Tool] Word with ID ${id} deleted`);
      return true;
    } catch (error) {
      console.error('[Vocab Tool] Error deleting word:', error);
      return false;
    }
  }

  /**
   * Search words by keyword
   */
  static search(query) {
    const words = this.getAll();
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      return words;
    }

    return words.filter(word => 
      word.word.toLowerCase().includes(lowerQuery) ||
      word.english_explanation.toLowerCase().includes(lowerQuery) ||
      word.chinese_translation.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Update correct count for a word
   */
  static incrementCorrectCount(id) {
    try {
      const words = this.getAll();
      const wordIndex = words.findIndex(w => w.id === id);
      
      if (wordIndex === -1) {
        console.warn(`[Vocab Tool] Word with ID ${id} not found`);
        return null;
      }

      words[wordIndex].correct_count += 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
      console.info(`[Vocab Tool] Word ID ${id} correct count incremented to ${words[wordIndex].correct_count}`);
      return words[wordIndex];
    } catch (error) {
      console.error('[Vocab Tool] Error incrementing correct count:', error);
      return null;
    }
  }

  /**
   * Reset correct count for a word
   */
  static resetCorrectCount(id) {
    try {
      const words = this.getAll();
      const wordIndex = words.findIndex(w => w.id === id);
      
      if (wordIndex === -1) {
        console.warn(`[Vocab Tool] Word with ID ${id} not found`);
        return null;
      }

      words[wordIndex].correct_count = 0;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
      console.info(`[Vocab Tool] Word ID ${id} correct count reset to 0`);
      return words[wordIndex];
    } catch (error) {
      console.error('[Vocab Tool] Error resetting correct count:', error);
      return null;
    }
  }

  /**
   * Clear all words
   */
  static clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.info('[Vocab Tool] All words cleared');
      return true;
    } catch (error) {
      console.error('[Vocab Tool] Error clearing storage:', error);
      return false;
    }
  }
}
