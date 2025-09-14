import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { LoadingService, LoadingState } from '../../services/loading';

@Component({
  selector: 'app-loading',
  imports: [CommonModule],
  template: `
    <div class="loading-container" *ngIf="loadingService.isLoading()" @fadeIn>
      <div class="loading-overlay" [class.global]="isGlobal"></div>
      <div class="loading-content" [class.global]="isGlobal">
        <div *ngFor="let loading of loadingService.activeLoadings(); trackBy: trackByLoadingId" 
             class="loading-item" 
             [ngClass]="'loading-' + loading.type">
          
          <!-- Spinner Loading -->
          <div *ngIf="loading.type === 'spinner'" class="spinner-container">
            <div class="spinner" [attr.aria-label]="loading.message"></div>
            <p class="loading-message">{{ loading.message }}</p>
          </div>
          
          <!-- Progress Loading -->
          <div *ngIf="loading.type === 'progress'" class="progress-container">
            <p class="loading-message">{{ loading.message }}</p>
            <div class="progress-bar">
              <div class="progress-fill" 
                   [style.width.%]="loading.progress || 0"
                   role="progressbar"
                   [attr.aria-valuenow]="loading.progress || 0"
                   aria-valuemin="0"
                   aria-valuemax="100"
                   [attr.aria-label]="loading.message + ' ' + (loading.progress || 0) + '%'">
              </div>
            </div>
            <span class="progress-text">{{ (loading.progress || 0) | number:'1.0-0' }}%</span>
          </div>
          
          <!-- Skeleton Loading -->
          <div *ngIf="loading.type === 'skeleton'" class="skeleton-container">
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-line skeleton-text"></div>
            <div class="skeleton-line skeleton-text short"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './loading.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class LoadingComponent {
  @Input() isGlobal = true;
  
  constructor(public loadingService: LoadingService) {}
  
  trackByLoadingId(index: number, loading: LoadingState): string {
    return loading.id;
  }
}