import { Injectable, signal, computed } from '@angular/core';

export interface TypingLesson {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: 'home-row' | 'top-row' | 'bottom-row' | 'numbers' | 'symbols' | 'words' | 'sentences';
  targetKeys: string[];
  content: string[];
  instructions: string;
  goals: {
    minWpm: number;
    minAccuracy: number;
    timeLimit?: number;
  };
  prerequisites?: string[];
  estimatedDuration: number; // in minutes
  order: number;
}

export interface TypingCourse {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons: string[]; // lesson IDs
  estimatedDuration: number; // total duration in minutes
  goals: string[];
  prerequisites?: string[];
  badge?: string;
  color: string;
}

export interface UserProgress {
  lessonId: string;
  completed: boolean;
  bestWpm: number;
  bestAccuracy: number;
  attempts: number;
  timeSpent: number; // in seconds
  lastAttempt: Date;
  stars: number; // 0-3 stars based on performance
  completedAt?: Date;
}

export interface CourseProgress {
  courseId: string;
  startedAt: Date;
  completedAt?: Date;
  lessonsCompleted: number;
  totalLessons: number;
  overallProgress: number; // 0-100
  currentLessonId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TypingCoursesService {
  private readonly PROGRESS_STORAGE_KEY = 'typingGame_courseProgress';
  private readonly USER_PROGRESS_KEY = 'typingGame_userProgress';

  // Course data
  private courses = signal<TypingCourse[]>([]);
  private lessons = signal<TypingLesson[]>([]);
  
  // User progress
  private userProgress = signal<UserProgress[]>([]);
  private courseProgress = signal<CourseProgress[]>([]);

  // Computed properties
  availableCourses = computed(() => this.courses());
  availableLessons = computed(() => this.lessons());
  progress = computed(() => this.userProgress());
  coursesProgress = computed(() => this.courseProgress());

  constructor() {
    this.initializeCourses();
    this.initializeLessons();
    this.loadUserProgress();
  }

  private initializeCourses(): void {
    const courses: TypingCourse[] = [
      {
        id: 'beginner-basics',
        title: 'Typing Basics',
        description: 'Master the fundamentals of touch typing with proper finger placement and home row keys.',
        level: 'beginner',
        lessons: [
          'home-row-1', 'home-row-2', 'home-row-3', 'home-row-practice',
          'left-hand-1', 'left-hand-2', 'right-hand-1', 'right-hand-2',
          'basic-words-1', 'basic-words-2'
        ],
        estimatedDuration: 120,
        goals: [
          'Learn proper finger placement',
          'Type without looking at keyboard',
          'Achieve 20+ WPM with 90% accuracy',
          'Master home row keys'
        ],
        badge: '🎯',
        color: '#4CAF50'
      },
      {
        id: 'intermediate-expansion',
        title: 'Keyboard Expansion',
        description: 'Expand your typing skills to all letters, numbers, and basic punctuation.',
        level: 'intermediate',
        lessons: [
          'top-row-1', 'top-row-2', 'top-row-3', 'top-row-practice',
          'bottom-row-1', 'bottom-row-2', 'bottom-row-3', 'bottom-row-practice',
          'numbers-1', 'numbers-2', 'numbers-practice',
          'punctuation-1', 'punctuation-2', 'mixed-practice-1'
        ],
        estimatedDuration: 180,
        goals: [
          'Type all letters without looking',
          'Master number row typing',
          'Learn basic punctuation',
          'Achieve 35+ WPM with 92% accuracy'
        ],
        prerequisites: ['beginner-basics'],
        badge: '🚀',
        color: '#2196F3'
      },
      {
        id: 'advanced-mastery',
        title: 'Speed & Accuracy Mastery',
        description: 'Perfect your typing with advanced exercises, symbols, and speed building.',
        level: 'advanced',
        lessons: [
          'symbols-1', 'symbols-2', 'symbols-practice',
          'speed-building-1', 'speed-building-2', 'speed-building-3',
          'accuracy-focus-1', 'accuracy-focus-2',
          'mixed-advanced-1', 'mixed-advanced-2', 'final-challenge'
        ],
        estimatedDuration: 240,
        goals: [
          'Master all keyboard symbols',
          'Achieve 50+ WPM consistently',
          'Maintain 95%+ accuracy',
          'Type complex text fluently'
        ],
        prerequisites: ['intermediate-expansion'],
        badge: '👑',
        color: '#FF9800'
      },
      {
        id: 'specialized-numeric',
        title: 'Numeric Keypad Mastery',
        description: 'Master the numeric keypad for data entry and accounting work.',
        level: 'intermediate',
        lessons: [
          'numpad-basics-1', 'numpad-basics-2', 'numpad-practice-1',
          'numpad-calculations', 'numpad-data-entry', 'numpad-speed'
        ],
        estimatedDuration: 90,
        goals: [
          'Master 10-key typing',
          'Achieve fast numeric input',
          'Learn calculator operations',
          'Perfect data entry skills'
        ],
        badge: '🔢',
        color: '#9C27B0'
      },
      {
        id: 'programming-typing',
        title: 'Programming & Code Typing',
        description: 'Specialized training for programming languages and code symbols.',
        level: 'advanced',
        lessons: [
          'code-symbols-1', 'code-symbols-2', 'code-brackets',
          'javascript-typing', 'python-typing', 'html-css-typing',
          'code-formatting', 'variable-names', 'function-typing'
        ],
        estimatedDuration: 150,
        goals: [
          'Type code symbols fluently',
          'Master bracket combinations',
          'Learn programming patterns',
          'Achieve fast code typing'
        ],
        prerequisites: ['intermediate-expansion'],
        badge: '💻',
        color: '#607D8B'
      }
    ];

    this.courses.set(courses);
  }

  private initializeLessons(): void {
    const lessons: TypingLesson[] = [
      // Home Row Lessons
      {
        id: 'home-row-1',
        title: 'Home Row Foundation',
        description: 'Learn the basic home row keys: A S D F J K L ;',
        level: 'beginner',
        category: 'home-row',
        targetKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
        content: [
          'asdf jkl;', 'asdf jkl;', 'asdf jkl;',
          'aa ss dd ff jj kk ll ;;',
          'as df jk l;', 'sad fad jak lad',
          'ask fall jazz', 'all dad sad'
        ],
        instructions: 'Place your fingers on the home row. Left hand: A(pinky), S(ring), D(middle), F(index). Right hand: J(index), K(middle), L(ring), ;(pinky). Type without looking at the keyboard.',
        goals: { minWpm: 15, minAccuracy: 85 },
        estimatedDuration: 10,
        order: 1
      },
      {
        id: 'home-row-2',
        title: 'Home Row Combinations',
        description: 'Practice common home row letter combinations and short words',
        level: 'beginner',
        category: 'home-row',
        targetKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
        content: [
          'ask lad sad fall', 'all add dad',
          'flask flask flask', 'glass glass glass',
          'salad salad salad', 'falls falls falls',
          'asksasks asks', 'dads dads dads'
        ],
        instructions: 'Continue practicing home row keys with more complex combinations. Focus on accuracy over speed.',
        goals: { minWpm: 18, minAccuracy: 88 },
        prerequisites: ['home-row-1'],
        estimatedDuration: 10,
        order: 2
      },
      {
        id: 'home-row-3',
        title: 'Home Row Fluency',
        description: 'Achieve fluency with home row keys through varied exercises',
        level: 'beginner',
        category: 'home-row',
        targetKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
        content: [
          'a skilled sailor sailed', 'flash flash flash',
          'Alaska Alaska Alaska', 'Kansas Kansas Kansas',
          'salads and fads', 'dads ask lads',
          'allfallallas', 'flaskask flask'
        ],
        instructions: 'Focus on smooth, rhythmic typing. Maintain proper finger placement and posture.',
        goals: { minWpm: 20, minAccuracy: 90 },
        prerequisites: ['home-row-2'],
        estimatedDuration: 15,
        order: 3
      },
      
      // Left Hand Expansion
      {
        id: 'left-hand-1',
        title: 'Left Hand Expansion: Q W E R T',
        description: 'Expand to top row keys with left hand',
        level: 'beginner',
        category: 'top-row',
        targetKeys: ['q', 'w', 'e', 'r', 't'],
        content: [
          'qwert qwert qwert', 'quest quest quest',
          'water water water', 'sweet sweet sweet',
          'faster faster faster', 'after after after',
          'sweet treats', 'water quest', 'fast east'
        ],
        instructions: 'Use proper finger placement for top row keys. Q and W with pinky and ring finger of left hand.',
        goals: { minWpm: 18, minAccuracy: 85 },
        prerequisites: ['home-row-3'],
        estimatedDuration: 12,
        order: 4
      },
      {
        id: 'left-hand-2',
        title: 'Left Hand Bottom: Z X C V',
        description: 'Learn bottom row keys with left hand',
        level: 'beginner',
        category: 'bottom-row',
        targetKeys: ['z', 'x', 'c', 'v'],
        content: [
          'zxcv zxcv zxcv', 'vex vex vex',
          'cave cave cave', 'zest zest zest',
          'exact exact exact', 'excel excel excel',
          'cross cross cross', 'scale scale scale'
        ],
        instructions: 'Reach down to bottom row keys while maintaining home row position.',
        goals: { minWpm: 16, minAccuracy: 85 },
        prerequisites: ['left-hand-1'],
        estimatedDuration: 12,
        order: 5
      },

      // Right Hand Expansion
      {
        id: 'right-hand-1',
        title: 'Right Hand Expansion: Y U I O P',
        description: 'Expand to top row keys with right hand',
        level: 'beginner',
        category: 'top-row',
        targetKeys: ['y', 'u', 'i', 'o', 'p'],
        content: [
          'yuiop yuiop yuiop', 'you you you',
          'point point point', 'input input input',
          'output output output', 'policy policy policy',
          'your input', 'top priority', 'oil spill'
        ],
        instructions: 'Stretch up to reach top row keys. Y with right index finger, U with right middle finger.',
        goals: { minWpm: 18, minAccuracy: 85 },
        prerequisites: ['left-hand-2'],
        estimatedDuration: 12,
        order: 6
      },
      {
        id: 'right-hand-2',
        title: 'Right Hand Bottom: N M , . /',
        description: 'Learn bottom row keys with right hand',
        level: 'beginner',
        category: 'bottom-row',
        targetKeys: ['n', 'm', ',', '.', '/'],
        content: [
          'nm,./  nm,./', 'name name name',
          'main main main', 'moon moon moon',
          'common common common', 'motion motion motion',
          'final main', 'common name', 'moon mission'
        ],
        instructions: 'Use right hand fingers for bottom row keys. Comma with middle finger, period with ring finger.',
        goals: { minWpm: 16, minAccuracy: 85 },
        prerequisites: ['right-hand-1'],
        estimatedDuration: 12,
        order: 7
      },

      // Word Practice
      {
        id: 'basic-words-1',
        title: 'Basic Word Practice',
        description: 'Practice common English words using learned keys',
        level: 'beginner',
        category: 'words',
        targetKeys: [], // All learned keys
        content: [
          'the and that with have this will',
          'you from they know want been good',
          'just like time very when come here',
          'how its two more these first well'
        ],
        instructions: 'Type common words fluently. Focus on word recognition rather than individual letters.',
        goals: { minWpm: 22, minAccuracy: 90 },
        prerequisites: ['right-hand-2'],
        estimatedDuration: 15,
        order: 8
      },
      {
        id: 'basic-words-2',
        title: 'Extended Word Practice',
        description: 'Practice longer words and word combinations',
        level: 'beginner',
        category: 'words',
        targetKeys: [],
        content: [
          'because through another much before line',
          'against right old small those both each',
          'house during home school might never system',
          'after without place around something fact'
        ],
        instructions: 'Build fluency with longer words. Maintain consistent rhythm and avoid pausing between letters.',
        goals: { minWpm: 25, minAccuracy: 92 },
        prerequisites: ['basic-words-1'],
        estimatedDuration: 15,
        order: 9
      },

      // Numbers
      {
        id: 'numbers-1',
        title: 'Number Row Basics',
        description: 'Learn to type numbers 1-5 and 6-0',
        level: 'intermediate',
        category: 'numbers',
        targetKeys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        content: [
          '1234567890', '123 456 789',
          '10 20 30 40 50', '60 70 80 90 100',
          '15 25 35 45 55', '65 75 85 95 105',
          '2023 2024 2025', '1990 2000 2010'
        ],
        instructions: 'Use proper finger placement for numbers. Reach up from home row position.',
        goals: { minWpm: 20, minAccuracy: 88 },
        prerequisites: ['basic-words-2'],
        estimatedDuration: 12,
        order: 10
      },

      // Advanced lessons would continue here...
      {
        id: 'symbols-1',
        title: 'Basic Symbols',
        description: 'Learn common symbols and punctuation marks',
        level: 'advanced',
        category: 'symbols',
        targetKeys: ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
        content: [
          '!@#$%^&*()', 'email@domain.com',
          '100% success', '$50 budget', 'C++ language',
          'question?', 'statement!', 'list: item1, item2'
        ],
        instructions: 'Use shift key combinations for symbols. Maintain proper finger placement.',
        goals: { minWpm: 25, minAccuracy: 90 },
        prerequisites: ['numbers-1'],
        estimatedDuration: 15,
        order: 11
      }
    ];

    this.lessons.set(lessons);
  }

  // Public API methods
  getCourses(): TypingCourse[] {
    return this.courses();
  }

  getLessons(): TypingLesson[] {
    return this.lessons();
  }

  getCourseById(courseId: string): TypingCourse | undefined {
    return this.courses().find(course => course.id === courseId);
  }

  getLessonById(lessonId: string): TypingLesson | undefined {
    return this.lessons().find(lesson => lesson.id === lessonId);
  }

  getLessonsForCourse(courseId: string): TypingLesson[] {
    const course = this.getCourseById(courseId);
    if (!course) return [];
    
    return course.lessons
      .map(lessonId => this.getLessonById(lessonId))
      .filter(lesson => lesson !== undefined)
      .sort((a, b) => a!.order - b!.order) as TypingLesson[];
  }

  getAvailableCourses(userLevel?: string): TypingCourse[] {
    // Filter courses based on user's progress and prerequisites
    const progress = this.courseProgress();
    const completedCourses = progress.filter(p => p.completedAt).map(p => p.courseId);
    
    return this.courses().filter(course => {
      if (!course.prerequisites) return true;
      return course.prerequisites.every(prereq => completedCourses.includes(prereq));
    });
  }

  getUserProgress(lessonId: string): UserProgress | undefined {
    return this.userProgress().find(p => p.lessonId === lessonId);
  }

  getCourseProgress(courseId: string): CourseProgress | undefined {
    return this.courseProgress().find(p => p.courseId === courseId);
  }

  startCourse(courseId: string): void {
    const existingProgress = this.getCourseProgress(courseId);
    if (existingProgress) return; // Already started

    const course = this.getCourseById(courseId);
    if (!course) return;

    const newProgress: CourseProgress = {
      courseId,
      startedAt: new Date(),
      lessonsCompleted: 0,
      totalLessons: course.lessons.length,
      overallProgress: 0,
      currentLessonId: course.lessons[0]
    };

    this.courseProgress.update(progress => [...progress, newProgress]);
    this.saveCourseProgress();
  }

  completeLesson(lessonId: string, wpm: number, accuracy: number, timeSpent: number): void {
    const lesson = this.getLessonById(lessonId);
    if (!lesson) return;

    // Calculate stars based on performance
    let stars = 1;
    if (wpm >= lesson.goals.minWpm && accuracy >= lesson.goals.minAccuracy) {
      stars = 2;
      if (wpm >= lesson.goals.minWpm * 1.2 && accuracy >= lesson.goals.minAccuracy + 3) {
        stars = 3;
      }
    }

    // Update or create user progress
    const existingProgress = this.getUserProgress(lessonId);
    if (existingProgress) {
      existingProgress.completed = stars >= 2;
      existingProgress.bestWpm = Math.max(existingProgress.bestWpm, wpm);
      existingProgress.bestAccuracy = Math.max(existingProgress.bestAccuracy, accuracy);
      existingProgress.attempts++;
      existingProgress.timeSpent += timeSpent;
      existingProgress.lastAttempt = new Date();
      existingProgress.stars = Math.max(existingProgress.stars, stars);
      if (stars >= 2) {
        existingProgress.completedAt = new Date();
      }
    } else {
      const newProgress: UserProgress = {
        lessonId,
        completed: stars >= 2,
        bestWpm: wpm,
        bestAccuracy: accuracy,
        attempts: 1,
        timeSpent,
        lastAttempt: new Date(),
        stars,
        completedAt: stars >= 2 ? new Date() : undefined
      };
      this.userProgress.update(progress => [...progress, newProgress]);
    }

    // Update course progress
    this.updateCourseProgress(lessonId);
    this.saveUserProgress();
  }

  private updateCourseProgress(completedLessonId: string): void {
    // Find which course this lesson belongs to
    const course = this.courses().find(c => c.lessons.includes(completedLessonId));
    if (!course) return;

    const courseProgress = this.getCourseProgress(course.id);
    if (!courseProgress) return;

    // Count completed lessons in this course
    const courseLessons = course.lessons;
    const completedLessons = courseLessons.filter(lessonId => {
      const progress = this.getUserProgress(lessonId);
      return progress?.completed;
    }).length;

    // Update progress
    courseProgress.lessonsCompleted = completedLessons;
    courseProgress.overallProgress = (completedLessons / course.lessons.length) * 100;

    // Check if course is completed
    if (completedLessons === course.lessons.length) {
      courseProgress.completedAt = new Date();
    } else {
      // Update current lesson to next incomplete lesson
      const nextLesson = courseLessons.find(lessonId => {
        const progress = this.getUserProgress(lessonId);
        return !progress?.completed;
      });
      courseProgress.currentLessonId = nextLesson;
    }

    this.saveCourseProgress();
  }

  getRecommendedLesson(): TypingLesson | undefined {
    // Find the first incomplete lesson from available courses
    const availableCourses = this.getAvailableCourses();
    
    for (const course of availableCourses) {
      const lessons = this.getLessonsForCourse(course.id);
      const incompleteLesson = lessons.find(lesson => {
        const progress = this.getUserProgress(lesson.id);
        return !progress?.completed;
      });
      
      if (incompleteLesson) {
        return incompleteLesson;
      }
    }

    return undefined;
  }

  getOverallProgress(): { 
    totalLessons: number; 
    completedLessons: number; 
    percentage: number; 
    currentLevel: string;
  } {
    const allLessons = this.lessons();
    const completedLessons = this.userProgress().filter(p => p.completed).length;
    const percentage = allLessons.length > 0 ? (completedLessons / allLessons.length) * 100 : 0;
    
    let currentLevel = 'beginner';
    if (percentage >= 75) currentLevel = 'advanced';
    else if (percentage >= 35) currentLevel = 'intermediate';

    return {
      totalLessons: allLessons.length,
      completedLessons,
      percentage,
      currentLevel
    };
  }

  // Data persistence
  private loadUserProgress(): void {
    const userProgressData = localStorage.getItem(this.USER_PROGRESS_KEY);
    if (userProgressData) {
      try {
        const progress = JSON.parse(userProgressData).map((p: any) => ({
          ...p,
          lastAttempt: new Date(p.lastAttempt),
          completedAt: p.completedAt ? new Date(p.completedAt) : undefined
        }));
        this.userProgress.set(progress);
      } catch (error) {
        console.warn('Failed to load user progress:', error);
      }
    }

    const courseProgressData = localStorage.getItem(this.PROGRESS_STORAGE_KEY);
    if (courseProgressData) {
      try {
        const progress = JSON.parse(courseProgressData).map((p: any) => ({
          ...p,
          startedAt: new Date(p.startedAt),
          completedAt: p.completedAt ? new Date(p.completedAt) : undefined
        }));
        this.courseProgress.set(progress);
      } catch (error) {
        console.warn('Failed to load course progress:', error);
      }
    }
  }

  private saveUserProgress(): void {
    localStorage.setItem(this.USER_PROGRESS_KEY, JSON.stringify(this.userProgress()));
  }

  private saveCourseProgress(): void {
    localStorage.setItem(this.PROGRESS_STORAGE_KEY, JSON.stringify(this.courseProgress()));
  }
}