import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccessibilityService, AccessibilitySettings } from '../../services/accessibility';

@Component({
  selector: 'app-accessibility-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="accessibility-settings" [attr.role]="'region'" [attr.aria-label]="'Accessibility Settings'">
      <div class="settings-header">
        <h2>♿ Accessibility Settings</h2>
        <p class="settings-description">
          Customize your typing experience for better accessibility. 
          These settings will be saved for future sessions.
        </p>
      </div>

      <div class="settings-grid">
        <!-- Screen Reader Support -->
        <div class="setting-group">
          <h3>🔊 Screen Reader Support</h3>
          
          <div class="setting-item">
            <label class="setting-label">
              <input 
                type="checkbox" 
                [(ngModel)]="settings().screenReaderEnabled"
                (change)="onSettingChange('screenReaderEnabled', $event)"
                [attr.aria-describedby]="'screen-reader-desc'"
              />
              Enable screen reader optimizations
            </label>
            <small id="screen-reader-desc" class="setting-description">
              Adds live regions and enhanced ARIA labels for screen readers
            </small>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <input 
                type="checkbox" 
                [(ngModel)]="settings().autoAnnouncements"
                (change)="onSettingChange('autoAnnouncements', $event)"
                [attr.aria-describedby]="'announcements-desc'"
              />
              Automatic game announcements
            </label>
            <small id="announcements-desc" class="setting-description">
              Automatically announce game events and statistics
            </small>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <input 
                type="checkbox" 
                [(ngModel)]="settings().audioFeedback"
                (change)="onSettingChange('audioFeedback', $event)"
                [attr.aria-describedby]="'audio-desc'"
              />
              Audio feedback for typing
            </label>
            <small id="audio-desc" class="setting-description">
              Provides audio cues for correct and incorrect typing
            </small>
          </div>
        </div>

        <!-- Visual Accessibility -->
        <div class="setting-group">
          <h3>👁️ Visual Accessibility</h3>
          
          <div class="setting-item">
            <label class="setting-label">
              <input 
                type="checkbox" 
                [(ngModel)]="settings().highContrastMode"
                (change)="onSettingChange('highContrastMode', $event)"
                [attr.aria-describedby]="'contrast-desc'"
              />
              High contrast mode
            </label>
            <small id="contrast-desc" class="setting-description">
              Increases color contrast for better visibility
            </small>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <input 
                type="checkbox" 
                [(ngModel)]="settings().largeText"
                (change)="onSettingChange('largeText', $event)"
                [attr.aria-describedby]="'large-text-desc'"
              />
              Large text mode
            </label>
            <small id="large-text-desc" class="setting-description">
              Increases font sizes throughout the application
            </small>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <input 
                type="checkbox" 
                [(ngModel)]="settings().focusIndicatorEnhanced"
                (change)="onSettingChange('focusIndicatorEnhanced', $event)"
                [attr.aria-describedby]="'focus-desc'"
              />
              Enhanced focus indicators
            </label>
            <small id="focus-desc" class="setting-description">
              Makes keyboard focus indicators more visible
            </small>
          </div>

          <div class="setting-item">
            <label class="setting-label" for="colorblind-support">
              Color blind support:
            </label>
            <select 
              id="colorblind-support"
              class="setting-select"
              [(ngModel)]="settings().colorBlindSupport"
              (change)="onColorBlindSupportChange($event)"
              [attr.aria-describedby]="'colorblind-desc'"
            >
              <option value="none">None</option>
              <option value="protanopia">Protanopia (Red-blind)</option>
              <option value="deuteranopia">Deuteranopia (Green-blind)</option>
              <option value="tritanopia">Tritanopia (Blue-blind)</option>
            </select>
            <small id="colorblind-desc" class="setting-description">
              Adjusts colors for different types of color blindness
            </small>
          </div>
        </div>

        <!-- Motion and Animation -->
        <div class="setting-group">
          <h3>🎬 Motion and Animation</h3>
          
          <div class="setting-item">
            <label class="setting-label">
              <input 
                type="checkbox" 
                [(ngModel)]="settings().reducedMotion"
                (change)="onSettingChange('reducedMotion', $event)"
                [attr.aria-describedby]="'motion-desc'"
              />
              Reduce motion and animations
            </label>
            <small id="motion-desc" class="setting-description">
              Minimizes animations that might cause vestibular disorders
            </small>
          </div>
        </div>

        <!-- Navigation -->
        <div class="setting-group">
          <h3>⌨️ Navigation</h3>
          
          <div class="setting-item">
            <label class="setting-label">
              <input 
                type="checkbox" 
                [(ngModel)]="settings().keyboardNavigation"
                (change)="onSettingChange('keyboardNavigation', $event)"
                [attr.aria-describedby]="'keyboard-desc'"
              />
              Enhanced keyboard navigation
            </label>
            <small id="keyboard-desc" class="setting-description">
              Enables keyboard shortcuts and improved tab navigation
            </small>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <input 
                type="checkbox" 
                [(ngModel)]="settings().skipToContent"
                (change)="onSettingChange('skipToContent', $event)"
                [attr.aria-describedby]="'skip-desc'"
              />
              Skip to content links
            </label>
            <small id="skip-desc" class="setting-description">
              Provides shortcuts to skip navigation and go to main content
            </small>
          </div>
        </div>
      </div>

      <!-- Keyboard Shortcuts Help -->
      <div class="shortcuts-help" *ngIf="settings().keyboardNavigation">
        <h3>⌨️ Keyboard Shortcuts</h3>
        <div class="shortcuts-grid">
          <div class="shortcut-item">
            <kbd>Alt + H</kbd>
            <span>Show keyboard shortcuts help</span>
          </div>
          <div class="shortcut-item">
            <kbd>Alt + S</kbd>
            <span>Skip to main content</span>
          </div>
          <div class="shortcut-item">
            <kbd>Alt + P</kbd>
            <span>Pause or resume game</span>
          </div>
          <div class="shortcut-item">
            <kbd>Alt + R</kbd>
            <span>Read current game statistics</span>
          </div>
          <div class="shortcut-item">
            <kbd>Alt + W</kbd>
            <span>Read current word</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="settings-actions">
        <button 
          type="button" 
          class="btn-primary"
          (click)="testAccessibilityFeatures()"
          [attr.aria-describedby]="'test-desc'"
        >
          🧪 Test Accessibility Features
        </button>
        <small id="test-desc" class="setting-description">
          Tests screen reader announcements and other accessibility features
        </small>
      </div>

      <!-- Status Messages -->
      <div class="status-messages" *ngIf="statusMessage" @fadeIn>
        <div class="status-message" [class]="statusType">
          {{statusMessage}}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .accessibility-settings {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      font-family: inherit;
    }

    .settings-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .settings-header h2 {
      color: var(--primary-color, #007acc);
      margin-bottom: 0.5rem;
    }

    .settings-description {
      color: var(--text-secondary, #666);
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .settings-grid {
      display: grid;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .setting-group {
      background: var(--card-bg, #f8f9fa);
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 8px;
      padding: 1.5rem;
    }

    .setting-group h3 {
      color: var(--heading-color, #333);
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .setting-item {
      margin-bottom: 1rem;
    }

    .setting-item:last-child {
      margin-bottom: 0;
    }

    .setting-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
      color: var(--text-primary, #333);
      cursor: pointer;
      line-height: 1.4;
    }

    .setting-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--primary-color, #007acc);
    }

    .setting-select {
      width: 100%;
      max-width: 200px;
      padding: 0.5rem;
      border: 1px solid var(--border-color, #ccc);
      border-radius: 4px;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }

    .setting-description {
      display: block;
      color: var(--text-secondary, #666);
      font-size: 0.85rem;
      margin-top: 0.25rem;
      margin-left: 1.5rem;
      line-height: 1.3;
    }

    .shortcuts-help {
      background: var(--info-bg, #e3f2fd);
      border: 1px solid var(--info-border, #bbdefb);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .shortcuts-help h3 {
      margin: 0 0 1rem 0;
      color: var(--info-text, #1565c0);
    }

    .shortcuts-grid {
      display: grid;
      gap: 0.5rem;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }

    .shortcut-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 4px;
    }

    kbd {
      background: var(--kbd-bg, #f8f9fa);
      border: 1px solid var(--kbd-border, #dee2e6);
      border-radius: 3px;
      padding: 0.2rem 0.4rem;
      font-family: monospace;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--kbd-text, #333);
    }

    .settings-actions {
      text-align: center;
      margin-bottom: 1rem;
    }

    .btn-primary {
      background: var(--primary-color, #007acc);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary:hover {
      background: var(--primary-hover, #0056b3);
      transform: translateY(-1px);
    }

    .btn-primary:focus {
      outline: 2px solid var(--focus-color, #007acc);
      outline-offset: 2px;
    }

    .status-messages {
      margin-top: 1rem;
    }

    .status-message {
      padding: 0.75rem;
      border-radius: 4px;
      text-align: center;
      font-weight: 500;
    }

    .status-message.success {
      background: var(--success-bg, #d4edda);
      border: 1px solid var(--success-border, #c3e6cb);
      color: var(--success-text, #155724);
    }

    .status-message.info {
      background: var(--info-bg, #cce7ff);
      border: 1px solid var(--info-border, #99d6ff);
      color: var(--info-text, #004085);
    }

    /* High contrast mode styles */
    :global(.high-contrast) .accessibility-settings {
      --card-bg: #000;
      --text-primary: #fff;
      --text-secondary: #ccc;
      --border-color: #fff;
      --primary-color: #ffff00;
      --primary-hover: #cccc00;
    }

    /* Large text mode styles */
    :global(.large-text) .accessibility-settings {
      font-size: 1.2rem;
    }

    :global(.large-text) .setting-label {
      font-size: 1.1rem;
    }

    :global(.large-text) .setting-description {
      font-size: 1rem;
    }

    /* Enhanced focus styles */
    :global(.enhanced-focus) .setting-label:focus-within,
    :global(.enhanced-focus) .setting-select:focus,
    :global(.enhanced-focus) .btn-primary:focus {
      outline: 3px solid var(--focus-color, #007acc);
      outline-offset: 3px;
      box-shadow: 0 0 0 6px rgba(0, 122, 204, 0.2);
    }

    /* Reduced motion styles */
    :global(.reduced-motion) .btn-primary {
      transition: none;
    }

    :global(.reduced-motion) .btn-primary:hover {
      transform: none;
    }

    @media (max-width: 600px) {
      .accessibility-settings {
        padding: 1rem;
      }

      .shortcuts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AccessibilitySettingsComponent {
  statusMessage = '';
  statusType: 'success' | 'info' | 'error' = 'info';

  settings = computed(() => this.accessibilityService.settings());

  constructor(private accessibilityService: AccessibilityService) {}

  onSettingChange(settingKey: keyof AccessibilitySettings, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    
    this.accessibilityService.updateSettings({
      [settingKey]: value
    } as Partial<AccessibilitySettings>);

    this.showStatusMessage(`${settingKey} updated successfully`, 'success');
  }

  onColorBlindSupportChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.accessibilityService.updateSettings({
      colorBlindSupport: target.value as AccessibilitySettings['colorBlindSupport']
    });

    this.showStatusMessage('Color blind support updated', 'success');
  }

  testAccessibilityFeatures(): void {
    this.accessibilityService.announce({
      message: 'Testing accessibility features. Screen reader support is working correctly.',
      priority: 'assertive'
    });

    this.accessibilityService.announce({
      message: 'This is a test of polite announcements. You should hear this after the previous message.',
      priority: 'polite',
      delay: 1000
    });

    this.showStatusMessage('Accessibility test completed. Check if you heard the announcements.', 'info');
  }

  private showStatusMessage(message: string, type: 'success' | 'info' | 'error'): void {
    this.statusMessage = message;
    this.statusType = type;

    // Clear message after 3 seconds
    setTimeout(() => {
      this.statusMessage = '';
    }, 3000);
  }
}