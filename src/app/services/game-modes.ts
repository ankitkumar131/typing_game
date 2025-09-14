import { Injectable, signal } from '@angular/core';
import { WordService } from './word';

export interface GameMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'speed' | 'accuracy' | 'endurance' | 'special';
  settings: {
    timeLimit?: number;
    wordLimit?: number;
    livesLimit?: number;
    difficultyProgression?: boolean;
    customRules?: string[];
  };
  unlocked: boolean;
  highScore?: number;
  bestWpm?: number;
  bestAccuracy?: number;
  timesPlayed: number;
}

export interface GameModeResult {
  mode: string;
  score: number;
  wpm: number;
  accuracy: number;
  duration: number;
  wordsCompleted: number;
  specialMetrics?: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class GameModeService {
  private readonly STORAGE_KEY = 'typingGame_gameModes';
  private readonly RESULTS_KEY = 'typingGame_modeResults';
  
  private gameModes = signal<GameMode[]>(this.getDefaultGameModes());
  private modeResults = signal<GameModeResult[]>([]);
  
  constructor(private wordService: WordService) {
    this.loadGameModes();
    this.loadResults();
  }

  // Public API
  getGameModes() {
    return this.gameModes.asReadonly();
  }

  getAvailableGameModes(): GameMode[] {
    return this.gameModes().filter(mode => mode.unlocked);
  }

  getGameModesByCategory(category: string): GameMode[] {
    return this.gameModes().filter(mode => mode.category === category && mode.unlocked);
  }

  getGameMode(id: string): GameMode | undefined {
    return this.gameModes().find(mode => mode.id === id);
  }

  getModeResults(modeId: string): GameModeResult[] {
    return this.modeResults().filter(result => result.mode === modeId);
  }

  recordModeResult(result: GameModeResult): void {
    const results = [...this.modeResults(), result];
    this.modeResults.set(results);
    
    // Update mode statistics
    this.updateModeStatistics(result);
    
    this.saveResults();
    this.saveModes();
  }

  unlockGameMode(modeId: string): boolean {
    const modes = this.gameModes();
    const index = modes.findIndex(mode => mode.id === modeId);
    
    if (index === -1) return false;
    
    const updatedModes = [...modes];
    updatedModes[index] = { ...updatedModes[index], unlocked: true };
    this.gameModes.set(updatedModes);
    this.saveModes();
    return true;
  }

  checkUnlockConditions(): string[] {
    const unlockedModes: string[] = [];
    const results = this.modeResults();
    const modes = this.gameModes();
    
    // Check each locked mode for unlock conditions
    modes.forEach(mode => {
      if (!mode.unlocked && this.shouldUnlockMode(mode, results)) {
        this.unlockGameMode(mode.id);
        unlockedModes.push(mode.name);
      }
    });
    
    return unlockedModes;
  }

  // Game Mode Implementations
  
  // Time Attack Mode - Race against time with increasing difficulty
  createTimeAttackSession(baseSettings: any) {
    return {
      ...baseSettings,
      mode: 'timeAttack',
      timeLimit: 60,
      difficultyProgression: true,
      scoreMultiplier: 1.5,
      customRules: [
        'Speed increases every 10 correct words',
        'Bonus points for maintaining accuracy above 90%',
        'Time penalties for mistakes'
      ]
    };
  }

  // Endless Mode - No time limit, track longest session
  createEndlessSession(baseSettings: any) {
    return {
      ...baseSettings,
      mode: 'endless',
      timeLimit: undefined,
      wordLimit: undefined,
      scoreMultiplier: 1.2,
      customRules: [
        'No time limit',
        'Difficulty increases gradually',
        'Score multiplier builds with streak'
      ]
    };
  }

  // Sprint Challenges - Short burst modes
  createSprintSession(sprintType: '10sec' | '30sec' | '60sec', baseSettings: any) {
    const timeMap = { '10sec': 10, '30sec': 30, '60sec': 60 };
    
    return {
      ...baseSettings,
      mode: `sprint${sprintType}`,
      timeLimit: timeMap[sprintType],
      scoreMultiplier: sprintType === '10sec' ? 3 : sprintType === '30sec' ? 2 : 1.5,
      customRules: [
        `Complete as many words as possible in ${timeMap[sprintType]} seconds`,
        'High intensity scoring',
        'Perfect accuracy bonus'
      ]
    };
  }

  // Survival Mode - Lives system
  createSurvivalSession(baseSettings: any) {
    return {
      ...baseSettings,
      mode: 'survival',
      livesLimit: 3,
      timeLimit: undefined,
      scoreMultiplier: 2,
      customRules: [
        'Start with 3 lives',
        'Lose a life for each mistake',
        'Gain extra life every 50 correct words'
      ]
    };
  }

  // Zen Mode - No pressure, focus on accuracy
  createZenSession(baseSettings: any) {
    return {
      ...baseSettings,
      mode: 'zen',
      timeLimit: undefined,
      pressureLevel: 'none',
      scoreMultiplier: 1,
      customRules: [
        'No time pressure',
        'Focus on accuracy and form',
        'Peaceful practice environment'
      ]
    };
  }

  // Private methods
  private getDefaultGameModes(): GameMode[] {
    return [
      {
        id: 'standard',
        name: 'Standard',
        description: 'Classic typing test with time limit',
        icon: '⏱️',
        category: 'speed',
        settings: { timeLimit: 60 },
        unlocked: true,
        timesPlayed: 0
      },
      {
        id: 'timeAttack',
        name: 'Time Attack',
        description: 'Race against time with increasing difficulty',
        icon: '⚡',
        category: 'speed',
        settings: { 
          timeLimit: 60, 
          difficultyProgression: true,
          customRules: ['Difficulty increases every 10 words', 'Speed bonus for accuracy']
        },
        unlocked: true,
        timesPlayed: 0
      },
      {
        id: 'endless',
        name: 'Endless Mode',
        description: 'Type as long as you can with no time limit',
        icon: '∞',
        category: 'endurance',
        settings: { 
          customRules: ['No time limit', 'Gradual difficulty increase', 'Streak multipliers']
        },
        unlocked: true,
        timesPlayed: 0
      },
      {
        id: 'sprint10',
        name: '10-Second Sprint',
        description: 'Maximum words in 10 seconds',
        icon: '🏃',
        category: 'speed',
        settings: { 
          timeLimit: 10,
          customRules: ['Ultra-fast pace', 'High score multiplier', 'Perfect accuracy bonus']
        },
        unlocked: false,
        timesPlayed: 0
      },
      {
        id: 'sprint30',
        name: '30-Second Sprint',
        description: 'Intense 30-second typing burst',
        icon: '💨',
        category: 'speed',
        settings: { 
          timeLimit: 30,
          customRules: ['High intensity', 'Score multiplier x2', 'Accuracy matters']
        },
        unlocked: false,
        timesPlayed: 0
      },
      {
        id: 'sprint60',
        name: '60-Second Sprint',
        description: 'One minute of pure typing intensity',
        icon: '⚡',
        category: 'speed',
        settings: { 
          timeLimit: 60,
          customRules: ['Sustained high pace', 'Score multiplier x1.5', 'Endurance challenge']
        },
        unlocked: false,
        timesPlayed: 0
      },
      {
        id: 'survival',
        name: 'Survival Mode',
        description: 'Three strikes and you are out',
        icon: '❤️',
        category: 'accuracy',
        settings: { 
          livesLimit: 3,
          customRules: ['3 lives only', 'Mistakes cost lives', 'Extra life every 50 words']
        },
        unlocked: false,
        timesPlayed: 0
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'No mistakes allowed',
        icon: '🎯',
        category: 'accuracy',
        settings: { 
          livesLimit: 1,
          customRules: ['Single mistake ends game', 'Perfect accuracy required', 'Maximum score potential']
        },
        unlocked: false,
        timesPlayed: 0
      },
      {
        id: 'zen',
        name: 'Zen Mode',
        description: 'Peaceful typing practice with no pressure',
        icon: '🧘',
        category: 'special',
        settings: { 
          customRules: ['No time pressure', 'Focus on form', 'Relaxed environment']
        },
        unlocked: false,
        timesPlayed: 0
      },
      {
        id: 'blindType',
        name: 'Blind Typing',
        description: 'Type without seeing the text',
        icon: '👁️‍🗨️',
        category: 'special',
        settings: { 
          timeLimit: 60,
          customRules: ['Text disappears after 2 seconds', 'Memory challenge', 'Advanced difficulty']
        },
        unlocked: false,
        timesPlayed: 0
      },
      {
        id: 'marathon',
        name: 'Marathon',
        description: 'Ultimate endurance test - 10 minutes',
        icon: '🏃‍♂️',
        category: 'endurance',
        settings: { 
          timeLimit: 600,
          customRules: ['10-minute challenge', 'Endurance test', 'Consistency rewards']
        },
        unlocked: false,
        timesPlayed: 0
      }
    ];
  }

  private shouldUnlockMode(mode: GameMode, results: GameModeResult[]): boolean {
    const standardResults = results.filter(r => r.mode === 'standard');
    
    switch (mode.id) {
      case 'sprint10':
        return standardResults.some(r => r.wpm >= 30);
      case 'sprint30':
        return standardResults.some(r => r.wpm >= 40);
      case 'sprint60':
        return standardResults.some(r => r.wpm >= 50);
      case 'survival':
        return standardResults.some(r => r.accuracy >= 90);
      case 'perfectionist':
        return standardResults.some(r => r.accuracy >= 98);
      case 'zen':
        return standardResults.length >= 5;
      case 'blindType':
        return standardResults.some(r => r.wpm >= 60 && r.accuracy >= 95);
      case 'marathon':
        return standardResults.some(r => r.wpm >= 50 && r.accuracy >= 90);
      default:
        return false;
    }
  }

  private updateModeStatistics(result: GameModeResult): void {
    const modes = this.gameModes();
    const index = modes.findIndex(mode => mode.id === result.mode);
    
    if (index === -1) return;
    
    const mode = modes[index];
    const updatedModes = [...modes];
    
    updatedModes[index] = {
      ...mode,
      timesPlayed: mode.timesPlayed + 1,
      highScore: Math.max(mode.highScore || 0, result.score),
      bestWpm: Math.max(mode.bestWpm || 0, result.wpm),
      bestAccuracy: Math.max(mode.bestAccuracy || 0, result.accuracy)
    };
    
    this.gameModes.set(updatedModes);
  }

  private loadGameModes(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Merge with defaults to add new modes
        const defaultModes = this.getDefaultGameModes();
        const mergedModes = defaultModes.map(defaultMode => {
          const storedMode = data.find((m: GameMode) => m.id === defaultMode.id);
          return storedMode ? { ...defaultMode, ...storedMode } : defaultMode;
        });
        this.gameModes.set(mergedModes);
      } catch {
        this.gameModes.set(this.getDefaultGameModes());
      }
    }
  }

  private saveModes(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.gameModes()));
  }

  private loadResults(): void {
    const stored = localStorage.getItem(this.RESULTS_KEY);
    if (stored) {
      try {
        this.modeResults.set(JSON.parse(stored));
      } catch {
        this.modeResults.set([]);
      }
    }
  }

  private saveResults(): void {
    localStorage.setItem(this.RESULTS_KEY, JSON.stringify(this.modeResults()));
  }
}