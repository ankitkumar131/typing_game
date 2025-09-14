import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface LeaderboardEntry {
  rank: number;
  wpm: number;
  accuracy: number;
  score: number;
  date: string;
  category: string;
  difficulty: string;
  isCurrentUser?: boolean;
}

interface LeaderboardFilter {
  category: string;
  difficulty: string;
  timeframe: string;
  metric: string;
}

@Component({
  selector: 'app-leaderboard',
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.scss',
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
export class Leaderboard implements OnInit {
  leaderboardData: LeaderboardEntry[] = [];
  filteredData: LeaderboardEntry[] = [];
  
  filters: LeaderboardFilter = {
    category: 'All',
    difficulty: 'All',
    timeframe: 'All',
    metric: 'wpm'
  };
  
  categories = ['All', 'Common', 'Programming', 'Academic', 'Advanced'];
  difficulties = ['All', 'Easy', 'Medium', 'Hard', 'Expert'];
  timeframes = [
    { value: 'All', label: 'All Time' },
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 3 Months' }
  ];
  metrics = [
    { value: 'wpm', label: 'Words Per Minute' },
    { value: 'accuracy', label: 'Accuracy' },
    { value: 'score', label: 'Score' }
  ];
  
  currentUserStats = {
    bestWpm: 0,
    bestAccuracy: 0,
    bestScore: 0,
    totalGames: 0,
    rank: null as number | null
  };
  
  constructor(
    private storageService: StorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLeaderboardData();
    this.calculateCurrentUserStats();
    this.applyFilters();
  }

  private loadLeaderboardData(): void {
    const gameHistory = this.storageService.getGameHistory();
    
    // Generate mock leaderboard data (in a real app, this would come from a backend)
    const mockData = this.generateMockLeaderboardData();
    
    // Add user's best games to leaderboard
    const userBestGames = this.getUserBestGames(gameHistory);
    
    // Combine and sort all data
    const allEntries = [...mockData, ...userBestGames];
    
    this.leaderboardData = allEntries
      .sort((a, b) => {
        switch (this.filters.metric) {
          case 'wpm': return b.wpm - a.wpm;
          case 'accuracy': return b.accuracy - a.accuracy;
          case 'score': return b.score - a.score;
          default: return b.wpm - a.wpm;
        }
      })
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  private generateMockLeaderboardData(): LeaderboardEntry[] {
    const mockEntries: LeaderboardEntry[] = [];
    const names = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Blake', 'Sage'];
    const categories = ['Common', 'Programming', 'Academic', 'Advanced'];
    const difficulties = ['Easy', 'Medium', 'Hard', 'Expert'];
    
    for (let i = 0; i < 50; i++) {
      const baseWpm = Math.random() * 60 + 40; // 40-100 WPM
      const accuracy = Math.random() * 20 + 80; // 80-100% accuracy
      const score = Math.floor((baseWpm * accuracy * 10) + Math.random() * 5000);
      
      mockEntries.push({
        rank: 0, // Will be calculated later
        wpm: Math.round(baseWpm),
        accuracy: Math.round(accuracy),
        score: score,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: categories[Math.floor(Math.random() * categories.length)],
        difficulty: difficulties[Math.floor(Math.random() * difficulties.length)]
      });
    }
    
    return mockEntries;
  }

  private getUserBestGames(gameHistory: any[]): LeaderboardEntry[] {
    if (gameHistory.length === 0) return [];
    
    // Get user's top 3 games
    const sortedGames = gameHistory
      .sort((a, b) => b.wpm - a.wpm)
      .slice(0, 3);
    
    return sortedGames.map(game => ({
      rank: 0, // Will be calculated later
      wpm: game.wpm,
      accuracy: game.accuracy,
      score: game.score,
      date: new Date(game.timestamp).toISOString().split('T')[0],
      category: game.category,
      difficulty: game.difficulty,
      isCurrentUser: true
    }));
  }

  private calculateCurrentUserStats(): void {
    const gameHistory = this.storageService.getGameHistory();
    
    if (gameHistory.length === 0) {
      this.currentUserStats = {
        bestWpm: 0,
        bestAccuracy: 0,
        bestScore: 0,
        totalGames: 0,
        rank: null
      };
      return;
    }
    
    this.currentUserStats = {
      bestWpm: Math.max(...gameHistory.map(g => g.wpm)),
      bestAccuracy: Math.max(...gameHistory.map(g => g.accuracy)),
      bestScore: Math.max(...gameHistory.map(g => g.score)),
      totalGames: gameHistory.length,
      rank: this.getCurrentUserRank()
    };
  }

  private getCurrentUserRank(): number | null {
    const userBestWpm = this.currentUserStats.bestWpm;
    if (userBestWpm === 0) return null;
    
    const betterEntries = this.leaderboardData.filter(entry => entry.wpm > userBestWpm);
    return betterEntries.length + 1;
  }

  applyFilters(): void {
    let filtered = [...this.leaderboardData];
    
    // Apply category filter
    if (this.filters.category !== 'All') {
      filtered = filtered.filter(entry => entry.category === this.filters.category);
    }
    
    // Apply difficulty filter
    if (this.filters.difficulty !== 'All') {
      filtered = filtered.filter(entry => entry.difficulty === this.filters.difficulty);
    }
    
    // Apply timeframe filter
    if (this.filters.timeframe !== 'All') {
      const days = parseInt(this.filters.timeframe);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(entry => new Date(entry.date) > cutoffDate);
    }
    
    // Sort by selected metric
    filtered.sort((a, b) => {
      switch (this.filters.metric) {
        case 'wpm': return b.wpm - a.wpm;
        case 'accuracy': return b.accuracy - a.accuracy;
        case 'score': return b.score - a.score;
        default: return b.wpm - a.wpm;
      }
    });
    
    // Update ranks
    this.filteredData = filtered.map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  getRankIcon(rank: number): string {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  }

  getRankClass(rank: number): string {
    if (rank <= 3) return 'top-three';
    if (rank <= 10) return 'top-ten';
    return 'regular';
  }

  getMetricValue(entry: LeaderboardEntry): number {
    switch (this.filters.metric) {
      case 'wpm': return entry.wpm;
      case 'accuracy': return entry.accuracy;
      case 'score': return entry.score;
      default: return entry.wpm;
    }
  }

  getMetricUnit(): string {
    switch (this.filters.metric) {
      case 'wpm': return 'WPM';
      case 'accuracy': return '%';
      case 'score': return 'pts';
      default: return 'WPM';
    }
  }

  getCurrentUserPosition(): LeaderboardEntry | null {
    return this.filteredData.find(entry => entry.isCurrentUser) || null;
  }

  getTopPerformers(): LeaderboardEntry[] {
    return this.filteredData.slice(0, 10);
  }

  generateShareText(): string {
    const userPos = this.getCurrentUserPosition();
    if (!userPos) {
      return `🎮 Typing Speed Challenge Leaderboard

Check out the top typists and compete for the crown!

Join the challenge now!`;
    }
    
    return `🎮 Typing Speed Challenge Leaderboard\n\n` +
           `🏆 I'm ranked #${userPos.rank} with ${userPos.wpm} WPM!\n` +
           `🎯 ${userPos.accuracy}% accuracy\n` +
           `💯 ${userPos.score.toLocaleString()} points\n\n` +
           `Can you beat my score? Join the typing challenge!`;
  }

  shareLeaderboard(): void {
    const shareText = this.generateShareText();
    
    if (navigator.share) {
      navigator.share({
        title: 'Typing Speed Challenge Leaderboard',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Leaderboard shared to clipboard!');
    }
  }

  goToGame(): void {
    this.router.navigate(['/game']);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }
}
