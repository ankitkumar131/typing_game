import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: string;
  category: 'game' | 'navigation' | 'utility' | 'accessibility';
  enabled: boolean;
  global?: boolean; // Works from anywhere in the app
}

export interface ShortcutCategory {
  name: string;
  shortcuts: KeyboardShortcut[];
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutService {
  private readonly STORAGE_KEY = 'typingGame_shortcuts';
  
  private shortcuts = signal<KeyboardShortcut[]>(this.getDefaultShortcuts());
  private isEnabled = signal<boolean>(true);
  private activeListeners = new Map<string, (event: KeyboardEvent) => void>();
  
  constructor(private router: Router) {
    this.loadShortcuts();
    this.setupGlobalListeners();
  }

  // Public API
  getShortcuts() {
    return this.shortcuts.asReadonly();
  }

  getShortcutsByCategory(category: string): KeyboardShortcut[] {
    return this.shortcuts().filter(shortcut => shortcut.category === category);
  }

  getShortcutCategories(): ShortcutCategory[] {
    const categories = new Map<string, ShortcutCategory>();
    
    this.shortcuts().forEach(shortcut => {
      if (!categories.has(shortcut.category)) {
        categories.set(shortcut.category, {
          name: this.getCategoryDisplayName(shortcut.category),
          shortcuts: [],
          description: this.getCategoryDescription(shortcut.category)
        });
      }
      categories.get(shortcut.category)!.shortcuts.push(shortcut);
    });
    
    return Array.from(categories.values());
  }

  isShortcutEnabled(): boolean {
    return this.isEnabled();
  }

  toggleShortcuts(enabled?: boolean): void {
    this.isEnabled.set(enabled !== undefined ? enabled : !this.isEnabled());
    
    if (this.isEnabled()) {
      this.setupGlobalListeners();
    } else {
      this.removeGlobalListeners();
    }
  }

  updateShortcut(action: string, newShortcut: Partial<KeyboardShortcut>): boolean {
    const shortcuts = this.shortcuts();
    const index = shortcuts.findIndex(s => s.action === action);
    
    if (index === -1) return false;
    
    const updated = [...shortcuts];
    updated[index] = { ...updated[index], ...newShortcut };
    
    this.shortcuts.set(updated);
    this.saveShortcuts();
    this.setupGlobalListeners(); // Refresh listeners
    return true;
  }

  resetToDefaults(): void {
    this.shortcuts.set(this.getDefaultShortcuts());
    this.saveShortcuts();
    this.setupGlobalListeners();
  }

  getShortcutString(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.metaKey) parts.push('Cmd');
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join(' + ');
  }

  executeAction(action: string, context?: any): boolean {
    const shortcut = this.shortcuts().find(s => s.action === action);
    if (!shortcut || !shortcut.enabled) return false;
    
    try {
      switch (action) {
        // Game actions
        case 'startGame':
          this.triggerGameAction('start', context);
          break;
        case 'pauseGame':
          this.triggerGameAction('pause', context);
          break;
        case 'resetGame':
          this.triggerGameAction('reset', context);
          break;
        case 'skipWord':
          this.triggerGameAction('skip', context);
          break;
        case 'quitGame':
          this.triggerGameAction('quit', context);
          break;
          
        // Navigation actions
        case 'goHome':
          this.router.navigate(['/home']);
          break;
        case 'goToGame':
          this.router.navigate(['/game']);
          break;
        case 'goToProfile':
          this.router.navigate(['/profile']);
          break;
        case 'goToLeaderboard':
          this.router.navigate(['/leaderboard']);
          break;
        case 'goToSettings':
          this.router.navigate(['/settings']);
          break;
        case 'goBack':
          window.history.back();
          break;
          
        // Utility actions
        case 'focusInput':
          this.focusGameInput();
          break;
        case 'toggleTheme':
          this.triggerThemeToggle();
          break;
        case 'showHelp':
          this.showHelpDialog();
          break;
        case 'showShortcuts':
          this.showShortcutsDialog();
          break;
        case 'exportData':
          this.triggerDataExport();
          break;
          
        // Accessibility actions
        case 'increaseFont':
          this.adjustFontSize(1);
          break;
        case 'decreaseFont':
          this.adjustFontSize(-1);
          break;
        case 'toggleHighContrast':
          this.toggleHighContrast();
          break;
        case 'announceStats':
          this.announceCurrentStats();
          break;
          
        default:
          return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error executing shortcut action:', action, error);
      return false;
    }
  }

  // Private methods
  private getDefaultShortcuts(): KeyboardShortcut[] {
    return [
      // Game shortcuts
      {
        key: ' ',
        description: 'Start/Pause game',
        action: 'startGame',
        category: 'game',
        enabled: true,
        global: true
      },
      {
        key: 'Escape',
        description: 'Pause game',
        action: 'pauseGame',
        category: 'game',
        enabled: true,
        global: true
      },
      {
        key: 'r',
        ctrlKey: true,
        description: 'Reset game',
        action: 'resetGame',
        category: 'game',
        enabled: true
      },
      {
        key: 'Tab',
        description: 'Skip current word',
        action: 'skipWord',
        category: 'game',
        enabled: true
      },
      {
        key: 'q',
        ctrlKey: true,
        description: 'Quit game',
        action: 'quitGame',
        category: 'game',
        enabled: true
      },
      
      // Navigation shortcuts
      {
        key: 'h',
        altKey: true,
        description: 'Go to Home',
        action: 'goHome',
        category: 'navigation',
        enabled: true,
        global: true
      },
      {
        key: 'g',
        altKey: true,
        description: 'Go to Game',
        action: 'goToGame',
        category: 'navigation',
        enabled: true,
        global: true
      },
      {
        key: 'p',
        altKey: true,
        description: 'Go to Profile',
        action: 'goToProfile',
        category: 'navigation',
        enabled: true,
        global: true
      },
      {
        key: 'l',
        altKey: true,
        description: 'Go to Leaderboard',
        action: 'goToLeaderboard',
        category: 'navigation',
        enabled: true,
        global: true
      },
      {
        key: 's',
        altKey: true,
        description: 'Go to Settings',
        action: 'goToSettings',
        category: 'navigation',
        enabled: true,
        global: true
      },
      {
        key: 'ArrowLeft',
        altKey: true,
        description: 'Go back',
        action: 'goBack',
        category: 'navigation',
        enabled: true,
        global: true
      },
      
      // Utility shortcuts
      {
        key: 'f',
        ctrlKey: true,
        description: 'Focus typing input',
        action: 'focusInput',
        category: 'utility',
        enabled: true
      },
      {
        key: 't',
        ctrlKey: true,
        description: 'Toggle theme',
        action: 'toggleTheme',
        category: 'utility',
        enabled: true,
        global: true
      },
      {
        key: 'F1',
        description: 'Show help',
        action: 'showHelp',
        category: 'utility',
        enabled: true,
        global: true
      },
      {
        key: '?',
        ctrlKey: true,
        description: 'Show keyboard shortcuts',
        action: 'showShortcuts',
        category: 'utility',
        enabled: true,
        global: true
      },
      {
        key: 'e',
        ctrlKey: true,
        shiftKey: true,
        description: 'Export data',
        action: 'exportData',
        category: 'utility',
        enabled: true
      },
      
      // Accessibility shortcuts
      {
        key: '=',
        ctrlKey: true,
        description: 'Increase font size',
        action: 'increaseFont',
        category: 'accessibility',
        enabled: true,
        global: true
      },
      {
        key: '-',
        ctrlKey: true,
        description: 'Decrease font size',
        action: 'decreaseFont',
        category: 'accessibility',
        enabled: true,
        global: true
      },
      {
        key: 'c',
        ctrlKey: true,
        altKey: true,
        description: 'Toggle high contrast',
        action: 'toggleHighContrast',
        category: 'accessibility',
        enabled: true,
        global: true
      },
      {
        key: 'a',
        ctrlKey: true,
        altKey: true,
        description: 'Announce current stats',
        action: 'announceStats',
        category: 'accessibility',
        enabled: true
      }
    ];
  }

  private setupGlobalListeners(): void {
    this.removeGlobalListeners();
    
    if (!this.isEnabled()) return;
    
    this.shortcuts().forEach(shortcut => {
      if (!shortcut.enabled) return;
      
      const listener = (event: KeyboardEvent) => {
        if (this.matchesShortcut(event, shortcut)) {
          event.preventDefault();
          event.stopPropagation();
          this.executeAction(shortcut.action);
        }
      };
      
      const key = this.getShortcutKey(shortcut);
      this.activeListeners.set(key, listener);
      document.addEventListener('keydown', listener, true);
    });
  }

  private removeGlobalListeners(): void {
    this.activeListeners.forEach(listener => {
      document.removeEventListener('keydown', listener, true);
    });
    this.activeListeners.clear();
  }

  private matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    return (
      event.key.toLowerCase() === shortcut.key.toLowerCase() &&
      !!event.ctrlKey === !!shortcut.ctrlKey &&
      !!event.altKey === !!shortcut.altKey &&
      !!event.shiftKey === !!shortcut.shiftKey &&
      !!event.metaKey === !!shortcut.metaKey
    );
  }

  private getShortcutKey(shortcut: KeyboardShortcut): string {
    return `${shortcut.ctrlKey ? 'ctrl+' : ''}${shortcut.altKey ? 'alt+' : ''}${shortcut.shiftKey ? 'shift+' : ''}${shortcut.metaKey ? 'meta+' : ''}${shortcut.key.toLowerCase()}`;
  }

  private getCategoryDisplayName(category: string): string {
    const names = {
      game: 'Game Controls',
      navigation: 'Navigation',
      utility: 'Utilities',
      accessibility: 'Accessibility'
    };
    return names[category as keyof typeof names] || category;
  }

  private getCategoryDescription(category: string): string {
    const descriptions = {
      game: 'Shortcuts for game control and interaction',
      navigation: 'Quick navigation between app sections',
      utility: 'General utility functions and tools',
      accessibility: 'Accessibility and assistive features'
    };
    return descriptions[category as keyof typeof descriptions] || '';
  }

  // Action implementations
  private triggerGameAction(action: string, context?: any): void {
    const event = new CustomEvent('shortcutGameAction', { 
      detail: { action, context } 
    });
    document.dispatchEvent(event);
  }

  private focusGameInput(): void {
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (input) {
      input.focus();
    }
  }

  private triggerThemeToggle(): void {
    const event = new CustomEvent('shortcutThemeToggle');
    document.dispatchEvent(event);
  }

  private showHelpDialog(): void {
    const event = new CustomEvent('shortcutShowHelp');
    document.dispatchEvent(event);
  }

  private showShortcutsDialog(): void {
    const event = new CustomEvent('shortcutShowShortcuts');
    document.dispatchEvent(event);
  }

  private triggerDataExport(): void {
    const event = new CustomEvent('shortcutExportData');
    document.dispatchEvent(event);
  }

  private adjustFontSize(delta: number): void {
    const event = new CustomEvent('shortcutAdjustFontSize', { 
      detail: { delta } 
    });
    document.dispatchEvent(event);
  }

  private toggleHighContrast(): void {
    const event = new CustomEvent('shortcutToggleHighContrast');
    document.dispatchEvent(event);
  }

  private announceCurrentStats(): void {
    const event = new CustomEvent('shortcutAnnounceStats');
    document.dispatchEvent(event);
  }

  private loadShortcuts(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.shortcuts.set(data.shortcuts || this.getDefaultShortcuts());
        this.isEnabled.set(data.enabled !== false);
      } catch {
        this.shortcuts.set(this.getDefaultShortcuts());
      }
    }
  }

  private saveShortcuts(): void {
    const data = {
      shortcuts: this.shortcuts(),
      enabled: this.isEnabled()
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }
}