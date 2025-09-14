import { Injectable, signal, computed } from '@angular/core';

export interface LoadingState {
  id: string;
  message: string;
  progress?: number;
  type: 'spinner' | 'progress' | 'skeleton';
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingStates = signal<Map<string, LoadingState>>(new Map());
  
  // Computed properties for easy access
  isLoading = computed(() => this.loadingStates().size > 0);
  activeLoadings = computed(() => Array.from(this.loadingStates().values()));
  
  startLoading(id: string, message: string, type: LoadingState['type'] = 'spinner'): void {
    const currentStates = new Map(this.loadingStates());
    currentStates.set(id, {
      id,
      message,
      type,
      progress: type === 'progress' ? 0 : undefined
    });
    this.loadingStates.set(currentStates);
  }
  
  updateProgress(id: string, progress: number, message?: string): void {
    const currentStates = new Map(this.loadingStates());
    const existingState = currentStates.get(id);
    
    if (existingState) {
      currentStates.set(id, {
        ...existingState,
        progress: Math.min(100, Math.max(0, progress)),
        message: message || existingState.message
      });
      this.loadingStates.set(currentStates);
    }
  }
  
  stopLoading(id: string): void {
    const currentStates = new Map(this.loadingStates());
    currentStates.delete(id);
    this.loadingStates.set(currentStates);
  }
  
  stopAllLoading(): void {
    this.loadingStates.set(new Map());
  }
  
  isLoadingId(id: string): boolean {
    return this.loadingStates().has(id);
  }
  
  getLoadingState(id: string): LoadingState | undefined {
    return this.loadingStates().get(id);
  }
}