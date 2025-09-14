import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomTextService, CustomText, TextImportResult } from '../../services/custom-text';

@Component({
  selector: 'app-custom-text',
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-text.html',
  styleUrl: './custom-text.scss'
})
export class CustomTextComponent implements OnInit {
  
  // Import form data
  textName = '';
  textContent = '';
  selectedCategory = 'General';
  tags = '';
  
  // UI state
  importResult: TextImportResult | null = null;
  isImporting = false;
  selectedFile: File | null = null;
  urlToImport = '';
  
  // Data
  customTexts: CustomText[] = [];
  categories = ['General', 'Programming', 'Literature', 'Science', 'Business', 'Practice'];

  constructor(
    private customTextService: CustomTextService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCustomTexts();
  }

  // File import
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.textName = file.name.replace(/\.[^/.]+$/, '');
    }
  }

  async importFromFile(): Promise<void> {
    if (!this.selectedFile) return;
    
    this.isImporting = true;
    try {
      this.importResult = await this.customTextService.importFromFile(this.selectedFile);
      if (this.importResult.success) {
        this.loadCustomTexts();
        this.resetForm();
      }
    } catch (error) {
      this.importResult = {
        success: false,
        error: 'Failed to import file'
      };
    }
    this.isImporting = false;
  }

  // URL import
  async importFromUrl(): Promise<void> {
    if (!this.urlToImport.trim()) return;
    
    this.isImporting = true;
    try {
      this.importResult = await this.customTextService.importFromUrl(this.urlToImport);
      if (this.importResult.success) {
        this.loadCustomTexts();
        this.urlToImport = '';
      }
    } catch (error) {
      this.importResult = {
        success: false,
        error: 'Failed to import from URL'
      };
    }
    this.isImporting = false;
  }

  // Text import
  importFromText(): void {
    if (!this.textContent.trim() || !this.textName.trim()) return;
    
    this.isImporting = true;
    const tagsArray = this.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    this.importResult = this.customTextService.importFromString(
      this.textContent,
      this.textName,
      {
        category: this.selectedCategory,
        tags: tagsArray
      }
    );
    
    if (this.importResult.success) {
      this.loadCustomTexts();
      this.resetForm();
    }
    this.isImporting = false;
  }

  // Text management
  deleteText(id: string): void {
    if (confirm('Are you sure you want to delete this text?')) {
      this.customTextService.deleteText(id);
      this.loadCustomTexts();
    }
  }

  useText(text: CustomText): void {
    // Navigate to game with this custom text
    sessionStorage.setItem('customText', JSON.stringify(text));
    this.router.navigate(['/game'], {
      queryParams: { customText: text.id }
    });
  }

  exportTexts(): void {
    const data = this.customTextService.exportTexts();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-texts-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  // Helper methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getDifficultyColor(difficulty: string): string {
    const colors = {
      'Easy': '#10b981',
      'Medium': '#f59e0b',
      'Hard': '#ef4444',
      'Expert': '#dc2626'
    };
    return colors[difficulty as keyof typeof colors] || '#6b7280';
  }

  getWordCountText(count: number): string {
    if (count < 20) return 'Very Short';
    if (count < 50) return 'Short';
    if (count < 100) return 'Medium';
    if (count < 200) return 'Long';
    return 'Very Long';
  }

  private loadCustomTexts(): void {
    this.customTexts = this.customTextService.getCustomTexts()();
  }

  private resetForm(): void {
    this.textName = '';
    this.textContent = '';
    this.tags = '';
    this.selectedFile = null;
    this.urlToImport = '';
  }
}