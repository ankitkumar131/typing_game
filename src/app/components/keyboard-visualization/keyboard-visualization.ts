import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { KeyboardService, KeyboardKey, FingerPosition, KeyHighlight } from '../../services/keyboard';

@Component({
  selector: 'app-keyboard-visualization',
  imports: [CommonModule],
  template: `
    <div class="keyboard-container" [class.show-finger-guide]="showFingerGuide">
      
      <!-- Finger Guide Toggle -->
      <div class="keyboard-controls">
        <button class="control-btn" 
                (click)="toggleFingerGuide()" 
                [class.active]="showFingerGuide"
                title="Toggle finger placement guide">
          <span class="btn-icon">👆</span>
          <span class="btn-text">Finger Guide</span>
        </button>
        
        <button class="control-btn" 
                (click)="toggleHandVisualization()" 
                [class.active]="showHands"
                title="Toggle hand visualization">
          <span class="btn-icon">🖐️</span>
          <span class="btn-text">Hand Guide</span>
        </button>
        
        <button class="control-btn" 
                (click)="resetHighlights()" 
                title="Reset all highlights">
          <span class="btn-icon">🔄</span>
          <span class="btn-text">Reset</span>
        </button>
      </div>

      <!-- Hand Visualization -->
      <div class="hands-container" *ngIf="showHands" @slideIn>
        <div class="hand left-hand">
          <div class="hand-title">Left Hand</div>
          <div class="fingers">
            <div *ngFor="let finger of getLeftHandFingers()" 
                 class="finger-indicator"
                 [style.background-color]="finger.color"
                 [class.active]="isFingerActive(finger.finger)"
                 [title]="finger.finger + ' finger - Home: ' + finger.homeKey.toUpperCase()">
              <div class="finger-name">{{ getFingerDisplayName(finger.finger) }}</div>
              <div class="home-key">{{ finger.homeKey.toUpperCase() }}</div>
            </div>
          </div>
        </div>
        
        <div class="hand right-hand">
          <div class="hand-title">Right Hand</div>
          <div class="fingers">
            <div *ngFor="let finger of getRightHandFingers()" 
                 class="finger-indicator"
                 [style.background-color]="finger.color"
                 [class.active]="isFingerActive(finger.finger)"
                 [title]="finger.finger + ' finger - Home: ' + finger.homeKey.toUpperCase()">
              <div class="finger-name">{{ getFingerDisplayName(finger.finger) }}</div>
              <div class="home-key">{{ finger.homeKey.toUpperCase() }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Keyboard Layout -->
      <div class="keyboard" [class.compact]="compactMode">
        <div *ngFor="let row of keyboardLayout; let rowIndex = index" 
             class="keyboard-row"
             [class.number-row]="rowIndex === 0"
             [class.qwerty-row]="rowIndex === 1"
             [class.home-row]="rowIndex === 2"
             [class.bottom-row]="rowIndex === 3"
             [class.space-row]="rowIndex === 4">
          
          <div *ngFor="let key of row; trackBy: trackByKey" 
               class="key"
               [class]="getKeyClasses(key)"
               [style.background-color]="getKeyBackgroundColor(key)"
               [style.border-color]="getKeyBorderColor(key)"
               [style.color]="getKeyTextColor(key)"
               [title]="getKeyTooltip(key)"
               (mouseenter)="onKeyHover(key)"
               (mouseleave)="onKeyLeave(key)"
               @keyPress>
            
            <!-- Key Display -->
            <div class="key-content">
              <span class="key-main" [class.space-key]="key.key === ' '">
                {{ key.key === ' ' ? 'SPACE' : key.display }}
              </span>
              
              <!-- Finger indicator -->
              <div class="finger-dot" 
                   *ngIf="showFingerGuide && key.type === 'letter'"
                   [style.background-color]="keyboardService.getFingerColor(key.finger)">
              </div>
              
              <!-- Home row indicators -->
              <div class="home-indicator" 
                   *ngIf="isHomeRowKey(key)"
                   [style.border-color]="keyboardService.getFingerColor(key.finger)">
              </div>
              
              <!-- Current character highlight -->
              <div class="key-highlight" 
                   *ngIf="getKeyHighlight(key.key)"
                   [class]="'highlight-' + getKeyHighlight(key.key)?.type"
                   [style.opacity]="(getKeyHighlight(key.key)?.intensity || 0) / 100">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Typing Instructions -->
      <div class="typing-instructions" *ngIf="currentChar || nextChars.length > 0" @fadeIn>
        <div class="instruction-content">
          
          <!-- Current Character -->
          <div class="current-instruction" *ngIf="currentChar">
            <div class="instruction-header">
              <span class="instruction-icon">👆</span>
              <span class="instruction-title">Type Next:</span>
            </div>
            <div class="char-display">
              <span class="target-char">{{ currentChar.toUpperCase() }}</span>
              <span class="finger-name" 
                    [style.color]="getFingerColorForChar(currentChar)">
                {{ getFingerDisplayName(getFingerForChar(currentChar)) }}
              </span>
            </div>
          </div>

          <!-- Next Characters Preview -->
          <div class="next-chars" *ngIf="nextChars.length > 0">
            <div class="preview-title">Coming Up:</div>
            <div class="char-preview">
              <span *ngFor="let char of nextChars.slice(0, 5); let i = index" 
                    class="preview-char"
                    [style.color]="getFingerColorForChar(char)"
                    [style.opacity]="1 - (i * 0.15)">
                {{ char === ' ' ? '␣' : char.toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Typing Statistics -->
      <div class="typing-stats" *ngIf="showStats" @slideIn>
        <div class="stat-item">
          <span class="stat-label">Hand Usage</span>
          <div class="hand-usage-bars">
            <div class="usage-bar left-hand-bar">
              <div class="usage-fill" [style.width.%]="leftHandUsage"></div>
              <span class="usage-label">L: {{ leftHandUsage }}%</span>
            </div>
            <div class="usage-bar right-hand-bar">
              <div class="usage-fill" [style.width.%]="rightHandUsage"></div>
              <span class="usage-label">R: {{ rightHandUsage }}%</span>
            </div>
          </div>
        </div>
        
        <div class="stat-item">
          <span class="stat-label">Finger Stress</span>
          <div class="finger-stress">
            <div *ngFor="let finger of fingerPositions" 
                 class="stress-indicator"
                 [style.background-color]="finger.color"
                 [style.height.%]="getFingerStress(finger.finger)"
                 [title]="finger.finger + ': ' + getFingerStress(finger.finger) + '%'">
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './keyboard-visualization.scss',
  animations: [
    trigger('keyPress', [
      transition(':enter', [
        style({ transform: 'scale(0.95)', backgroundColor: 'var(--key-active-color)' }),
        animate('150ms ease-out', style({ transform: 'scale(1)', backgroundColor: 'var(--key-default-color)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class KeyboardVisualizationComponent implements OnInit, OnChanges {
  @Input() currentChar = '';
  @Input() nextChars: string[] = [];
  @Input() highlights: KeyHighlight[] = [];
  @Input() showFingerGuide = true;
  @Input() showHands = false;
  @Input() showStats = false;
  @Input() compactMode = false;
  @Input() leftHandUsage = 50;
  @Input() rightHandUsage = 50;
  @Input() fingerStressData: { [finger: string]: number } = {};

  keyboardLayout: KeyboardKey[][] = [];
  fingerPositions: FingerPosition[] = [];
  activeFingers = new Set<string>();
  hoveredKey: KeyboardKey | null = null;

  constructor(public keyboardService: KeyboardService) {}

  ngOnInit(): void {
    this.keyboardLayout = this.keyboardService.getKeyboardLayout();
    this.fingerPositions = this.keyboardService.getFingerPositions();
    this.updateActiveFingers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentChar'] || changes['highlights']) {
      this.updateActiveFingers();
    }
  }

  // Control methods
  toggleFingerGuide(): void {
    this.showFingerGuide = !this.showFingerGuide;
  }

  toggleHandVisualization(): void {
    this.showHands = !this.showHands;
  }

  resetHighlights(): void {
    this.highlights = [];
    this.activeFingers.clear();
  }

  // Key interaction methods
  onKeyHover(key: KeyboardKey): void {
    this.hoveredKey = key;
    if (this.showFingerGuide) {
      this.activeFingers.add(key.finger);
    }
  }

  onKeyLeave(key: KeyboardKey): void {
    this.hoveredKey = null;
    if (this.showFingerGuide && !this.isKeyHighlighted(key.key)) {
      this.activeFingers.delete(key.finger);
    }
  }

  // Styling methods
  getKeyClasses(key: KeyboardKey): string {
    const classes = ['key-base', `key-${key.type}`, `key-${key.size}`];
    
    if (this.isHomeRowKey(key)) classes.push('home-key');
    if (this.isKeyHighlighted(key.key)) classes.push('highlighted');
    if (this.hoveredKey === key) classes.push('hovered');
    if (this.activeFingers.has(key.finger)) classes.push('finger-active');
    
    const highlight = this.getKeyHighlight(key.key);
    if (highlight) {
      classes.push(`highlight-${highlight.type}`);
    }
    
    return classes.join(' ');
  }

  getKeyBackgroundColor(key: KeyboardKey): string {
    if (this.isKeyHighlighted(key.key)) {
      const highlight = this.getKeyHighlight(key.key);
      if (highlight?.type === 'current') return '#007bff';
      if (highlight?.type === 'next') return '#28a745';
      if (highlight?.type === 'correct') return '#28a745';
      if (highlight?.type === 'incorrect') return '#dc3545';
    }
    
    if (this.showFingerGuide && this.activeFingers.has(key.finger)) {
      const fingerColor = this.keyboardService.getFingerColor(key.finger);
      return this.lightenColor(fingerColor, 0.8);
    }
    
    return '';
  }

  getKeyBorderColor(key: KeyboardKey): string {
    if (this.showFingerGuide) {
      return this.keyboardService.getFingerColor(key.finger);
    }
    return '';
  }

  getKeyTextColor(key: KeyboardKey): string {
    if (this.isKeyHighlighted(key.key)) {
      return 'white';
    }
    return '';
  }

  getKeyTooltip(key: KeyboardKey): string {
    const finger = this.fingerPositions.find(f => f.finger === key.finger);
    const fingerName = finger ? this.getFingerDisplayName(finger.finger) : 'Unknown';
    
    let tooltip = `${key.display} - ${fingerName} finger`;
    
    if (this.isHomeRowKey(key)) {
      tooltip += ' (Home position)';
    }
    
    return tooltip;
  }

  // Helper methods
  trackByKey(index: number, key: KeyboardKey): string {
    return key.key;
  }

  isHomeRowKey(key: KeyboardKey): boolean {
    const homeKeys = this.keyboardService.getHomeRowKeys();
    return homeKeys.includes(key.key);
  }

  isKeyHighlighted(keyChar: string): boolean {
    return this.highlights.some(h => h.key === keyChar);
  }

  getKeyHighlight(keyChar: string): KeyHighlight | undefined {
    return this.highlights.find(h => h.key === keyChar);
  }

  getFingerForChar(char: string): string {
    const key = this.keyboardService.getKeyByCharacter(char);
    return key?.finger || '';
  }

  getFingerColorForChar(char: string): string {
    const finger = this.getFingerForChar(char);
    return this.keyboardService.getFingerColor(finger);
  }

  getFingerDisplayName(finger: string): string {
    const names: { [key: string]: string } = {
      'left-pinky': 'Left Pinky',
      'left-ring': 'Left Ring',
      'left-middle': 'Left Middle',
      'left-index': 'Left Index',
      'right-index': 'Right Index',
      'right-middle': 'Right Middle',
      'right-ring': 'Right Ring',
      'right-pinky': 'Right Pinky',
      'thumbs': 'Thumbs',
      'left-thumb': 'Left Thumb',
      'right-thumb': 'Right Thumb'
    };
    return names[finger] || finger;
  }

  getLeftHandFingers(): FingerPosition[] {
    return this.fingerPositions.filter(f => f.side === 'left');
  }

  getRightHandFingers(): FingerPosition[] {
    return this.fingerPositions.filter(f => f.side === 'right');
  }

  isFingerActive(finger: string): boolean {
    return this.activeFingers.has(finger);
  }

  getFingerStress(finger: string): number {
    return this.fingerStressData[finger] || 0;
  }

  private updateActiveFingers(): void {
    this.activeFingers.clear();
    
    // Highlight current character's finger
    if (this.currentChar) {
      const finger = this.getFingerForChar(this.currentChar);
      if (finger) {
        this.activeFingers.add(finger);
      }
    }
    
    // Highlight fingers from explicit highlights
    this.highlights.forEach(highlight => {
      const finger = this.getFingerForChar(highlight.key);
      if (finger) {
        this.activeFingers.add(finger);
      }
    });
  }

  private lightenColor(color: string, amount: number): string {
    // Simple color lightening function
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(255 * amount);
    const R = (num >> 16) + amt;
    const B = (num >> 8 & 0x00FF) + amt;
    const G = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
      (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + 
      (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
  }
}