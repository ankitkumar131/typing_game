import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { DailyChallengeService, DailyChallenge } from '../../services/daily-challenge';
import { GameService } from '../../services/game';

@Component({
  selector: 'app-daily-challenges',
  imports: [CommonModule],
  templateUrl: './daily-challenges.html',
  styleUrl: './daily-challenges.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class DailyChallengesComponent implements OnInit {
  
  // Computed properties
  todaysChallenges!: any;
  weeklyChallenges!: any;
  
  constructor(
    private dailyChallengeService: DailyChallengeService,
    private gameService: GameService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize computed properties after service injection
    this.todaysChallenges = this.dailyChallengeService.getTodaysChallenges();
    this.weeklyChallenges = this.dailyChallengeService.getWeeklyChallenges();
  }
  challengeProgress = () => this.dailyChallengeService.getChallengeProgress();

  // Event handlers
  startChallenge(challenge: DailyChallenge): void {
    // Set up custom word list for themed challenges
    const themeWords = this.dailyChallengeService.getThemeWords(challenge.id);
    
    // Configure game settings based on challenge
    const gameSettings = {
      difficulty: challenge.difficulty,
      category: challenge.category,
      gameDuration: this.getChallengeDuration(challenge),
      wordsPerGame: this.getChallengeWordCount(challenge)
    };

    // Store challenge context for game completion
    sessionStorage.setItem('activeChallenge', JSON.stringify(challenge));
    sessionStorage.setItem('challengeWords', JSON.stringify(themeWords));

    // Navigate to game with challenge settings
    this.router.navigate(['/game'], { 
      queryParams: { 
        challenge: challenge.id,
        mode: 'challenge'
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/game']);
  }

  refreshChallenges(): void {
    // This would trigger regeneration of challenges if needed
    window.location.reload();
  }

  // Helper methods
  getChallengeIcon(type: DailyChallenge['type']): string {
    const icons = {
      speed: '⚡',
      accuracy: '🎯',
      endurance: '🏃',
      special: '🔥'
    };
    return icons[type] || '🏆';
  }

  formatTarget(target: DailyChallenge['target']): string {
    if (target.wpm) return `${target.wpm} WPM`;
    if (target.accuracy) return `${target.accuracy}% Accuracy`;
    if (target.words) return `${target.words} Words`;
    if (target.streak) return `${target.streak} Word Streak`;
    if (target.time) return `${target.time} Seconds`;
    return 'Complete Challenge';
  }

  formatChallengeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  }

  trackChallenge(index: number, challenge: DailyChallenge): string {
    return challenge.id;
  }

  private getChallengeDuration(challenge: DailyChallenge): number {
    // Adjust duration based on challenge type
    switch (challenge.type) {
      case 'speed': return 60;
      case 'accuracy': return 120;
      case 'endurance': return 180;
      case 'special': return 90;
      default: return 60;
    }
  }

  private getChallengeWordCount(challenge: DailyChallenge): number {
    // Adjust word count based on challenge target
    if (challenge.target.words) return challenge.target.words;
    
    switch (challenge.type) {
      case 'speed': return 50;
      case 'accuracy': return 30;
      case 'endurance': return 100;
      case 'special': return 40;
      default: return 50;
    }
  }
}