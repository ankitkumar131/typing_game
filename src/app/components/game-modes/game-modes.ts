import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { GameModeService, GameMode } from '../../services/game-modes';
import { GameService } from '../../services/game';

@Component({
  selector: 'app-game-modes',
  imports: [CommonModule],
  templateUrl: './game-modes.html',
  styleUrl: './game-modes.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(30px)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('bounce', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', 
          style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
export class GameModesComponent implements OnInit {
  
  selectedCategory: string = 'all';
  availableModes: GameMode[] = [];
  categories = [
    { id: 'all', name: 'All Modes', icon: '🎮' },
    { id: 'speed', name: 'Speed', icon: '⚡' },
    { id: 'accuracy', name: 'Accuracy', icon: '🎯' },
    { id: 'endurance', name: 'Endurance', icon: '🏃' },
    { id: 'special', name: 'Special', icon: '✨' }
  ];

  constructor(
    private gameModeService: GameModeService,
    private gameService: GameService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAvailableModes();
    this.checkForNewUnlocks();
  }

  // Event handlers
  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.loadAvailableModes();
  }

  startGameMode(mode: GameMode): void {
    // Configure game settings based on mode
    const gameSettings = this.createGameSettings(mode);
    
    // Store mode context
    sessionStorage.setItem('gameMode', JSON.stringify(mode));
    sessionStorage.setItem('gameModeSettings', JSON.stringify(gameSettings));

    // Navigate to game
    this.router.navigate(['/game'], { 
      queryParams: { 
        mode: mode.id,
        type: 'gameMode'
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  viewModeStats(mode: GameMode): void {
    const results = this.gameModeService.getModeResults(mode.id);
    // Show modal or navigate to detailed stats
    console.log('Mode stats for', mode.name, results);
  }

  // Helper methods
  getFilteredModes(): GameMode[] {
    if (this.selectedCategory === 'all') {
      return this.availableModes;
    }
    return this.availableModes.filter(mode => mode.category === this.selectedCategory);
  }

  getModeStatusClass(mode: GameMode): string {
    if (!mode.unlocked) return 'locked';
    if (mode.timesPlayed === 0) return 'new';
    if (mode.timesPlayed > 10) return 'mastered';
    return 'available';
  }

  getModeStatsText(mode: GameMode): string {
    if (!mode.unlocked) return 'Locked';
    if (mode.timesPlayed === 0) return 'New!';
    return `Played ${mode.timesPlayed} times`;
  }

  getBestScoreText(mode: GameMode): string {
    if (!mode.highScore) return 'No best score';
    return `Best: ${mode.highScore.toLocaleString()}`;
  }

  getBestWpmText(mode: GameMode): string {
    if (!mode.bestWpm) return 'No best WPM';
    return `Best: ${mode.bestWpm} WPM`;
  }

  getBestAccuracyText(mode: GameMode): string {
    if (!mode.bestAccuracy) return 'No best accuracy';
    return `Best: ${mode.bestAccuracy}%`;
  }

  getUnlockRequirement(mode: GameMode): string {
    switch (mode.id) {
      case 'sprint10':
        return 'Reach 30 WPM in Standard mode';
      case 'sprint30':
        return 'Reach 40 WPM in Standard mode';
      case 'sprint60':
        return 'Reach 50 WPM in Standard mode';
      case 'survival':
        return 'Achieve 90% accuracy in Standard mode';
      case 'perfectionist':
        return 'Achieve 98% accuracy in Standard mode';
      case 'zen':
        return 'Complete 5 Standard mode games';
      case 'blindType':
        return 'Reach 60 WPM with 95% accuracy';
      case 'marathon':
        return 'Reach 50 WPM with 90% accuracy';
      default:
        return 'Requirements not specified';
    }
  }

  getDifficultyBadge(mode: GameMode): string {
    const difficultyMap: { [key: string]: string } = {
      'standard': 'Beginner',
      'timeAttack': 'Intermediate',
      'endless': 'Intermediate',
      'sprint10': 'Advanced',
      'sprint30': 'Advanced',
      'sprint60': 'Intermediate',
      'survival': 'Hard',
      'perfectionist': 'Expert',
      'zen': 'Beginner',
      'blindType': 'Expert',
      'marathon': 'Hard'
    };
    return difficultyMap[mode.id] || 'Unknown';
  }

  getDifficultyColor(difficulty: string): string {
    const colorMap: { [key: string]: string } = {
      'Beginner': '#10b981',
      'Intermediate': '#f59e0b',
      'Advanced': '#ef4444',
      'Hard': '#dc2626',
      'Expert': '#7c2d12'
    };
    return colorMap[difficulty] || '#6b7280';
  }

  trackByMode(index: number, mode: GameMode): string {
    return mode.id;
  }

  trackByCategory(index: number, category: any): string {
    return category.id;
  }

  // Private methods
  private loadAvailableModes(): void {
    this.availableModes = this.gameModeService.getAvailableGameModes();
  }

  private checkForNewUnlocks(): void {
    const newUnlocks = this.gameModeService.checkUnlockConditions();
    if (newUnlocks.length > 0) {
      // Show notification about new unlocks
      this.showUnlockNotification(newUnlocks);
    }
  }

  private showUnlockNotification(unlockedModes: string[]): void {
    // This could trigger a toast notification or modal
    console.log('New game modes unlocked:', unlockedModes);
  }

  private createGameSettings(mode: GameMode): any {
    const baseSettings = {
      difficulty: 'Medium',
      category: 'Common',
      gameDuration: mode.settings.timeLimit || 60,
      wordsPerGame: mode.settings.wordLimit || 50
    };

    // Apply mode-specific settings
    switch (mode.id) {
      case 'timeAttack':
        return this.gameModeService.createTimeAttackSession(baseSettings);
      case 'endless':
        return this.gameModeService.createEndlessSession(baseSettings);
      case 'sprint10':
        return this.gameModeService.createSprintSession('10sec', baseSettings);
      case 'sprint30':
        return this.gameModeService.createSprintSession('30sec', baseSettings);
      case 'sprint60':
        return this.gameModeService.createSprintSession('60sec', baseSettings);
      case 'survival':
        return this.gameModeService.createSurvivalSession(baseSettings);
      case 'zen':
        return this.gameModeService.createZenSession(baseSettings);
      default:
        return baseSettings;
    }
  }
}