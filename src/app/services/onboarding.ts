import { Injectable, signal, computed } from '@angular/core';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: string;
  target?: string; // CSS selector for element to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'type' | 'wait' | 'none';
  actionText?: string;
  skippable: boolean;
  completionCriteria?: {
    type: 'time' | 'action' | 'score' | 'accuracy';
    value: number;
  };
  tips?: string[];
  image?: string;
  video?: string;
}

export interface Tutorial {
  id: string;
  name: string;
  description: string;
  category: 'basics' | 'intermediate' | 'advanced' | 'feature';
  steps: TutorialStep[];
  estimatedTime: number; // in minutes
  prerequisites?: string[];
  rewards?: {
    coins: number;
    experience: number;
    badges: string[];
  };
}

export interface TutorialProgress {
  tutorialId: string;
  currentStep: number;
  completed: boolean;
  startedAt: number;
  completedAt?: number;
  stepProgress: { [stepId: string]: boolean };
  score?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private readonly STORAGE_KEY = 'typingGame_onboarding';
  
  // Tutorial state
  private currentTutorial = signal<Tutorial | null>(null);
  private currentStep = signal<number>(0);
  private isActive = signal<boolean>(false);
  private tutorialProgress = signal<{ [tutorialId: string]: TutorialProgress }>({});
  private hasSeenOnboarding = signal<boolean>(false);

  // Available tutorials
  private tutorials: Tutorial[] = [
    {
      id: 'welcome',
      name: 'Welcome to Typing Speed Challenge',
      description: 'Learn the basics of the typing game',
      category: 'basics',
      estimatedTime: 5,
      steps: [
        {
          id: 'welcome-intro',
          title: 'Welcome! 👋',
          description: 'Welcome to the Ultimate Typing Speed Challenge',
          content: `
            <h3>Ready to improve your typing skills?</h3>
            <p>This tutorial will guide you through the features and help you get started on your typing journey.</p>
            <ul>
              <li>🎯 Improve typing speed and accuracy</li>
              <li>📊 Track detailed performance analytics</li>
              <li>🏆 Unlock achievements and compete</li>
              <li>🎮 Try different game modes</li>
            </ul>
          `,
          position: 'center',
          action: 'none',
          skippable: true
        },
        {
          id: 'interface-overview',
          title: 'Interface Overview',
          description: 'Let\'s explore the main interface',
          content: `
            <h3>Main Game Interface</h3>
            <p>Here's what you'll see during typing:</p>
            <ul>
              <li><strong>Current Word:</strong> The word you need to type</li>
              <li><strong>Input Field:</strong> Where you type</li>
              <li><strong>Statistics:</strong> Real-time WPM, accuracy, and score</li>
              <li><strong>Progress Bar:</strong> Time remaining or progress</li>
            </ul>
          `,
          target: '.game-container',
          position: 'right',
          action: 'none',
          skippable: true,
          tips: ['Take your time to familiarize yourself with the layout']
        },
        {
          id: 'finger-placement',
          title: 'Proper Finger Placement',
          description: 'Learn correct finger positioning',
          content: `
            <h3>Home Row Position</h3>
            <p>Place your fingers on the home row keys:</p>
            <ul>
              <li><strong>Left hand:</strong> A-S-D-F (pinky to index)</li>
              <li><strong>Right hand:</strong> J-K-L-; (index to pinky)</li>
              <li><strong>Thumbs:</strong> On the spacebar</li>
            </ul>
            <p>This is your starting position for all typing!</p>
          `,
          target: '.keyboard-visualization',
          position: 'top',
          action: 'none',
          skippable: true,
          tips: [
            'Keep your wrists straight and relaxed',
            'Your fingers should curve naturally over the keys',
            'Don\'t look at the keyboard!'
          ]
        },
        {
          id: 'first-typing',
          title: 'Your First Words',
          description: 'Let\'s try typing some basic words',
          content: `
            <h3>Practice Time!</h3>
            <p>Now let's practice with some simple words. Remember:</p>
            <ul>
              <li>Keep your fingers on the home row</li>
              <li>Use the correct finger for each key</li>
              <li>Focus on accuracy first, speed will come naturally</li>
            </ul>
            <p>Type the words that appear on screen.</p>
          `,
          target: '.game-input',
          position: 'bottom',
          action: 'type',
          actionText: 'Type the displayed words',
          skippable: false,
          completionCriteria: {
            type: 'action',
            value: 5 // Type 5 words correctly
          }
        },
        {
          id: 'statistics-explanation',
          title: 'Understanding Your Stats',
          description: 'Learn what the numbers mean',
          content: `
            <h3>Your Typing Metrics</h3>
            <p>Here's what each statistic means:</p>
            <ul>
              <li><strong>WPM (Words Per Minute):</strong> Your typing speed</li>
              <li><strong>Accuracy:</strong> Percentage of correct keystrokes</li>
              <li><strong>Score:</strong> Points based on speed, accuracy, and consistency</li>
              <li><strong>Streak:</strong> Consecutive correct words</li>
            </ul>
            <p>Aim for 95%+ accuracy before focusing on speed!</p>
          `,
          target: '.stats-container',
          position: 'left',
          action: 'none',
          skippable: true
        },
        {
          id: 'features-overview',
          title: 'Explore Features',
          description: 'Discover what else you can do',
          content: `
            <h3>More Features to Explore</h3>
            <p>After this tutorial, check out:</p>
            <ul>
              <li>🎮 <strong>Game Modes:</strong> Different typing challenges</li>
              <li>📈 <strong>Profile:</strong> Detailed analytics and progress</li>
              <li>🏆 <strong>Achievements:</strong> Goals to unlock</li>
              <li>⚙️ <strong>Settings:</strong> Customize your experience</li>
              <li>🌐 <strong>Multiplayer:</strong> Compete with others</li>
            </ul>
          `,
          position: 'center',
          action: 'none',
          skippable: true
        },
        {
          id: 'tutorial-complete',
          title: 'Tutorial Complete! 🎉',
          description: 'You\'re ready to start typing!',
          content: `
            <h3>Congratulations!</h3>
            <p>You've completed the basic tutorial. You're now ready to:</p>
            <ul>
              <li>Start your typing journey with regular practice</li>
              <li>Try different difficulty levels and categories</li>
              <li>Track your improvement over time</li>
              <li>Challenge friends in multiplayer mode</li>
            </ul>
            <p><strong>Remember:</strong> Consistency is key. Practice a little each day for best results!</p>
          `,
          position: 'center',
          action: 'none',
          skippable: false
        }
      ],
      rewards: {
        coins: 100,
        experience: 50,
        badges: ['first-steps']
      }
    },
    {
      id: 'advanced-features',
      name: 'Advanced Features Tour',
      description: 'Explore advanced features and analytics',
      category: 'intermediate',
      estimatedTime: 8,
      prerequisites: ['welcome'],
      steps: [
        {
          id: 'heat-map-intro',
          title: 'Heat Map Analytics',
          description: 'Understanding your typing patterns',
          content: `
            <h3>Heat Map Analysis</h3>
            <p>The heat map shows which keys you struggle with:</p>
            <ul>
              <li><strong>Red areas:</strong> Keys with high error rates</li>
              <li><strong>Green areas:</strong> Keys you type accurately</li>
              <li><strong>Size intensity:</strong> How often you use each key</li>
            </ul>
            <p>Use this to identify areas for focused practice!</p>
          `,
          target: '.heat-map-container',
          position: 'right',
          action: 'none',
          skippable: true
        },
        {
          id: 'error-analysis',
          title: 'Error Pattern Analysis',
          description: 'Learn from your mistakes',
          content: `
            <h3>Smart Error Analysis</h3>
            <p>Our system categorizes your errors:</p>
            <ul>
              <li><strong>Finger slips:</strong> Adjacent key mistakes</li>
              <li><strong>Timing errors:</strong> Rushed keystrokes</li>
              <li><strong>Visual errors:</strong> Misreading characters</li>
              <li><strong>Muscle memory:</strong> Ingrained bad habits</li>
            </ul>
            <p>Each type has specific improvement strategies!</p>
          `,
          target: '.error-feedback',
          position: 'left',
          action: 'none',
          skippable: true
        },
        {
          id: 'custom-text',
          title: 'Custom Text Practice',
          description: 'Practice with your own content',
          content: `
            <h3>Import Your Own Text</h3>
            <p>Practice with content that matters to you:</p>
            <ul>
              <li>Upload text files</li>
              <li>Import from URLs</li>
              <li>Paste directly</li>
              <li>Practice code, documents, or books</li>
            </ul>
            <p>Perfect for profession-specific typing practice!</p>
          `,
          target: '[routerLink="/custom-text"]',
          position: 'bottom',
          action: 'click',
          actionText: 'Click to explore custom text',
          skippable: true
        }
      ],
      rewards: {
        coins: 200,
        experience: 100,
        badges: ['power-user']
      }
    }
  ];

  // Computed properties
  activeTutorial = computed(() => this.currentTutorial());
  activeStep = computed(() => {
    const tutorial = this.currentTutorial();
    const stepIndex = this.currentStep();
    return tutorial?.steps[stepIndex] || null;
  });
  isRunning = computed(() => this.isActive());
  progress = computed(() => {
    const tutorial = this.currentTutorial();
    const stepIndex = this.currentStep();
    if (!tutorial) return 0;
    return Math.round((stepIndex / tutorial.steps.length) * 100);
  });

  constructor() {
    this.loadProgress();
  }

  // Public API
  shouldShowOnboarding(): boolean {
    return !this.hasSeenOnboarding() && !this.isActive();
  }

  startTutorial(tutorialId: string): boolean {
    const tutorial = this.tutorials.find(t => t.id === tutorialId);
    if (!tutorial) return false;

    // Check prerequisites
    if (tutorial.prerequisites) {
      const hasPrereqs = tutorial.prerequisites.every(prereqId => 
        this.tutorialProgress()[prereqId]?.completed
      );
      if (!hasPrereqs) return false;
    }

    this.currentTutorial.set(tutorial);
    this.currentStep.set(0);
    this.isActive.set(true);
    this.hasSeenOnboarding.set(true);

    // Initialize progress
    const progress = this.tutorialProgress();
    progress[tutorialId] = {
      tutorialId,
      currentStep: 0,
      completed: false,
      startedAt: Date.now(),
      stepProgress: {}
    };
    this.tutorialProgress.set({ ...progress });
    this.saveProgress();

    return true;
  }

  nextStep(): void {
    const tutorial = this.currentTutorial();
    const currentStepIndex = this.currentStep();
    
    if (!tutorial || currentStepIndex >= tutorial.steps.length - 1) {
      this.completeTutorial();
      return;
    }

    // Mark current step as completed
    this.markStepCompleted(tutorial.steps[currentStepIndex].id);

    this.currentStep.set(currentStepIndex + 1);
    this.saveProgress();
  }

  previousStep(): void {
    const currentStepIndex = this.currentStep();
    if (currentStepIndex > 0) {
      this.currentStep.set(currentStepIndex - 1);
      this.saveProgress();
    }
  }

  skipStep(): void {
    const activeStep = this.activeStep();
    if (activeStep?.skippable) {
      this.nextStep();
    }
  }

  skipTutorial(): void {
    const tutorial = this.currentTutorial();
    if (tutorial) {
      this.markTutorialCompleted(tutorial.id, true);
    }
    this.endTutorial();
  }

  endTutorial(): void {
    this.currentTutorial.set(null);
    this.currentStep.set(0);
    this.isActive.set(false);
    this.saveProgress();
  }

  completeTutorial(): void {
    const tutorial = this.currentTutorial();
    if (tutorial) {
      this.markTutorialCompleted(tutorial.id, false);
      
      // Award rewards
      if (tutorial.rewards) {
        this.awardRewards(tutorial.rewards);
      }
    }
    this.endTutorial();
  }

  restartTutorial(): void {
    const tutorial = this.currentTutorial();
    if (tutorial) {
      this.currentStep.set(0);
      
      // Reset progress
      const progress = this.tutorialProgress();
      progress[tutorial.id] = {
        tutorialId: tutorial.id,
        currentStep: 0,
        completed: false,
        startedAt: Date.now(),
        stepProgress: {}
      };
      this.tutorialProgress.set({ ...progress });
      this.saveProgress();
    }
  }

  // Tutorial management
  getAllTutorials(): Tutorial[] {
    return this.tutorials;
  }

  getAvailableTutorials(): Tutorial[] {
    return this.tutorials.filter(tutorial => {
      if (!tutorial.prerequisites) return true;
      
      return tutorial.prerequisites.every(prereqId => 
        this.tutorialProgress()[prereqId]?.completed
      );
    });
  }

  getTutorialProgress(tutorialId: string): TutorialProgress | null {
    return this.tutorialProgress()[tutorialId] || null;
  }

  isTutorialCompleted(tutorialId: string): boolean {
    return this.tutorialProgress()[tutorialId]?.completed || false;
  }

  getCompletedTutorials(): Tutorial[] {
    return this.tutorials.filter(t => this.isTutorialCompleted(t.id));
  }

  // Step completion criteria
  checkStepCompletion(stepId: string, data: any): boolean {
    const activeStep = this.activeStep();
    if (!activeStep || activeStep.id !== stepId) return false;

    const criteria = activeStep.completionCriteria;
    if (!criteria) return true;

    switch (criteria.type) {
      case 'time':
        return data.timeSpent >= criteria.value;
      case 'action':
        return data.actionCount >= criteria.value;
      case 'score':
        return data.score >= criteria.value;
      case 'accuracy':
        return data.accuracy >= criteria.value;
      default:
        return true;
    }
  }

  markStepCompleted(stepId: string): void {
    const tutorial = this.currentTutorial();
    if (!tutorial) return;

    const progress = this.tutorialProgress();
    const tutorialProgress = progress[tutorial.id];
    if (tutorialProgress) {
      tutorialProgress.stepProgress[stepId] = true;
      tutorialProgress.currentStep = this.currentStep();
      this.tutorialProgress.set({ ...progress });
      this.saveProgress();
    }
  }

  // Utility methods
  private markTutorialCompleted(tutorialId: string, skipped: boolean): void {
    const progress = this.tutorialProgress();
    const tutorialProgress = progress[tutorialId];
    if (tutorialProgress) {
      tutorialProgress.completed = true;
      tutorialProgress.completedAt = Date.now();
      this.tutorialProgress.set({ ...progress });
      this.saveProgress();
    }
  }

  private awardRewards(rewards: { coins: number; experience: number; badges: string[] }): void {
    // This would integrate with your achievement/currency system
    console.log('Tutorial rewards awarded:', rewards);
    // Example: this.achievementService.earnCoins(rewards.coins, 'tutorial_completion');
  }

  private loadProgress(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.tutorialProgress.set(data.progress || {});
        this.hasSeenOnboarding.set(data.hasSeenOnboarding || false);
      } catch (error) {
        console.warn('Failed to load tutorial progress:', error);
      }
    }
  }

  private saveProgress(): void {
    const data = {
      progress: this.tutorialProgress(),
      hasSeenOnboarding: this.hasSeenOnboarding()
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  // Reset methods (for testing or user request)
  resetAllProgress(): void {
    this.tutorialProgress.set({});
    this.hasSeenOnboarding.set(false);
    this.endTutorial();
    localStorage.removeItem(this.STORAGE_KEY);
  }

  resetTutorial(tutorialId: string): void {
    const progress = this.tutorialProgress();
    delete progress[tutorialId];
    this.tutorialProgress.set({ ...progress });
    this.saveProgress();
  }
}