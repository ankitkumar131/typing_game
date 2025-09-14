import { Injectable } from '@angular/core';

export type SoundType = 'correct' | 'incorrect' | 'gameStart' | 'gameEnd' | 'pause' | 'resume' | 'skip' | 'achievement';

interface SoundConfig {
  enabled: boolean;
  volume: number;
  soundPack: 'default' | 'retro' | 'minimal';
}

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private audioContext?: AudioContext;
  private sounds: Map<SoundType, AudioBuffer> = new Map();
  private config: SoundConfig = {
    enabled: true,
    volume: 0.5,
    soundPack: 'default'
  };

  constructor() {
    this.initializeAudio();
    this.loadSoundConfig();
  }

  private initializeAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.generateSounds();
    } catch (error) {
      console.warn('Web Audio API not supported, sound disabled');
    }
  }

  private loadSoundConfig(): void {
    const savedConfig = localStorage.getItem('typingGame_soundConfig');
    if (savedConfig) {
      this.config = { ...this.config, ...JSON.parse(savedConfig) };
    }
  }

  private saveSoundConfig(): void {
    localStorage.setItem('typingGame_soundConfig', JSON.stringify(this.config));
  }

  private generateSounds(): void {
    if (!this.audioContext) return;

    this.sounds.set('correct', this.generateTone(800, 0.1, 'square'));
    this.sounds.set('incorrect', this.generateTone(200, 0.2, 'sawtooth'));
    this.sounds.set('gameStart', this.generateMelody([440, 554, 659], 0.15));
    this.sounds.set('gameEnd', this.generateMelody([659, 554, 440], 0.2));
    this.sounds.set('pause', this.generateTone(400, 0.1, 'sine'));
    this.sounds.set('resume', this.generateTone(600, 0.1, 'sine'));
    this.sounds.set('skip', this.generateTone(300, 0.05, 'triangle'));
    this.sounds.set('achievement', this.generateMelody([523, 659, 784, 1047], 0.12));
  }

  private generateTone(frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const numSamples = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      let sample = 0;

      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * time);
          break;
        case 'square':
          sample = Math.sign(Math.sin(2 * Math.PI * frequency * time));
          break;
        case 'triangle':
          sample = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * time));
          break;
        case 'sawtooth':
          sample = 2 * (frequency * time - Math.floor(frequency * time + 0.5));
          break;
      }

      const envelope = this.generateEnvelope(time, duration);
      channelData[i] = sample * envelope;
    }

    return buffer;
  }

  private generateMelody(frequencies: number[], noteDuration: number): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');

    const sampleRate = this.audioContext.sampleRate;
    const totalDuration = frequencies.length * noteDuration;
    const numSamples = totalDuration * sampleRate;
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      const noteIndex = Math.floor(time / noteDuration);
      const noteTime = time % noteDuration;
      
      if (noteIndex < frequencies.length) {
        const frequency = frequencies[noteIndex];
        const sample = Math.sin(2 * Math.PI * frequency * noteTime);
        const envelope = this.generateEnvelope(noteTime, noteDuration);
        channelData[i] = sample * envelope;
      }
    }

    return buffer;
  }

  private generateEnvelope(time: number, duration: number): number {
    const attackTime = duration * 0.1;
    const releaseTime = duration * 0.3;
    
    if (time < attackTime) {
      return time / attackTime;
    } else if (time > duration - releaseTime) {
      return (duration - time) / releaseTime;
    }
    return 1;
  }

  playSound(soundType: SoundType): void {
    if (!this.config.enabled || !this.audioContext || !this.sounds.has(soundType)) {
      return;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const buffer = this.sounds.get(soundType)!;
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = this.config.volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveSoundConfig();
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.saveSoundConfig();
  }

  getVolume(): number {
    return this.config.volume;
  }

  setSoundPack(pack: SoundConfig['soundPack']): void {
    this.config.soundPack = pack;
    this.saveSoundConfig();
    this.generateSounds();
  }

  getSoundPack(): SoundConfig['soundPack'] {
    return this.config.soundPack;
  }

  getConfig(): SoundConfig {
    return { ...this.config };
  }

  testSound(): void {
    this.playSound('correct');
  }
}
