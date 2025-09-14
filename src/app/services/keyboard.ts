import { Injectable } from '@angular/core';

export interface KeyboardKey {
  key: string;
  display: string;
  finger: string;
  position: { row: number; col: number };
  size: 'normal' | 'wide' | 'extra-wide';
  type: 'letter' | 'number' | 'space' | 'modifier';
}

export interface FingerPosition {
  finger: string;
  homeKey: string;
  color: string;
  side: 'left' | 'right';
}

export interface KeyHighlight {
  key: string;
  type: 'current' | 'next' | 'correct' | 'incorrect' | 'home' | 'finger-highlight';
  intensity: number;
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardService {
  
  // QWERTY keyboard layout
  private keyboardLayout: KeyboardKey[][] = [
    // Number row
    [
      { key: '`', display: '`', finger: 'left-pinky', position: { row: 0, col: 0 }, size: 'normal', type: 'modifier' },
      { key: '1', display: '1', finger: 'left-pinky', position: { row: 0, col: 1 }, size: 'normal', type: 'number' },
      { key: '2', display: '2', finger: 'left-ring', position: { row: 0, col: 2 }, size: 'normal', type: 'number' },
      { key: '3', display: '3', finger: 'left-middle', position: { row: 0, col: 3 }, size: 'normal', type: 'number' },
      { key: '4', display: '4', finger: 'left-index', position: { row: 0, col: 4 }, size: 'normal', type: 'number' },
      { key: '5', display: '5', finger: 'left-index', position: { row: 0, col: 5 }, size: 'normal', type: 'number' },
      { key: '6', display: '6', finger: 'right-index', position: { row: 0, col: 6 }, size: 'normal', type: 'number' },
      { key: '7', display: '7', finger: 'right-index', position: { row: 0, col: 7 }, size: 'normal', type: 'number' },
      { key: '8', display: '8', finger: 'right-middle', position: { row: 0, col: 8 }, size: 'normal', type: 'number' },
      { key: '9', display: '9', finger: 'right-ring', position: { row: 0, col: 9 }, size: 'normal', type: 'number' },
      { key: '0', display: '0', finger: 'right-pinky', position: { row: 0, col: 10 }, size: 'normal', type: 'number' },
      { key: '-', display: '-', finger: 'right-pinky', position: { row: 0, col: 11 }, size: 'normal', type: 'modifier' },
      { key: '=', display: '=', finger: 'right-pinky', position: { row: 0, col: 12 }, size: 'normal', type: 'modifier' },
      { key: 'Backspace', display: '⌫', finger: 'right-pinky', position: { row: 0, col: 13 }, size: 'wide', type: 'modifier' }
    ],
    // QWERTY row
    [
      { key: 'Tab', display: 'Tab', finger: 'left-pinky', position: { row: 1, col: 0 }, size: 'wide', type: 'modifier' },
      { key: 'q', display: 'Q', finger: 'left-pinky', position: { row: 1, col: 1 }, size: 'normal', type: 'letter' },
      { key: 'w', display: 'W', finger: 'left-ring', position: { row: 1, col: 2 }, size: 'normal', type: 'letter' },
      { key: 'e', display: 'E', finger: 'left-middle', position: { row: 1, col: 3 }, size: 'normal', type: 'letter' },
      { key: 'r', display: 'R', finger: 'left-index', position: { row: 1, col: 4 }, size: 'normal', type: 'letter' },
      { key: 't', display: 'T', finger: 'left-index', position: { row: 1, col: 5 }, size: 'normal', type: 'letter' },
      { key: 'y', display: 'Y', finger: 'right-index', position: { row: 1, col: 6 }, size: 'normal', type: 'letter' },
      { key: 'u', display: 'U', finger: 'right-index', position: { row: 1, col: 7 }, size: 'normal', type: 'letter' },
      { key: 'i', display: 'I', finger: 'right-middle', position: { row: 1, col: 8 }, size: 'normal', type: 'letter' },
      { key: 'o', display: 'O', finger: 'right-ring', position: { row: 1, col: 9 }, size: 'normal', type: 'letter' },
      { key: 'p', display: 'P', finger: 'right-pinky', position: { row: 1, col: 10 }, size: 'normal', type: 'letter' },
      { key: '[', display: '[', finger: 'right-pinky', position: { row: 1, col: 11 }, size: 'normal', type: 'modifier' },
      { key: ']', display: ']', finger: 'right-pinky', position: { row: 1, col: 12 }, size: 'normal', type: 'modifier' },
      { key: '\\', display: '\\', finger: 'right-pinky', position: { row: 1, col: 13 }, size: 'normal', type: 'modifier' }
    ],
    // Home row (ASDF)
    [
      { key: 'CapsLock', display: 'Caps', finger: 'left-pinky', position: { row: 2, col: 0 }, size: 'wide', type: 'modifier' },
      { key: 'a', display: 'A', finger: 'left-pinky', position: { row: 2, col: 1 }, size: 'normal', type: 'letter' },
      { key: 's', display: 'S', finger: 'left-ring', position: { row: 2, col: 2 }, size: 'normal', type: 'letter' },
      { key: 'd', display: 'D', finger: 'left-middle', position: { row: 2, col: 3 }, size: 'normal', type: 'letter' },
      { key: 'f', display: 'F', finger: 'left-index', position: { row: 2, col: 4 }, size: 'normal', type: 'letter' },
      { key: 'g', display: 'G', finger: 'left-index', position: { row: 2, col: 5 }, size: 'normal', type: 'letter' },
      { key: 'h', display: 'H', finger: 'right-index', position: { row: 2, col: 6 }, size: 'normal', type: 'letter' },
      { key: 'j', display: 'J', finger: 'right-index', position: { row: 2, col: 7 }, size: 'normal', type: 'letter' },
      { key: 'k', display: 'K', finger: 'right-middle', position: { row: 2, col: 8 }, size: 'normal', type: 'letter' },
      { key: 'l', display: 'L', finger: 'right-ring', position: { row: 2, col: 9 }, size: 'normal', type: 'letter' },
      { key: ';', display: ';', finger: 'right-pinky', position: { row: 2, col: 10 }, size: 'normal', type: 'modifier' },
      { key: "'", display: "'", finger: 'right-pinky', position: { row: 2, col: 11 }, size: 'normal', type: 'modifier' },
      { key: 'Enter', display: '↵', finger: 'right-pinky', position: { row: 2, col: 12 }, size: 'wide', type: 'modifier' }
    ],
    // Bottom row (ZXCV)
    [
      { key: 'Shift', display: 'Shift', finger: 'left-pinky', position: { row: 3, col: 0 }, size: 'extra-wide', type: 'modifier' },
      { key: 'z', display: 'Z', finger: 'left-pinky', position: { row: 3, col: 1 }, size: 'normal', type: 'letter' },
      { key: 'x', display: 'X', finger: 'left-ring', position: { row: 3, col: 2 }, size: 'normal', type: 'letter' },
      { key: 'c', display: 'C', finger: 'left-middle', position: { row: 3, col: 3 }, size: 'normal', type: 'letter' },
      { key: 'v', display: 'V', finger: 'left-index', position: { row: 3, col: 4 }, size: 'normal', type: 'letter' },
      { key: 'b', display: 'B', finger: 'left-index', position: { row: 3, col: 5 }, size: 'normal', type: 'letter' },
      { key: 'n', display: 'N', finger: 'right-index', position: { row: 3, col: 6 }, size: 'normal', type: 'letter' },
      { key: 'm', display: 'M', finger: 'right-index', position: { row: 3, col: 7 }, size: 'normal', type: 'letter' },
      { key: ',', display: ',', finger: 'right-middle', position: { row: 3, col: 8 }, size: 'normal', type: 'modifier' },
      { key: '.', display: '.', finger: 'right-ring', position: { row: 3, col: 9 }, size: 'normal', type: 'modifier' },
      { key: '/', display: '/', finger: 'right-pinky', position: { row: 3, col: 10 }, size: 'normal', type: 'modifier' },
      { key: 'Shift', display: 'Shift', finger: 'right-pinky', position: { row: 3, col: 11 }, size: 'extra-wide', type: 'modifier' }
    ],
    // Space row
    [
      { key: 'Ctrl', display: 'Ctrl', finger: 'left-pinky', position: { row: 4, col: 0 }, size: 'normal', type: 'modifier' },
      { key: 'Win', display: '⊞', finger: 'left-thumb', position: { row: 4, col: 1 }, size: 'normal', type: 'modifier' },
      { key: 'Alt', display: 'Alt', finger: 'left-thumb', position: { row: 4, col: 2 }, size: 'normal', type: 'modifier' },
      { key: ' ', display: '', finger: 'thumbs', position: { row: 4, col: 3 }, size: 'extra-wide', type: 'space' },
      { key: 'Alt', display: 'Alt', finger: 'right-thumb', position: { row: 4, col: 4 }, size: 'normal', type: 'modifier' },
      { key: 'Win', display: '⊞', finger: 'right-thumb', position: { row: 4, col: 5 }, size: 'normal', type: 'modifier' },
      { key: 'Menu', display: '☰', finger: 'right-pinky', position: { row: 4, col: 6 }, size: 'normal', type: 'modifier' },
      { key: 'Ctrl', display: 'Ctrl', finger: 'right-pinky', position: { row: 4, col: 7 }, size: 'normal', type: 'modifier' }
    ]
  ];

  // Finger positions and colors
  private fingerPositions: FingerPosition[] = [
    { finger: 'left-pinky', homeKey: 'a', color: '#ff6b6b', side: 'left' },
    { finger: 'left-ring', homeKey: 's', color: '#4ecdc4', side: 'left' },
    { finger: 'left-middle', homeKey: 'd', color: '#45b7d1', side: 'left' },
    { finger: 'left-index', homeKey: 'f', color: '#96ceb4', side: 'left' },
    { finger: 'right-index', homeKey: 'j', color: '#ffeaa7', side: 'right' },
    { finger: 'right-middle', homeKey: 'k', color: '#fab1a0', side: 'right' },
    { finger: 'right-ring', homeKey: 'l', color: '#fd79a8', side: 'right' },
    { finger: 'right-pinky', homeKey: ';', color: '#a29bfe', side: 'right' },
    { finger: 'thumbs', homeKey: ' ', color: '#6c5ce7', side: 'left' }
  ];

  getKeyboardLayout(): KeyboardKey[][] {
    return this.keyboardLayout;
  }

  getFingerPositions(): FingerPosition[] {
    return this.fingerPositions;
  }

  getKeyByCharacter(char: string): KeyboardKey | null {
    for (const row of this.keyboardLayout) {
      for (const key of row) {
        if (key.key.toLowerCase() === char.toLowerCase()) {
          return key;
        }
      }
    }
    return null;
  }

  getFingerForKey(key: string): FingerPosition | null {
    const keyData = this.getKeyByCharacter(key);
    if (!keyData) return null;
    
    return this.fingerPositions.find(finger => finger.finger === keyData.finger) || null;
  }

  getFingerColor(finger: string): string {
    const fingerPos = this.fingerPositions.find(f => f.finger === finger);
    return fingerPos?.color || '#666';
  }

  getHomeRowKeys(): string[] {
    return this.fingerPositions.map(finger => finger.homeKey);
  }

  getKeysForFinger(fingerName: string): KeyboardKey[] {
    const keys: KeyboardKey[] = [];
    for (const row of this.keyboardLayout) {
      for (const key of row) {
        if (key.finger === fingerName) {
          keys.push(key);
        }
      }
    }
    return keys;
  }

  // Hand detection methods
  isLeftHand(finger: string): boolean {
    return finger.startsWith('left') || finger === 'thumbs';
  }

  isRightHand(finger: string): boolean {
    return finger.startsWith('right');
  }

  // Keyboard layout validation
  validateKeyboardLayout(): boolean {
    // Check if all finger positions have corresponding keys
    const allFingers = this.fingerPositions.map(f => f.finger);
    const keyFingers = new Set<string>();
    
    for (const row of this.keyboardLayout) {
      for (const key of row) {
        keyFingers.add(key.finger);
      }
    }

    return allFingers.every(finger => keyFingers.has(finger));
  }
}