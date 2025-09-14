import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobileSupportService, TouchKey } from '../../services/mobile-support';

@Component({
  selector: 'app-mobile-keyboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="mobile-keyboard" 
      [class.hidden]="!shouldShow()"
      [style.height.px]="keyboardHeight()"
      [attr.data-theme]="settings().keyboardTheme"
    >
      <div class="keyboard-container">
        @for (row of keyboard().layout; track $index) {
          <div class="keyboard-row">
            @for (key of row; track key.key) {
              <button
                class="keyboard-key"
                [class.active]="key.isActive"
                [class.shift-active]="keyboard().isShiftActive && key.type === 'shift'"
                [class.caps-active]="keyboard().isCapsLockActive && key.type === 'caps'"
                [class]="getKeyClasses(key)"
                [style.flex]="getKeyFlex(key)"
                (touchstart)="onKeyTouchStart($event, key)"
                (touchend)="onKeyTouchEnd($event, key)"
                (click)="onKeyClick(key)"
                [attr.aria-label]="getKeyAriaLabel(key)"
                type="button"
              >
                <span class="key-display">{{ getKeyDisplay(key) }}</span>
                @if (key.type === 'shift' && keyboard().isShiftActive) {
                  <span class="shift-indicator">●</span>
                }
                @if (key.type === 'caps' && keyboard().isCapsLockActive) {
                  <span class="caps-indicator">●</span>
                }
              </button>
            }
          </div>
        }
      </div>
      
      <!-- Layout switcher -->
      <div class="layout-switcher">
        <button 
          class="layout-btn"
          [class.active]="keyboard().currentLayout === 'qwerty'"
          (click)="switchLayout('qwerty')"
          type="button"
        >
          ABC
        </button>
        <button 
          class="layout-btn"
          [class.active]="keyboard().currentLayout === 'numbers'"
          (click)="switchLayout('numbers')"
          type="button"
        >
          123
        </button>
        <button 
          class="layout-btn"
          [class.active]="keyboard().currentLayout === 'symbols'"
          (click)="switchLayout('symbols')"
          type="button"
        >
          !@#
        </button>
      </div>
    </div>
  `,
  styles: [`
    .mobile-keyboard {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--keyboard-bg, #f0f0f0);
      border-top: 1px solid var(--keyboard-border, #ccc);
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      transition: transform 0.3s ease;
      user-select: none;
    }
    
    .mobile-keyboard.hidden {
      transform: translateY(100%);
    }
    
    .mobile-keyboard[data-theme="dark"] {
      --keyboard-bg: #2a2a2a;
      --keyboard-border: #444;
      --key-bg: #3a3a3a;
      --key-border: #555;
      --key-text: #fff;
      --key-active: #007acc;
    }
    
    .mobile-keyboard[data-theme="light"] {
      --keyboard-bg: #f8f9fa;
      --keyboard-border: #dee2e6;
      --key-bg: #ffffff;
      --key-border: #ced4da;
      --key-text: #212529;
      --key-active: #0066cc;
    }
    
    .keyboard-container {
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .keyboard-row {
      display: flex;
      gap: 4px;
      justify-content: center;
    }
    
    .keyboard-key {
      background: var(--key-bg, #fff);
      border: 1px solid var(--key-border, #ddd);
      border-radius: 6px;
      color: var(--key-text, #333);
      font-size: 16px;
      font-weight: 500;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      transition: all 0.15s ease;
      outline: none;
      touch-action: manipulation;
    }
    
    .keyboard-key:hover {
      background: var(--key-hover, #f5f5f5);
      transform: scale(1.05);
    }
    
    .keyboard-key:active,
    .keyboard-key.active {
      background: var(--key-active, #007acc);
      color: white;
      transform: scale(0.95);
    }
    
    .keyboard-key.shift-active,
    .keyboard-key.caps-active {
      background: var(--key-active, #007acc);
      color: white;
    }
    
    .keyboard-key.key-width-normal {
      flex: 1;
      max-width: 44px;
    }
    
    .keyboard-key.key-width-wide {
      flex: 1.5;
    }
    
    .keyboard-key.key-width-extra-wide {
      flex: 3;
    }
    
    .keyboard-key.key-type-space {
      min-width: 120px;
    }
    
    .keyboard-key.key-type-backspace,
    .keyboard-key.key-type-enter {
      font-size: 18px;
    }
    
    .key-display {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .shift-indicator,
    .caps-indicator {
      position: absolute;
      top: 2px;
      right: 4px;
      font-size: 8px;
      color: currentColor;
    }
    
    .layout-switcher {
      display: flex;
      gap: 2px;
      padding: 4px 8px;
      background: var(--keyboard-bg, #f0f0f0);
      border-top: 1px solid var(--keyboard-border, #ccc);
    }
    
    .layout-btn {
      flex: 1;
      background: var(--key-bg, #fff);
      border: 1px solid var(--key-border, #ddd);
      border-radius: 4px;
      color: var(--key-text, #333);
      font-size: 12px;
      font-weight: 500;
      height: 28px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .layout-btn:hover {
      background: var(--key-hover, #f5f5f5);
    }
    
    .layout-btn.active {
      background: var(--key-active, #007acc);
      color: white;
    }
    
    /* Responsive adjustments */
    @media (max-width: 480px) {
      .keyboard-key {
        min-height: 40px;
        font-size: 14px;
      }
      
      .keyboard-container {
        padding: 6px;
        gap: 3px;
      }
      
      .keyboard-row {
        gap: 3px;
      }
    }
    
    @media (orientation: landscape) and (max-height: 500px) {
      .keyboard-key {
        min-height: 36px;
        font-size: 14px;
      }
      
      .keyboard-container {
        padding: 4px;
        gap: 2px;
      }
    }
  `]
})
export class MobileKeyboardComponent {
  @Input() currentChar = '';
  @Input() nextChars: string[] = [];
  @Output() keyPress = new EventEmitter<string>();
  @Output() specialKey = new EventEmitter<string>();

  // Computed properties from service
  keyboard = computed(() => this.mobileService.keyboard());
  settings = computed(() => this.mobileService.settings());
  shouldShow = computed(() => this.mobileService.shouldShowVirtualKeyboard());
  keyboardHeight = computed(() => this.mobileService.getOptimalKeyboardHeight());

  constructor(private mobileService: MobileSupportService) {}

  onKeyClick(key: TouchKey): void {
    this.handleKeyInput(key);
  }

  onKeyTouchStart(event: TouchEvent, key: TouchKey): void {
    event.preventDefault();
    key.isActive = true;
  }

  onKeyTouchEnd(event: TouchEvent, key: TouchKey): void {
    event.preventDefault();
    key.isActive = false;
    this.handleKeyInput(key);
  }

  private handleKeyInput(key: TouchKey): void {
    const result = this.mobileService.handleTouchInput(key.key);
    
    if (this.isSpecialKey(key.key)) {
      this.specialKey.emit(key.key);
    } else if (result) {
      this.keyPress.emit(result);
    }
  }

  switchLayout(layout: 'qwerty' | 'numbers' | 'symbols'): void {
    this.mobileService.switchKeyboardLayout(layout);
  }

  getKeyDisplay(key: TouchKey): string {
    const keyboard = this.keyboard();
    
    // Show alternate display for shift/caps
    if (key.type === 'letter' && (keyboard.isShiftActive || keyboard.isCapsLockActive)) {
      return key.alternateDisplay || key.display.toUpperCase();
    }
    
    // Show symbols for numbers when shift is active
    if (key.type === 'number' && keyboard.isShiftActive && key.alternateDisplay) {
      return key.alternateDisplay;
    }
    
    return key.display;
  }

  getKeyClasses(key: TouchKey): string {
    const classes = [
      `key-type-${key.type}`,
      `key-width-${key.width}`
    ];
    
    // Add highlight for current/next characters
    if (this.shouldHighlightKey(key)) {
      classes.push('key-highlighted');
    }
    
    return classes.join(' ');
  }

  getKeyFlex(key: TouchKey): string {
    switch (key.width) {
      case 'wide': return '1.5';
      case 'extra-wide': return '3';
      default: return '1';
    }
  }

  getKeyAriaLabel(key: TouchKey): string {
    switch (key.type) {
      case 'space': return 'Space bar';
      case 'backspace': return 'Backspace';
      case 'enter': return 'Enter';
      case 'shift': return 'Shift';
      case 'caps': return 'Caps Lock';
      case 'layout-switch': return `Switch to ${key.display} layout`;
      default: return `${key.display} key`;
    }
  }

  private shouldHighlightKey(key: TouchKey): boolean {
    if (!this.settings().showKeyHighlights) return false;
    
    const currentChar = this.currentChar.toLowerCase();
    const keyChar = key.key.toLowerCase();
    
    // Highlight current character
    if (currentChar === keyChar) return true;
    
    // Highlight space bar for space character
    if (currentChar === ' ' && key.type === 'space') return true;
    
    // Highlight next characters
    return this.nextChars.some(char => char.toLowerCase() === keyChar);
  }

  private isSpecialKey(key: string): boolean {
    const specialKeys = ['Backspace', 'Enter', 'Shift', 'CapsLock', 'Tab'];
    return specialKeys.includes(key);
  }
}