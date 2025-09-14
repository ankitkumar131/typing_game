import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { OnboardingService, Tutorial, TutorialStep } from '../../services/onboarding';

@Component({
  selector: 'app-onboarding-tutorial',
  imports: [CommonModule],
  template: `
    <div class="tutorial-overlay" *ngIf="onboardingService.isRunning()" @fadeIn>
      <div class="tutorial-backdrop" (click)="skipTutorial()"></div>
      
      <div class="tutorial-container" [class.center]="currentStep?.position === 'center'" @slideIn>
        
        <!-- Tutorial Header -->
        <div class="tutorial-header">
          <div class="tutorial-title">
            <span class="tutorial-icon">🎓</span>
            <h2>{{ currentTutorial?.name }}</h2>
          </div>
          
          <div class="tutorial-progress">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="onboardingService.progress()"></div>
            </div>
            <span class="progress-text">
              Step {{ getCurrentStepNumber() }} of {{ currentTutorial?.steps?.length || 0 }}
            </span>
          </div>
          
          <button class="close-btn" (click)="skipTutorial()" title="Skip tutorial">
            ✖️
          </button>
        </div>

        <!-- Step Content -->
        <div class="step-content" *ngIf="currentStep">
          <div class="step-header">
            <h3>{{ currentStep.title }}</h3>
            <p class="step-description">{{ currentStep.description }}</p>
          </div>
          
          <div class="step-body" [innerHTML]="currentStep.content"></div>
          
          <!-- Step Tips -->
          <div class="step-tips" *ngIf="currentStep.tips && currentStep.tips.length > 0">
            <h4>💡 Pro Tips:</h4>
            <ul>
              <li *ngFor="let tip of currentStep.tips">{{ tip }}</li>
            </ul>
          </div>
          
          <!-- Media Content -->
          <div class="step-media" *ngIf="currentStep.image || currentStep.video">
            <img *ngIf="currentStep.image" [src]="currentStep.image" [alt]="currentStep.title" class="step-image">
            <video *ngIf="currentStep.video" [src]="currentStep.video" controls class="step-video"></video>
          </div>
          
          <!-- Action Requirements -->
          <div class="step-action" *ngIf="currentStep.action && currentStep.action !== 'none'">
            <div class="action-indicator">
              <span class="action-icon">
                {{ getActionIcon(currentStep.action) }}
              </span>
              <span class="action-text">
                {{ currentStep.actionText || getDefaultActionText(currentStep.action) }}
              </span>
            </div>
            
            <!-- Completion criteria display -->
            <div class="completion-criteria" *ngIf="currentStep.completionCriteria">
              <div class="criteria-text">
                {{ getCriteriaText(currentStep.completionCriteria) }}
              </div>
              <div class="criteria-progress" *ngIf="currentStep.completionCriteria.type === 'action'">
                <div class="criteria-bar">
                  <div class="criteria-fill" [style.width.%]="getCompletionProgress()"></div>
                </div>
                <span class="criteria-count">{{ completionProgress }} / {{ currentStep.completionCriteria.value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tutorial Navigation -->
        <div class="tutorial-navigation">
          <div class="nav-left">
            <button class="nav-btn secondary" 
                    (click)="previousStep()" 
                    [disabled]="getCurrentStepNumber() === 1">
              ← Previous
            </button>
          </div>
          
          <div class="nav-center">
            <button class="nav-btn tertiary" 
                    (click)="skipStep()" 
                    *ngIf="currentStep?.skippable"
                    title="Skip this step">
              Skip Step
            </button>
          </div>
          
          <div class="nav-right">
            <!-- Continue button (shown when no action required or action completed) -->
            <button class="nav-btn primary" 
                    (click)="nextStep()" 
                    *ngIf="canContinue()"
                    [disabled]="!isStepCompleted()">
              {{ isLastStep() ? 'Complete Tutorial' : 'Continue' }} →
            </button>
            
            <!-- Waiting indicator (shown when action is required) -->
            <div class="waiting-indicator" *ngIf="!canContinue() && currentStep?.action !== 'none'">
              <div class="waiting-spinner"></div>
              <span>Complete the action above to continue</span>
            </div>
          </div>
        </div>

        <!-- Tutorial Controls -->
        <div class="tutorial-controls">
          <button class="control-btn" (click)="restartTutorial()" title="Restart tutorial">
            🔄 Restart
          </button>
          
          <button class="control-btn" (click)="skipTutorial()" title="Skip entire tutorial">
            ⏭️ Skip Tutorial
          </button>
        </div>
      </div>

      <!-- Tutorial Pointer/Arrow -->
      <div class="tutorial-pointer" 
            *ngIf="currentStep?.target && currentStep?.position !== 'center'"
           [class]="'pointer-' + (currentStep?.position || 'center')"
           [style.top.px]="pointerPosition.top"
           [style.left.px]="pointerPosition.left"
           @fadeIn>
        <div class="pointer-arrow"></div>
        <div class="pointer-pulse"></div>
      </div>
    </div>
  `,
  styleUrl: './onboarding-tutorial.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-50px)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class OnboardingTutorialComponent implements OnInit {
  currentTutorial: Tutorial | null = null;
  currentStep: TutorialStep | null = null;
  pointerPosition = { top: 0, left: 0 };
  completionProgress = 0;

  constructor(public onboardingService: OnboardingService) {}

  getCurrentStepNumber(): number {
    return (this.onboardingService as any).currentStep() + 1;
  }

  ngOnInit(): void {
    // Subscribe to tutorial changes
    this.updateCurrentTutorialData();
    
    // Set up interval to check tutorial state
    setInterval(() => {
      this.updateCurrentTutorialData();
      this.updatePointerPosition();
    }, 100);
  }

  private updateCurrentTutorialData(): void {
    this.currentTutorial = this.onboardingService.activeTutorial();
    this.currentStep = this.onboardingService.activeStep();
  }

  // Navigation methods
  nextStep(): void {
    this.onboardingService.nextStep();
  }

  previousStep(): void {
    this.onboardingService.previousStep();
  }

  skipStep(): void {
    this.onboardingService.skipStep();
  }

  skipTutorial(): void {
    if (confirm('Are you sure you want to skip the tutorial? You can always restart it later.')) {
      this.onboardingService.skipTutorial();
    }
  }

  restartTutorial(): void {
    if (confirm('Restart the tutorial from the beginning?')) {
      this.onboardingService.restartTutorial();
    }
  }

  // State checking methods
  canContinue(): boolean {
    if (!this.currentStep) return false;
    return this.currentStep.action === 'none' || this.isStepCompleted();
  }

  isStepCompleted(): boolean {
    if (!this.currentStep?.completionCriteria) return true;
    
    // This would integrate with your actual completion tracking
    // For now, return true after a delay for demo purposes
    return this.completionProgress >= (this.currentStep.completionCriteria.value || 0);
  }

  isLastStep(): boolean {
    if (!this.currentTutorial) return false;
    return this.getCurrentStepNumber() === (this.currentTutorial?.steps?.length || 0);
  }

  // UI helper methods
  getActionIcon(action: string): string {
    const icons: { [key: string]: string } = {
      'click': '👆',
      'type': '⌨️',
      'wait': '⏳',
      'none': ''
    };
    return icons[action] || '❓';
  }

  getDefaultActionText(action: string): string {
    const texts: { [key: string]: string } = {
      'click': 'Click the highlighted element',
      'type': 'Type as instructed',
      'wait': 'Please wait...',
      'none': ''
    };
    return texts[action] || 'Complete the required action';
  }

  getCriteriaText(criteria: any): string {
    switch (criteria.type) {
      case 'time':
        return `Wait for ${criteria.value} seconds`;
      case 'action':
        return `Complete ${criteria.value} actions`;
      case 'score':
        return `Achieve a score of ${criteria.value}`;
      case 'accuracy':
        return `Reach ${criteria.value}% accuracy`;
      default:
        return 'Complete the requirement';
    }
  }

  getCompletionProgress(): number {
    if (!this.currentStep?.completionCriteria) return 0;
    return Math.min(100, (this.completionProgress / this.currentStep.completionCriteria.value) * 100);
  }

  private updatePointerPosition(): void {
    if (!this.currentStep?.target) return;
    
    const targetElement = document.querySelector(this.currentStep.target);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const containerRect = document.querySelector('.tutorial-container')?.getBoundingClientRect();
      
      if (containerRect) {
        this.pointerPosition = {
          top: rect.top + rect.height / 2 - containerRect.top,
          left: rect.left + rect.width / 2 - containerRect.left
        };
      }
    }
  }

  // Mock completion tracking (integrate with your actual systems)
  simulateProgress(): void {
    if (this.currentStep?.completionCriteria?.type === 'action') {
      this.completionProgress++;
    }
  }
}