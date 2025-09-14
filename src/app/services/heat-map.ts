import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage';

export interface KeystrokeData {
  key: string;
  attempts: number;
  errors: number;
  averageTime: number;
  totalTime: number;
  finger: string;
  position: { row: number; col: number };
}

export interface TypingError {
  timestamp: number;
  expectedKey: string;
  actualKey: string;
  word: string;
  position: number;
  timeTaken: number;
}

export interface HeatMapData {
  keystroke: KeystrokeData[];
  errors: TypingError[];
  lastUpdated: number;
  totalKeystrokes: number;
  totalErrors: number;
  sessionId: string;
}

export interface FingerAnalysis {
  finger: string;
  accuracy: number;
  speed: number;
  errorCount: number;
  keystrokeCount: number;
  problemKeys: string[];
}

export interface KeyboardLayout {
  [key: string]: {
    finger: string;
    position: { row: number; col: number };
    difficulty: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class HeatMapService {
  private readonly STORAGE_KEY = 'typingGame_heatMap';
  private readonly MAX_STORED_SESSIONS = 10;
  
  private heatMapData = signal<HeatMapData>(this.getInitialHeatMapData());
  private currentSession = signal<string>('');
  
  // QWERTY keyboard layout with finger mapping
  private readonly keyboardLayout: KeyboardLayout = {
    // Top row (numbers)
    '1': { finger: 'left-pinky', position: { row: 0, col: 0 }, difficulty: 3 },
    '2': { finger: 'left-ring', position: { row: 0, col: 1 }, difficulty: 3 },
    '3': { finger: 'left-middle', position: { row: 0, col: 2 }, difficulty: 3 },
    '4': { finger: 'left-index', position: { row: 0, col: 3 }, difficulty: 3 },
    '5': { finger: 'left-index', position: { row: 0, col: 4 }, difficulty: 3 },
    '6': { finger: 'right-index', position: { row: 0, col: 5 }, difficulty: 3 },
    '7': { finger: 'right-index', position: { row: 0, col: 6 }, difficulty: 3 },
    '8': { finger: 'right-middle', position: { row: 0, col: 7 }, difficulty: 3 },
    '9': { finger: 'right-ring', position: { row: 0, col: 8 }, difficulty: 3 },
    '0': { finger: 'right-pinky', position: { row: 0, col: 9 }, difficulty: 3 },
    
    // QWERTY row
    'q': { finger: 'left-pinky', position: { row: 1, col: 0 }, difficulty: 2 },
    'w': { finger: 'left-ring', position: { row: 1, col: 1 }, difficulty: 2 },
    'e': { finger: 'left-middle', position: { row: 1, col: 2 }, difficulty: 1 },
    'r': { finger: 'left-index', position: { row: 1, col: 3 }, difficulty: 1 },
    't': { finger: 'left-index', position: { row: 1, col: 4 }, difficulty: 2 },
    'y': { finger: 'right-index', position: { row: 1, col: 5 }, difficulty: 2 },
    'u': { finger: 'right-index', position: { row: 1, col: 6 }, difficulty: 2 },
    'i': { finger: 'right-middle', position: { row: 1, col: 7 }, difficulty: 1 },
    'o': { finger: 'right-ring', position: { row: 1, col: 8 }, difficulty: 1 },
    'p': { finger: 'right-pinky', position: { row: 1, col: 9 }, difficulty: 2 },
    
    // ASDF row (home row)
    'a': { finger: 'left-pinky', position: { row: 2, col: 0 }, difficulty: 1 },
    's': { finger: 'left-ring', position: { row: 2, col: 1 }, difficulty: 1 },
    'd': { finger: 'left-middle', position: { row: 2, col: 2 }, difficulty: 1 },
    'f': { finger: 'left-index', position: { row: 2, col: 3 }, difficulty: 1 },
    'g': { finger: 'left-index', position: { row: 2, col: 4 }, difficulty: 1 },
    'h': { finger: 'right-index', position: { row: 2, col: 5 }, difficulty: 1 },
    'j': { finger: 'right-index', position: { row: 2, col: 6 }, difficulty: 1 },
    'k': { finger: 'right-middle', position: { row: 2, col: 7 }, difficulty: 1 },
    'l': { finger: 'right-ring', position: { row: 2, col: 8 }, difficulty: 1 },
    
    // ZXCV row
    'z': { finger: 'left-pinky', position: { row: 3, col: 0 }, difficulty: 2 },
    'x': { finger: 'left-ring', position: { row: 3, col: 1 }, difficulty: 2 },
    'c': { finger: 'left-middle', position: { row: 3, col: 2 }, difficulty: 2 },
    'v': { finger: 'left-index', position: { row: 3, col: 3 }, difficulty: 2 },
    'b': { finger: 'left-index', position: { row: 3, col: 4 }, difficulty: 2 },
    'n': { finger: 'right-index', position: { row: 3, col: 5 }, difficulty: 2 },
    'm': { finger: 'right-index', position: { row: 3, col: 6 }, difficulty: 2 },
    
    // Special keys
    ' ': { finger: 'thumbs', position: { row: 4, col: 4 }, difficulty: 1 },
    '.': { finger: 'right-ring', position: { row: 3, col: 8 }, difficulty: 2 },
    ',': { finger: 'right-middle', position: { row: 3, col: 7 }, difficulty: 2 },
  };

  constructor(private storageService: StorageService) {
    this.loadHeatMapData();
    this.startNewSession();
  }

  // Public API
  getHeatMapData() {
    return this.heatMapData.asReadonly();
  }

  getCurrentSession() {
    return this.currentSession.asReadonly();
  }

  recordKeystroke(key: string, timeTaken: number, isCorrect: boolean, expectedKey?: string, word?: string, position?: number): void {
    const lowerKey = key.toLowerCase();
    const keyInfo = this.keyboardLayout[lowerKey];
    
    if (!keyInfo) return; // Ignore unknown keys
    
    const data = { ...this.heatMapData() };
    let keystroke = data.keystroke.find(k => k.key === lowerKey);
    
    if (!keystroke) {
      keystroke = {
        key: lowerKey,
        attempts: 0,
        errors: 0,
        averageTime: 0,
        totalTime: 0,
        finger: keyInfo.finger,
        position: keyInfo.position
      };
      data.keystroke.push(keystroke);
    }
    
    // Update keystroke data
    keystroke.attempts++;
    keystroke.totalTime += timeTaken;
    keystroke.averageTime = keystroke.totalTime / keystroke.attempts;
    
    if (!isCorrect) {
      keystroke.errors++;
      
      // Record the error
      if (expectedKey && word !== undefined && position !== undefined) {
        data.errors.push({
          timestamp: Date.now(),
          expectedKey: expectedKey.toLowerCase(),
          actualKey: lowerKey,
          word,
          position,
          timeTaken
        });
      }
    }
    
    data.totalKeystrokes++;
    if (!isCorrect) data.totalErrors++;
    data.lastUpdated = Date.now();
    
    this.heatMapData.set(data);
    this.saveHeatMapData();
  }

  getKeyAccuracy(key: string): number {
    const lowerKey = key.toLowerCase();
    const keystroke = this.heatMapData().keystroke.find(k => k.key === lowerKey);
    
    if (!keystroke || keystroke.attempts === 0) return 100;
    
    return Math.round(((keystroke.attempts - keystroke.errors) / keystroke.attempts) * 100);
  }

  getKeySpeed(key: string): number {
    const lowerKey = key.toLowerCase();
    const keystroke = this.heatMapData().keystroke.find(k => k.key === lowerKey);
    
    return keystroke?.averageTime || 0;
  }

  getFingerAnalysis = computed(() => {
    const data = this.heatMapData();
    const fingerMap = new Map<string, FingerAnalysis>();
    
    // Initialize finger data
    const fingers = ['left-pinky', 'left-ring', 'left-middle', 'left-index', 'right-index', 'right-middle', 'right-ring', 'right-pinky', 'thumbs'];
    fingers.forEach(finger => {
      fingerMap.set(finger, {
        finger,
        accuracy: 100,
        speed: 0,
        errorCount: 0,
        keystrokeCount: 0,
        problemKeys: []
      });
    });
    
    // Aggregate data by finger
    data.keystroke.forEach(keystroke => {
      const fingerData = fingerMap.get(keystroke.finger);
      if (fingerData) {
        fingerData.keystrokeCount += keystroke.attempts;
        fingerData.errorCount += keystroke.errors;
        fingerData.speed += keystroke.averageTime * keystroke.attempts;
        
        // Check if this key is problematic (accuracy < 90%)
        const accuracy = ((keystroke.attempts - keystroke.errors) / keystroke.attempts) * 100;
        if (accuracy < 90 && keystroke.attempts >= 5) {
          fingerData.problemKeys.push(keystroke.key);
        }
      }
    });
    
    // Calculate final metrics
    fingerMap.forEach(fingerData => {
      if (fingerData.keystrokeCount > 0) {
        fingerData.accuracy = Math.round(((fingerData.keystrokeCount - fingerData.errorCount) / fingerData.keystrokeCount) * 100);
        fingerData.speed = Math.round((fingerData.speed / fingerData.keystrokeCount) * 100) / 100;
      }
    });
    
    return Array.from(fingerMap.values());
  });

  getProblematicKeys = computed(() => {
    const data = this.heatMapData();
    return data.keystroke
      .filter(keystroke => {
        if (keystroke.attempts < 5) return false;
        const accuracy = ((keystroke.attempts - keystroke.errors) / keystroke.attempts) * 100;
        return accuracy < 85;
      })
      .map(keystroke => ({
        key: keystroke.key,
        accuracy: Math.round(((keystroke.attempts - keystroke.errors) / keystroke.attempts) * 100),
        attempts: keystroke.attempts,
        errors: keystroke.errors,
        averageTime: Math.round(keystroke.averageTime * 100) / 100,
        finger: keystroke.finger
      }))
      .sort((a, b) => a.accuracy - b.accuracy);
  });

  getRecentErrors = computed(() => {
    const data = this.heatMapData();
    return data.errors
      .slice(-20) // Last 20 errors
      .reverse()
      .map(error => ({
        ...error,
        relativeTime: this.getRelativeTime(error.timestamp)
      }));
  });

  getKeyboardHeatMap = computed(() => {
    const data = this.heatMapData();
    const heatMap: { [key: string]: { intensity: number; accuracy: number; speed: number; count: number } } = {};
    
    // Find max values for normalization
    let maxAttempts = 0;
    let maxTime = 0;
    
    data.keystroke.forEach(keystroke => {
      maxAttempts = Math.max(maxAttempts, keystroke.attempts);
      maxTime = Math.max(maxTime, keystroke.averageTime);
    });
    
    // Generate heat map data
    Object.keys(this.keyboardLayout).forEach(key => {
      const keystroke = data.keystroke.find(k => k.key === key);
      
      if (keystroke) {
        const accuracy = ((keystroke.attempts - keystroke.errors) / keystroke.attempts) * 100;
        const normalizedUsage = keystroke.attempts / (maxAttempts || 1);
        const normalizedSpeed = 1 - (keystroke.averageTime / (maxTime || 1));
        
        heatMap[key] = {
          intensity: normalizedUsage,
          accuracy: Math.round(accuracy),
          speed: Math.round(normalizedSpeed * 100),
          count: keystroke.attempts
        };
      } else {
        heatMap[key] = {
          intensity: 0,
          accuracy: 100,
          speed: 100,
          count: 0
        };
      }
    });
    
    return heatMap;
  });

  getTypingPatterns = computed(() => {
    const data = this.heatMapData();
    const patterns = {
      commonMistakes: this.getCommonMistakePatterns(data.errors),
      slowKeys: this.getSlowKeys(data.keystroke),
      fingerStress: this.getFingerStressAnalysis(),
      improvementSuggestions: this.getImprovementSuggestions()
    };
    
    return patterns;
  });

  // Session management
  startNewSession(): void {
    this.currentSession.set(`session_${Date.now()}`);
  }

  clearAllData(): void {
    this.heatMapData.set(this.getInitialHeatMapData());
    this.saveHeatMapData();
  }

  exportHeatMapData(): string {
    const data = {
      heatMapData: this.heatMapData(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  }

  // Private methods
  private getInitialHeatMapData(): HeatMapData {
    return {
      keystroke: [],
      errors: [],
      lastUpdated: Date.now(),
      totalKeystrokes: 0,
      totalErrors: 0,
      sessionId: ''
    };
  }

  private getCommonMistakePatterns(errors: TypingError[]): Array<{pattern: string; count: number; description: string}> {
    const patterns = new Map<string, number>();
    
    errors.forEach(error => {
      const pattern = `${error.expectedKey}→${error.actualKey}`;
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    });
    
    return Array.from(patterns.entries())
      .map(([pattern, count]) => ({
        pattern,
        count,
        description: this.describeMistakePattern(pattern)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private describeMistakePattern(pattern: string): string {
    const [expected, actual] = pattern.split('→');
    const expectedInfo = this.keyboardLayout[expected];
    const actualInfo = this.keyboardLayout[actual];
    
    if (!expectedInfo || !actualInfo) return 'Unknown pattern';
    
    if (expectedInfo.finger === actualInfo.finger) {
      return 'Same finger mistake - focus on finger precision';
    }
    
    if (Math.abs(expectedInfo.position.col - actualInfo.position.col) === 1) {
      return 'Adjacent key mistake - slow down and focus';
    }
    
    return 'Finger coordination issue';
  }

  private getSlowKeys(keystrokes: KeystrokeData[]): Array<{key: string; averageTime: number; finger: string}> {
    return keystrokes
      .filter(k => k.attempts >= 5)
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10)
      .map(k => ({
        key: k.key,
        averageTime: Math.round(k.averageTime * 100) / 100,
        finger: k.finger
      }));
  }

  private getFingerStressAnalysis(): Array<{finger: string; workload: number; accuracy: number}> {
    const analysis = this.getFingerAnalysis();
    return analysis
      .map(finger => ({
        finger: finger.finger,
        workload: Math.round((finger.keystrokeCount / (this.heatMapData().totalKeystrokes || 1)) * 100),
        accuracy: finger.accuracy
      }))
      .sort((a, b) => b.workload - a.workload);
  }

  private getImprovementSuggestions(): string[] {
    const suggestions: string[] = [];
    const problemKeys = this.getProblematicKeys();
    const fingerAnalysis = this.getFingerAnalysis();
    
    // Accuracy suggestions
    if (problemKeys.length > 0) {
      suggestions.push(`Focus on improving accuracy for: ${problemKeys.slice(0, 3).map(k => k.key).join(', ')}`);
    }
    
    // Finger-specific suggestions
    const weakFingers = fingerAnalysis.filter(f => f.accuracy < 90 && f.keystrokeCount > 10);
    if (weakFingers.length > 0) {
      suggestions.push(`Practice exercises for ${weakFingers[0].finger} finger`);
    }
    
    // Speed suggestions
    const slowKeys = this.getSlowKeys(this.heatMapData().keystroke);
    if (slowKeys.length > 0) {
      suggestions.push(`Work on speed for keys: ${slowKeys.slice(0, 3).map(k => k.key).join(', ')}`);
    }
    
    return suggestions;
  }

  private getRelativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) return `${minutes}m ${seconds}s ago`;
    return `${seconds}s ago`;
  }

  private loadHeatMapData(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.heatMapData.set(data);
      } catch {
        this.heatMapData.set(this.getInitialHeatMapData());
      }
    }
  }

  private saveHeatMapData(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.heatMapData()));
  }
}