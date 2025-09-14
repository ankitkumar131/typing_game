import { Injectable, signal, computed } from '@angular/core';
import { StorageService, GameResult } from './storage';
import { ErrorFeedbackService, TypingError } from './error-feedback';
import { HeatMapService } from './heat-map';

export interface PerformanceTrend {
  period: 'daily' | 'weekly' | 'monthly';
  data: {
    date: string;
    wpm: number;
    accuracy: number;
    score: number;
    gamesPlayed: number;
    avgSessionTime: number;
  }[];
}

export interface DetailedErrorAnalysis {
  totalErrors: number;
  errorsByType: {
    type: string;
    count: number;
    percentage: number;
    avgTimePenalty: number;
    commonKeys: string[];
  }[];
  errorsByTime: {
    hour: number;
    count: number;
    accuracy: number;
  }[];
  errorsByFinger: {
    finger: string;
    count: number;
    accuracy: number;
    strongKeys: string[];
    weakKeys: string[];
  }[];
  improvements: {
    area: string;
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    expectedGain: string;
  }[];
}

export interface BiometricAnalysis {
  typingRhythm: {
    avgKeystrokeInterval: number;
    rhythmConsistency: number;
    optimalSpeed: number;
    fatigueIndicators: number[];
  };
  handCoordination: {
    leftHandDominance: number;
    rightHandDominance: number;
    handSyncScore: number;
    alternatingScore: number;
  };
  pressurePatterns: {
    lightTouches: number;
    heavyTouches: number;
    avgPressure: number;
    pressureConsistency: number;
  };
  fatigueCurve: {
    timePoints: number[];
    wpmPoints: number[];
    accuracyPoints: number[];
    fatigueScore: number;
  };
}

export interface PredictiveInsights {
  projectedImprovement: {
    timeframe: '1week' | '1month' | '3months';
    expectedWpm: number;
    expectedAccuracy: number;
    confidenceLevel: number;
  }[];
  skillCeiling: {
    maxWpm: number;
    timeToReach: number;
    keyLimitingFactors: string[];
  };
  personalizedGoals: {
    shortTerm: { metric: string; target: number; timeframe: string }[];
    mediumTerm: { metric: string; target: number; timeframe: string }[];
    longTerm: { metric: string; target: number; timeframe: string }[];
  };
  practiceRecommendations: {
    focus: string;
    duration: number;
    frequency: string;
    exercises: string[];
    priority: number;
  }[];
}

export interface ComparativeAnalysis {
  userPercentile: {
    wpm: number;
    accuracy: number;
    overall: number;
  };
  peerComparison: {
    similarUsers: {
      avgWpm: number;
      avgAccuracy: number;
      commonStrengths: string[];
      commonWeaknesses: string[];
    };
    topPerformers: {
      avgWpm: number;
      avgAccuracy: number;
      keyDifferences: string[];
      improvementAreas: string[];
    };
  };
  competitiveInsights: {
    rank: number;
    totalUsers: number;
    rankingTrend: 'rising' | 'stable' | 'declining';
    nextRankTarget: {
      wpmGap: number;
      accuracyGap: number;
      estimatedTime: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdvancedAnalyticsService {
  private readonly ANALYTICS_KEY = 'typingGame_advancedAnalytics';
  
  // Cached analytics data
  private analyticsCache = signal<{
    lastUpdated: number;
    performanceTrends: PerformanceTrend[];
    errorAnalysis: DetailedErrorAnalysis | null;
    biometricAnalysis: BiometricAnalysis | null;
    predictiveInsights: PredictiveInsights | null;
    comparativeAnalysis: ComparativeAnalysis | null;
  }>({
    lastUpdated: 0,
    performanceTrends: [],
    errorAnalysis: null,
    biometricAnalysis: null,
    predictiveInsights: null,
    comparativeAnalysis: null
  });

  // Update flags
  private needsUpdate = signal<boolean>(true);
  
  constructor(
    private storageService: StorageService,
    private errorFeedbackService: ErrorFeedbackService,
    private heatMapService: HeatMapService
  ) {
    this.loadCachedAnalytics();
  }

  // Main analysis methods
  generatePerformanceTrends(period: 'daily' | 'weekly' | 'monthly' = 'daily'): PerformanceTrend {
    const gameResults = this.storageService.getGameResults();
    const now = new Date();
    const data: PerformanceTrend['data'] = [];
    
    // Determine date range and grouping
    const days = period === 'daily' ? 30 : period === 'weekly' ? 84 : 365;
    const groupSize = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    
    for (let i = days; i >= 0; i -= groupSize) {
      const endDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startDate = new Date(endDate.getTime() - (groupSize - 1) * 24 * 60 * 60 * 1000);
      
      const periodResults = gameResults.filter(result => {
        const resultDate = new Date(result.timestamp);
        return resultDate >= startDate && resultDate <= endDate;
      });
      
      if (periodResults.length > 0) {
        const avgWpm = periodResults.reduce((sum, r) => sum + r.wpm, 0) / periodResults.length;
        const avgAccuracy = periodResults.reduce((sum, r) => sum + r.accuracy, 0) / periodResults.length;
        const avgScore = periodResults.reduce((sum, r) => sum + r.score, 0) / periodResults.length;
        const avgSessionTime = periodResults.reduce((sum, r) => sum + r.duration, 0) / periodResults.length;
        
        data.push({
          date: endDate.toISOString().split('T')[0],
          wpm: Math.round(avgWpm * 10) / 10,
          accuracy: Math.round(avgAccuracy * 10) / 10,
          score: Math.round(avgScore),
          gamesPlayed: periodResults.length,
          avgSessionTime: Math.round(avgSessionTime)
        });
      }
    }
    
    return { period, data };
  }

  generateDetailedErrorAnalysis(): DetailedErrorAnalysis {
    const errors = this.errorFeedbackService.allErrors();
    const heatMapData = this.heatMapService.getHeatMapData();
    
    // Error type analysis
    const errorTypeMap = new Map<string, TypingError[]>();
    errors.forEach(error => {
      const type = error.pattern?.type || 'unknown';
      if (!errorTypeMap.has(type)) {
        errorTypeMap.set(type, []);
      }
      errorTypeMap.get(type)!.push(error);
    });

    const errorsByType = Array.from(errorTypeMap.entries()).map(([type, typeErrors]) => ({
      type,
      count: typeErrors.length,
      percentage: Math.round((typeErrors.length / errors.length) * 100),
      avgTimePenalty: typeErrors.reduce((sum, e) => sum + e.timeTaken, 0) / typeErrors.length,
      commonKeys: this.getTopKeys(typeErrors.map(e => e.expectedChar), 5)
    }));

    // Error timing analysis
    const errorsByTime = Array.from({ length: 24 }, (_, hour) => {
      const hourErrors = errors.filter(e => new Date(e.timestamp).getHours() === hour);
      return {
        hour,
        count: hourErrors.length,
        accuracy: hourErrors.length > 0 ? 100 - (hourErrors.length / (hourErrors.length + 10)) * 100 : 100
      };
    });

    // Finger analysis
    const fingerMap = new Map<string, TypingError[]>();
    errors.forEach(error => {
      const finger = error.fingerUsed || 'unknown';
      if (!fingerMap.has(finger)) {
        fingerMap.set(finger, []);
      }
      fingerMap.get(finger)!.push(error);
    });

    const errorsByFinger = Array.from(fingerMap.entries()).map(([finger, fingerErrors]) => {
      const allKeysForFinger = heatMapData().keystroke.filter(k => k.finger === finger);
      const accuracy = allKeysForFinger.length > 0 
        ? Math.round((allKeysForFinger.reduce((sum, k) => sum + ((k.attempts - k.errors) / k.attempts), 0) / allKeysForFinger.length) * 100)
        : 100;
      
      return {
        finger,
        count: fingerErrors.length,
        accuracy,
        strongKeys: allKeysForFinger
          .filter(k => ((k.attempts - k.errors) / k.attempts) > 0.95)
          .map(k => k.key)
          .slice(0, 3),
        weakKeys: allKeysForFinger
          .filter(k => ((k.attempts - k.errors) / k.attempts) < 0.85)
          .map(k => k.key)
          .slice(0, 3)
      };
    });

    // Generate improvement recommendations
    const improvements = this.generateImprovementRecommendations(errorsByType, errorsByFinger);

    return {
      totalErrors: errors.length,
      errorsByType: errorsByType.sort((a, b) => b.count - a.count),
      errorsByTime,
      errorsByFinger: errorsByFinger.sort((a, b) => b.count - a.count),
      improvements
    };
  }

  generateBiometricAnalysis(): BiometricAnalysis {
    const gameResults = this.storageService.getGameResults().slice(-20); // Last 20 games
    const heatMapData = this.heatMapService.getHeatMapData();
    
    // Typing rhythm analysis
    const keystrokeTimes = heatMapData().keystroke.map(k => k.averageTime);
    const avgInterval = keystrokeTimes.reduce((sum, time) => sum + time, 0) / keystrokeTimes.length;
    const rhythmVariance = keystrokeTimes.reduce((sum, time) => sum + Math.pow(time - avgInterval, 2), 0) / keystrokeTimes.length;
    const rhythmConsistency = Math.max(0, 100 - Math.sqrt(rhythmVariance) * 100);

    // Hand coordination
    const leftHandKeys = heatMapData().keystroke.filter(k => k.finger.includes('left'));
    const rightHandKeys = heatMapData().keystroke.filter(k => k.finger.includes('right'));
    const leftHandUsage = leftHandKeys.reduce((sum, k) => sum + k.attempts, 0);
    const rightHandUsage = rightHandKeys.reduce((sum, k) => sum + k.attempts, 0);
    const totalUsage = leftHandUsage + rightHandUsage;

    // Fatigue curve from recent games
    const fatigueData = gameResults.map((result, index) => ({
      timePoint: index * 5, // Every 5 minutes of play
      wpm: result.wpm,
      accuracy: result.accuracy
    }));

    return {
      typingRhythm: {
        avgKeystrokeInterval: Math.round(avgInterval * 1000), // Convert to ms
        rhythmConsistency: Math.round(rhythmConsistency),
        optimalSpeed: Math.round(avgInterval * 0.8 * 1000), // 20% faster than current
        fatigueIndicators: fatigueData.map(d => d.wpm)
      },
      handCoordination: {
        leftHandDominance: Math.round((leftHandUsage / totalUsage) * 100),
        rightHandDominance: Math.round((rightHandUsage / totalUsage) * 100),
        handSyncScore: Math.round(100 - Math.abs(50 - (leftHandUsage / totalUsage) * 100)),
        alternatingScore: this.calculateAlternatingScore(heatMapData().keystroke)
      },
      pressurePatterns: {
        lightTouches: 65, // Mock data - would come from pressure-sensitive keyboards
        heavyTouches: 35,
        avgPressure: 2.3,
        pressureConsistency: 78
      },
      fatigueCurve: {
        timePoints: fatigueData.map(d => d.timePoint),
        wpmPoints: fatigueData.map(d => d.wpm),
        accuracyPoints: fatigueData.map(d => d.accuracy),
        fatigueScore: this.calculateFatigueScore(fatigueData)
      }
    };
  }

  generatePredictiveInsights(): PredictiveInsights {
    const gameResults = this.storageService.getGameResults();
    const recentResults = gameResults.slice(-10);
    const currentAvgWpm = recentResults.reduce((sum, r) => sum + r.wpm, 0) / recentResults.length;
    const currentAvgAccuracy = recentResults.reduce((sum, r) => sum + r.accuracy, 0) / recentResults.length;

    // Calculate improvement rate
    const improvementRate = this.calculateImprovementRate(gameResults);
    
    const projectedImprovement = [
      {
        timeframe: '1week' as const,
        expectedWpm: Math.round(currentAvgWpm + improvementRate.wpm * 7),
        expectedAccuracy: Math.min(100, Math.round(currentAvgAccuracy + improvementRate.accuracy * 7)),
        confidenceLevel: 85
      },
      {
        timeframe: '1month' as const,
        expectedWpm: Math.round(currentAvgWpm + improvementRate.wpm * 30),
        expectedAccuracy: Math.min(100, Math.round(currentAvgAccuracy + improvementRate.accuracy * 30)),
        confidenceLevel: 70
      },
      {
        timeframe: '3months' as const,
        expectedWpm: Math.round(currentAvgWpm + improvementRate.wpm * 90),
        expectedAccuracy: Math.min(100, Math.round(currentAvgAccuracy + improvementRate.accuracy * 90)),
        confidenceLevel: 50
      }
    ];

    // Calculate skill ceiling based on current performance and error patterns
    const errorAnalysis = this.generateDetailedErrorAnalysis();
    const maxPotentialWpm = Math.round(currentAvgWpm * (1 + (100 - currentAvgAccuracy) / 100) * 1.5);

    return {
      projectedImprovement,
      skillCeiling: {
        maxWpm: maxPotentialWpm,
        timeToReach: Math.round((maxPotentialWpm - currentAvgWpm) / (improvementRate.wpm || 0.1)),
        keyLimitingFactors: errorAnalysis.improvements
          .filter(i => i.priority === 'high')
          .map(i => i.area)
          .slice(0, 3)
      },
      personalizedGoals: this.generatePersonalizedGoals(currentAvgWpm, currentAvgAccuracy),
      practiceRecommendations: this.generatePracticeRecommendations(errorAnalysis)
    };
  }

  generateComparativeAnalysis(): ComparativeAnalysis {
    const gameResults = this.storageService.getGameResults();
    const recentResults = gameResults.slice(-10);
    const userAvgWpm = recentResults.reduce((sum, r) => sum + r.wpm, 0) / recentResults.length;
    const userAvgAccuracy = recentResults.reduce((sum, r) => sum + r.accuracy, 0) / recentResults.length;

    // Mock comparative data (in real app, this would come from server)
    const mockUserData = this.generateMockComparativeData();

    return {
      userPercentile: {
        wpm: this.calculatePercentile(userAvgWpm, mockUserData.wpmDistribution),
        accuracy: this.calculatePercentile(userAvgAccuracy, mockUserData.accuracyDistribution),
        overall: this.calculatePercentile((userAvgWpm * userAvgAccuracy) / 100, mockUserData.overallDistribution)
      },
      peerComparison: {
        similarUsers: {
          avgWpm: Math.round(userAvgWpm * (0.9 + Math.random() * 0.2)),
          avgAccuracy: Math.round(userAvgAccuracy * (0.95 + Math.random() * 0.1)),
          commonStrengths: ['Consistent typing rhythm', 'Good accuracy'],
          commonWeaknesses: ['Number row', 'Special characters']
        },
        topPerformers: {
          avgWpm: Math.round(userAvgWpm * 1.8),
          avgAccuracy: Math.min(100, Math.round(userAvgAccuracy * 1.1)),
          keyDifferences: ['Better finger independence', 'Faster error recovery', 'Optimal posture'],
          improvementAreas: ['Increase daily practice', 'Focus on weak fingers', 'Reduce hesitation']
        }
      },
      competitiveInsights: {
        rank: Math.floor(Math.random() * 1000) + 1,
        totalUsers: 10000,
        rankingTrend: Math.random() > 0.5 ? 'rising' : 'stable',
        nextRankTarget: {
          wpmGap: Math.round(Math.random() * 10 + 2),
          accuracyGap: Math.round(Math.random() * 5 + 1),
          estimatedTime: '2-3 weeks with focused practice'
        }
      }
    };
  }

  // Utility methods
  private getTopKeys(keys: string[], limit: number): string[] {
    const keyCount = new Map<string, number>();
    keys.forEach(key => {
      keyCount.set(key, (keyCount.get(key) || 0) + 1);
    });
    
    return Array.from(keyCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key]) => key);
  }

  private generateImprovementRecommendations(errorsByType: any[], errorsByFinger: any[]): any[] {
    const recommendations = [];

    // High-frequency error type recommendations
    if (errorsByType.length > 0) {
      const topErrorType = errorsByType[0];
      if (topErrorType.percentage > 30) {
        recommendations.push({
          area: `${topErrorType.type} errors`,
          priority: 'high',
          recommendation: this.getRecommendationForErrorType(topErrorType.type),
          expectedGain: '15-25% error reduction'
        });
      }
    }

    // Finger-specific recommendations
    const weakestFinger = errorsByFinger.find(f => f.accuracy < 85);
    if (weakestFinger) {
      recommendations.push({
        area: `${weakestFinger.finger} finger accuracy`,
        priority: 'medium',
        recommendation: `Focus on strengthening ${weakestFinger.finger} finger with targeted exercises`,
        expectedGain: '10-15% accuracy improvement'
      });
    }

    return recommendations;
  }

  private getRecommendationForErrorType(errorType: string): string {
    const recommendations: { [key: string]: string } = {
      'finger_slip': 'Slow down and focus on precise finger placement. Practice scales and finger exercises.',
      'timing': 'Work on maintaining consistent rhythm. Use a metronome during practice.',
      'visual': 'Improve text scanning and preview reading. Practice reading ahead while typing.',
      'muscle_memory': 'Dedicated practice of problem key combinations and common word patterns.',
      'finger_confusion': 'Review proper finger assignments and practice home row positioning.'
    };
    
    return recommendations[errorType] || 'Focus on accuracy over speed until patterns improve.';
  }

  private calculateAlternatingScore(keystrokes: any[]): number {
    // Mock calculation for hand alternation efficiency
    return Math.round(70 + Math.random() * 20);
  }

  private calculateFatigueScore(fatigueData: any[]): number {
    if (fatigueData.length < 2) return 100;
    
    const wpmTrend = fatigueData[fatigueData.length - 1].wpm - fatigueData[0].wpm;
    const accuracyTrend = fatigueData[fatigueData.length - 1].accuracy - fatigueData[0].accuracy;
    
    return Math.max(0, 100 - Math.abs(wpmTrend) - Math.abs(accuracyTrend));
  }

  private calculateImprovementRate(gameResults: GameResult[]): { wpm: number; accuracy: number } {
    if (gameResults.length < 5) return { wpm: 0.1, accuracy: 0.05 };
    
    const recentGames = gameResults.slice(-10);
    const oldGames = gameResults.slice(-20, -10);
    
    const recentAvgWpm = recentGames.reduce((sum, r) => sum + r.wpm, 0) / recentGames.length;
    const oldAvgWpm = oldGames.reduce((sum, r) => sum + r.wpm, 0) / oldGames.length;
    const recentAvgAccuracy = recentGames.reduce((sum, r) => sum + r.accuracy, 0) / recentGames.length;
    const oldAvgAccuracy = oldGames.reduce((sum, r) => sum + r.accuracy, 0) / oldGames.length;
    
    return {
      wpm: (recentAvgWpm - oldAvgWpm) / 10, // Per day
      accuracy: (recentAvgAccuracy - oldAvgAccuracy) / 10
    };
  }

  private generatePersonalizedGoals(currentWpm: number, currentAccuracy: number): any {
    return {
      shortTerm: [
        { metric: 'WPM', target: Math.round(currentWpm * 1.1), timeframe: '1 week' },
        { metric: 'Accuracy', target: Math.min(100, Math.round(currentAccuracy + 2)), timeframe: '1 week' }
      ],
      mediumTerm: [
        { metric: 'WPM', target: Math.round(currentWpm * 1.25), timeframe: '1 month' },
        { metric: 'Consistency', target: 90, timeframe: '1 month' }
      ],
      longTerm: [
        { metric: 'WPM', target: Math.round(currentWpm * 1.5), timeframe: '3 months' },
        { metric: 'Error Rate', target: 2, timeframe: '3 months' }
      ]
    };
  }

  private generatePracticeRecommendations(errorAnalysis: DetailedErrorAnalysis): any[] {
    const recommendations = [];
    
    if (errorAnalysis.improvements.length > 0) {
      const topImprovement = errorAnalysis.improvements[0];
      recommendations.push({
        focus: topImprovement.area,
        duration: 15,
        frequency: 'daily',
        exercises: [
          'Targeted key drills',
          'Pattern practice',
          'Speed building exercises'
        ],
        priority: 1
      });
    }
    
    return recommendations;
  }

  private generateMockComparativeData(): any {
    return {
      wpmDistribution: Array.from({ length: 100 }, (_, i) => 20 + i * 0.8),
      accuracyDistribution: Array.from({ length: 100 }, (_, i) => 70 + i * 0.3),
      overallDistribution: Array.from({ length: 100 }, (_, i) => 1400 + i * 40)
    };
  }

  private calculatePercentile(value: number, distribution: number[]): number {
    const sortedDistribution = distribution.sort((a, b) => a - b);
    const index = sortedDistribution.findIndex(v => v >= value);
    return index === -1 ? 100 : Math.round((index / sortedDistribution.length) * 100);
  }

  // Caching methods
  private loadCachedAnalytics(): void {
    const cached = localStorage.getItem(this.ANALYTICS_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        this.analyticsCache.set(data);
        
        // Check if cache is still valid (24 hours)
        const cacheAge = Date.now() - data.lastUpdated;
        this.needsUpdate.set(cacheAge > 24 * 60 * 60 * 1000);
      } catch (error) {
        console.warn('Failed to load cached analytics:', error);
      }
    }
  }

  private saveCachedAnalytics(): void {
    localStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(this.analyticsCache()));
  }

  // Public API for getting cached or fresh analytics
  getPerformanceTrends(period: 'daily' | 'weekly' | 'monthly' = 'daily', forceRefresh = false): PerformanceTrend {
    if (forceRefresh || this.needsUpdate()) {
      const trends = this.generatePerformanceTrends(period);
      this.updateCache('performanceTrends', trends);
      return trends;
    }
    
    const cached = this.analyticsCache().performanceTrends.find(t => t.period === period);
    return cached || this.generatePerformanceTrends(period);
  }

  getDetailedErrorAnalysis(forceRefresh = false): DetailedErrorAnalysis {
    if (forceRefresh || this.needsUpdate() || !this.analyticsCache().errorAnalysis) {
      const analysis = this.generateDetailedErrorAnalysis();
      this.updateCache('errorAnalysis', analysis);
      return analysis;
    }
    
    return this.analyticsCache().errorAnalysis!;
  }

  private updateCache(key: string, data: any): void {
    const cache = this.analyticsCache();
    cache[key as keyof typeof cache] = data;
    cache.lastUpdated = Date.now();
    this.analyticsCache.set({ ...cache });
    this.needsUpdate.set(false);
    this.saveCachedAnalytics();
  }
}