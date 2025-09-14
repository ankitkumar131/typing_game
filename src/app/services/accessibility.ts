import { Injectable, signal, computed, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export interface AccessibilitySettings {
  screenReaderEnabled: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
  audioFeedback: boolean;
  colorBlindSupport: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  focusIndicatorEnhanced: boolean;
  skipToContent: boolean;
  autoAnnouncements: boolean;
}

export interface AriaAnnouncement {
  message: string;
  priority: 'polite' | 'assertive' | 'off';
  delay?: number;
  category?: 'error' | 'success' | 'info' | 'warning';
}

export interface AccessibilityShortcut {
  key: string;
  modifier?: 'ctrl' | 'alt' | 'shift';
  action: string;
  description: string;
  handler: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private readonly STORAGE_KEY = 'typingGame_accessibilitySettings';
  private document = inject(DOCUMENT);
  
  // Screen reader elements
  private announceElement?: HTMLElement;
  private statusElement?: HTMLElement;
  
  // Settings state
  private accessibilitySettings = signal<AccessibilitySettings>({
    screenReaderEnabled: false,
    highContrastMode: false,
    reducedMotion: false,
    largeText: false,
    keyboardNavigation: true,
    audioFeedback: false,
    colorBlindSupport: 'none',
    focusIndicatorEnhanced: false,
    skipToContent: true,
    autoAnnouncements: true
  });
  
  // Focus management
  private focusHistory: HTMLElement[] = [];
  private currentFocusIndex = -1;
  
  // Keyboard shortcuts
  private shortcuts: AccessibilityShortcut[] = [];
  
  // Computed properties
  settings = computed(() => this.accessibilitySettings());
  isScreenReaderActive = computed(() => this.accessibilitySettings().screenReaderEnabled);
  isHighContrastMode = computed(() => this.accessibilitySettings().highContrastMode);
  isReducedMotion = computed(() => this.accessibilitySettings().reducedMotion);

  constructor() {
    this.loadAccessibilitySettings();
    this.detectAccessibilityPreferences();
    this.setupScreenReaderElements();
    this.setupKeyboardShortcuts();
    this.applyAccessibilitySettings();
  }

  // Settings management
  updateSettings(updates: Partial<AccessibilitySettings>): void {
    this.accessibilitySettings.update(current => ({ ...current, ...updates }));
    this.saveAccessibilitySettings();
    this.applyAccessibilitySettings();
  }

  private loadAccessibilitySettings(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        this.accessibilitySettings.set({ ...this.accessibilitySettings(), ...settings });
      } catch (error) {
        console.warn('Failed to load accessibility settings:', error);
      }
    }
  }

  private saveAccessibilitySettings(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.accessibilitySettings()));
  }

  // Auto-detect accessibility preferences
  private detectAccessibilityPreferences(): void {
    // Detect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.updateSettings({ reducedMotion: true });
    }
    
    // Detect prefers-contrast
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.updateSettings({ highContrastMode: true });
    }
    
    // Detect screen reader usage
    if (this.detectScreenReader()) {
      this.updateSettings({ screenReaderEnabled: true });
    }
    
    // Listen for changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.updateSettings({ reducedMotion: e.matches });
    });
    
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.updateSettings({ highContrastMode: e.matches });
    });
  }

  private detectScreenReader(): boolean {
    // Various methods to detect screen reader
    return !!(
      navigator.userAgent.match(/NVDA|JAWS|VoiceOver|TalkBack|Dragon NaturallySpeaking/i) ||
      window.speechSynthesis ||
      document.querySelector('[aria-live]') ||
      // Check for screen reader specific attributes
      document.documentElement.getAttribute('data-whatinput') === 'keyboard'
    );
  }

  // Screen reader support
  private setupScreenReaderElements(): void {
    // Create live region for announcements
    this.announceElement = this.document.createElement('div');
    this.announceElement.setAttribute('aria-live', 'polite');
    this.announceElement.setAttribute('aria-atomic', 'true');
    this.announceElement.setAttribute('aria-label', 'Game announcements');
    this.announceElement.className = 'sr-only';
    this.announceElement.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    this.document.body.appendChild(this.announceElement);
    
    // Create status region for game status
    this.statusElement = this.document.createElement('div');
    this.statusElement.setAttribute('aria-live', 'assertive');
    this.statusElement.setAttribute('aria-atomic', 'false');
    this.statusElement.setAttribute('aria-label', 'Game status');
    this.statusElement.className = 'sr-only';
    this.statusElement.style.cssText = this.announceElement.style.cssText;
    this.document.body.appendChild(this.statusElement);
  }

  announce(announcement: AriaAnnouncement): void {
    if (!this.settings().autoAnnouncements && !this.settings().screenReaderEnabled) {
      return;
    }
    
    const element = announcement.priority === 'assertive' ? this.statusElement : this.announceElement;
    if (!element) return;
    
    // Clear previous content
    element.textContent = '';
    
    // Set new content with delay if specified
    const announceText = () => {
      element.textContent = announcement.message;
      
      // Clear after a reasonable time to avoid cluttering
      setTimeout(() => {
        if (element.textContent === announcement.message) {
          element.textContent = '';
        }
      }, 5000);
    };
    
    if (announcement.delay) {
      setTimeout(announceText, announcement.delay);
    } else {
      announceText();
    }
  }

  // Keyboard navigation support
  setupKeyboardShortcuts(): void {
    this.shortcuts = [
      {
        key: 'h',
        modifier: 'alt',
        action: 'showHelp',
        description: 'Show keyboard shortcuts help',
        handler: () => this.showKeyboardHelp()
      },
      {
        key: 's',
        modifier: 'alt',
        action: 'skipToContent',
        description: 'Skip to main content',
        handler: () => this.skipToContent()
      },
      {
        key: 'p',
        modifier: 'alt',
        action: 'pauseGame',
        description: 'Pause or resume game',
        handler: () => this.announceGameAction('pause')
      },
      {
        key: 'r',
        modifier: 'alt',
        action: 'readStats',
        description: 'Read current game statistics',
        handler: () => this.readGameStats()
      },
      {
        key: 'w',
        modifier: 'alt',
        action: 'readCurrentWord',
        description: 'Read current word',
        handler: () => this.readCurrentWord()
      }
    ];
    
    // Add event listener for shortcuts
    this.document.addEventListener('keydown', (event) => {
      this.handleKeyboardShortcut(event);
    });
  }

  private handleKeyboardShortcut(event: KeyboardEvent): void {
    if (!this.settings().keyboardNavigation) return;
    
    const shortcut = this.shortcuts.find(s => {
      const modifierMatch = !s.modifier || 
        (s.modifier === 'ctrl' && event.ctrlKey) ||
        (s.modifier === 'alt' && event.altKey) ||
        (s.modifier === 'shift' && event.shiftKey);
      
      return s.key.toLowerCase() === event.key.toLowerCase() && modifierMatch;
    });
    
    if (shortcut) {
      event.preventDefault();
      shortcut.handler();
      this.announce({
        message: `Executed: ${shortcut.description}`,
        priority: 'polite'
      });
    }
  }

  // Content navigation
  skipToContent(): void {
    const mainContent = this.document.querySelector('main, [role="main"], .main-content, .game-container');
    if (mainContent && mainContent instanceof HTMLElement) {
      mainContent.focus();
      this.announce({
        message: 'Skipped to main content',
        priority: 'polite'
      });
    }
  }

  showKeyboardHelp(): void {
    const helpText = this.shortcuts
      .map(s => `${s.modifier ? s.modifier + '+' : ''}${s.key}: ${s.description}`)
      .join('. ');
    
    this.announce({
      message: `Keyboard shortcuts: ${helpText}`,
      priority: 'polite'
    });
  }

  // Game-specific accessibility features
  announceGameStart(): void {
    this.announce({
      message: 'Game started. Type the words as they appear. Use Alt+R to hear your current statistics.',
      priority: 'assertive'
    });
  }

  announceGameEnd(wpm: number, accuracy: number): void {
    this.announce({
      message: `Game finished. Your speed was ${wpm} words per minute with ${accuracy}% accuracy.`,
      priority: 'assertive'
    });
  }

  announceWordCorrect(word: string, timeTaken: number): void {
    if (this.settings().audioFeedback) {
      this.announce({
        message: `Correct: ${word}. Time: ${timeTaken.toFixed(1)} seconds.`,
        priority: 'polite'
      });
    }
  }

  announceWordIncorrect(expected: string, typed: string): void {
    this.announce({
      message: `Incorrect. Expected: ${expected}. You typed: ${typed}.`,
      priority: 'assertive'
    });
  }

  announceTypingError(expectedChar: string, typedChar: string): void {
    if (this.settings().audioFeedback) {
      this.announce({
        message: `Error: Expected ${expectedChar}, typed ${typedChar}`,
        priority: 'polite',
        delay: 100
      });
    }
  }

  private announceGameAction(action: string): void {
    // This would integrate with the game service
    this.announce({
      message: `Game ${action} action triggered`,
      priority: 'polite'
    });
  }

  private readGameStats(): void {
    // This would integrate with the game service to read current stats
    this.announce({
      message: 'Reading current game statistics...',
      priority: 'polite'
    });
  }

  private readCurrentWord(): void {
    // This would integrate with the game service to read current word
    this.announce({
      message: 'Reading current word...',
      priority: 'polite'
    });
  }

  // Visual accessibility
  private applyAccessibilitySettings(): void {
    const settings = this.settings();
    const body = this.document.body;
    const root = this.document.documentElement;
    
    // High contrast mode
    if (settings.highContrastMode) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (settings.reducedMotion) {
      body.classList.add('reduced-motion');
    } else {
      body.classList.remove('reduced-motion');
    }
    
    // Large text
    if (settings.largeText) {
      body.classList.add('large-text');
    } else {
      body.classList.remove('large-text');
    }
    
    // Enhanced focus indicators
    if (settings.focusIndicatorEnhanced) {
      body.classList.add('enhanced-focus');
    } else {
      body.classList.remove('enhanced-focus');
    }
    
    // Color blind support
    if (settings.colorBlindSupport !== 'none') {
      body.classList.add(`colorblind-${settings.colorBlindSupport}`);
    } else {
      body.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
    }
  }

  // Focus management
  manageFocus(element: HTMLElement): void {
    this.focusHistory.push(element);
    this.currentFocusIndex = this.focusHistory.length - 1;
  }

  restorePreviousFocus(): void {
    if (this.currentFocusIndex > 0) {
      this.currentFocusIndex--;
      const element = this.focusHistory[this.currentFocusIndex];
      if (element && element.isConnected) {
        element.focus();
      }
    }
  }

  // ARIA label helpers
  generateWordLabel(word: string, position: number, total: number): string {
    return `Word ${position} of ${total}: ${word}`;
  }

  generateStatsLabel(wpm: number, accuracy: number, streak: number): string {
    return `Current stats: ${wpm} words per minute, ${accuracy}% accuracy, ${streak} word streak`;
  }

  // Cleanup
  destroy(): void {
    if (this.announceElement) {
      this.document.body.removeChild(this.announceElement);
    }
    if (this.statusElement) {
      this.document.body.removeChild(this.statusElement);
    }
  }
}