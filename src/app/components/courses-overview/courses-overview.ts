import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TypingCoursesService, TypingCourse, CourseProgress } from '../../services/typing-courses';

@Component({
  selector: 'app-courses-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="courses-overview">
      <div class="header">
        <h1>🎓 Typing Courses</h1>
        <p class="subtitle">
          Master touch typing with our structured learning path. 
          Progress through courses at your own pace.
        </p>
        
        <!-- Overall Progress -->
        <div class="overall-progress">
          <div class="progress-stats">
            <div class="stat">
              <span class="number">{{overallProgress().completedLessons}}</span>
              <span class="label">Lessons Completed</span>
            </div>
            <div class="stat">
              <span class="number">{{overallProgress().percentage | number:'1.0-0'}}%</span>
              <span class="label">Overall Progress</span>
            </div>
            <div class="stat">
              <span class="number">{{overallProgress().currentLevel}}</span>
              <span class="label">Current Level</span>
            </div>
          </div>
          
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              [style.width.%]="overallProgress().percentage">
            </div>
          </div>
        </div>
      </div>

      <!-- Recommended Lesson -->
      <div class="recommended-section" *ngIf="recommendedLesson()">
        <h2>🎯 Continue Learning</h2>
        <div class="recommended-lesson" (click)="startLesson(recommendedLesson()!.id)">
          <div class="lesson-info">
            <h3>{{recommendedLesson()!.title}}</h3>
            <p>{{recommendedLesson()!.description}}</p>
            <div class="lesson-meta">
              <span class="level">{{recommendedLesson()!.level}}</span>
              <span class="duration">{{recommendedLesson()!.estimatedDuration}} min</span>
            </div>
          </div>
          <button class="continue-btn">Continue →</button>
        </div>
      </div>

      <!-- Courses Grid -->
      <div class="courses-section">
        <h2>📚 All Courses</h2>
        <div class="courses-grid">
          <div 
            *ngFor="let course of availableCourses()" 
            class="course-card"
            [class.completed]="isCourseCompleted(course.id)"
            [class.in-progress]="isCourseInProgress(course.id)"
            [class.locked]="!isCourseAvailable(course.id)"
            (click)="selectCourse(course)"
          >
            <div class="course-header">
              <div class="course-badge" [style.background-color]="course.color">
                {{course.badge}}
              </div>
              <div class="course-status">
                <span 
                  *ngIf="isCourseCompleted(course.id)" 
                  class="status-icon completed">
                  ✓
                </span>
                <span 
                  *ngIf="isCourseInProgress(course.id) && !isCourseCompleted(course.id)" 
                  class="status-icon in-progress">
                  ⏳
                </span>
                <span 
                  *ngIf="!isCourseAvailable(course.id)" 
                  class="status-icon locked">
                  🔒
                </span>
              </div>
            </div>

            <div class="course-content">
              <h3>{{course.title}}</h3>
              <p class="course-description">{{course.description}}</p>
              
              <div class="course-meta">
                <span class="level-badge" [class]="course.level">
                  {{course.level}}
                </span>
                <span class="duration">
                  {{course.estimatedDuration}} minutes
                </span>
                <span class="lessons-count">
                  {{course.lessons.length}} lessons
                </span>
              </div>

              <!-- Course Progress -->
              <div class="course-progress" *ngIf="getCourseProgress(course.id)">
                <div class="progress-info">
                  <span>{{getCourseProgress(course.id)!.lessonsCompleted}}/{{getCourseProgress(course.id)!.totalLessons}} lessons</span>
                  <span>{{getCourseProgress(course.id)!.overallProgress | number:'1.0-0'}}%</span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    [style.width.%]="getCourseProgress(course.id)!.overallProgress">
                  </div>
                </div>
              </div>

              <!-- Course Goals -->
              <div class="course-goals">
                <h4>🎯 Learning Goals:</h4>
                <ul>
                  <li *ngFor="let goal of course.goals">{{goal}}</li>
                </ul>
              </div>

              <!-- Prerequisites -->
              <div class="prerequisites" *ngIf="course.prerequisites?.length">
                <h4>📋 Prerequisites:</h4>
                <div class="prereq-list">
                  <span 
                    *ngFor="let prereqId of course.prerequisites" 
                    class="prereq-badge"
                    [class.completed]="isCourseCompleted(prereqId)">
                    {{getCourseTitle(prereqId)}}
                  </span>
                </div>
              </div>
            </div>

            <div class="course-actions">
              <button 
                class="action-btn primary"
                [disabled]="!isCourseAvailable(course.id)"
                (click)="$event.stopPropagation(); selectCourse(course)"
              >
                <span *ngIf="!getCourseProgress(course.id)">Start Course</span>
                <span *ngIf="getCourseProgress(course.id) && !isCourseCompleted(course.id)">Continue</span>
                <span *ngIf="isCourseCompleted(course.id)">Review</span>
              </button>
              
              <button 
                class="action-btn secondary"
                (click)="$event.stopPropagation(); viewCourseDetails(course)"
                [attr.aria-label]="'View details for ' + course.title"
              >
                Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .courses-overview {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .header h1 {
      color: var(--primary-color, #007acc);
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: var(--text-secondary, #666);
      font-size: 1.1rem;
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .overall-progress {
      background: var(--card-bg, #f8f9fa);
      border-radius: 12px;
      padding: 2rem;
      border: 1px solid var(--border-color, #dee2e6);
    }

    .progress-stats {
      display: flex;
      justify-content: center;
      gap: 3rem;
      margin-bottom: 1.5rem;
    }

    .stat {
      text-align: center;
    }

    .stat .number {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary-color, #007acc);
      text-transform: capitalize;
    }

    .stat .label {
      color: var(--text-secondary, #666);
      font-size: 0.9rem;
    }

    .progress-bar {
      background: var(--progress-bg, #e9ecef);
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      background: linear-gradient(90deg, #007acc, #00a8ff);
      height: 100%;
      transition: width 0.3s ease;
    }

    .recommended-section {
      margin-bottom: 3rem;
    }

    .recommended-section h2 {
      color: var(--heading-color, #333);
      margin-bottom: 1rem;
    }

    .recommended-lesson {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 12px;
      padding: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .recommended-lesson:hover {
      transform: translateY(-2px);
    }

    .lesson-info h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.3rem;
    }

    .lesson-info p {
      margin: 0 0 1rem 0;
      opacity: 0.9;
    }

    .lesson-meta {
      display: flex;
      gap: 1rem;
    }

    .lesson-meta span {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      font-size: 0.8rem;
      text-transform: capitalize;
    }

    .continue-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 0.8rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .continue-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .courses-section h2 {
      color: var(--heading-color, #333);
      margin-bottom: 2rem;
    }

    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 2rem;
    }

    .course-card {
      background: var(--card-bg, #fff);
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 12px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .course-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    .course-card.completed {
      border-color: #28a745;
      background: linear-gradient(135deg, #d4edda, #c3e6cb);
    }

    .course-card.in-progress {
      border-color: #007acc;
      background: linear-gradient(135deg, #cce7ff, #99d6ff);
    }

    .course-card.locked {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .course-card.locked:hover {
      transform: none;
      box-shadow: none;
    }

    .course-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .course-badge {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: white;
      font-weight: bold;
    }

    .status-icon {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      font-weight: bold;
    }

    .status-icon.completed {
      background: #28a745;
      color: white;
    }

    .status-icon.in-progress {
      background: #007acc;
      color: white;
    }

    .status-icon.locked {
      background: #6c757d;
      color: white;
    }

    .course-content h3 {
      margin: 0 0 0.5rem 0;
      color: var(--heading-color, #333);
      font-size: 1.3rem;
    }

    .course-description {
      color: var(--text-secondary, #666);
      line-height: 1.5;
      margin-bottom: 1rem;
    }

    .course-meta {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .level-badge {
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: capitalize;
    }

    .level-badge.beginner { background: #28a745; color: white; }
    .level-badge.intermediate { background: #007acc; color: white; }
    .level-badge.advanced { background: #dc3545; color: white; }

    .duration, .lessons-count {
      background: var(--tag-bg, #e9ecef);
      color: var(--tag-text, #495057);
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      font-size: 0.8rem;
    }

    .course-progress {
      margin-bottom: 1rem;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      color: var(--text-secondary, #666);
      margin-bottom: 0.5rem;
    }

    .course-progress .progress-bar {
      height: 6px;
    }

    .course-goals {
      margin-bottom: 1rem;
    }

    .course-goals h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      color: var(--heading-color, #333);
    }

    .course-goals ul {
      margin: 0;
      padding-left: 1.2rem;
    }

    .course-goals li {
      color: var(--text-secondary, #666);
      font-size: 0.9rem;
      line-height: 1.4;
      margin-bottom: 0.3rem;
    }

    .prerequisites {
      margin-bottom: 1rem;
    }

    .prerequisites h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      color: var(--heading-color, #333);
    }

    .prereq-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .prereq-badge {
      background: var(--prereq-bg, #f8f9fa);
      color: var(--prereq-text, #495057);
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      font-size: 0.8rem;
      border: 1px solid var(--border-color, #dee2e6);
    }

    .prereq-badge.completed {
      background: #d4edda;
      color: #155724;
      border-color: #c3e6cb;
    }

    .course-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .action-btn {
      flex: 1;
      padding: 0.6rem 1rem;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .action-btn.primary {
      background: var(--primary-color, #007acc);
      color: white;
    }

    .action-btn.primary:hover:not(:disabled) {
      background: var(--primary-hover, #0056b3);
    }

    .action-btn.primary:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .action-btn.secondary {
      background: transparent;
      color: var(--primary-color, #007acc);
      border: 1px solid var(--primary-color, #007acc);
    }

    .action-btn.secondary:hover {
      background: var(--primary-color, #007acc);
      color: white;
    }

    @media (max-width: 768px) {
      .courses-overview {
        padding: 1rem;
      }

      .progress-stats {
        flex-direction: column;
        gap: 1rem;
      }

      .courses-grid {
        grid-template-columns: 1fr;
      }

      .recommended-lesson {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
      }
    }
  `]
})
export class CoursesOverviewComponent {
  availableCourses = computed(() => this.coursesService.getAvailableCourses());
  overallProgress = computed(() => this.coursesService.getOverallProgress());
  recommendedLesson = computed(() => this.coursesService.getRecommendedLesson());

  constructor(
    private coursesService: TypingCoursesService,
    private router: Router
  ) {}

  selectCourse(course: TypingCourse): void {
    if (!this.isCourseAvailable(course.id)) return;
    
    this.coursesService.startCourse(course.id);
    this.router.navigate(['/courses', course.id]);
  }

  startLesson(lessonId: string): void {
    this.router.navigate(['/lesson', lessonId]);
  }

  viewCourseDetails(course: TypingCourse): void {
    this.router.navigate(['/courses', course.id, 'details']);
  }

  isCourseCompleted(courseId: string): boolean {
    const progress = this.getCourseProgress(courseId);
    return !!progress?.completedAt;
  }

  isCourseInProgress(courseId: string): boolean {
    const progress = this.getCourseProgress(courseId);
    return !!progress && !progress.completedAt;
  }

  isCourseAvailable(courseId: string): boolean {
    const course = this.coursesService.getCourseById(courseId);
    if (!course?.prerequisites) return true;
    
    return course.prerequisites.every(prereqId => this.isCourseCompleted(prereqId));
  }

  getCourseProgress(courseId: string): CourseProgress | undefined {
    return this.coursesService.getCourseProgress(courseId);
  }

  getCourseTitle(courseId: string): string {
    const course = this.coursesService.getCourseById(courseId);
    return course?.title || courseId;
  }
}