import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ErrorFeedbackService, ErrorPattern, TypingError } from '../../services/error-feedback';

@Component({
  selector: 'app-error-feedback',
  imports: [CommonModule],
  template: `
    <div class="error-feedback-container" *ngIf="showFeedback">
      
      <!-- Real-time Error Indicator -->
      <div class="real-time-errors" *ngIf="showRealTime && recentError" @slideIn>
        <div class="error-popup" [style.background-color]="recentError.pattern?.color">
          <span class="error-icon">{{ recentError.pattern?.icon }}</span>
          <div class="error-details">
            <div class="error-chars">
              <span class="expected">{{ recentError.expectedChar }}</span>
              <span class="arrow">→</span>
              <span class="actual">{{ recentError.actualChar }}</span>
            </div>
            <div class="error-message">{{ recentError.pattern?.description }}</div>
          </div>
        </div>
      </div>

      <!-- Session Error Summary -->
      <div class="error-summary" *ngIf="showSummary && errorAnalysis">
        <h3>
          <span class="summary-icon">📊</span>
          Error Analysis
        </h3>
        
        <div class="error-stats">
          <div class="stat-item">
            <span class="stat-value">{{ errorAnalysis.totalErrors }}</span>
            <span class="stat-label">Total Errors</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ errorAnalysis.errorRate | number:'1.1-1' }}%</span>
            <span class="stat-label">Error Rate</span>
          </div>
        </div>

        <!-- Common Error Patterns -->
        <div class="error-patterns" *ngIf="errorAnalysis.commonPatterns.length > 0">
          <h4>Common Mistake Patterns</h4>
          <div class="pattern-list">
            <div *ngFor="let patternData of errorAnalysis.commonPatterns.slice(0, 3)" 
                 class="pattern-item"
                 [style.border-left-color]="patternData.pattern.color">
              <div class="pattern-header">
                <span class="pattern-icon">{{ patternData.pattern.icon }}</span>
                <span class="pattern-name">{{ patternData.pattern.description }}</span>
                <span class="pattern-count">{{ patternData.count }}x</span>
              </div>
              <div class="pattern-suggestion">{{ patternData.pattern.suggestion }}</div>
            </div>
          </div>
        </div>

        <!-- Problematic Keys -->
        <div class="problematic-keys" *ngIf="errorAnalysis.problematicKeys.length > 0">
          <h4>Keys Needing Practice</h4>
          <div class="key-list">
            <div *ngFor="let keyData of errorAnalysis.problematicKeys.slice(0, 5)" 
                 class="key-item"
                 [class.high-priority]="keyData.errorCount > 10">
              <span class="key-char">{{ keyData.key }}</span>
              <div class="key-stats">
                <span class="error-count">{{ keyData.errorCount }} errors</span>
                <div class="accuracy-bar">
                  <div class="accuracy-fill" 
                       [style.width.%]="keyData.accuracy"
                       [class.low-accuracy]="keyData.accuracy < 80">
                  </div>
                </div>
                <span class="accuracy-text">{{ keyData.accuracy | number:'1.0-0' }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="recommendations" *ngIf="errorAnalysis.recommendations.length > 0">
          <h4>
            <span class="rec-icon">💡</span>
            Recommendations
          </h4>
          <ul class="recommendation-list">
            <li *ngFor="let recommendation of errorAnalysis.recommendations">
              {{ recommendation }}
            </li>
          </ul>
        </div>

        <!-- Improvement Focus -->
        <div class="improvement-focus" *ngIf="errorAnalysis.improvementFocus.length > 0">
          <h4>
            <span class="focus-icon">🎯</span>
            Focus Areas
          </h4>
          <div class="focus-tags">
            <span *ngFor="let focus of errorAnalysis.improvementFocus" 
                  class="focus-tag">
              {{ focus }}
            </span>
          </div>
        </div>
      </div>

      <!-- Detailed Error History -->
      <div class="error-history" *ngIf="showHistory && sessionErrors.length > 0">
        <h4>Recent Errors</h4>
        <div class="error-timeline">
          <div *ngFor="let error of sessionErrors.slice(-10).reverse(); trackBy: trackByErrorId" 
               class="error-entry"
               [style.border-left-color]="error.pattern?.color">
            <div class="error-time">{{ getRelativeTime(error.timestamp) }}</div>
            <div class="error-content">
              <div class="error-chars-small">
                <span class="expected-small">{{ error.expectedChar }}</span>
                <span class="arrow-small">→</span>
                <span class="actual-small">{{ error.actualChar }}</span>
              </div>
              <div class="error-context">in "{{ error.word }}"</div>
            </div>
            <span class="error-pattern-icon">{{ error.pattern?.icon }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './error-feedback.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ErrorFeedbackComponent implements OnInit {
  @Input() showRealTime = true;
  @Input() showSummary = true;
  @Input() showHistory = false;
  @Input() showFeedback = true;

  recentError: TypingError | null = null;
  errorAnalysis: any = null;
  sessionErrors: TypingError[] = [];
  
  private errorDisplayTimeout?: number;

  constructor(private errorFeedbackService: ErrorFeedbackService) {}

  ngOnInit(): void {
    // Subscribe to error analysis
    this.errorAnalysis = this.errorFeedbackService.errorAnalysis();
    this.sessionErrors = this.errorFeedbackService.currentSessionErrors();
    
    // Listen for new errors to show real-time feedback
    this.setupErrorListener();
  }

  private setupErrorListener(): void {
    // This would be called when a new error occurs
    // For now, we'll check periodically for new errors
    setInterval(() => {
      const currentErrors = this.errorFeedbackService.currentSessionErrors();
      if (currentErrors.length > this.sessionErrors.length) {
        const newError = currentErrors[currentErrors.length - 1];
        this.showRecentError(newError);
        this.sessionErrors = currentErrors;
        this.errorAnalysis = this.errorFeedbackService.errorAnalysis();
      }
    }, 100);
  }

  private showRecentError(error: TypingError): void {
    this.recentError = error;
    
    // Clear previous timeout
    if (this.errorDisplayTimeout) {
      clearTimeout(this.errorDisplayTimeout);
    }
    
    // Hide the error after 3 seconds
    this.errorDisplayTimeout = window.setTimeout(() => {
      this.recentError = null;
    }, 3000);
  }

  trackByErrorId(index: number, error: TypingError): string {
    return error.id;
  }

  getRelativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return `${seconds}s ago`;
    }
  }
}