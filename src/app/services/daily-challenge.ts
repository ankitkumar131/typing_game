import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage';
import { WordService } from './word';

export interface DailyChallenge {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'speed' | 'accuracy' | 'endurance' | 'special';
  target: {
    wpm?: number;
    accuracy?: number;
    words?: number;
    time?: number;
    streak?: number;
  };
  category: string;
  difficulty: string;
  rewards: {
    points: number;
    badge?: string;
    title?: string;
  };
  isCompleted: boolean;
  bestScore?: number;
  attempts: number;
}

export interface ChallengeTheme {
  name: string;
  description: string;
  words: string[];
  modifier?: {
    timeMultiplier?: number;
    scoreMultiplier?: number;
    specialRule?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DailyChallengeService {
  private readonly STORAGE_KEY = 'typingGame_dailyChallenges';
  private readonly CHALLENGE_HISTORY_KEY = 'typingGame_challengeHistory';
  
  private currentChallenges = signal<DailyChallenge[]>([]);
  private challengeHistory = signal<DailyChallenge[]>([]);
  
  // Predefined challenge themes
  private readonly challengeThemes: ChallengeTheme[] = [
    {
      name: 'Tech Tuesday',
      description: 'Programming and technology terms',
      words: [
        'algorithm', 'database', 'framework', 'repository', 'deployment',
        'container', 'kubernetes', 'microservice', 'authentication', 'encryption',
        'typescript', 'javascript', 'angular', 'component', 'service',
        'interface', 'implementation', 'optimization', 'performance', 'scalability'
      ]
    },
    {
      name: 'Word Wednesday',
      description: 'Beautiful and uncommon English words',
      words: [
        'serendipity', 'ephemeral', 'mellifluous', 'petrichor', 'luminescence',
        'eloquence', 'resonance', 'transcendence', 'magnificent', 'harmonious',
        'crystalline', 'delicate', 'graceful', 'serene', 'tranquil',
        'mesmerizing', 'captivating', 'enchanting', 'exquisite', 'sublime'
      ]
    },
    {
      name: 'Fitness Friday',
      description: 'Health and fitness terminology',
      words: [
        'cardiovascular', 'endurance', 'strength', 'flexibility', 'nutrition',
        'metabolism', 'exercise', 'workout', 'training', 'discipline',
        'wellness', 'fitness', 'healthy', 'stamina', 'vitality',
        'energy', 'recovery', 'performance', 'consistency', 'dedication'
      ]
    },
    {
      name: 'Science Sunday',
      description: 'Scientific terms and concepts',
      words: [
        'hypothesis', 'experiment', 'molecule', 'electron', 'quantum',
        'photosynthesis', 'evolution', 'genetics', 'chromosome', 'protein',
        'microscope', 'telescope', 'laboratory', 'research', 'discovery',
        'innovation', 'technology', 'chemistry', 'physics', 'biology'
      ]
    },
    {
      name: 'Monday Motivation',
      description: 'Inspirational and motivational words',
      words: [
        'achievement', 'success', 'determination', 'perseverance', 'excellence',
        'dedication', 'commitment', 'progress', 'improvement', 'growth',
        'potential', 'opportunity', 'challenge', 'victory', 'triumph',
        'confidence', 'courage', 'strength', 'resilience', 'inspiration'
      ]
    }
  ];

  private readonly challengeTypes = [
    {
      type: 'speed' as const,
      title: 'Speed Demon',
      description: 'Achieve target WPM',
      generateTarget: () => ({ wpm: 40 + Math.floor(Math.random() * 40) })
    },
    {
      type: 'accuracy' as const,
      title: 'Precision Master',
      description: 'Maintain high accuracy',
      generateTarget: () => ({ accuracy: 85 + Math.floor(Math.random() * 15) })
    },
    {
      type: 'endurance' as const,
      title: 'Marathon Typer',
      description: 'Type many words correctly',
      generateTarget: () => ({ words: 50 + Math.floor(Math.random() * 100) })
    },
    {
      type: 'special' as const,
      title: 'Streak Master',
      description: 'Achieve consecutive correct words',
      generateTarget: () => ({ streak: 15 + Math.floor(Math.random() * 25) })
    }
  ];

  constructor(
    private storageService: StorageService,
    private wordService: WordService
  ) {
    this.loadChallenges();
    this.generateDailyChallenges();
  }

  // Public API
  getTodaysChallenges() {
    return computed(() => this.currentChallenges().filter(c => this.isToday(c.date)));
  }

  getWeeklyChallenges() {
    return computed(() => this.currentChallenges().filter(c => this.isThisWeek(c.date)));
  }

  getChallengeHistory() {
    return this.challengeHistory.asReadonly();
  }

  completeChallenge(challengeId: string, score: number): boolean {
    const challenges = this.currentChallenges();
    const challengeIndex = challenges.findIndex(c => c.id === challengeId);
    
    if (challengeIndex === -1) return false;
    
    const challenge = { ...challenges[challengeIndex] };
    const isSuccess = this.evaluateChallengeCompletion(challenge, score);
    
    challenge.attempts++;
    if (isSuccess) {
      challenge.isCompleted = true;
      challenge.bestScore = Math.max(challenge.bestScore || 0, score);
    }
    
    const updatedChallenges = [...challenges];
    updatedChallenges[challengeIndex] = challenge;
    this.currentChallenges.set(updatedChallenges);
    
    this.saveChallenges();
    return isSuccess;
  }

  getThemeWords(challengeId: string): string[] {
    const challenge = this.currentChallenges().find(c => c.id === challengeId);
    if (!challenge) return [];
    
    const theme = this.challengeThemes.find(t => t.name.toLowerCase().includes(challenge.title.toLowerCase()));
    return theme?.words || [];
  }

  getChallengeProgress(): {
    todayCompleted: number;
    todayTotal: number;
    weeklyCompleted: number;
    weeklyTotal: number;
    totalPoints: number;
  } {
    const today = this.getTodaysChallenges()();
    const weekly = this.getWeeklyChallenges()();
    const history = this.challengeHistory();
    
    return {
      todayCompleted: today.filter(c => c.isCompleted).length,
      todayTotal: today.length,
      weeklyCompleted: weekly.filter(c => c.isCompleted).length,
      weeklyTotal: weekly.length,
      totalPoints: history.reduce((sum, c) => sum + (c.isCompleted ? c.rewards.points : 0), 0)
    };
  }

  // Private methods
  private generateDailyChallenges(): void {
    const today = new Date().toDateString();
    const existing = this.currentChallenges().filter(c => this.isToday(c.date));
    
    if (existing.length >= 3) return; // Already have today's challenges
    
    const challenges: DailyChallenge[] = [];
    
    // Generate 3 different types of challenges for today
    const shuffledTypes = [...this.challengeTypes].sort(() => Math.random() - 0.5);
    const todayTheme = this.getTodayTheme();
    
    for (let i = 0; i < 3 && i < shuffledTypes.length; i++) {
      const challengeType = shuffledTypes[i];
      const challenge: DailyChallenge = {
        id: `daily_${today}_${challengeType.type}_${Date.now()}`,
        date: today,
        title: `${challengeType.title} - ${todayTheme.name}`,
        description: `${challengeType.description} with ${todayTheme.description}`,
        type: challengeType.type,
        target: challengeType.generateTarget(),
        category: 'Custom',
        difficulty: this.getDifficultyForChallenge(challengeType.type),
        rewards: this.generateRewards(challengeType.type),
        isCompleted: false,
        attempts: 0
      };
      
      challenges.push(challenge);
    }
    
    const updated = [...this.currentChallenges(), ...challenges];
    this.currentChallenges.set(updated);
    this.saveChallenges();
  }

  private getTodayTheme(): ChallengeTheme {
    const dayOfWeek = new Date().getDay();
    const themeMap = {
      0: 'Science Sunday',
      1: 'Monday Motivation',
      2: 'Tech Tuesday',
      3: 'Word Wednesday',
      4: 'Tech Tuesday', // Fallback
      5: 'Fitness Friday',
      6: 'Word Wednesday' // Fallback
    };
    
    const themeName = themeMap[dayOfWeek as keyof typeof themeMap];
    return this.challengeThemes.find(t => t.name === themeName) || this.challengeThemes[0];
  }

  private getDifficultyForChallenge(type: DailyChallenge['type']): string {
    const difficultyMap = {
      speed: 'Medium',
      accuracy: 'Hard',
      endurance: 'Easy',
      special: 'Medium'
    };
    return difficultyMap[type];
  }

  private generateRewards(type: DailyChallenge['type']): DailyChallenge['rewards'] {
    const basePoints = {
      speed: 150,
      accuracy: 200,
      endurance: 100,
      special: 250
    };
    
    const badges = {
      speed: '⚡',
      accuracy: '🎯',
      endurance: '🏃',
      special: '🔥'
    };
    
    return {
      points: basePoints[type] + Math.floor(Math.random() * 50),
      badge: badges[type],
      title: type === 'special' ? 'Challenge Master' : undefined
    };
  }

  private evaluateChallengeCompletion(challenge: DailyChallenge, gameResult: any): boolean {
    const { target } = challenge;
    
    if (target.wpm && gameResult.wpm < target.wpm) return false;
    if (target.accuracy && gameResult.accuracy < target.accuracy) return false;
    if (target.words && gameResult.correctWords < target.words) return false;
    if (target.streak && gameResult.maxStreak < target.streak) return false;
    if (target.time && gameResult.timeElapsed < target.time) return false;
    
    return true;
  }

  private isToday(dateStr: string): boolean {
    return dateStr === new Date().toDateString();
  }

  private isThisWeek(dateStr: string): boolean {
    const date = new Date(dateStr);
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    return date >= weekStart;
  }

  private loadChallenges(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      this.currentChallenges.set(JSON.parse(stored));
    }
    
    const historyStored = localStorage.getItem(this.CHALLENGE_HISTORY_KEY);
    if (historyStored) {
      this.challengeHistory.set(JSON.parse(historyStored));
    }
  }

  private saveChallenges(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentChallenges()));
    
    // Move completed challenges to history
    const completed = this.currentChallenges().filter(c => c.isCompleted);
    const history = [...this.challengeHistory(), ...completed];
    this.challengeHistory.set(history);
    localStorage.setItem(this.CHALLENGE_HISTORY_KEY, JSON.stringify(history));
  }
}