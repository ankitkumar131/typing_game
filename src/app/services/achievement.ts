import { Injectable, signal, computed } from '@angular/core';
import { StorageService, GameResult } from './storage';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'speed' | 'accuracy' | 'consistency' | 'endurance' | 'special' | 'social';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  requirements: {
    type: 'single' | 'cumulative' | 'streak' | 'special';
    target: number;
    metric: string;
    condition?: string;
  };
  rewards: {
    coins: number;
    experience: number;
    title?: string;
    badge?: string;
    skillPoints?: number;
  };
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  rarity: number; // 1-100, lower = more rare
}

export interface UserCurrency {
  coins: number;
  gems: number;
  experiencePoints: number;
  skillPoints: number;
  totalEarned: {
    coins: number;
    gems: number;
    experience: number;
  };
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'speed' | 'accuracy' | 'power' | 'utility';
  tier: number; // 1-5
  cost: {
    skillPoints: number;
    coins?: number;
  };
  prerequisites: string[]; // skill node IDs
  maxLevel: number;
  currentLevel: number;
  effects: {
    type: 'bonus' | 'multiplier' | 'unlock' | 'passive';
    target: string;
    value: number;
    perLevel?: number;
  }[];
  unlocked: boolean;
}

export interface UserProfile {
  level: number;
  experience: number;
  experienceToNext: number;
  totalGamesPlayed: number;
  rank: string;
  title: string;
  activeBadges: string[];
  unlockedTitles: string[];
  prestigeLevel: number;
}

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  private readonly STORAGE_KEY = 'typingGame_achievements';
  private readonly CURRENCY_KEY = 'typingGame_currency';
  private readonly SKILLS_KEY = 'typingGame_skills';
  private readonly PROFILE_KEY = 'typingGame_userProfile';

  private achievements = signal<Achievement[]>(this.getDefaultAchievements());
  private currency = signal<UserCurrency>(this.getDefaultCurrency());
  private skillTree = signal<SkillNode[]>(this.getDefaultSkillTree());
  private userProfile = signal<UserProfile>(this.getDefaultProfile());

  // Computed properties
  unlockedAchievements = computed(() => this.achievements().filter(a => a.unlocked));
  availableSkillPoints = computed(() => this.currency().skillPoints);
  currentLevel = computed(() => this.userProfile().level);
  totalCoins = computed(() => this.currency().coins);

  constructor(private storageService: StorageService) {
    this.loadData();
  }

  // Achievement System
  checkAchievements(gameResult: GameResult): Achievement[] {
    const newAchievements: Achievement[] = [];
    const allResults = this.storageService.getGameResults();
    
    this.achievements().forEach(achievement => {
      if (!achievement.unlocked) {
        const progress = this.calculateAchievementProgress(achievement, gameResult, allResults);
        
        if (progress >= 100) {
          // Achievement unlocked!
          achievement.unlocked = true;
          achievement.unlockedAt = Date.now();
          achievement.progress = 100;
          
          // Award rewards
          this.awardRewards(achievement.rewards);
          newAchievements.push(achievement);
        } else {
          achievement.progress = progress;
        }
      }
    });

    if (newAchievements.length > 0) {
      this.saveData();
    }

    return newAchievements;
  }

  getAchievementsByCategory(category: string): Achievement[] {
    return this.achievements().filter(a => a.category === category);
  }

  getRecentAchievements(limit: number = 5): Achievement[] {
    return this.unlockedAchievements()
      .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
      .slice(0, limit);
  }

  // Currency System
  earnCoins(amount: number, source: string = 'gameplay'): void {
    this.currency.update(c => ({
      ...c,
      coins: c.coins + amount,
      totalEarned: { ...c.totalEarned, coins: c.totalEarned.coins + amount }
    }));
    this.saveData();
  }

  spendCoins(amount: number): boolean {
    if (this.currency().coins >= amount) {
      this.currency.update(c => ({ ...c, coins: c.coins - amount }));
      this.saveData();
      return true;
    }
    return false;
  }

  earnExperience(amount: number): { levelUp: boolean; newLevel?: number } {
    const currentProfile = this.userProfile();
    const newExperience = currentProfile.experience + amount;
    const newLevel = this.calculateLevel(newExperience);
    const levelUp = newLevel > currentProfile.level;

    this.userProfile.update(p => ({
      ...p,
      experience: newExperience,
      level: newLevel,
      experienceToNext: this.getExperienceForLevel(newLevel + 1) - newExperience
    }));

    this.currency.update(c => ({
      ...c,
      experiencePoints: c.experiencePoints + amount,
      totalEarned: { ...c.totalEarned, experience: c.totalEarned.experience + amount }
    }));

    if (levelUp) {
      // Award skill points for level up
      const skillPointsAwarded = this.getSkillPointsForLevel(newLevel) - this.getSkillPointsForLevel(currentProfile.level);
      this.currency.update(c => ({ ...c, skillPoints: c.skillPoints + skillPointsAwarded }));
    }

    this.saveData();
    return { levelUp, newLevel: levelUp ? newLevel : undefined };
  }

  // Skill Tree System
  getAvailableSkills(): SkillNode[] {
    return this.skillTree().filter(skill => 
      !skill.unlocked && 
      skill.prerequisites.every(prereq => 
        this.skillTree().find(s => s.id === prereq)?.unlocked
      )
    );
  }

  getUnlockedSkills(): SkillNode[] {
    return this.skillTree().filter(skill => skill.unlocked);
  }

  upgradeSkill(skillId: string): { success: boolean; error?: string } {
    const skill = this.skillTree().find(s => s.id === skillId);
    if (!skill) return { success: false, error: 'Skill not found' };

    if (!skill.unlocked) {
      // Unlock skill
      if (this.currency().skillPoints < skill.cost.skillPoints) {
        return { success: false, error: 'Insufficient skill points' };
      }
      if (skill.cost.coins && this.currency().coins < skill.cost.coins) {
        return { success: false, error: 'Insufficient coins' };
      }

      // Check prerequisites
      const missingPrereqs = skill.prerequisites.filter(prereq =>
        !this.skillTree().find(s => s.id === prereq)?.unlocked
      );
      if (missingPrereqs.length > 0) {
        return { success: false, error: 'Prerequisites not met' };
      }

      // Unlock skill
      skill.unlocked = true;
      skill.currentLevel = 1;
      this.currency.update(c => ({ 
        ...c, 
        skillPoints: c.skillPoints - skill.cost.skillPoints,
        coins: c.coins - (skill.cost.coins || 0)
      }));
    } else {
      // Upgrade existing skill
      if (skill.currentLevel >= skill.maxLevel) {
        return { success: false, error: 'Skill already at max level' };
      }

      const upgradeCost = this.getUpgradeCost(skill);
      if (this.currency().skillPoints < upgradeCost.skillPoints) {
        return { success: false, error: 'Insufficient skill points' };
      }
      if (upgradeCost.coins && this.currency().coins < upgradeCost.coins) {
        return { success: false, error: 'Insufficient coins' };
      }

      skill.currentLevel++;
      this.currency.update(c => ({ 
        ...c, 
        skillPoints: c.skillPoints - upgradeCost.skillPoints,
        coins: c.coins - (upgradeCost.coins || 0)
      }));
    }

    this.saveData();
    return { success: true };
  }

  getActiveSkillEffects(): { [key: string]: number } {
    const effects: { [key: string]: number } = {};
    
    this.getUnlockedSkills().forEach(skill => {
      skill.effects.forEach(effect => {
        const value = effect.value + (effect.perLevel ? effect.perLevel * (skill.currentLevel - 1) : 0);
        
        if (effect.type === 'bonus') {
          effects[effect.target] = (effects[effect.target] || 0) + value;
        } else if (effect.type === 'multiplier') {
          effects[`${effect.target}_multiplier`] = (effects[`${effect.target}_multiplier`] || 1) * value;
        }
      });
    });

    return effects;
  }

  // Shop System
  purchaseItem(itemId: string, cost: number): boolean {
    if (this.spendCoins(cost)) {
      // Handle item purchase logic here
      return true;
    }
    return false;
  }

  // Stats and Progress
  getProgressStats(): {
    totalAchievements: number;
    unlockedAchievements: number;
    achievementProgress: number;
    rareAchievements: number;
    skillTreeProgress: number;
  } {
    const total = this.achievements().length;
    const unlocked = this.unlockedAchievements().length;
    const rare = this.unlockedAchievements().filter(a => a.rarity <= 10).length;
    const totalSkills = this.skillTree().length;
    const unlockedSkills = this.getUnlockedSkills().length;

    return {
      totalAchievements: total,
      unlockedAchievements: unlocked,
      achievementProgress: Math.round((unlocked / total) * 100),
      rareAchievements: rare,
      skillTreeProgress: Math.round((unlockedSkills / totalSkills) * 100)
    };
  }

  // Private methods
  private calculateAchievementProgress(achievement: Achievement, gameResult: GameResult, allResults: GameResult[]): number {
    const { requirements } = achievement;
    
    switch (requirements.type) {
      case 'single':
        return this.evaluateSingleRequirement(requirements, gameResult);
      case 'cumulative':
        return this.evaluateCumulativeRequirement(requirements, allResults);
      case 'streak':
        return this.evaluateStreakRequirement(requirements, allResults);
      case 'special':
        return this.evaluateSpecialRequirement(requirements, gameResult, allResults);
      default:
        return 0;
    }
  }

  private evaluateSingleRequirement(requirements: any, gameResult: GameResult): number {
    const value = gameResult[requirements.metric as keyof GameResult] as number || 0;
    return Math.min(100, (value / requirements.target) * 100);
  }

  private evaluateCumulativeRequirement(requirements: any, allResults: GameResult[]): number {
    const total = allResults.reduce((sum, result) => {
      return sum + ((result[requirements.metric as keyof GameResult] as number) || 0);
    }, 0);
    return Math.min(100, (total / requirements.target) * 100);
  }

  private evaluateStreakRequirement(requirements: any, allResults: GameResult[]): number {
    // Implementation for streak-based achievements
    return 0; // Placeholder
  }

  private evaluateSpecialRequirement(requirements: any, gameResult: GameResult, allResults: GameResult[]): number {
    // Implementation for special achievements with custom logic
    return 0; // Placeholder
  }

  private awardRewards(rewards: Achievement['rewards']): void {
    this.earnCoins(rewards.coins, 'achievement');
    this.earnExperience(rewards.experience);
    
    if (rewards.skillPoints) {
      this.currency.update(c => ({ ...c, skillPoints: c.skillPoints + rewards.skillPoints! }));
    }
    
    if (rewards.title) {
      this.userProfile.update(p => ({
        ...p,
        unlockedTitles: [...p.unlockedTitles, rewards.title!]
      }));
    }
  }

  private calculateLevel(experience: number): number {
    return Math.floor(Math.sqrt(experience / 100)) + 1;
  }

  private getExperienceForLevel(level: number): number {
    return Math.pow(level - 1, 2) * 100;
  }

  private getSkillPointsForLevel(level: number): number {
    return Math.floor(level / 5) + level;
  }

  private getUpgradeCost(skill: SkillNode): { skillPoints: number; coins?: number } {
    return {
      skillPoints: skill.cost.skillPoints * skill.currentLevel,
      coins: skill.cost.coins ? skill.cost.coins * skill.currentLevel : undefined
    };
  }

  private getDefaultAchievements(): Achievement[] {
    return [
      {
        id: 'first_game',
        name: 'Getting Started',
        description: 'Complete your first typing game',
        icon: '🎯',
        category: 'special',
        tier: 'bronze',
        requirements: { type: 'single', target: 1, metric: 'totalWords' },
        rewards: { coins: 50, experience: 100 },
        unlocked: false,
        progress: 0,
        rarity: 100
      },
      {
        id: 'speed_50',
        name: 'Speed Racer',
        description: 'Achieve 50 WPM in a single game',
        icon: '⚡',
        category: 'speed',
        tier: 'silver',
        requirements: { type: 'single', target: 50, metric: 'wpm' },
        rewards: { coins: 200, experience: 300, skillPoints: 1 },
        unlocked: false,
        progress: 0,
        rarity: 75
      },
      {
        id: 'accuracy_master',
        name: 'Accuracy Master',
        description: 'Achieve 95% accuracy in a single game',
        icon: '🎯',
        category: 'accuracy',
        tier: 'gold',
        requirements: { type: 'single', target: 95, metric: 'accuracy' },
        rewards: { coins: 500, experience: 500, skillPoints: 2 },
        unlocked: false,
        progress: 0,
        rarity: 50
      },
      {
        id: 'marathon_runner',
        name: 'Marathon Runner',
        description: 'Complete 100 games total',
        icon: '🏃‍♂️',
        category: 'endurance',
        tier: 'platinum',
        requirements: { type: 'cumulative', target: 100, metric: 'totalGamesPlayed' },
        rewards: { coins: 1000, experience: 1000, skillPoints: 3, title: 'Marathon Runner' },
        unlocked: false,
        progress: 0,
        rarity: 25
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Complete a game with 100% accuracy',
        icon: '👑',
        category: 'accuracy',
        tier: 'diamond',
        requirements: { type: 'single', target: 100, metric: 'accuracy' },
        rewards: { coins: 2000, experience: 2000, skillPoints: 5, title: 'Perfectionist', badge: '👑' },
        unlocked: false,
        progress: 0,
        rarity: 5
      }
    ];
  }

  private getDefaultCurrency(): UserCurrency {
    return {
      coins: 100,
      gems: 0,
      experiencePoints: 0,
      skillPoints: 0,
      totalEarned: {
        coins: 100,
        gems: 0,
        experience: 0
      }
    };
  }

  private getDefaultSkillTree(): SkillNode[] {
    return [
      {
        id: 'speed_boost_1',
        name: 'Speed Boost I',
        description: '+5% typing speed bonus',
        icon: '⚡',
        category: 'speed',
        tier: 1,
        cost: { skillPoints: 1 },
        prerequisites: [],
        maxLevel: 3,
        currentLevel: 0,
        effects: [{ type: 'multiplier', target: 'wpm', value: 1.05, perLevel: 0.02 }],
        unlocked: false
      },
      {
        id: 'accuracy_boost_1',
        name: 'Accuracy Boost I',
        description: '+3% accuracy bonus',
        icon: '🎯',
        category: 'accuracy',
        tier: 1,
        cost: { skillPoints: 1 },
        prerequisites: [],
        maxLevel: 3,
        currentLevel: 0,
        effects: [{ type: 'bonus', target: 'accuracy', value: 3, perLevel: 1 }],
        unlocked: false
      },
      {
        id: 'coin_master',
        name: 'Coin Master',
        description: '+25% coins from games',
        icon: '🪙',
        category: 'utility',
        tier: 2,
        cost: { skillPoints: 2 },
        prerequisites: ['speed_boost_1', 'accuracy_boost_1'],
        maxLevel: 2,
        currentLevel: 0,
        effects: [{ type: 'multiplier', target: 'coins', value: 1.25, perLevel: 0.15 }],
        unlocked: false
      }
    ];
  }

  private getDefaultProfile(): UserProfile {
    return {
      level: 1,
      experience: 0,
      experienceToNext: 100,
      totalGamesPlayed: 0,
      rank: 'Beginner',
      title: 'Novice Typist',
      activeBadges: [],
      unlockedTitles: ['Novice Typist'],
      prestigeLevel: 0
    };
  }

  private loadData(): void {
    // Load achievements
    const achievements = localStorage.getItem(this.STORAGE_KEY);
    if (achievements) {
      try {
        this.achievements.set(JSON.parse(achievements));
      } catch (e) {
        console.warn('Failed to load achievements');
      }
    }

    // Load currency
    const currency = localStorage.getItem(this.CURRENCY_KEY);
    if (currency) {
      try {
        this.currency.set(JSON.parse(currency));
      } catch (e) {
        console.warn('Failed to load currency');
      }
    }

    // Load skills
    const skills = localStorage.getItem(this.SKILLS_KEY);
    if (skills) {
      try {
        this.skillTree.set(JSON.parse(skills));
      } catch (e) {
        console.warn('Failed to load skills');
      }
    }

    // Load profile
    const profile = localStorage.getItem(this.PROFILE_KEY);
    if (profile) {
      try {
        this.userProfile.set(JSON.parse(profile));
      } catch (e) {
        console.warn('Failed to load profile');
      }
    }
  }

  private saveData(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.achievements()));
    localStorage.setItem(this.CURRENCY_KEY, JSON.stringify(this.currency()));
    localStorage.setItem(this.SKILLS_KEY, JSON.stringify(this.skillTree()));
    localStorage.setItem(this.PROFILE_KEY, JSON.stringify(this.userProfile()));
  }
}