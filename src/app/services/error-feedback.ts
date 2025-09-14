import { Injectable, signal, computed } from '@angular/core';

export interface ErrorPattern {
  type: 'finger_slip' | 'finger_confusion' | 'timing' | 'visual' | 'muscle_memory' | 'keyboard_layout';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
  icon: string;
  color: string;
}

export interface TypingError {
  id: string;
  timestamp: number;
  expectedChar: string;
  actualChar: string;
  word: string;
  position: number;
  timeTaken: number;
  pattern?: ErrorPattern;
  fingerUsed?: string;
  keyDistance?: number;
}

export interface ErrorAnalysis {
  totalErrors: number;
  errorRate: number;
  commonPatterns: { pattern: ErrorPattern; count: number }[];
  problematicKeys: { key: string; errorCount: number; accuracy: number }[];
  recommendations: string[];
  improvementFocus: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ErrorFeedbackService {
  private errors = signal<TypingError[]>([]);
  private sessionErrors = signal<TypingError[]>([]);
  
  // Keyboard layout for distance calculations
  private keyboardLayout: { [key: string]: { row: number; col: number; finger: string } } = {
    'q': { row: 1, col: 0, finger: 'left-pinky' }, 'w': { row: 1, col: 1, finger: 'left-ring' },
    'e': { row: 1, col: 2, finger: 'left-middle' }, 'r': { row: 1, col: 3, finger: 'left-index' },
    't': { row: 1, col: 4, finger: 'left-index' }, 'y': { row: 1, col: 5, finger: 'right-index' },
    'u': { row: 1, col: 6, finger: 'right-index' }, 'i': { row: 1, col: 7, finger: 'right-middle' },
    'o': { row: 1, col: 8, finger: 'right-ring' }, 'p': { row: 1, col: 9, finger: 'right-pinky' },
    'a': { row: 2, col: 0, finger: 'left-pinky' }, 's': { row: 2, col: 1, finger: 'left-ring' },
    'd': { row: 2, col: 2, finger: 'left-middle' }, 'f': { row: 2, col: 3, finger: 'left-index' },
    'g': { row: 2, col: 4, finger: 'left-index' }, 'h': { row: 2, col: 5, finger: 'right-index' },
    'j': { row: 2, col: 6, finger: 'right-index' }, 'k': { row: 2, col: 7, finger: 'right-middle' },
    'l': { row: 2, col: 8, finger: 'right-ring' }, 'z': { row: 3, col: 0, finger: 'left-pinky' },
    'x': { row: 3, col: 1, finger: 'left-ring' }, 'c': { row: 3, col: 2, finger: 'left-middle' },
    'v': { row: 3, col: 3, finger: 'left-index' }, 'b': { row: 3, col: 4, finger: 'left-index' },
    'n': { row: 3, col: 5, finger: 'right-index' }, 'm': { row: 3, col: 6, finger: 'right-index' },
    ' ': { row: 4, col: 4, finger: 'thumbs' }
  };

  // Error patterns for classification
  private errorPatterns: ErrorPattern[] = [
    {
      type: 'finger_slip',
      severity: 'low',
      description: 'Adjacent key mistake',
      suggestion: 'Slow down and focus on finger placement',
      icon: '👆',
      color: '#ffc107'
    },
    {
      type: 'finger_confusion',
      severity: 'medium',
      description: 'Wrong finger used',
      suggestion: 'Practice proper finger positioning',
      icon: '🤔',
      color: '#fd7e14'
    },
    {
      type: 'timing',
      severity: 'medium',
      description: 'Rushed keystroke',
      suggestion: 'Maintain steady rhythm',
      icon: '⏱️',
      color: '#17a2b8'
    },
    {
      type: 'visual',
      severity: 'high',
      description: 'Visual recognition error',
      suggestion: 'Focus on letter recognition',
      icon: '👁️',
      color: '#dc3545'
    },
    {
      type: 'muscle_memory',
      severity: 'high',
      description: 'Muscle memory mismatch',
      suggestion: 'Practice key combinations',
      icon: '💪',
      color: '#6f42c1'
    },
    {
      type: 'keyboard_layout',
      severity: 'low',
      description: 'Layout confusion',
      suggestion: 'Practice with consistent keyboard',
      icon: '⌨️',
      color: '#20c997'
    }
  ];

  // Computed properties
  allErrors = computed(() => this.errors());
  currentSessionErrors = computed(() => this.sessionErrors());
  errorAnalysis = computed(() => this.analyzeErrors());

  recordError(expectedChar: string, actualChar: string, word: string, position: number, timeTaken: number): void {
    const error: TypingError = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      expectedChar: expectedChar.toLowerCase(),
      actualChar: actualChar.toLowerCase(),
      word,
      position,
      timeTaken,
      pattern: this.classifyError(expectedChar, actualChar, timeTaken),
      fingerUsed: this.getFingerForKey(actualChar),
      keyDistance: this.calculateKeyDistance(expectedChar, actualChar)
    };

    // Add to both persistent and session errors
    this.errors.update(errors => [...errors, error]);
    this.sessionErrors.update(errors => [...errors, error]);
    
    // Limit stored errors to prevent memory issues
    if (this.errors().length > 1000) {
      this.errors.update(errors => errors.slice(-800));
    }
  }

  clearSessionErrors(): void {
    this.sessionErrors.set([]);
  }

  clearAllErrors(): void {
    this.errors.set([]);
    this.sessionErrors.set([]);
  }

  getErrorsForKey(key: string): TypingError[] {
    return this.errors().filter(error => error.expectedChar === key.toLowerCase());
  }

  private classifyError(expected: string, actual: string, timeTaken: number): ErrorPattern {
    const expectedKey = this.keyboardLayout[expected.toLowerCase()];
    const actualKey = this.keyboardLayout[actual.toLowerCase()];

    if (!expectedKey || !actualKey) {
      return this.errorPatterns.find(p => p.type === 'visual')!;
    }

    // Calculate distance between keys
    const distance = Math.abs(expectedKey.row - actualKey.row) + Math.abs(expectedKey.col - actualKey.col);

    // Classify based on various factors
    if (distance === 1) {
      return this.errorPatterns.find(p => p.type === 'finger_slip')!;
    }

    if (expectedKey.finger !== actualKey.finger && distance <= 2) {
      return this.errorPatterns.find(p => p.type === 'finger_confusion')!;
    }

    if (timeTaken < 0.1) {
      return this.errorPatterns.find(p => p.type === 'timing')!;
    }

    if (distance > 3) {
      return this.errorPatterns.find(p => p.type === 'visual')!;
    }

    return this.errorPatterns.find(p => p.type === 'muscle_memory')!;
  }

  private getFingerForKey(key: string): string {
    return this.keyboardLayout[key.toLowerCase()]?.finger || 'unknown';
  }

  private calculateKeyDistance(key1: string, key2: string): number {
    const pos1 = this.keyboardLayout[key1.toLowerCase()];
    const pos2 = this.keyboardLayout[key2.toLowerCase()];
    
    if (!pos1 || !pos2) return 0;
    
    return Math.sqrt(Math.pow(pos1.row - pos2.row, 2) + Math.pow(pos1.col - pos2.col, 2));
  }

  private analyzeErrors(): ErrorAnalysis {
    const errors = this.errors();
    const sessionErrors = this.sessionErrors();
    
    if (errors.length === 0) {
      return {
        totalErrors: 0,
        errorRate: 0,
        commonPatterns: [],
        problematicKeys: [],
        recommendations: [],
        improvementFocus: []
      };
    }

    // Pattern analysis
    const patternCounts = new Map<string, number>();
    const keyCounts = new Map<string, { total: number; errors: number }>();

    errors.forEach(error => {
      if (error.pattern) {
        const key = error.pattern.type;
        patternCounts.set(key, (patternCounts.get(key) || 0) + 1);
      }

      const keyData = keyCounts.get(error.expectedChar) || { total: 0, errors: 0 };
      keyData.errors++;
      keyCounts.set(error.expectedChar, keyData);
    });

    // Common patterns
    const commonPatterns = Array.from(patternCounts.entries())
      .map(([type, count]) => ({
        pattern: this.errorPatterns.find(p => p.type === type)!,
        count
      }))
      .sort((a, b) => b.count - a.count);

    // Problematic keys
    const problematicKeys = Array.from(keyCounts.entries())
      .map(([key, data]) => ({
        key,
        errorCount: data.errors,
        accuracy: Math.max(0, 100 - (data.errors / Math.max(data.total, 1)) * 100)
      }))
      .filter(item => item.errorCount >= 3)
      .sort((a, b) => b.errorCount - a.errorCount);

    // Generate recommendations
    const recommendations = this.generateRecommendations(commonPatterns, problematicKeys);
    const improvementFocus = this.generateImprovementFocus(commonPatterns);

    return {
      totalErrors: errors.length,
      errorRate: sessionErrors.length > 0 ? (sessionErrors.length / sessionErrors.length) * 100 : 0,
      commonPatterns,
      problematicKeys,
      recommendations,
      improvementFocus
    };
  }

  private generateRecommendations(patterns: { pattern: ErrorPattern; count: number }[], keys: { key: string; errorCount: number }[]): string[] {
    const recommendations: string[] = [];

    if (patterns.length > 0) {
      const topPattern = patterns[0];
      recommendations.push(topPattern.pattern.suggestion);
    }

    if (keys.length > 0) {
      const topKeys = keys.slice(0, 3).map(k => k.key).join(', ');
      recommendations.push(`Focus on improving accuracy for keys: ${topKeys}`);
    }

    // Add general recommendations based on error count
    const totalErrors = patterns.reduce((sum, p) => sum + p.count, 0);
    if (totalErrors > 50) {
      recommendations.push('Consider slowing down to improve accuracy');
    }

    return recommendations;
  }

  private generateImprovementFocus(patterns: { pattern: ErrorPattern; count: number }[]): string[] {
    const focus: string[] = [];

    patterns.forEach(({ pattern, count }) => {
      if (count >= 5) {
        switch (pattern.type) {
          case 'finger_slip':
            focus.push('Finger placement precision');
            break;
          case 'finger_confusion':
            focus.push('Proper finger assignments');
            break;
          case 'timing':
            focus.push('Typing rhythm and pacing');
            break;
          case 'visual':
            focus.push('Letter recognition and focus');
            break;
          case 'muscle_memory':
            focus.push('Key combination practice');
            break;
          case 'keyboard_layout':
            focus.push('Keyboard familiarity');
            break;
        }
      }
    });

    return [...new Set(focus)]; // Remove duplicates
  }
}