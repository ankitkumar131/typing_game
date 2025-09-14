import { Injectable } from '@angular/core';

export interface WordCategory {
  name: string;
  words: string[];
}

export interface DifficultyLevel {
  name: string;
  wordLength: { min: number; max: number };
  timePerWord: number; // seconds
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class WordService {
  private readonly categories: WordCategory[] = [
    {
      name: 'Basic',
      words: [
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
        'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
        'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy',
        'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
      ]
    },
    {
      name: 'Common',
      words: [
        'about', 'after', 'again', 'before', 'being', 'below', 'between', 'both',
        'during', 'each', 'few', 'from', 'further', 'here', 'how', 'other',
        'own', 'same', 'should', 'such', 'than', 'them', 'very', 'were',
        'what', 'when', 'where', 'which', 'while', 'with', 'would', 'your'
      ]
    },
    {
      name: 'Programming',
      words: [
        'function', 'variable', 'array', 'object', 'string', 'number', 'boolean',
        'interface', 'class', 'method', 'property', 'return', 'import', 'export',
        'component', 'service', 'module', 'package', 'library', 'framework',
        'algorithm', 'database', 'server', 'client', 'response', 'request',
        'parameter', 'argument', 'callback', 'promise', 'async', 'await'
      ]
    },
    {
      name: 'Advanced',
      words: [
        'development', 'implementation', 'architecture', 'optimization', 'performance',
        'scalability', 'maintainability', 'responsibility', 'configuration', 'authentication',
        'authorization', 'infrastructure', 'documentation', 'specification', 'integration',
        'deployment', 'environment', 'orchestration', 'containerization', 'virtualization',
        'microservices', 'monolithic', 'distributed', 'synchronization', 'asynchronous'
      ]
    }
  ];

  private readonly difficultyLevels: DifficultyLevel[] = [
    {
      name: 'Easy',
      wordLength: { min: 2, max: 5 },
      timePerWord: 4,
      description: 'Short words with plenty of time'
    },
    {
      name: 'Medium',
      wordLength: { min: 4, max: 8 },
      timePerWord: 2.5,
      description: 'Medium words with moderate time'
    },
    {
      name: 'Hard',
      wordLength: { min: 6, max: 12 },
      timePerWord: 1.5,
      description: 'Long words with limited time'
    },
    {
      name: 'Expert',
      wordLength: { min: 8, max: 15 },
      timePerWord: 1,
      description: 'Complex words with minimal time'
    }
  ];

  getCategories(): WordCategory[] {
    return this.categories;
  }

  getDifficultyLevels(): DifficultyLevel[] {
    return this.difficultyLevels;
  }

  getRandomWord(category: string = 'Common', difficulty: string = 'Medium'): string {
    const categoryData = this.categories.find(cat => cat.name === category);
    if (!categoryData) {
      throw new Error(`Category '${category}' not found`);
    }

    const difficultyData = this.difficultyLevels.find(diff => diff.name === difficulty);
    if (!difficultyData) {
      throw new Error(`Difficulty '${difficulty}' not found`);
    }

    // Filter words by difficulty length requirements
    const filteredWords = categoryData.words.filter(word => 
      word.length >= difficultyData.wordLength.min && 
      word.length <= difficultyData.wordLength.max
    );

    if (filteredWords.length === 0) {
      // Fallback to any word from category if no words match difficulty
      return categoryData.words[Math.floor(Math.random() * categoryData.words.length)];
    }

    return filteredWords[Math.floor(Math.random() * filteredWords.length)];
  }

  getWordSequence(count: number, category: string = 'Common', difficulty: string = 'Medium'): string[] {
    const words: string[] = [];
    const usedWords = new Set<string>();
    
    for (let i = 0; i < count; i++) {
      let word = this.getRandomWord(category, difficulty);
      
      // Avoid repeating words in sequence
      while (usedWords.has(word) && usedWords.size < this.getAllWordsForCategory(category).length) {
        word = this.getRandomWord(category, difficulty);
      }
      
      words.push(word);
      usedWords.add(word);
      
      // Clear used words set if we've used most available words
      if (usedWords.size > this.getAllWordsForCategory(category).length * 0.8) {
        usedWords.clear();
      }
    }
    
    return words;
  }

  private getAllWordsForCategory(category: string): string[] {
    const categoryData = this.categories.find(cat => cat.name === category);
    return categoryData ? categoryData.words : [];
  }

  getTimePerWord(difficulty: string): number {
    const difficultyData = this.difficultyLevels.find(diff => diff.name === difficulty);
    return difficultyData ? difficultyData.timePerWord : 2.5;
  }
}
