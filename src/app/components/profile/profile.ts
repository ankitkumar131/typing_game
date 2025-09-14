import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface GameResult {
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

interface UserStats {
  totalGames: number;
  totalScore: number;
  averageWpm: number;
  averageAccuracy: number;
  bestWpm: number;
  bestAccuracy: number;
  bestScore: number;
  totalWordsTyped: number;
  totalTimeSpent: number;
  achievementsUnlocked: number;
  favoriteCategory: string;
  favoriteDifficulty: string;
}

interface ChartData {
  labels: string[];
  wpmData: number[];
  accuracyData: number[];
  scoreData: number[];
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
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
export class Profile implements OnInit {
  gameHistory: GameResult[] = [];
  userStats: UserStats = this.getEmptyStats();
  chartData: ChartData = { labels: [], wpmData: [], accuracyData: [], scoreData: [] };
  selectedTimeframe = '30';
  selectedMetric = 'wpm';
  
  constructor(
    private storageService: StorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.calculateStats();
    this.updateChartData();
  }

  private loadUserData(): void {
    this.gameHistory = this.storageService.getGameHistory();
  }

  private calculateStats(): void {
    if (this.gameHistory.length === 0) {
      this.userStats = this.getEmptyStats();
      return;
    }

    const totalGames = this.gameHistory.length;
    const totalScore = this.gameHistory.reduce((sum, game) => sum + game.score, 0);
    const totalWpm = this.gameHistory.reduce((sum, game) => sum + game.wpm, 0);
    const totalAccuracy = this.gameHistory.reduce((sum, game) => sum + game.accuracy, 0);
    const bestWpm = Math.max(...this.gameHistory.map(game => game.wpm));
    const bestAccuracy = Math.max(...this.gameHistory.map(game => game.accuracy));
    const bestScore = Math.max(...this.gameHistory.map(game => game.score));
    const totalWordsTyped = this.gameHistory.reduce((sum, game) => sum + game.correctWords, 0);
    const totalTimeSpent = this.gameHistory.reduce((sum, game) => sum + game.duration, 0);
    
    // Calculate achievements
    const allAchievements = this.gameHistory.flatMap(game => game.achievements || []);
    const uniqueAchievements = new Set(allAchievements.map(a => a.id));
    
    // Find favorite category and difficulty
    const categoryCount = this.gameHistory.reduce((acc, game) => {
      acc[game.category] = (acc[game.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const difficultyCount = this.gameHistory.reduce((acc, game) => {
      acc[game.difficulty] = (acc[game.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, 'Common'
    );
    
    const favoriteDifficulty = Object.keys(difficultyCount).reduce((a, b) => 
      difficultyCount[a] > difficultyCount[b] ? a : b, 'Medium'
    );

    this.userStats = {
      totalGames,
      totalScore,
      averageWpm: Math.round(totalWpm / totalGames),
      averageAccuracy: Math.round(totalAccuracy / totalGames),
      bestWpm,
      bestAccuracy,
      bestScore,
      totalWordsTyped,
      totalTimeSpent,
      achievementsUnlocked: uniqueAchievements.size,
      favoriteCategory,
      favoriteDifficulty
    };
  }

  private updateChartData(): void {
    const timeframeDays = parseInt(this.selectedTimeframe);
    const cutoffDate = Date.now() - (timeframeDays * 24 * 60 * 60 * 1000);
    
    const filteredGames = this.gameHistory
      .filter(game => game.timestamp > cutoffDate)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-20); // Show last 20 games max

    this.chartData = {
      labels: filteredGames.map((game, index) => `Game ${index + 1}`),
      wpmData: filteredGames.map(game => game.wpm),
      accuracyData: filteredGames.map(game => game.accuracy),
      scoreData: filteredGames.map(game => Math.round(game.score / 100)) // Scale down for better visualization
    };
  }

  private getEmptyStats(): UserStats {
    return {
      totalGames: 0,
      totalScore: 0,
      averageWpm: 0,
      averageAccuracy: 0,
      bestWpm: 0,
      bestAccuracy: 0,
      bestScore: 0,
      totalWordsTyped: 0,
      totalTimeSpent: 0,
      achievementsUnlocked: 0,
      favoriteCategory: 'Common',
      favoriteDifficulty: 'Medium'
    };
  }

  onTimeframeChange(timeframe: string): void {
    this.selectedTimeframe = timeframe;
    this.updateChartData();
  }

  onMetricChange(metric: string): void {
    this.selectedMetric = metric;
  }

  getCurrentData(): number[] {
    switch (this.selectedMetric) {
      case 'wpm': return this.chartData.wpmData;
      case 'accuracy': return this.chartData.accuracyData;
      case 'score': return this.chartData.scoreData;
      default: return this.chartData.wpmData;
    }
  }

  getMetricLabel(): string {
    switch (this.selectedMetric) {
      case 'wpm': return 'Words Per Minute';
      case 'accuracy': return 'Accuracy (%)';
      case 'score': return 'Score (÷100)';
      default: return 'WPM';
    }
  }

  getRecentGames(): GameResult[] {
    return this.gameHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }

  getPersonalBests(): any {
    if (this.gameHistory.length === 0) return null;
    
    const bestWpmGame = this.gameHistory.reduce((best, game) => 
      game.wpm > best.wpm ? game : best
    );
    
    const bestAccuracyGame = this.gameHistory.reduce((best, game) => 
      game.accuracy > best.accuracy ? game : best
    );
    
    const bestScoreGame = this.gameHistory.reduce((best, game) => 
      game.score > best.score ? game : best
    );

    return {
      wpm: bestWpmGame,
      accuracy: bestAccuracyGame,
      score: bestScoreGame
    };
  }

  getAllAchievements(): any[] {
    const allAchievements = this.gameHistory.flatMap(game => game.achievements || []);
    const uniqueAchievements = new Map();
    
    allAchievements.forEach(achievement => {
      if (!uniqueAchievements.has(achievement.id)) {
        uniqueAchievements.set(achievement.id, achievement);
      }
    });
    
    return Array.from(uniqueAchievements.values());
  }

  getProgressAnalysis(): string {
    if (this.gameHistory.length < 5) {
      return 'Play more games to see your progress analysis!';
    }
    
    const recentGames = this.gameHistory.slice(-5);
    const earlierGames = this.gameHistory.slice(-10, -5);
    
    if (earlierGames.length === 0) {
      return 'Keep playing to track your improvement!';
    }
    
    const recentAvgWpm = recentGames.reduce((sum, game) => sum + game.wpm, 0) / recentGames.length;
    const earlierAvgWpm = earlierGames.reduce((sum, game) => sum + game.wpm, 0) / earlierGames.length;
    
    const improvement = recentAvgWpm - earlierAvgWpm;
    
    if (improvement > 5) {
      return `🚀 Excellent progress! Your WPM improved by ${improvement.toFixed(1)} in recent games.`;
    } else if (improvement > 2) {
      return `📈 Good improvement! Your WPM increased by ${improvement.toFixed(1)}.`;
    } else if (improvement > -2) {
      return `⚖️ Consistent performance! Your WPM is stable around ${recentAvgWpm.toFixed(1)}.`;
    } else {
      return `🎯 Focus on accuracy and consistency to improve your speed.`;
    }
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }

  getMaxValue(data: number[]): number {
    return Math.max(...data);
  }

  getBarHeight(value: number): number {
    const data = this.getCurrentData();
    if (data.length === 0) return 0;
    const maxValue = this.getMaxValue(data);
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  }

  clearData(): void {
    if (confirm('Are you sure you want to clear all your typing data? This action cannot be undone.')) {
      this.storageService.clearAllData();
      this.gameHistory = [];
      this.userStats = this.getEmptyStats();
      this.chartData = { labels: [], wpmData: [], accuracyData: [], scoreData: [] };
    }
  }

  exportData(): void {
    const dataStr = JSON.stringify(this.gameHistory, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `typing-game-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  goToGame(): void {
    this.router.navigate(['/game']);
  }

  goToLeaderboard(): void {
    this.router.navigate(['/leaderboard']);
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }
}
