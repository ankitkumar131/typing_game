import { Injectable, signal, computed } from '@angular/core';

export interface TouchKeyboard {
  layout: TouchKey[][];
  currentLayout: 'qwerty' | 'numbers' | 'symbols';
  isShiftActive: boolean;
  isCapsLockActive: boolean;
}

export interface TouchKey {
  key: string;
  display: string;
  type: 'letter' | 'number' | 'symbol' | 'space' | 'backspace' | 'enter' | 'shift' | 'caps' | 'layout-switch';
  width: 'normal' | 'wide' | 'extra-wide';
  position: { row: number; col: number };
  isActive?: boolean;
  alternateDisplay?: string; // For caps/shift versions
}

export interface MobileGameSettings {
  enableVirtualKeyboard: boolean;
  showKeyHighlights: boolean;
  hapticFeedback: boolean;
  autoCorrect: boolean;
  swipeGestures: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  keyboardTheme: 'light' | 'dark' | 'auto';
}

export interface TouchEvent {
  type: 'tap' | 'swipe' | 'hold' | 'pinch';
  key?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  force?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MobileSupportService {
  private readonly STORAGE_KEY = 'typingGame_mobileSettings';
  
  // Device detection
  private isMobile = signal<boolean>(this.detectMobileDevice());
  private isTablet = signal<boolean>(this.detectTabletDevice());
  private hasTouch = signal<boolean>(this.detectTouchSupport());
  private screenOrientation = signal<'portrait' | 'landscape'>('portrait');
  
  // Mobile settings
  private mobileSettings = signal<MobileGameSettings>({
    enableVirtualKeyboard: true,
    showKeyHighlights: true,
    hapticFeedback: true,
    autoCorrect: false,
    swipeGestures: true,
    fontSize: 'medium',
    keyboardTheme: 'auto'
  });
  
  // Touch keyboard state
  private touchKeyboard = signal<TouchKeyboard>({
    layout: [],
    currentLayout: 'qwerty',
    isShiftActive: false,
    isCapsLockActive: false
  });

  // Computed properties
  isMobileDevice = computed(() => this.isMobile());
  isTabletDevice = computed(() => this.isTablet());
  hasTouchSupport = computed(() => this.hasTouch());
  currentOrientation = computed(() => this.screenOrientation());
  settings = computed(() => this.mobileSettings());
  keyboard = computed(() => this.touchKeyboard());

  constructor() {
    this.loadMobileSettings();
    this.initializeTouchKeyboard();
    this.setupOrientationListener();
    this.setupTouchEventListeners();
  }

  // Device detection methods
  private detectMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private detectTabletDevice(): boolean {
    return /iPad|Android(?=.*Mobile)|Tablet/i.test(navigator.userAgent) || 
           (this.detectMobileDevice() && window.screen.width >= 768);
  }

  private detectTouchSupport(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  private setupOrientationListener(): void {
    const updateOrientation = () => {
      if (window.innerHeight > window.innerWidth) {
        this.screenOrientation.set('portrait');
      } else {
        this.screenOrientation.set('landscape');
      }
    };

    window.addEventListener('orientationchange', updateOrientation);
    window.addEventListener('resize', updateOrientation);
    updateOrientation(); // Initial check
  }

  private setupTouchEventListeners(): void {
    if (!this.hasTouch()) return;

    // Prevent zoom on double tap for better UX
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });

    // Prevent context menu on long press
    document.addEventListener('contextmenu', (event) => {
      if (this.isMobileDevice()) {
        event.preventDefault();
      }
    });
  }

  // Touch keyboard initialization
  private initializeTouchKeyboard(): void {
    const qwertyLayout = this.createQwertyLayout();
    const numbersLayout = this.createNumbersLayout();
    const symbolsLayout = this.createSymbolsLayout();

    this.touchKeyboard.update(keyboard => ({
      ...keyboard,
      layout: qwertyLayout
    }));
  }

  private createQwertyLayout(): TouchKey[][] {
    return [
      // Row 1: Numbers
      [
        { key: '1', display: '1', type: 'number', width: 'normal', position: { row: 0, col: 0 }, alternateDisplay: '!' },
        { key: '2', display: '2', type: 'number', width: 'normal', position: { row: 0, col: 1 }, alternateDisplay: '@' },
        { key: '3', display: '3', type: 'number', width: 'normal', position: { row: 0, col: 2 }, alternateDisplay: '#' },
        { key: '4', display: '4', type: 'number', width: 'normal', position: { row: 0, col: 3 }, alternateDisplay: '$' },
        { key: '5', display: '5', type: 'number', width: 'normal', position: { row: 0, col: 4 }, alternateDisplay: '%' },
        { key: '6', display: '6', type: 'number', width: 'normal', position: { row: 0, col: 5 }, alternateDisplay: '^' },
        { key: '7', display: '7', type: 'number', width: 'normal', position: { row: 0, col: 6 }, alternateDisplay: '&' },
        { key: '8', display: '8', type: 'number', width: 'normal', position: { row: 0, col: 7 }, alternateDisplay: '*' },
        { key: '9', display: '9', type: 'number', width: 'normal', position: { row: 0, col: 8 }, alternateDisplay: '(' },
        { key: '0', display: '0', type: 'number', width: 'normal', position: { row: 0, col: 9 }, alternateDisplay: ')' }
      ],
      // Row 2: QWERTY
      [
        { key: 'q', display: 'q', type: 'letter', width: 'normal', position: { row: 1, col: 0 }, alternateDisplay: 'Q' },
        { key: 'w', display: 'w', type: 'letter', width: 'normal', position: { row: 1, col: 1 }, alternateDisplay: 'W' },
        { key: 'e', display: 'e', type: 'letter', width: 'normal', position: { row: 1, col: 2 }, alternateDisplay: 'E' },
        { key: 'r', display: 'r', type: 'letter', width: 'normal', position: { row: 1, col: 3 }, alternateDisplay: 'R' },
        { key: 't', display: 't', type: 'letter', width: 'normal', position: { row: 1, col: 4 }, alternateDisplay: 'T' },
        { key: 'y', display: 'y', type: 'letter', width: 'normal', position: { row: 1, col: 5 }, alternateDisplay: 'Y' },
        { key: 'u', display: 'u', type: 'letter', width: 'normal', position: { row: 1, col: 6 }, alternateDisplay: 'U' },
        { key: 'i', display: 'i', type: 'letter', width: 'normal', position: { row: 1, col: 7 }, alternateDisplay: 'I' },
        { key: 'o', display: 'o', type: 'letter', width: 'normal', position: { row: 1, col: 8 }, alternateDisplay: 'O' },
        { key: 'p', display: 'p', type: 'letter', width: 'normal', position: { row: 1, col: 9 }, alternateDisplay: 'P' }
      ],
      // Row 3: ASDF
      [
        { key: 'a', display: 'a', type: 'letter', width: 'normal', position: { row: 2, col: 0 }, alternateDisplay: 'A' },
        { key: 's', display: 's', type: 'letter', width: 'normal', position: { row: 2, col: 1 }, alternateDisplay: 'S' },
        { key: 'd', display: 'd', type: 'letter', width: 'normal', position: { row: 2, col: 2 }, alternateDisplay: 'D' },
        { key: 'f', display: 'f', type: 'letter', width: 'normal', position: { row: 2, col: 3 }, alternateDisplay: 'F' },
        { key: 'g', display: 'g', type: 'letter', width: 'normal', position: { row: 2, col: 4 }, alternateDisplay: 'G' },
        { key: 'h', display: 'h', type: 'letter', width: 'normal', position: { row: 2, col: 5 }, alternateDisplay: 'H' },
        { key: 'j', display: 'j', type: 'letter', width: 'normal', position: { row: 2, col: 6 }, alternateDisplay: 'J' },
        { key: 'k', display: 'k', type: 'letter', width: 'normal', position: { row: 2, col: 7 }, alternateDisplay: 'K' },
        { key: 'l', display: 'l', type: 'letter', width: 'normal', position: { row: 2, col: 8 }, alternateDisplay: 'L' },
        { key: 'Backspace', display: '⌫', type: 'backspace', width: 'normal', position: { row: 2, col: 9 } }
      ],
      // Row 4: ZXCV
      [
        { key: 'Shift', display: '⇧', type: 'shift', width: 'wide', position: { row: 3, col: 0 } },
        { key: 'z', display: 'z', type: 'letter', width: 'normal', position: { row: 3, col: 1 }, alternateDisplay: 'Z' },
        { key: 'x', display: 'x', type: 'letter', width: 'normal', position: { row: 3, col: 2 }, alternateDisplay: 'X' },
        { key: 'c', display: 'c', type: 'letter', width: 'normal', position: { row: 3, col: 3 }, alternateDisplay: 'C' },
        { key: 'v', display: 'v', type: 'letter', width: 'normal', position: { row: 3, col: 4 }, alternateDisplay: 'V' },
        { key: 'b', display: 'b', type: 'letter', width: 'normal', position: { row: 3, col: 5 }, alternateDisplay: 'B' },
        { key: 'n', display: 'n', type: 'letter', width: 'normal', position: { row: 3, col: 6 }, alternateDisplay: 'N' },
        { key: 'm', display: 'm', type: 'letter', width: 'normal', position: { row: 3, col: 7 }, alternateDisplay: 'M' },
        { key: 'Enter', display: '↵', type: 'enter', width: 'wide', position: { row: 3, col: 8 } }
      ],
      // Row 5: Space and controls
      [
        { key: '123', display: '123', type: 'layout-switch', width: 'normal', position: { row: 4, col: 0 } },
        { key: ',', display: ',', type: 'symbol', width: 'normal', position: { row: 4, col: 1 } },
        { key: ' ', display: 'Space', type: 'space', width: 'extra-wide', position: { row: 4, col: 2 } },
        { key: '.', display: '.', type: 'symbol', width: 'normal', position: { row: 4, col: 3 } },
        { key: '?!', display: '?!', type: 'layout-switch', width: 'normal', position: { row: 4, col: 4 } }
      ]
    ];
  }

  private createNumbersLayout(): TouchKey[][] {
    return [
      [
        { key: '1', display: '1', type: 'number', width: 'normal', position: { row: 0, col: 0 } },
        { key: '2', display: '2', type: 'number', width: 'normal', position: { row: 0, col: 1 } },
        { key: '3', display: '3', type: 'number', width: 'normal', position: { row: 0, col: 2 } }
      ],
      [
        { key: '4', display: '4', type: 'number', width: 'normal', position: { row: 1, col: 0 } },
        { key: '5', display: '5', type: 'number', width: 'normal', position: { row: 1, col: 1 } },
        { key: '6', display: '6', type: 'number', width: 'normal', position: { row: 1, col: 2 } }
      ],
      [
        { key: '7', display: '7', type: 'number', width: 'normal', position: { row: 2, col: 0 } },
        { key: '8', display: '8', type: 'number', width: 'normal', position: { row: 2, col: 1 } },
        { key: '9', display: '9', type: 'number', width: 'normal', position: { row: 2, col: 2 } }
      ],
      [
        { key: 'ABC', display: 'ABC', type: 'layout-switch', width: 'normal', position: { row: 3, col: 0 } },
        { key: '0', display: '0', type: 'number', width: 'normal', position: { row: 3, col: 1 } },
        { key: 'Backspace', display: '⌫', type: 'backspace', width: 'normal', position: { row: 3, col: 2 } }
      ]
    ];
  }

  private createSymbolsLayout(): TouchKey[][] {
    return [
      [
        { key: '!', display: '!', type: 'symbol', width: 'normal', position: { row: 0, col: 0 } },
        { key: '@', display: '@', type: 'symbol', width: 'normal', position: { row: 0, col: 1 } },
        { key: '#', display: '#', type: 'symbol', width: 'normal', position: { row: 0, col: 2 } },
        { key: '$', display: '$', type: 'symbol', width: 'normal', position: { row: 0, col: 3 } },
        { key: '%', display: '%', type: 'symbol', width: 'normal', position: { row: 0, col: 4 } }
      ],
      [
        { key: '^', display: '^', type: 'symbol', width: 'normal', position: { row: 1, col: 0 } },
        { key: '&', display: '&', type: 'symbol', width: 'normal', position: { row: 1, col: 1 } },
        { key: '*', display: '*', type: 'symbol', width: 'normal', position: { row: 1, col: 2 } },
        { key: '(', display: '(', type: 'symbol', width: 'normal', position: { row: 1, col: 3 } },
        { key: ')', display: ')', type: 'symbol', width: 'normal', position: { row: 1, col: 4 } }
      ],
      [
        { key: '-', display: '-', type: 'symbol', width: 'normal', position: { row: 2, col: 0 } },
        { key: '=', display: '=', type: 'symbol', width: 'normal', position: { row: 2, col: 1 } },
        { key: '[', display: '[', type: 'symbol', width: 'normal', position: { row: 2, col: 2 } },
        { key: ']', display: ']', type: 'symbol', width: 'normal', position: { row: 2, col: 3 } },
        { key: '\\', display: '\\', type: 'symbol', width: 'normal', position: { row: 2, col: 4 } }
      ],
      [
        { key: 'ABC', display: 'ABC', type: 'layout-switch', width: 'normal', position: { row: 3, col: 0 } },
        { key: '123', display: '123', type: 'layout-switch', width: 'normal', position: { row: 3, col: 1 } },
        { key: ' ', display: 'Space', type: 'space', width: 'wide', position: { row: 3, col: 2 } },
        { key: 'Backspace', display: '⌫', type: 'backspace', width: 'normal', position: { row: 3, col: 3 } }
      ]
    ];
  }

  // Public API methods
  updateSettings(updates: Partial<MobileGameSettings>): void {
    this.mobileSettings.update(current => ({ ...current, ...updates }));
    this.saveMobileSettings();
  }

  switchKeyboardLayout(layout: 'qwerty' | 'numbers' | 'symbols'): void {
    this.touchKeyboard.update(keyboard => {
      let newLayout: TouchKey[][];
      
      switch (layout) {
        case 'numbers':
          newLayout = this.createNumbersLayout();
          break;
        case 'symbols':
          newLayout = this.createSymbolsLayout();
          break;
        default:
          newLayout = this.createQwertyLayout();
      }
      
      return {
        ...keyboard,
        currentLayout: layout,
        layout: newLayout
      };
    });
  }

  toggleShift(): void {
    this.touchKeyboard.update(keyboard => ({
      ...keyboard,
      isShiftActive: !keyboard.isShiftActive
    }));
  }

  toggleCapsLock(): void {
    this.touchKeyboard.update(keyboard => ({
      ...keyboard,
      isCapsLockActive: !keyboard.isCapsLockActive,
      isShiftActive: false // Clear shift when caps lock is toggled
    }));
  }

  handleTouchInput(key: string): string {
    const keyboard = this.touchKeyboard();
    let outputKey = key;
    
    // Handle special keys
    if (key === 'Shift') {
      this.toggleShift();
      return '';
    }
    
    if (key === 'CapsLock') {
      this.toggleCapsLock();
      return '';
    }
    
    if (key === '123') {
      this.switchKeyboardLayout('numbers');
      return '';
    }
    
    if (key === 'ABC') {
      this.switchKeyboardLayout('qwerty');
      return '';
    }
    
    if (key === '?!') {
      this.switchKeyboardLayout('symbols');
      return '';
    }
    
    // Handle letter case
    if (key.match(/[a-z]/)) {
      if (keyboard.isCapsLockActive || keyboard.isShiftActive) {
        outputKey = key.toUpperCase();
      }
      
      // Clear shift after letter input (but not caps lock)
      if (keyboard.isShiftActive && !keyboard.isCapsLockActive) {
        this.touchKeyboard.update(kb => ({ ...kb, isShiftActive: false }));
      }
    }
    
    // Handle number row symbols when shift is active
    if (keyboard.isShiftActive && key.match(/[0-9]/)) {
      const symbolMap: { [key: string]: string } = {
        '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
        '6': '^', '7': '&', '8': '*', '9': '(', '0': ')'
      };
      outputKey = symbolMap[key] || key;
      this.touchKeyboard.update(kb => ({ ...kb, isShiftActive: false }));
    }

    // Trigger haptic feedback
    if (this.mobileSettings().hapticFeedback && this.hasTouch()) {
      this.triggerHapticFeedback();
    }
    
    return outputKey;
  }

  // Haptic feedback
  private triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy' = 'light'): void {
    if ('vibrate' in navigator) {
      const vibrationPattern = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(vibrationPattern[intensity]);
    }
  }

  // Gesture recognition
  recognizeSwipeGesture(startX: number, startY: number, endX: number, endY: number): TouchEvent | null {
    if (!this.mobileSettings().swipeGestures) return null;
    
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < 30) return null; // Too short to be a swipe
    
    let direction: 'up' | 'down' | 'left' | 'right';
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }
    
    return {
      type: 'swipe',
      direction,
      duration: 0 // Would be calculated from actual timestamps
    };
  }

  // Responsive font sizing
  getResponsiveFontSize(): string {
    const baseSize = {
      'small': 14,
      'medium': 16,
      'large': 18,
      'extra-large': 20
    };
    
    const size = baseSize[this.mobileSettings().fontSize];
    
    if (this.isTabletDevice()) {
      return `${size + 2}px`;
    } else if (this.isMobileDevice()) {
      return `${size}px`;
    } else {
      return `${size + 4}px`;
    }
  }

  // Screen size utilities
  getOptimalKeyboardHeight(): number {
    const screenHeight = window.innerHeight;
    const orientation = this.screenOrientation();
    
    if (orientation === 'portrait') {
      return Math.min(300, screenHeight * 0.4);
    } else {
      return Math.min(250, screenHeight * 0.5);
    }
  }

  shouldShowVirtualKeyboard(): boolean {
    return this.isMobileDevice() && this.mobileSettings().enableVirtualKeyboard;
  }

  // Data persistence
  private loadMobileSettings(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        this.mobileSettings.set({ ...this.mobileSettings(), ...settings });
      } catch (error) {
        console.warn('Failed to load mobile settings:', error);
      }
    }
  }

  private saveMobileSettings(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.mobileSettings()));
  }
}