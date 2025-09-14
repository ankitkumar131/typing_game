import { Component, OnInit, OnDestroy, ViewChild, ElementRef, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TypingCoursesService, TypingLesson } from '../../services/typing-courses';

@Component({
  selector: 'app-lesson',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="lesson-container" *ngIf="currentLesson()">
      <div class="lesson-header">
        <button class="back-btn" (click)="goBack()">← Back</button>
        <h1>{{currentLesson()!.title}}</h1>
        <div class="lesson-progress">
          Lesson {{currentLesson()!.order}} - {{currentLesson()!.level}}
        </div>
      </div>

      <div class="lesson-content" *ngIf="!isCompleted()">
        <div class="instructions">
          <h3>📋 Instructions</h3>
          <p>{{currentLesson()!.instructions}}</p>
          <div class="goals">
            <strong>Goals:</strong> {{currentLesson()!.goals.minWpm}} WPM, {{currentLesson()!.goals.minAccuracy}}% accuracy
          </div>
        </div>

        <div class="typing-area">
          <div class="text-display">
            <div class="current-text">{{getCurrentText()}}</div>
          </div>
          
          <input #lessonInput
                 type="text"
                 class="lesson-input"
                 [(ngModel)]="userInput"
                 (input)="onInputChange($event)"
                 placeholder="Start typing..."
                 [disabled]="isCompleted()">
          
          <div class="stats">
            <span>WPM: {{currentWpm()}}</span>
            <span>Accuracy: {{currentAccuracy()}}%</span>
            <span>Time: {{elapsedTime()}}s</span>
          </div>
        </div>
      </div>

      <div class="lesson-complete" *ngIf="isCompleted()">
        <h2>🎉 Lesson Complete!</h2>
        <div class="results">
          <div class="stat">Final WPM: {{finalWpm()}}</div>
          <div class="stat">Final Accuracy: {{finalAccuracy()}}%</div>
          <div class="stars">Stars: {{getStars()}} ⭐</div>
        </div>
        <button class="next-btn" (click)="nextLesson()">Next Lesson</button>
      </div>
    </div>
  `,
  styles: [`
    .lesson-container { max-width: 800px; margin: 0 auto; padding: 2rem; }
    .lesson-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .back-btn { padding: 0.5rem 1rem; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; cursor: pointer; }
    .typing-area { background: #f8f9fa; padding: 2rem; border-radius: 8px; }
    .text-display { font-size: 1.2rem; margin-bottom: 1rem; padding: 1rem; background: white; border-radius: 4px; }
    .lesson-input { width: 100%; padding: 1rem; font-size: 1.1rem; border: 1px solid #ccc; border-radius: 4px; }
    .stats { display: flex; gap: 2rem; margin-top: 1rem; }
    .lesson-complete { text-align: center; }
    .results { display: flex; justify-content: center; gap: 2rem; margin: 2rem 0; }
    .next-btn { padding: 1rem 2rem; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer; }
  `]
})
export class LessonComponent implements OnInit, OnDestroy {
  @ViewChild('lessonInput') lessonInput!: ElementRef<HTMLInputElement>;

  private lessonId = signal<string>('');
  currentLesson = computed(() => this.coursesService.getLessonById(this.lessonId()));
  
  private textIndex = signal(0);
  userInput = '';
  private startTime = 0;
  private endTime = 0;
  private keystrokes = 0;
  private errors = 0;
  
  private completed = signal(false);
  isCompleted = computed(() => this.completed());
  
  currentWpm = signal(0);
  currentAccuracy = signal(100);
  elapsedTime = signal(0);
  finalWpm = signal(0);
  finalAccuracy = signal(100);
  
  private updateInterval?: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coursesService: TypingCoursesService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.lessonId.set(params['id']);
      this.initializeLesson();
    });
  }

  ngOnDestroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  private initializeLesson(): void {
    this.startTime = Date.now();
    this.textIndex.set(0);
    this.userInput = '';
    this.keystrokes = 0;
    this.errors = 0;
    this.completed.set(false);
    
    // Start stats update interval
    this.updateInterval = window.setInterval(() => {
      this.updateStats();
    }, 1000);
  }

  getCurrentText(): string {
    const lesson = this.currentLesson();
    return lesson?.content[this.textIndex()] || '';
  }

  onInputChange(event: any): void {
    const input = event.target.value;
    const currentText = this.getCurrentText();
    
    this.keystrokes++;
    
    // Check for errors
    for (let i = 0; i < input.length; i++) {
      if (input[i] !== currentText[i]) {
        this.errors++;
        break;
      }
    }
    
    // Check if text is complete
    if (input === currentText) {
      this.completeCurrentText();
    }
  }

  private completeCurrentText(): void {
    const lesson = this.currentLesson();
    if (!lesson) return;
    
    this.textIndex.update(index => index + 1);
    this.userInput = '';
    
    // Check if lesson is complete
    if (this.textIndex() >= lesson.content.length) {
      this.completeLesson();
    }
  }

  private completeLesson(): void {
    this.endTime = Date.now();
    const timeSpent = (this.endTime - this.startTime) / 1000;
    
    const wpm = Math.round((this.keystrokes / 5) / (timeSpent / 60));
    const accuracy = Math.round(((this.keystrokes - this.errors) / this.keystrokes) * 100);
    
    this.finalWpm.set(wpm);
    this.finalAccuracy.set(accuracy);
    this.completed.set(true);
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Save progress
    this.coursesService.completeLesson(this.lessonId(), wpm, accuracy, timeSpent);
  }

  private updateStats(): void {
    if (this.completed()) return;
    
    const elapsed = (Date.now() - this.startTime) / 1000;
    const wpm = this.keystrokes > 0 ? Math.round((this.keystrokes / 5) / (elapsed / 60)) : 0;
    const accuracy = this.keystrokes > 0 ? Math.round(((this.keystrokes - this.errors) / this.keystrokes) * 100) : 100;
    
    this.currentWpm.set(wpm);
    this.currentAccuracy.set(accuracy);
    this.elapsedTime.set(Math.floor(elapsed));
  }

  getStars(): number {
    const lesson = this.currentLesson();
    if (!lesson) return 0;
    
    const wpm = this.finalWpm();
    const accuracy = this.finalAccuracy();
    
    if (wpm >= lesson.goals.minWpm * 1.2 && accuracy >= lesson.goals.minAccuracy + 3) return 3;
    if (wpm >= lesson.goals.minWpm && accuracy >= lesson.goals.minAccuracy) return 2;
    return 1;
  }

  nextLesson(): void {
    // Navigate to next lesson or course overview
    this.router.navigate(['/courses']);
  }

  goBack(): void {
    this.router.navigate(['/courses']);
  }
}