import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage';

export interface CustomText {
  id: string;
  name: string;
  content: string;
  wordCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  category: string;
  createdAt: number;
  lastUsed?: number;
  timesUsed: number;
  averageWpm?: number;
  averageAccuracy?: number;
  tags: string[];
  source?: string;
  isPublic: boolean;
}

export interface TextImportResult {
  success: boolean;
  text?: CustomText;
  error?: string;
  warnings?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CustomTextService {
  private readonly STORAGE_KEY = 'typingGame_customTexts';
  private readonly MAX_TEXTS = 50;
  private readonly MIN_WORD_COUNT = 10;
  private readonly MAX_WORD_COUNT = 1000;
  
  private customTexts = signal<CustomText[]>([]);
  
  constructor(private storageService: StorageService) {
    this.loadCustomTexts();
    this.addDefaultTexts();
  }

  // Public API
  getCustomTexts() {
    return this.customTexts.asReadonly();
  }

  getTextById(id: string): CustomText | undefined {
    return this.customTexts().find(text => text.id === id);
  }

  getTextsByCategory(category: string): CustomText[] {
    return this.customTexts().filter(text => text.category === category);
  }

  getTextsByDifficulty(difficulty: string): CustomText[] {
    return this.customTexts().filter(text => text.difficulty === difficulty);
  }

  searchTexts(query: string): CustomText[] {
    const lowerQuery = query.toLowerCase();
    return this.customTexts().filter(text =>
      text.name.toLowerCase().includes(lowerQuery) ||
      text.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      text.content.toLowerCase().includes(lowerQuery)
    );
  }

  importFromString(content: string, name: string, options: Partial<CustomText> = {}): TextImportResult {
    try {
      const cleanContent = this.cleanText(content);
      const words = this.extractWords(cleanContent);
      
      if (words.length < this.MIN_WORD_COUNT) {
        return {
          success: false,
          error: `Text must contain at least ${this.MIN_WORD_COUNT} words. Found ${words.length}.`
        };
      }

      if (words.length > this.MAX_WORD_COUNT) {
        return {
          success: false,
          error: `Text is too long. Maximum ${this.MAX_WORD_COUNT} words allowed. Found ${words.length}.`
        };
      }

      if (this.customTexts().length >= this.MAX_TEXTS) {
        return {
          success: false,
          error: `Maximum ${this.MAX_TEXTS} custom texts allowed. Please delete some texts first.`
        };
      }

      const difficulty = this.calculateDifficulty(words);
      const category = options.category || this.suggestCategory(cleanContent);
      const tags = options.tags || this.generateTags(cleanContent, words);

      const customText: CustomText = {
        id: this.generateId(),
        name: name.trim() || `Custom Text ${this.customTexts().length + 1}`,
        content: cleanContent,
        wordCount: words.length,
        difficulty,
        category,
        createdAt: Date.now(),
        timesUsed: 0,
        tags,
        isPublic: options.isPublic || false,
        source: options.source,
        ...options
      };

      const warnings = this.validateText(customText);
      
      this.addCustomText(customText);
      
      return {
        success: true,
        text: customText,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to import text: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  importFromFile(file: File): Promise<TextImportResult> {
    return new Promise((resolve) => {
      if (!this.isValidFileType(file)) {
        resolve({
          success: false,
          error: 'Invalid file type. Please upload a .txt, .md, or .json file.'
        });
        return;
      }

      if (file.size > 1024 * 1024) { // 1MB limit
        resolve({
          success: false,
          error: 'File too large. Maximum size is 1MB.'
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const name = this.getFileNameWithoutExtension(file.name);
          const result = this.importFromString(content, name, {
            source: `File: ${file.name}`
          });
          resolve(result);
        } catch (error) {
          resolve({
            success: false,
            error: 'Failed to read file content.'
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to read file.'
        });
      };

      reader.readAsText(file);
    });
  }

  importFromUrl(url: string): Promise<TextImportResult> {
    return new Promise(async (resolve) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          resolve({
            success: false,
            error: `Failed to fetch content from URL: ${response.statusText}`
          });
          return;
        }

        const content = await response.text();
        const name = this.extractNameFromUrl(url);
        const result = this.importFromString(content, name, {
          source: `URL: ${url}`
        });
        resolve(result);
      } catch (error) {
        resolve({
          success: false,
          error: `Failed to fetch content: ${error instanceof Error ? error.message : 'Network error'}`
        });
      }
    });
  }

  deleteText(id: string): boolean {
    const texts = this.customTexts();
    const index = texts.findIndex(text => text.id === id);
    
    if (index === -1) return false;
    
    const updated = texts.filter(text => text.id !== id);
    this.customTexts.set(updated);
    this.saveCustomTexts();
    return true;
  }

  updateText(id: string, updates: Partial<CustomText>): boolean {
    const texts = this.customTexts();
    const index = texts.findIndex(text => text.id === id);
    
    if (index === -1) return false;
    
    const updatedTexts = [...texts];
    updatedTexts[index] = { ...updatedTexts[index], ...updates };
    this.customTexts.set(updatedTexts);
    this.saveCustomTexts();
    return true;
  }

  recordUsage(id: string, wpm: number, accuracy: number): void {
    const text = this.getTextById(id);
    if (!text) return;
    
    const newTimesUsed = text.timesUsed + 1;
    const newAverageWpm = text.averageWpm 
      ? (text.averageWpm * text.timesUsed + wpm) / newTimesUsed
      : wpm;
    const newAverageAccuracy = text.averageAccuracy
      ? (text.averageAccuracy * text.timesUsed + accuracy) / newTimesUsed
      : accuracy;
    
    this.updateText(id, {
      lastUsed: Date.now(),
      timesUsed: newTimesUsed,
      averageWpm: Math.round(newAverageWpm),
      averageAccuracy: Math.round(newAverageAccuracy)
    });
  }

  exportTexts(): string {
    const data = {
      texts: this.customTexts(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  }

  importTexts(jsonData: string): { success: boolean; imported: number; errors: string[] } {
    try {
      const data = JSON.parse(jsonData);
      const errors: string[] = [];
      let imported = 0;
      
      if (!data.texts || !Array.isArray(data.texts)) {
        return { success: false, imported: 0, errors: ['Invalid import format'] };
      }
      
      for (const textData of data.texts) {
        if (this.customTexts().length >= this.MAX_TEXTS) {
          errors.push('Maximum text limit reached');
          break;
        }
        
        try {
          const result = this.importFromString(
            textData.content,
            textData.name,
            {
              category: textData.category,
              tags: textData.tags,
              isPublic: textData.isPublic,
              source: textData.source
            }
          );
          
          if (result.success) {
            imported++;
          } else {
            errors.push(`Failed to import "${textData.name}": ${result.error}`);
          }
        } catch (error) {
          errors.push(`Error importing "${textData.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      return { success: imported > 0, imported, errors };
    } catch (error) {
      return { 
        success: false, 
        imported: 0, 
        errors: ['Invalid JSON format'] 
      };
    }
  }

  // Private methods
  private cleanText(content: string): string {
    return content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?;:'"()-]/g, '') // Remove special characters
      .trim();
  }

  private extractWords(content: string): string[] {
    return content
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .map(word => word.replace(/[.,!?;:'"()-]/g, ''));
  }

  private calculateDifficulty(words: string[]): CustomText['difficulty'] {
    const avgLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const complexWords = words.filter(word => word.length > 7).length;
    const complexRatio = complexWords / words.length;
    
    if (avgLength >= 6 && complexRatio >= 0.3) return 'Expert';
    if (avgLength >= 5 && complexRatio >= 0.2) return 'Hard';
    if (avgLength >= 4) return 'Medium';
    return 'Easy';
  }

  private suggestCategory(content: string): string {
    const techWords = ['code', 'programming', 'software', 'computer', 'algorithm', 'function', 'variable'];
    const scienceWords = ['science', 'research', 'experiment', 'hypothesis', 'theory', 'molecule'];
    const literatureWords = ['story', 'novel', 'character', 'plot', 'narrative', 'literature'];
    
    const lowerContent = content.toLowerCase();
    
    if (techWords.some(word => lowerContent.includes(word))) return 'Programming';
    if (scienceWords.some(word => lowerContent.includes(word))) return 'Science';
    if (literatureWords.some(word => lowerContent.includes(word))) return 'Literature';
    
    return 'General';
  }

  private generateTags(content: string, words: string[]): string[] {
    const tags: string[] = [];
    const avgLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    if (avgLength > 6) tags.push('long-words');
    if (words.length > 100) tags.push('long-text');
    if (content.includes('"')) tags.push('quotes');
    if (/\d/.test(content)) tags.push('numbers');
    if (/[A-Z]/.test(content)) tags.push('capitalized');
    
    return tags;
  }

  private validateText(text: CustomText): string[] {
    const warnings: string[] = [];
    
    if (text.name.length > 50) {
      warnings.push('Text name is quite long');
    }
    
    if (text.wordCount < 20) {
      warnings.push('Text is quite short for meaningful practice');
    }
    
    if (text.tags.length === 0) {
      warnings.push('Consider adding tags for better organization');
    }
    
    return warnings;
  }

  private isValidFileType(file: File): boolean {
    const validTypes = ['text/plain', 'text/markdown', 'application/json'];
    const validExtensions = ['.txt', '.md', '.json'];
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  }

  private getFileNameWithoutExtension(fileName: string): string {
    return fileName.replace(/\.[^/.]+$/, '');
  }

  private extractNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1] || 'URL Import';
    } catch {
      return 'URL Import';
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private addCustomText(text: CustomText): void {
    const texts = [...this.customTexts(), text];
    this.customTexts.set(texts);
    this.saveCustomTexts();
  }

  private loadCustomTexts(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const texts = JSON.parse(stored);
        this.customTexts.set(Array.isArray(texts) ? texts : []);
      } catch {
        this.customTexts.set([]);
      }
    }
  }

  private saveCustomTexts(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.customTexts()));
  }

  private addDefaultTexts(): void {
    if (this.customTexts().length > 0) return;
    
    const defaultTexts = [
      {
        name: 'Lorem Ipsum Classic',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        category: 'Practice',
        tags: ['classic', 'latin', 'practice']
      },
      {
        name: 'Quick Brown Fox',
        content: 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump! Waltz, bad nymph, for quick jigs vex.',
        category: 'Pangrams',
        tags: ['pangram', 'alphabet', 'practice']
      },
      {
        name: 'Programming Snippet',
        content: 'function calculateSum(array) { return array.reduce((sum, current) => sum + current, 0); } const numbers = [1, 2, 3, 4, 5]; const total = calculateSum(numbers); console.log(total);',
        category: 'Programming',
        tags: ['javascript', 'coding', 'functions']
      }
    ];
    
    defaultTexts.forEach(textData => {
      this.importFromString(textData.content, textData.name, {
        category: textData.category,
        tags: textData.tags,
        source: 'Default Text'
      });
    });
  }
}