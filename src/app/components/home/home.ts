import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AchievementService } from '../../services/achievement';
import { DailyChallengeService, DailyChallenge } from '../../services/daily-challenge';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  
  // Progress data
  totalCoins = 0;
  currentLevel = 1;
  unlockedAchievements = 0;
  totalAchievements = 0;
  dailyProgress = 0;
  todaysChallenge: DailyChallenge | null = null;

  constructor(
    private achievementService: AchievementService,
    private dailyChallengeService: DailyChallengeService
  ) {}

  ngOnInit(): void {
    this.loadProgressData();
    this.loadTodaysChallenge();
  }

  private loadProgressData(): void {
    // Get achievement data
    const progressStats = this.achievementService.getProgressStats();
    this.unlockedAchievements = progressStats.unlockedAchievements;
    this.totalAchievements = progressStats.totalAchievements;
    
    // Get currency data
    this.totalCoins = this.achievementService.totalCoins();
    this.currentLevel = this.achievementService.currentLevel();
    
    // Get daily challenge progress
    const challengeProgress = this.dailyChallengeService.getChallengeProgress();
    this.dailyProgress = challengeProgress.todayCompleted;
  }

  private loadTodaysChallenge(): void {
    const todaysChallenges = this.dailyChallengeService.getTodaysChallenges()();
    if (todaysChallenges.length > 0) {
      // Get the first uncompleted challenge or the first challenge
      this.todaysChallenge = todaysChallenges.find(c => !c.isCompleted) || todaysChallenges[0];
    }
  }

  getChallengeIcon(type: string): string {
    const icons = {
      speed: '⚡',
      accuracy: '🎯',
      endurance: '🏃',
      special: '🔥'
    };
    return icons[type as keyof typeof icons] || '🏆';
  }
}
