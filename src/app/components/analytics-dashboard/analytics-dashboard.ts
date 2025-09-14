import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AdvancedAnalyticsService, PerformanceTrend, DetailedErrorAnalysis, BiometricAnalysis, PredictiveInsights, ComparativeAnalysis } from '../../services/advanced-analytics';

@Component({
  selector: 'app-analytics-dashboard',
  imports: [CommonModule],
  template: `
    <div class="analytics-dashboard">
      <div class="dashboard-header">
        <h1>📊 Advanced Analytics Dashboard</h1>
        <div class="refresh-controls">
          <button class="refresh-btn" (click)="refreshAllData()" [disabled]="isLoading">
            <span class="refresh-icon" [class.spinning]="isLoading">🔄</span>
            Refresh Data
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-overlay" *ngIf="isLoading" @fadeIn>
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p>Analyzing your typing patterns...</p>
        </div>
      </div>

      <!-- Analytics Sections -->
      <div class="analytics-sections" *ngIf="!isLoading">
        
        <!-- Performance Trends -->
        <section class="analytics-section" @slideIn>
          <div class="section-header">
            <h2>📈 Performance Trends</h2>
            <div class="period-selector">
              <button *ngFor="let period of periods" 
                      class="period-btn"
                      [class.active]="selectedPeriod === period"
                      (click)="changePeriod(period)">
                {{ period | titlecase }}
              </button>
            </div>
          </div>
          
          <div class="trend-charts" *ngIf="performanceTrends">
            <div class="chart-container">
              <h3>Words Per Minute</h3>
              <div class="chart wpm-chart">
                <div class="chart-bars">
                  <div *ngFor="let data of performanceTrends.data; let i = index" 
                       class="chart-bar"
                       [style.height.%]="(data.wpm / getMaxValue('wpm')) * 100"
                       [title]="data.date + ': ' + data.wpm + ' WPM'">
                  </div>
                </div>
                <div class="chart-labels">
                  <span *ngFor="let data of performanceTrends.data" class="chart-label">
                    {{ formatDate(data.date) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="chart-container">
              <h3>Accuracy %</h3>
              <div class="chart accuracy-chart">
                <div class="chart-bars">
                  <div *ngFor="let data of performanceTrends.data" 
                       class="chart-bar accuracy-bar"
                       [style.height.%]="data.accuracy"
                       [title]="data.date + ': ' + data.accuracy + '%'">
                  </div>
                </div>
                <div class="chart-labels">
                  <span *ngFor="let data of performanceTrends.data" class="chart-label">
                    {{ formatDate(data.date) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Error Analysis -->
        <section class="analytics-section" @slideIn>
          <div class="section-header">
            <h2>🎯 Detailed Error Analysis</h2>
          </div>
          
          <div class="error-analysis-grid" *ngIf="errorAnalysis">
            <!-- Error Types -->
            <div class="analysis-card">
              <h3>Error Types</h3>
              <div class="error-types">
                <div *ngFor="let errorType of errorAnalysis.errorsByType" 
                     class="error-type-item"
                     [style.border-left-color]="getErrorTypeColor(errorType.type)">
                  <div class="error-type-header">
                    <span class="error-type-name">{{ errorType.type | titlecase }}</span>
                    <span class="error-type-percentage">{{ errorType.percentage }}%</span>
                  </div>
                  <div class="error-type-details">
                    <span class="error-count">{{ errorType.count }} errors</span>
                    <span class="avg-penalty">{{ errorType.avgTimePenalty | number:'1.1-1' }}s avg</span>
                  </div>
                  <div class="common-keys">
                    Keys: {{ errorType.commonKeys.join(', ') }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Finger Analysis -->
            <div class="analysis-card">
              <h3>Finger Performance</h3>
              <div class="finger-analysis">
                <div *ngFor="let finger of errorAnalysis.errorsByFinger" 
                     class="finger-item">
                  <div class="finger-header">
                    <span class="finger-name">{{ getFingerDisplayName(finger.finger) }}</span>
                    <span class="finger-accuracy" 
                          [class]="getAccuracyClass(finger.accuracy)">
                      {{ finger.accuracy }}%
                    </span>
                  </div>
                  <div class="finger-keys">
                    <div class="strong-keys" *ngIf="finger.strongKeys.length > 0">
                      <strong>Strong:</strong> {{ finger.strongKeys.join(', ') }}
                    </div>
                    <div class="weak-keys" *ngIf="finger.weakKeys.length > 0">
                      <strong>Weak:</strong> {{ finger.weakKeys.join(', ') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Improvement Recommendations -->
            <div class="analysis-card full-width">
              <h3>💡 Improvement Recommendations</h3>
              <div class="recommendations">
                <div *ngFor="let improvement of errorAnalysis.improvements" 
                     class="recommendation-item"
                     [class]="'priority-' + improvement.priority">
                  <div class="recommendation-header">
                    <span class="recommendation-area">{{ improvement.area }}</span>
                    <span class="priority-badge" [class]="'priority-' + improvement.priority">
                      {{ improvement.priority | uppercase }}
                    </span>
                  </div>
                  <div class="recommendation-text">{{ improvement.recommendation }}</div>
                  <div class="expected-gain">Expected gain: {{ improvement.expectedGain }}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Biometric Analysis -->
        <section class="analytics-section" @slideIn>
          <div class="section-header">
            <h2>🫀 Biometric Analysis</h2>
          </div>
          
          <div class="biometric-grid" *ngIf="biometricAnalysis">
            <!-- Typing Rhythm -->
            <div class="biometric-card">
              <h3>Typing Rhythm</h3>
              <div class="rhythm-metrics">
                <div class="metric">
                  <span class="metric-label">Avg Interval</span>
                  <span class="metric-value">{{ biometricAnalysis.typingRhythm.avgKeystrokeInterval }}ms</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Consistency</span>
                  <span class="metric-value">{{ biometricAnalysis.typingRhythm.rhythmConsistency }}%</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Optimal Speed</span>
                  <span class="metric-value">{{ biometricAnalysis.typingRhythm.optimalSpeed }}ms</span>
                </div>
              </div>
            </div>

            <!-- Hand Coordination -->
            <div class="biometric-card">
              <h3>Hand Coordination</h3>
              <div class="hand-coordination">
                <div class="hand-usage">
                  <div class="hand-bar left-hand">
                    <div class="hand-fill" 
                         [style.width.%]="biometricAnalysis.handCoordination.leftHandDominance">
                    </div>
                    <span class="hand-label">Left: {{ biometricAnalysis.handCoordination.leftHandDominance }}%</span>
                  </div>
                  <div class="hand-bar right-hand">
                    <div class="hand-fill" 
                         [style.width.%]="biometricAnalysis.handCoordination.rightHandDominance">
                    </div>
                    <span class="hand-label">Right: {{ biometricAnalysis.handCoordination.rightHandDominance }}%</span>
                  </div>
                </div>
                <div class="coordination-scores">
                  <div class="score-item">
                    <span>Sync Score:</span>
                    <span>{{ biometricAnalysis.handCoordination.handSyncScore }}%</span>
                  </div>
                  <div class="score-item">
                    <span>Alternating:</span>
                    <span>{{ biometricAnalysis.handCoordination.alternatingScore }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fatigue Analysis -->
            <div class="biometric-card full-width">
              <h3>Fatigue Curve</h3>
              <div class="fatigue-analysis">
                <div class="fatigue-chart">
                  <div class="fatigue-line wpm-line">
                    <div *ngFor="let point of biometricAnalysis.fatigueCurve.wpmPoints; let i = index"
                         class="fatigue-point"
                         [style.left.%]="(i / (biometricAnalysis.fatigueCurve.wpmPoints.length - 1)) * 100"
                         [style.bottom.%]="(point / getMaxFatigueValue('wpm')) * 100">
                    </div>
                  </div>
                </div>
                <div class="fatigue-score">
                  <span class="fatigue-label">Fatigue Resistance:</span>
                  <span class="fatigue-value" 
                        [class]="getFatigueClass(biometricAnalysis.fatigueCurve.fatigueScore)">
                    {{ biometricAnalysis.fatigueCurve.fatigueScore }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Predictive Insights -->
        <section class="analytics-section" @slideIn>
          <div class="section-header">
            <h2>🔮 Predictive Insights</h2>
          </div>
          
          <div class="predictive-grid" *ngIf="predictiveInsights">
            <!-- Improvement Projections -->
            <div class="prediction-card">
              <h3>Projected Improvement</h3>
              <div class="projections">
                <div *ngFor="let projection of predictiveInsights.projectedImprovement" 
                     class="projection-item">
                  <div class="projection-timeframe">{{ projection.timeframe }}</div>
                  <div class="projection-metrics">
                    <span class="projection-wpm">{{ projection.expectedWpm }} WPM</span>
                    <span class="projection-accuracy">{{ projection.expectedAccuracy }}% Acc</span>
                  </div>
                  <div class="confidence-bar">
                    <div class="confidence-fill" 
                         [style.width.%]="projection.confidenceLevel">
                    </div>
                    <span class="confidence-text">{{ projection.confidenceLevel }}% confidence</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Skill Ceiling -->
            <div class="prediction-card">
              <h3>Skill Ceiling Analysis</h3>
              <div class="skill-ceiling">
                <div class="ceiling-metric">
                  <span class="ceiling-label">Potential Max WPM:</span>
                  <span class="ceiling-value">{{ predictiveInsights.skillCeiling.maxWpm }}</span>
                </div>
                <div class="ceiling-metric">
                  <span class="ceiling-label">Time to Reach:</span>
                  <span class="ceiling-value">{{ predictiveInsights.skillCeiling.timeToReach }} days</span>
                </div>
                <div class="limiting-factors">
                  <h4>Limiting Factors:</h4>
                  <ul>
                    <li *ngFor="let factor of predictiveInsights.skillCeiling.keyLimitingFactors">
                      {{ factor }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Personalized Goals -->
            <div class="prediction-card full-width">
              <h3>Personalized Goals</h3>
              <div class="goals-timeline">
                <div class="goal-category">
                  <h4>Short Term (1 week)</h4>
                  <div class="goals">
                    <div *ngFor="let goal of predictiveInsights.personalizedGoals.shortTerm" 
                         class="goal-item short-term">
                      <span class="goal-metric">{{ goal.metric }}:</span>
                      <span class="goal-target">{{ goal.target }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="goal-category">
                  <h4>Medium Term (1 month)</h4>
                  <div class="goals">
                    <div *ngFor="let goal of predictiveInsights.personalizedGoals.mediumTerm" 
                         class="goal-item medium-term">
                      <span class="goal-metric">{{ goal.metric }}:</span>
                      <span class="goal-target">{{ goal.target }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="goal-category">
                  <h4>Long Term (3 months)</h4>
                  <div class="goals">
                    <div *ngFor="let goal of predictiveInsights.personalizedGoals.longTerm" 
                         class="goal-item long-term">
                      <span class="goal-metric">{{ goal.metric }}:</span>
                      <span class="goal-target">{{ goal.target }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Comparative Analysis -->
        <section class="analytics-section" @slideIn>
          <div class="section-header">
            <h2>🏆 Competitive Analysis</h2>
          </div>
          
          <div class="comparative-grid" *ngIf="comparativeAnalysis">
            <!-- User Percentiles -->
            <div class="comparative-card">
              <h3>Your Ranking</h3>
              <div class="percentiles">
                <div class="percentile-item">
                  <span class="percentile-label">WPM Percentile</span>
                  <div class="percentile-bar">
                    <div class="percentile-fill" 
                         [style.width.%]="comparativeAnalysis.userPercentile.wpm">
                    </div>
                    <span class="percentile-text">{{ comparativeAnalysis.userPercentile.wpm }}%</span>
                  </div>
                </div>
                
                <div class="percentile-item">
                  <span class="percentile-label">Accuracy Percentile</span>
                  <div class="percentile-bar">
                    <div class="percentile-fill accuracy" 
                         [style.width.%]="comparativeAnalysis.userPercentile.accuracy">
                    </div>
                    <span class="percentile-text">{{ comparativeAnalysis.userPercentile.accuracy }}%</span>
                  </div>
                </div>
                
                <div class="percentile-item">
                  <span class="percentile-label">Overall Percentile</span>
                  <div class="percentile-bar">
                    <div class="percentile-fill overall" 
                         [style.width.%]="comparativeAnalysis.userPercentile.overall">
                    </div>
                    <span class="percentile-text">{{ comparativeAnalysis.userPercentile.overall }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Competitive Insights -->
            <div class="comparative-card">
              <h3>Competitive Standing</h3>
              <div class="competitive-info">
                <div class="rank-info">
                  <span class="rank-label">Current Rank:</span>
                  <span class="rank-value">#{{ comparativeAnalysis.competitiveInsights.rank.toLocaleString() }}</span>
                  <span class="rank-total">of {{ comparativeAnalysis.competitiveInsights.totalUsers.toLocaleString() }}</span>
                </div>
                
                <div class="rank-trend">
                  <span class="trend-label">Trend:</span>
                  <span class="trend-value" [class]="comparativeAnalysis.competitiveInsights.rankingTrend">
                    {{ comparativeAnalysis.competitiveInsights.rankingTrend | titlecase }}
                  </span>
                </div>
                
                <div class="next-rank">
                  <h4>Next Rank Target:</h4>
                  <div class="target-gaps">
                    <span>+{{ comparativeAnalysis.competitiveInsights.nextRankTarget.wpmGap }} WPM</span>
                    <span>+{{ comparativeAnalysis.competitiveInsights.nextRankTarget.accuracyGap }}% Accuracy</span>
                  </div>
                  <div class="target-time">
                    {{ comparativeAnalysis.competitiveInsights.nextRankTarget.estimatedTime }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styleUrl: './analytics-dashboard.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(30px)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class AnalyticsDashboardComponent implements OnInit {
  selectedPeriod: 'daily' | 'weekly' | 'monthly' = 'daily';
  periods: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly'];
  isLoading = false;

  performanceTrends: PerformanceTrend | null = null;
  errorAnalysis: DetailedErrorAnalysis | null = null;
  biometricAnalysis: BiometricAnalysis | null = null;
  predictiveInsights: PredictiveInsights | null = null;
  comparativeAnalysis: ComparativeAnalysis | null = null;

  constructor(private analyticsService: AdvancedAnalyticsService) {}

  ngOnInit(): void {
    this.loadAllAnalytics();
  }

  async loadAllAnalytics(): Promise<void> {
    this.isLoading = true;
    
    try {
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.performanceTrends = this.analyticsService.getPerformanceTrends(this.selectedPeriod);
      this.errorAnalysis = this.analyticsService.getDetailedErrorAnalysis();
      this.biometricAnalysis = this.analyticsService.generateBiometricAnalysis();
      this.predictiveInsights = this.analyticsService.generatePredictiveInsights();
      this.comparativeAnalysis = this.analyticsService.generateComparativeAnalysis();
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      this.isLoading = false;
    }
  }

  changePeriod(period: 'daily' | 'weekly' | 'monthly'): void {
    this.selectedPeriod = period;
    this.performanceTrends = this.analyticsService.getPerformanceTrends(period);
  }

  refreshAllData(): void {
    this.loadAllAnalytics();
  }

  // Utility methods for templates
  getMaxValue(metric: 'wpm' | 'accuracy' | 'score'): number {
    if (!this.performanceTrends) return 100;
    
    const values = this.performanceTrends.data.map(d => d[metric] as number);
    return Math.max(...values, 1);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getErrorTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      'finger_slip': '#ffc107',
      'timing': '#17a2b8',
      'visual': '#dc3545',
      'muscle_memory': '#6f42c1',
      'finger_confusion': '#fd7e14'
    };
    return colors[type] || '#6c757d';
  }

  getFingerDisplayName(finger: string): string {
    const names: { [key: string]: string } = {
      'left-pinky': 'L Pinky',
      'left-ring': 'L Ring',
      'left-middle': 'L Middle',
      'left-index': 'L Index',
      'right-index': 'R Index',
      'right-middle': 'R Middle',
      'right-ring': 'R Ring',
      'right-pinky': 'R Pinky',
      'thumbs': 'Thumbs'
    };
    return names[finger] || finger;
  }

  getAccuracyClass(accuracy: number): string {
    if (accuracy >= 95) return 'excellent';
    if (accuracy >= 90) return 'good';
    if (accuracy >= 80) return 'fair';
    return 'poor';
  }

  getMaxFatigueValue(metric: 'wpm' | 'accuracy'): number {
    if (!this.biometricAnalysis) return 100;
    
    const values = metric === 'wpm' 
      ? this.biometricAnalysis.fatigueCurve.wpmPoints
      : this.biometricAnalysis.fatigueCurve.accuracyPoints;
    
    return Math.max(...values, 1);
  }

  getFatigueClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }
}