import { Injectable } from '@angular/core';

export interface GameResult {
  timestamp: number;
  wpm: number;
  accuracy: number;
  score: number;
  correctWords: number;
  totalWords: number;
  mistakes: number;
  maxStreak: number;
  difficulty: string;
  category: string;
  duration: number;
  achievements: any[];
}

export interface UserProfile {
  username: string;
  email?: string;
  avatar?: string;
  totalGamesPlayed: number;
  totalTimeSpent: number;
  bestWpm: number;
  bestAccuracy: number;
  bestScore: number;
  totalWordsTyped: number;
  averageWpm: number;
  averageAccuracy: number;
  favoriteCategory: string;
  favoritedifficulty: string;
  achievements: string[];
  createdAt: number;
  lastPlayedAt: number;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  soundEnabled: boolean;
  soundVolume: number;
  keyboardLayout: 'qwerty' | 'dvorak' | 'colemak' | 'azerty';
  showWpmInRealTime: boolean;
  showAccuracyInRealTime: boolean;
  enableAnimations: boolean;
  autoCapitalize: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorBlindFriendly: boolean;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  wpm: number;
  accuracy: number;
  score: number;
  difficulty: string;
  category: string;
  timestamp: number;
  verified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly STORAGE_KEYS = {
    GAME_RESULTS: 'typingGame_results',
    USER_PROFILE: 'typingGame_profile',
    USER_SETTINGS: 'typingGame_settings',
    LEADERBOARD: 'typingGame_leaderboard',
    ACHIEVEMENTS: 'typingGame_achievements',
    STATISTICS: 'typingGame_statistics'
  };

  private readonly MAX_STORED_RESULTS = 100;

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage(): void {
    if (!this.getUserProfile()) {
      this.createDefaultProfile();
    }

    if (!this.getUserSettings()) {
      this.createDefaultSettings();
    }
  }

  // Game Results Management
  saveGameResult(result: GameResult): void {
    const results = this.getGameResults();
    results.unshift(result);
    
    if (results.length > this.MAX_STORED_RESULTS) {
      results.splice(this.MAX_STORED_RESULTS);
    }
    
    localStorage.setItem(this.STORAGE_KEYS.GAME_RESULTS, JSON.stringify(results));
    this.updateProfileWithResult(result);
  }

  getGameResults(): GameResult[] {
    const stored = localStorage.getItem(this.STORAGE_KEYS.GAME_RESULTS);
    return stored ? JSON.parse(stored) : [];
  }

  getGameHistory(limit?: number): GameResult[] {
    const results = this.getGameResults();
    return limit ? results.slice(0, limit) : results;
  }

  // User Profile Management
  getUserProfile(): UserProfile | null {
    const stored = localStorage.getItem(this.STORAGE_KEYS.USER_PROFILE);
    return stored ? JSON.parse(stored) : null;
  }

  updateUserProfile(updates: Partial<UserProfile>): void {
    const profile = this.getUserProfile();
    if (profile) {
      const updatedProfile = { ...profile, ...updates };
      localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
    }
  }

  private createDefaultProfile(): void {
    const defaultProfile: UserProfile = {
      username: 'Player',
      totalGamesPlayed: 0,
      totalTimeSpent: 0,
      bestWpm: 0,
      bestAccuracy: 0,
      bestScore: 0,
      totalWordsTyped: 0,
      averageWpm: 0,
      averageAccuracy: 0,
      favoriteCategory: 'Common',
      favoritedifficulty: 'Medium',
      achievements: [],
      createdAt: Date.now(),
      lastPlayedAt: Date.now()
    };
    
    localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(defaultProfile));
  }

  private updateProfileWithResult(result: GameResult): void {
    const profile = this.getUserProfile();
    if (!profile) return;

    const allResults = this.getGameResults();
    const totalGames = allResults.length;
    
    const totalWpm = allResults.reduce((sum, r) => sum + r.wpm, 0);
    const totalAccuracy = allResults.reduce((sum, r) => sum + r.accuracy, 0);
    const totalWords = allResults.reduce((sum, r) => sum + r.totalWords, 0);
    
    const updatedProfile: UserProfile = {
      ...profile,
      totalGamesPlayed: totalGames,
      totalTimeSpent: profile.totalTimeSpent + result.duration,
      bestWpm: Math.max(profile.bestWpm, result.wpm),
      bestAccuracy: Math.max(profile.bestAccuracy, result.accuracy),
      bestScore: Math.max(profile.bestScore, result.score),
      totalWordsTyped: totalWords,
      averageWpm: Math.round(totalWpm / totalGames),
      averageAccuracy: Math.round(totalAccuracy / totalGames),
      lastPlayedAt: Date.now()
    };
    
    this.updateUserProfile(updatedProfile);
  }

  // User Settings Management
  getUserSettings(): UserSettings | null {
    const stored = localStorage.getItem(this.STORAGE_KEYS.USER_SETTINGS);
    return stored ? JSON.parse(stored) : null;
  }

  updateUserSettings(settings: Partial<UserSettings>): void {
    const currentSettings = this.getUserSettings();
    if (currentSettings) {
      const updatedSettings = { ...currentSettings, ...settings };
      localStorage.setItem(this.STORAGE_KEYS.USER_SETTINGS, JSON.stringify(updatedSettings));
    }
  }

  private createDefaultSettings(): void {
    const defaultSettings: UserSettings = {
      theme: 'auto',
      soundEnabled: true,
      soundVolume: 0.5,
      keyboardLayout: 'qwerty',
      showWpmInRealTime: true,
      showAccuracyInRealTime: true,
      enableAnimations: true,
      autoCapitalize: false,
      fontSize: 'medium',
      colorBlindFriendly: false
    };
    
    localStorage.setItem(this.STORAGE_KEYS.USER_SETTINGS, JSON.stringify(defaultSettings));
  }

  // Statistics
  getStatistics(): any {
    const results = this.getGameResults();
    if (results.length === 0) return null;

    const wpmValues = results.map(r => r.wpm);
    const accuracyValues = results.map(r => r.accuracy);
    const scoreValues = results.map(r => r.score);
    
    return {
      totalGames: results.length,
      averageWpm: Math.round(wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length),
      averageAccuracy: Math.round(accuracyValues.reduce((a, b) => a + b, 0) / accuracyValues.length),
      averageScore: Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length),
      bestWpm: Math.max(...wpmValues),
      bestAccuracy: Math.max(...accuracyValues),
      bestScore: Math.max(...scoreValues)
    };
  }

  // Leaderboard Management  
  getLeaderboard(difficulty?: string, category?: string): LeaderboardEntry[] {
    const stored = localStorage.getItem(this.STORAGE_KEYS.LEADERBOARD);
    let leaderboard: LeaderboardEntry[] = stored ? JSON.parse(stored) : [];
    
    if (difficulty) {
      leaderboard = leaderboard.filter(entry => entry.difficulty === difficulty);
    }
    
    if (category) {
      leaderboard = leaderboard.filter(entry => entry.category === category);
    }
    
    return leaderboard.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  exportData(): string {
    const data = {
      results: this.getGameResults(),
      profile: this.getUserProfile(),
      settings: this.getUserSettings(),
      leaderboard: this.getLeaderboard(),
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }

  clearAllData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    this.initializeStorage();
  }
}