import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { GameService, GameSettings } from '../../services/game';
import { WordService, WordCategory, DifficultyLevel } from '../../services/word';
import { SoundService } from '../../services/sound';
import { StorageService } from '../../services/storage';
import { AchievementService, Achievement as GameAchievement } from '../../services/achievement';
import { HeatMapService } from '../../services/heat-map';
import { GameModeService } from '../../services/game-modes';
import { CustomTextService, CustomText } from '../../services/custom-text';
import { LoadingService } from '../../services/loading';
import { ErrorFeedbackService } from '../../services/error-feedback';
import { OnboardingService } from '../../services/onboarding';
import { KeyboardService } from '../../services/keyboard';
import { LoadingComponent } from '../loading/loading';
import { ErrorFeedbackComponent } from '../error-feedback/error-feedback';
import { KeyboardVisualizationComponent } from '../keyboard-visualization/keyboard-visualization';
import { MobileKeyboardComponent } from '../mobile-keyboard/mobile-keyboard';
import { MobileSupportService } from '../../services/mobile-support';
import { AccessibilityService } from '../../services/accessibility';

interface RecentWord {
  text: string;
  isCorrect: boolean;
  timeTaken: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface CharPreview {
  display: string;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  isTyped?: boolean;
}

@Component({
  selector: 'app-game',
  imports: [CommonModule, FormsModule, DecimalPipe, LoadingComponent, ErrorFeedbackComponent, KeyboardVisualizationComponent, MobileKeyboardComponent],
  templateUrl: './game.html',
  styleUrl: './game.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('300ms ease-in', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('400ms ease-in', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class Game implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('gameInput') gameInput!: ElementRef<HTMLInputElement>;

  // Game configuration
  selectedCategory = 'Common';
  selectedDifficulty = 'Medium';
  selectedDuration = 60;
  
  // Custom text mode
  isCustomMode = false;
  customText: CustomText | null = null;
  
  // UI state
  userInput = '';
  recentWords: RecentWord[] = [];
  maxStreak = 0;
  totalWordTimes: number[] = [];
  
  // Word and difficulty data
  categories: WordCategory[] = [];
  difficulties: DifficultyLevel[] = [];
  
  // Word timing
  private wordStartTime = 0;
  private wordTimeLimit = 0;
  private wordTimerInterval?: number;

  constructor(
    public gameService: GameService,
    private wordService: WordService,
    private soundService: SoundService,
    private storageService: StorageService,
    private achievementService: AchievementService,
    private heatMapService: HeatMapService,
    private gameModeService: GameModeService,
    private customTextService: CustomTextService,
    private loadingService: LoadingService,
    private errorFeedbackService: ErrorFeedbackService,
    private onboardingService: OnboardingService,
    private keyboardService: KeyboardService,
    private mobileService: MobileSupportService,
    private accessibilityService: AccessibilityService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.categories = this.wordService.getCategories();
    this.difficulties = this.wordService.getDifficultyLevels();
    this.loadGameHistory();
    this.checkForCustomText();
    
    // Check if user should see onboarding
    if (this.onboardingService.shouldShowOnboarding()) {
      this.onboardingService.startTutorial('welcome');
    }
    
    // Set up accessibility for game page
    this.accessibilityService.manageFocus(document.body);
  }

  ngAfterViewInit(): void {
    // Focus input when component loads
    if (this.gameInput) {
      setTimeout(() => this.gameInput.nativeElement.focus(), 100);
    }
  }

  ngOnDestroy(): void {
    this.clearWordTimer();
    // Stop any game service timers as well
    this.gameService.endGame();
  }

  // Game Control Methods
  startGame(): void {
    // Show loading state
    this.loadingService.startLoading('game-start', 'Preparing game...', 'spinner');
    
    const settings: Partial<GameSettings> = {
      difficulty: this.selectedDifficulty,
      category: this.selectedCategory,
      gameDuration: this.selectedDuration,
      isCustomMode: this.isCustomMode,
      customText: this.customText || undefined
    };

    this.gameService.startGame(settings);
    this.resetGameUI();
    this.startWordTimer();
    this.soundService.playSound('gameStart');
    
    // Accessibility: Announce game start
    this.accessibilityService.announceGameStart();
    
    // Stop loading after a short delay
    setTimeout(() => {
      this.loadingService.stopLoading('game-start');
    }, 500);
    
    // Focus input after game starts
    setTimeout(() => {
      if (this.gameInput) {
        this.gameInput.nativeElement.focus();
      }
    }, 100);
  }

  pauseGame(): void {
    this.gameService.pauseGame();
    
    if (this.gameService.gameState().isPaused) {
      this.clearWordTimer();
      this.soundService.playSound('pause');
    } else {
      this.startWordTimer();
      this.soundService.playSound('resume');
      // Refocus input after resume
      setTimeout(() => {
        if (this.gameInput) {
          this.gameInput.nativeElement.focus();
        }
      }, 100);
    }
  }

  skipWord(): void {
    // Don't skip if game is over
    if (this.gameService.gameState().isGameOver) {
      return;
    }
    
    this.gameService.skipWord();
    this.userInput = '';
    this.clearWordTimer(); // Clear existing timer
    this.soundService.playSound('skip');
    
    // Only restart timer if game is still active
    if (this.gameService.gameState().isPlaying && !this.gameService.gameState().isGameOver) {
      this.startWordTimer();
    }
    
    if (this.gameInput) {
      this.gameInput.nativeElement.focus();
    }
  }

  quitGame(): void {
    if (confirm('Are you sure you want to quit the current game?')) {
      this.clearWordTimer(); // Ensure timer is stopped
      this.gameService.endGame();
      this.saveGameResults();
      this.soundService.playSound('gameEnd');
    }
  }

  playAgain(): void {
    this.clearWordTimer(); // Clear any existing timer
    this.gameService.resetGame();
    this.resetGameUI();
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }

  viewStats(): void {
    this.router.navigate(['/profile']);
  }

  shareResults(): void {
    const results = `🎮 Typing Speed Challenge Results 🎮\n` +
      `⚡ WPM: ${this.gameService.wpmCurrent()}\n` +
      `🎯 Accuracy: ${this.gameService.accuracyPercentage()}%\n` +
      `🏆 Score: ${this.gameService.gameState().score.toLocaleString()}\n` +
      `🔥 Best Streak: ${this.getMaxStreak()}\n\n` +
      `Can you beat my score? Try the Typing Speed Challenge!`;

    if (navigator.share) {
      navigator.share({
        title: 'My Typing Speed Results',
        text: results
      });
    } else {
      navigator.clipboard.writeText(results);
      alert('Results copied to clipboard!');
    }
  }

  // Input Handling
  onInputChange(event: any): void {
    const input = event.target.value;
    const previousInput = this.userInput;
    this.userInput = input;
    
    // Track keystroke data for heat map analytics
    if (input.length > previousInput.length) {
      const newChar = input[input.length - 1];
      const expectedChar = this.gameService.gameState().currentWord[input.length - 1];
      const isCorrect = newChar === expectedChar;
      
      this.heatMapService.recordKeystroke(
        newChar,
        Date.now() - this.wordStartTime,
        isCorrect,
        expectedChar,
        this.gameService.gameState().currentWord,
        input.length - 1
      );
      
      // Record error for error feedback system
      if (!isCorrect) {
        this.errorFeedbackService.recordError(
          expectedChar,
          newChar,
          this.gameService.gameState().currentWord,
          input.length - 1,
          (Date.now() - this.wordStartTime) / 1000
        );
        
        // Accessibility: Announce typing error
        this.accessibilityService.announceTypingError(expectedChar, newChar);
      }
    }
    
    if (input === this.gameService.gameState().currentWord) {
      this.handleWordComplete();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    // Handle special keys
    switch (event.key) {
      case 'Escape':
        this.pauseGame();
        break;
      case 'Tab':
        event.preventDefault();
        this.skipWord();
        break;
    }
  }

  private handleWordComplete(): void {
    const result = this.gameService.processInput(this.userInput);
    const timeTaken = (Date.now() - this.wordStartTime) / 1000;
    
    // Add to recent words
    this.recentWords.unshift({
      text: result.word,
      isCorrect: result.isCorrect,
      timeTaken: result.timeTaken
    });
    
    // Keep only last 5 words
    if (this.recentWords.length > 5) {
      this.recentWords.pop();
    }
    
    // Track statistics
    this.totalWordTimes.push(timeTaken);
    if (this.gameService.gameState().streak > this.maxStreak) {
      this.maxStreak = this.gameService.gameState().streak;
    }
    
    // Play sound feedback
    if (result.isCorrect) {
      this.soundService.playSound('correct');
      // Accessibility: Announce correct word
      this.accessibilityService.announceWordCorrect(result.word, result.timeTaken);
    } else {
      this.soundService.playSound('incorrect');
      // Accessibility: Announce incorrect word
      this.accessibilityService.announceWordIncorrect(
        this.gameService.gameState().currentWord,
        this.userInput
      );
    }
    
    // Reset input
    this.userInput = '';
    
    // Check for game end BEFORE starting new timer
    if (this.gameService.gameState().isGameOver) {
      this.clearWordTimer(); // Ensure timer is stopped
      this.saveGameResults();
      this.soundService.playSound('gameEnd');
      
      // Accessibility: Announce game end
      this.accessibilityService.announceGameEnd(
        this.gameService.wpmCurrent(),
        this.gameService.accuracyPercentage()
      );
      
      return; // Don't start new timer if game is over
    }
    
    // Only start new timer if game is still active
    this.startWordTimer();
  }

  // Word Timer Management
  private startWordTimer(): void {
    // Don't start timer if game is not playing or is over
    if (!this.gameService.gameState().isPlaying || this.gameService.gameState().isGameOver) {
      return;
    }
    
    this.wordStartTime = Date.now();
    this.wordTimeLimit = this.wordService.getTimePerWord(this.selectedDifficulty) * 1000;
    this.clearWordTimer();
    
    this.wordTimerInterval = window.setInterval(() => {
      // Check if game is still active before processing
      if (!this.gameService.gameState().isPlaying || this.gameService.gameState().isGameOver) {
        this.clearWordTimer();
        return;
      }
      
      const elapsed = Date.now() - this.wordStartTime;
      if (elapsed >= this.wordTimeLimit) {
        this.skipWord();
      }
    }, 100);
  }

  private clearWordTimer(): void {
    if (this.wordTimerInterval) {
      clearInterval(this.wordTimerInterval);
      this.wordTimerInterval = undefined;
    }
  }

  // UI Helper Methods
  getProgressPercentage(): number {
    const settings = this.gameService.currentSettings();
    const timeElapsed = settings.gameDuration - this.gameService.gameState().timeRemaining;
    return (timeElapsed / settings.gameDuration) * 100;
  }

  getWordTimeProgress(): number {
    if (!this.wordStartTime || !this.wordTimeLimit) return 100;
    const elapsed = Date.now() - this.wordStartTime;
    return Math.max(0, ((this.wordTimeLimit - elapsed) / this.wordTimeLimit) * 100);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  get isTypingCorrect(): boolean {
    if (!this.userInput) return false;
    return this.gameService.gameState().currentWord.startsWith(this.userInput);
  }

  get isTypingIncorrect(): boolean {
    if (!this.userInput) return false;
    return !this.gameService.gameState().currentWord.startsWith(this.userInput);
  }

  getTypingPreview(): CharPreview[] {
    const word = this.gameService.gameState().currentWord;
    const input = this.userInput;
    const preview: CharPreview[] = [];
    
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const inputChar = input[i];
      
      if (i < input.length) {
        preview.push({
          display: char,
          isTyped: true,
          isCorrect: char === inputChar,
          isIncorrect: char !== inputChar
        });
      } else {
        preview.push({
          display: char,
          isTyped: false
        });
      }
    }
    
    return preview;
  }

  getCharClass(char: CharPreview, index: number): string {
    const classes = ['char'];
    if (char.isTyped) classes.push('typed');
    if (char.isCorrect) classes.push('correct');
    if (char.isIncorrect) classes.push('incorrect');
    if (index === this.userInput.length) classes.push('current');
    return classes.join(' ');
  }

  getRecentWords(): RecentWord[] {
    return this.recentWords;
  }

  // Statistics and Analysis
  getMaxStreak(): number {
    return this.maxStreak;
  }

  getAverageWordTime(): number {
    if (this.totalWordTimes.length === 0) return 0;
    const sum = this.totalWordTimes.reduce((a, b) => a + b, 0);
    return Math.round((sum / this.totalWordTimes.length) * 10) / 10;
  }

  getWpmAnalysis(): string {
    const wpm = this.gameService.wpmCurrent();
    if (wpm >= 80) return 'Excellent typing speed! You\'re in the top 10%.';
    if (wpm >= 60) return 'Great typing speed! Above average performance.';
    if (wpm >= 40) return 'Good typing speed. Keep practicing to improve!';
    if (wpm >= 20) return 'Fair typing speed. Regular practice will help.';
    return 'Keep practicing! Everyone starts somewhere.';
  }

  getAccuracyAnalysis(): string {
    const accuracy = this.gameService.accuracyPercentage();
    if (accuracy >= 95) return 'Outstanding accuracy! Very few mistakes.';
    if (accuracy >= 90) return 'Excellent accuracy. Great precision!';
    if (accuracy >= 80) return 'Good accuracy. Focus on reducing errors.';
    if (accuracy >= 70) return 'Fair accuracy. Slow down for better precision.';
    return 'Focus on accuracy over speed. Quality first!';
  }

  getConsistencyAnalysis(): string {
    if (this.totalWordTimes.length < 5) return 'Play more to analyze consistency.';
    
    const times = this.totalWordTimes;
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 0.5) return 'Very consistent typing rhythm!';
    if (stdDev < 1) return 'Good consistency in your typing.';
    if (stdDev < 1.5) return 'Moderate consistency. Try to maintain steady pace.';
    return 'Focus on maintaining consistent typing speed.';
  }

  getPerformanceClass(metric: string): string {
    switch (metric) {
      case 'wpm':
        return this.gameService.wpmCurrent() >= 60 ? 'excellent' : 
               this.gameService.wpmCurrent() >= 40 ? 'good' : 'needs-work';
      case 'accuracy':
        return this.gameService.accuracyPercentage() >= 90 ? 'excellent' : 
               this.gameService.accuracyPercentage() >= 80 ? 'good' : 'needs-work';
      case 'consistency':
        const stdDev = this.getConsistencyStdDev();
        return stdDev < 1 ? 'excellent' : stdDev < 1.5 ? 'good' : 'needs-work';
      default:
        return 'good';
    }
  }

  private getConsistencyStdDev(): number {
    if (this.totalWordTimes.length < 2) return 0;
    const avg = this.totalWordTimes.reduce((a, b) => a + b, 0) / this.totalWordTimes.length;
    const variance = this.totalWordTimes.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / this.totalWordTimes.length;
    return Math.sqrt(variance);
  }

  // Achievements System
  getAchievements(): Achievement[] {
    const achievements: Achievement[] = [];
    const state = this.gameService.gameState();
    const wpm = this.gameService.wpmCurrent();
    const accuracy = this.gameService.accuracyPercentage();
    
    // Speed achievements
    if (wpm >= 100) achievements.push({ id: 'speed_demon', name: 'Speed Demon', description: '100+ WPM', icon: '⚡' });
    else if (wpm >= 80) achievements.push({ id: 'fast_fingers', name: 'Fast Fingers', description: '80+ WPM', icon: '🏃' });
    else if (wpm >= 60) achievements.push({ id: 'quick_typer', name: 'Quick Typer', description: '60+ WPM', icon: '⚡' });
    
    // Accuracy achievements
    if (accuracy >= 98) achievements.push({ id: 'perfectionist', name: 'Perfectionist', description: '98%+ Accuracy', icon: '🎯' });
    else if (accuracy >= 95) achievements.push({ id: 'sharp_shooter', name: 'Sharp Shooter', description: '95%+ Accuracy', icon: '🏹' });
    
    // Streak achievements
    if (this.maxStreak >= 50) achievements.push({ id: 'unstoppable', name: 'Unstoppable', description: '50+ Word Streak', icon: '🔥' });
    else if (this.maxStreak >= 25) achievements.push({ id: 'on_fire', name: 'On Fire', description: '25+ Word Streak', icon: '🔥' });
    else if (this.maxStreak >= 10) achievements.push({ id: 'hot_streak', name: 'Hot Streak', description: '10+ Word Streak', icon: '🔥' });
    
    // Score achievements
    if (state.score >= 10000) achievements.push({ id: 'high_scorer', name: 'High Scorer', description: '10,000+ Points', icon: '💎' });
    else if (state.score >= 5000) achievements.push({ id: 'point_master', name: 'Point Master', description: '5,000+ Points', icon: '🏆' });
    
    // Special achievements
    if (state.correctWords >= 100) achievements.push({ id: 'century', name: 'Century', description: '100+ Correct Words', icon: '💯' });
    if (state.mistakes === 0 && state.totalWords >= 10) achievements.push({ id: 'flawless', name: 'Flawless Victory', description: 'No mistakes!', icon: '👑' });
    
    return achievements;
  }

  // Data Persistence
  private saveGameResults(): void {
    const results = {
      timestamp: Date.now(),
      wpm: this.gameService.wpmCurrent(),
      accuracy: this.gameService.accuracyPercentage(),
      score: this.gameService.gameState().score,
      correctWords: this.gameService.gameState().correctWords,
      totalWords: this.gameService.gameState().totalWords,
      mistakes: this.gameService.gameState().mistakes,
      maxStreak: this.maxStreak,
      difficulty: this.selectedDifficulty,
      category: this.selectedCategory,
      duration: this.selectedDuration,
      achievements: this.getAchievements(),
      isCustomMode: this.isCustomMode,
      customTextId: this.customText?.id
    };
    
    // Save to storage
    this.storageService.saveGameResult(results);
    
    // Update custom text analytics if in custom mode
    if (this.isCustomMode && this.customText) {
      this.customTextService.recordUsage(
        this.customText.id,
        results.wpm,
        results.accuracy
      );
    }
    
    // Check for new achievements
    const newAchievements = this.achievementService.checkAchievements(results);
    if (newAchievements.length > 0) {
      this.showAchievementNotifications(newAchievements);
    }
    
    // Award experience and coins based on performance
    const experienceGained = Math.round(results.score / 10);
    const coinsGained = Math.round(results.score / 50);
    
    const levelUpResult = this.achievementService.earnExperience(experienceGained);
    this.achievementService.earnCoins(coinsGained, 'game_completion');
    
    if (levelUpResult.levelUp) {
      this.showLevelUpNotification(levelUpResult.newLevel!);
    }
    
    // Record game mode result if playing a special mode
    const gameMode = sessionStorage.getItem('gameMode');
    if (gameMode) {
      const modeData = JSON.parse(gameMode);
      this.gameModeService.recordModeResult({
        mode: modeData.id,
        score: results.score,
        wpm: results.wpm,
        accuracy: results.accuracy,
        duration: results.duration,
        wordsCompleted: results.correctWords,
        timestamp: results.timestamp
      });
    }
  }

  private loadGameHistory(): void {
    // Load any previous game data if needed
    const history = this.storageService.getGameHistory();
    // Use history data to show personal bests, etc.
  }

  private checkForCustomText(): void {
    // Check query parameters for custom text
    this.route.queryParams.subscribe(params => {
      if (params['customText']) {
        const customTextId = params['customText'];
        const customText = this.customTextService.getTextById(customTextId);
        if (customText) {
          this.setupCustomTextMode(customText);
        }
      }
    });

    // Also check sessionStorage (fallback)
    const storedCustomText = sessionStorage.getItem('customText');
    if (storedCustomText && !this.isCustomMode) {
      try {
        const customText = JSON.parse(storedCustomText);
        this.setupCustomTextMode(customText);
        // Clear from session storage after using
        sessionStorage.removeItem('customText');
      } catch (error) {
        console.error('Error parsing custom text from session storage:', error);
      }
    }
  }

  private setupCustomTextMode(customText: CustomText): void {
    this.isCustomMode = true;
    this.customText = customText;
    
    // Set appropriate difficulty and duration based on custom text
    this.selectedDifficulty = customText.difficulty;
    this.selectedCategory = customText.category;
    
    // Calculate appropriate duration based on word count (aim for ~1 word per 2 seconds)
    const estimatedDuration = Math.max(60, Math.min(300, customText.wordCount * 2));
    this.selectedDuration = estimatedDuration;
    
    console.log(`Custom text mode activated: "${customText.name}" (${customText.wordCount} words)`);
  }

  private resetGameUI(): void {
    this.userInput = '';
    this.recentWords = [];
    this.maxStreak = 0;
    this.totalWordTimes = [];
    this.clearWordTimer(); // Ensure timer is cleared when resetting
  }

  private showAchievementNotifications(achievements: GameAchievement[]): void {
    // Simple notification - could be enhanced with a toast/modal system
    achievements.forEach(achievement => {
      console.log(`🏆 Achievement Unlocked: ${achievement.name} - ${achievement.description}`);
      // You could implement a more sophisticated notification system here
    });
  }

  private showLevelUpNotification(newLevel: number): void {
    console.log(`🎉 Level Up! You are now level ${newLevel}!`);
    // You could implement a more sophisticated notification system here
  }

  // TrackBy function for ngFor optimization
  trackByIndex(index: number): number {
    return index;
  }

  // Mobile keyboard event handlers
  onMobileKeyPress(key: string): void {
    if (this.gameService.gameState().isPaused || this.gameService.gameState().isGameOver) {
      return;
    }

    // Simulate typing input
    this.userInput += key;
    this.onInputChange({ target: { value: this.userInput } } as any);
  }

  onMobileSpecialKey(key: string): void {
    if (this.gameService.gameState().isPaused || this.gameService.gameState().isGameOver) {
      return;
    }

    switch (key) {
      case 'Backspace':
        if (this.userInput.length > 0) {
          this.userInput = this.userInput.slice(0, -1);
          this.onInputChange({ target: { value: this.userInput } } as any);
        }
        break;
      case 'Enter':
        // Submit current word
        if (this.userInput.trim() && this.userInput === this.gameService.gameState().currentWord) {
          this.handleWordComplete();
        }
        break;
    }
  }
}
