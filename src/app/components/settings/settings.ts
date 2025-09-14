import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService, UserSettings } from '../../services/storage';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('300ms ease-in', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('400ms ease-in', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class Settings implements OnInit {
  settings: UserSettings = {
    theme: 'auto',
    soundEnabled: true,
    soundVolume: 0.5,
    keyboardLayout: 'qwerty',
    showWpmInRealTime: true,
    showAccuracyInRealTime: true,
    enableAnimations: true,
    autoCapitalize: false,
    fontSize: 'medium',
    colorBlindFriendly: false
  };

  themes = [
    { value: 'light', label: 'Light Theme' },
    { value: 'dark', label: 'Dark Theme' },
    { value: 'auto', label: 'Auto (System)' }
  ];

  keyboardLayouts = [
    { value: 'qwerty', label: 'QWERTY' },
    { value: 'dvorak', label: 'Dvorak' },
    { value: 'colemak', label: 'Colemak' },
    { value: 'azerty', label: 'AZERTY' }
  ];

  fontSizes = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'extra-large', label: 'Extra Large' }
  ];

  constructor(
    private storageService: StorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    const savedSettings = this.storageService.getUserSettings();
    if (savedSettings) {
      this.settings = { ...this.settings, ...savedSettings };
    }
  }

  saveSettings(): void {
    this.storageService.updateUserSettings(this.settings);
    this.applySettings();
    alert('Settings saved successfully!');
  }

  resetSettings(): void {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      this.settings = {
        theme: 'auto',
        soundEnabled: true,
        soundVolume: 0.5,
        keyboardLayout: 'qwerty',
        showWpmInRealTime: true,
        showAccuracyInRealTime: true,
        enableAnimations: true,
        autoCapitalize: false,
        fontSize: 'medium',
        colorBlindFriendly: false
      };
      this.saveSettings();
    }
  }

  private applySettings(): void {
    // Apply theme
    const body = document.body;
    body.className = body.className.replace(/theme-\w+/g, '');
    
    if (this.settings.theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      body.classList.add(`theme-${this.settings.theme}`);
    }

    // Apply font size
    body.className = body.className.replace(/font-size-\w+/g, '');
    body.classList.add(`font-size-${this.settings.fontSize}`);

    // Apply color blind friendly mode
    if (this.settings.colorBlindFriendly) {
      body.classList.add('color-blind-friendly');
    } else {
      body.classList.remove('color-blind-friendly');
    }

    // Apply animations setting
    if (!this.settings.enableAnimations) {
      body.classList.add('reduce-motion');
    } else {
      body.classList.remove('reduce-motion');
    }
  }

  exportSettings(): void {
    const settingsData = JSON.stringify(this.settings, null, 2);
    const blob = new Blob([settingsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `typing-game-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  importSettings(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          this.settings = { ...this.settings, ...importedSettings };
          this.saveSettings();
          alert('Settings imported successfully!');
        } catch (error) {
          alert('Error importing settings. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  }

  testSound(): void {
    if (this.settings.soundEnabled) {
      // Create a simple beep sound for testing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(this.settings.soundVolume, audioContext.currentTime);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }

  goToGame(): void {
    this.router.navigate(['/game']);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
