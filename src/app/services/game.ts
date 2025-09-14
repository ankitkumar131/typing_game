import { Injectable, signal, computed, effect } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { takeWhile, tap } from 'rxjs/operators';
import { WordService } from './word';
import { CustomTextService, CustomText } from './custom-text';

export interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  currentWord: string;
  userInput: string;
  score: number;
  correctWords: number;
  totalWords: number;
  accuracy: number;
  wpm: number;
  timeRemaining: number;
  streak: number;
  multiplier: number;
  gameTimeTotal: number;
  wordsTyped: string[];
  mistakes: number;
}

export interface GameSettings {
  difficulty: string;
  category: string;
  gameDuration: number;
  wordsPerGame: number;
  customText?: CustomText;
  isCustomMode?: boolean;
}

export interface TypingResult {
  isCorrect: boolean;
  timeTaken: number;
  word: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private gameStateSubject = new BehaviorSubject<GameState>(this.getInitialState());
  private timerSubscription?: Subscription;
  private wordTimerSubscription?: Subscription;
  private gameStartTime = 0;
  private wordStartTime = 0;
  private customTextWords: string[] = [];
  private customTextIndex = 0;
  
  gameState = signal<GameState>(this.getInitialState());
  currentSettings = signal<GameSettings>({
    difficulty: 'Medium',
    category: 'Common',
    gameDuration: 60,
    wordsPerGame: 50
  });

  accuracyPercentage = computed(() => {
    const state = this.gameState();
    return state.totalWords > 0 ? Math.round((state.correctWords / state.totalWords) * 100) : 100;
  });

  wpmCurrent = computed(() => {
    const state = this.gameState();
    const timeElapsed = (this.currentSettings().gameDuration - state.timeRemaining) / 60;
    return timeElapsed > 0 ? Math.round(state.correctWords / timeElapsed) : 0;
  });

  constructor(
    private wordService: WordService,
    private customTextService: CustomTextService
  ) {
    effect(() => {
      this.gameStateSubject.next(this.gameState());
    });
  }

  getGameState(): Observable<GameState> {
    return this.gameStateSubject.asObservable();
  }

  startGame(settings?: Partial<GameSettings>): void {
    if (settings) {
      this.currentSettings.update(current => ({ ...current, ...settings }));
    }

    let newWord: string;
    
    // Check if we're using custom text
    if (this.currentSettings().isCustomMode && this.currentSettings().customText) {
      this.initializeCustomText(this.currentSettings().customText!);
      newWord = this.getNextCustomWord();
    } else {
      newWord = this.wordService.getRandomWord(
        this.currentSettings().category,
        this.currentSettings().difficulty
      );
    }

    this.gameState.set({
      ...this.getInitialState(),
      isPlaying: true,
      currentWord: newWord,
      timeRemaining: this.currentSettings().gameDuration
    });

    this.gameStartTime = Date.now();
    this.wordStartTime = Date.now();
    this.startGameTimer();
    this.startWordTimer();
  }

  pauseGame(): void {
    this.gameState.update(state => ({ ...state, isPaused: !state.isPaused }));
    
    if (this.gameState().isPaused) {
      this.stopTimers();
    } else {
      this.startGameTimer();
      this.startWordTimer();
    }
  }

  endGame(): void {
    this.stopTimers();
    this.gameState.update(state => ({
      ...state,
      isPlaying: false,
      isGameOver: true,
      isPaused: false
    }));
  }

  resetGame(): void {
    this.stopTimers();
    this.gameState.set(this.getInitialState());
  }

  processInput(input: string): TypingResult {
    const currentState = this.gameState();
    const timeTaken = (Date.now() - this.wordStartTime) / 1000;
    
    this.gameState.update(state => ({ ...state, userInput: input }));

    if (input === currentState.currentWord) {
      return this.handleCorrectWord(timeTaken);
    } else if (input.length >= currentState.currentWord.length) {
      return this.handleIncorrectWord(timeTaken);
    }

    return { isCorrect: false, timeTaken, word: currentState.currentWord };
  }

  skipWord(): void {
    this.handleIncorrectWord((Date.now() - this.wordStartTime) / 1000);
  }

  private handleCorrectWord(timeTaken: number): TypingResult {
    const currentState = this.gameState();
    const baseScore = currentState.currentWord.length * 10;
    const timeBonus = Math.max(0, Math.round((3 - timeTaken) * 5));
    const streakBonus = Math.floor(currentState.streak / 5) * 50;
    const totalScore = (baseScore + timeBonus + streakBonus) * currentState.multiplier;

    const newStreak = currentState.streak + 1;
    const newMultiplier = Math.min(5, 1 + Math.floor(newStreak / 10) * 0.5);

    this.gameState.update(state => ({
      ...state,
      score: state.score + Math.round(totalScore),
      correctWords: state.correctWords + 1,
      totalWords: state.totalWords + 1,
      streak: newStreak,
      multiplier: newMultiplier,
      userInput: '',
      wordsTyped: [...state.wordsTyped, state.currentWord],
      currentWord: this.getNextWord()
    }));

    this.wordStartTime = Date.now();
    this.restartWordTimer();

    return { isCorrect: true, timeTaken, word: currentState.currentWord };
  }

  private handleIncorrectWord(timeTaken: number): TypingResult {
    const currentState = this.gameState();
    
    this.gameState.update(state => ({
      ...state,
      totalWords: state.totalWords + 1,
      mistakes: state.mistakes + 1,
      streak: 0,
      multiplier: 1,
      userInput: '',
      wordsTyped: [...state.wordsTyped, state.currentWord],
      currentWord: this.getNextWord()
    }));

    this.wordStartTime = Date.now();
    this.restartWordTimer();

    return { isCorrect: false, timeTaken, word: currentState.currentWord };
  }

  private getNextWord(): string {
    if (this.currentSettings().isCustomMode) {
      return this.getNextCustomWord();
    }
    
    return this.wordService.getRandomWord(
      this.currentSettings().category,
      this.currentSettings().difficulty
    );
  }

  private initializeCustomText(customText: CustomText): void {
    // Split the custom text content into words
    this.customTextWords = customText.content
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.replace(/[.,!?;:"'()\-]/g, ''))
      .filter(word => word.length > 0);
    
    this.customTextIndex = 0;
    
    // Record usage for analytics
    this.customTextService.recordUsage(customText.id, 0, 0);
  }

  private getNextCustomWord(): string {
    if (this.customTextWords.length === 0) {
      return 'end'; // Fallback word
    }
    
    const word = this.customTextWords[this.customTextIndex];
    this.customTextIndex = (this.customTextIndex + 1) % this.customTextWords.length;
    
    // End game if we've completed the custom text
    if (this.customTextIndex === 0 && this.gameState().totalWords > 0) {
      setTimeout(() => this.endGame(), 100);
    }
    
    return word;
  }

  private startGameTimer(): void {
    this.timerSubscription = interval(1000)
      .pipe(
        takeWhile(() => this.gameState().timeRemaining > 0 && this.gameState().isPlaying && !this.gameState().isPaused),
        tap(() => {
          this.gameState.update(state => ({
            ...state,
            timeRemaining: Math.max(0, state.timeRemaining - 1)
          }));

          if (this.gameState().timeRemaining <= 0) {
            this.endGame();
          }
        })
      )
      .subscribe();
  }

  private startWordTimer(): void {
    const timePerWord = this.wordService.getTimePerWord(this.currentSettings().difficulty);
    
    this.wordTimerSubscription = interval(100)
      .pipe(
        takeWhile(() => {
          const elapsed = (Date.now() - this.wordStartTime) / 1000;
          const gameState = this.gameState();
          return elapsed < timePerWord && gameState.isPlaying && !gameState.isPaused && !gameState.isGameOver;
        }),
        tap(() => {
          const elapsed = (Date.now() - this.wordStartTime) / 1000;
          const timePerWord = this.wordService.getTimePerWord(this.currentSettings().difficulty);
          
          if (elapsed >= timePerWord) {
            this.skipWord();
          }
        })
      )
      .subscribe();
  }

  private restartWordTimer(): void {
    this.wordTimerSubscription?.unsubscribe();
    // Only restart if game is still active
    if (this.gameState().isPlaying && !this.gameState().isGameOver && !this.gameState().isPaused) {
      this.startWordTimer();
    }
  }

  private stopTimers(): void {
    this.timerSubscription?.unsubscribe();
    this.wordTimerSubscription?.unsubscribe();
  }

  private getInitialState(): GameState {
    return {
      isPlaying: false,
      isGameOver: false,
      isPaused: false,
      currentWord: '',
      userInput: '',
      score: 0,
      correctWords: 0,
      totalWords: 0,
      accuracy: 100,
      wpm: 0,
      timeRemaining: 60,
      streak: 0,
      multiplier: 1,
      gameTimeTotal: 60,
      wordsTyped: [],
      mistakes: 0
    };
  }
}
