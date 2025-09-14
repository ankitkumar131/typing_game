import { Injectable, signal, computed } from '@angular/core';

export interface Room {
  id: string;
  name: string;
  host: string;
  players: Player[];
  maxPlayers: number;
  gameSettings: RoomSettings;
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  createdAt: number;
  gameMode: string;
  isPrivate: boolean;
  password?: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  currentWpm: number;
  currentAccuracy: number;
  progress: number;
  score: number;
  position: number;
  status: 'connected' | 'disconnected' | 'typing' | 'finished';
}

export interface RoomSettings {
  duration: number;
  difficulty: string;
  category: string;
  maxPlayers: number;
  allowSpectators: boolean;
  text?: string;
}

export interface GameSession {
  roomId: string;
  players: Player[];
  startTime: number;
  endTime?: number;
  currentText: string;
  results?: SessionResult[];
}

export interface SessionResult {
  playerId: string;
  playerName: string;
  wpm: number;
  accuracy: number;
  score: number;
  position: number;
  wordsTyped: number;
  mistakes: number;
}

@Injectable({
  providedIn: 'root'
})
export class MultiplayerService {
  
  // Connection state
  private _isConnected = signal(false);
  private _connectionStatus = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  // Room state
  private _currentRoom = signal<Room | null>(null);
  private _availableRooms = signal<Room[]>([]);
  private _currentSession = signal<GameSession | null>(null);
  
  // Player state
  private _currentPlayer = signal<Player | null>(null);
  private _playerStats = signal({
    gamesPlayed: 0,
    wins: 0,
    averageWpm: 0,
    bestWpm: 0,
    averageAccuracy: 0,
    totalScore: 0,
    rank: 'Beginner'
  });

  // Public computed properties
  isConnected = this._isConnected.asReadonly();
  connectionStatus = this._connectionStatus.asReadonly();
  currentRoom = this._currentRoom.asReadonly();
  availableRooms = this._availableRooms.asReadonly();
  currentSession = this._currentSession.asReadonly();
  currentPlayer = this._currentPlayer.asReadonly();
  playerStats = this._playerStats.asReadonly();

  // Computed room info
  isInRoom = computed(() => this._currentRoom() !== null);
  isHost = computed(() => {
    const room = this._currentRoom();
    const player = this._currentPlayer();
    return room && player && room.host === player.id;
  });
  canStartGame = computed(() => {
    const room = this._currentRoom();
    if (!room || !this.isHost()) return false;
    return room.players.filter(p => p.isReady).length >= 2;
  });

  constructor() {
    this.loadPlayerStats();
    this.generateMockRooms();
  }

  // Connection Management
  async connect(): Promise<boolean> {
    this._connectionStatus.set('connecting');
    
    try {
      // Simulate connection delay
      await this.delay(1500);
      
      // Mock successful connection
      this._isConnected.set(true);
      this._connectionStatus.set('connected');
      
      // Create mock player
      this._currentPlayer.set({
        id: this.generateId(),
        name: `Player${Math.floor(Math.random() * 1000)}`,
        avatar: this.getRandomAvatar(),
        isHost: false,
        isReady: false,
        currentWpm: 0,
        currentAccuracy: 0,
        progress: 0,
        score: 0,
        position: 0,
        status: 'connected'
      });
      
      return true;
    } catch (error) {
      this._connectionStatus.set('disconnected');
      return false;
    }
  }

  disconnect(): void {
    if (this._currentRoom()) {
      this.leaveRoom();
    }
    
    this._isConnected.set(false);
    this._connectionStatus.set('disconnected');
    this._currentPlayer.set(null);
  }

  // Room Management
  async createRoom(settings: RoomSettings, roomName: string, isPrivate: boolean = false, password?: string): Promise<Room> {
    const player = this._currentPlayer();
    if (!player) throw new Error('Not connected');

    const room: Room = {
      id: this.generateId(),
      name: roomName,
      host: player.id,
      players: [{ ...player, isHost: true }],
      maxPlayers: settings.maxPlayers,
      gameSettings: settings,
      status: 'waiting',
      createdAt: Date.now(),
      gameMode: 'multiplayer',
      isPrivate,
      password
    };

    this._currentRoom.set(room);
    this.addToAvailableRooms(room);
    
    return room;
  }

  async joinRoom(roomId: string, password?: string): Promise<boolean> {
    const player = this._currentPlayer();
    if (!player) throw new Error('Not connected');

    const rooms = this._availableRooms();
    const room = rooms.find(r => r.id === roomId);
    
    if (!room) throw new Error('Room not found');
    if (room.players.length >= room.maxPlayers) throw new Error('Room is full');
    if (room.isPrivate && room.password !== password) throw new Error('Invalid password');

    // Add player to room
    const updatedRoom = {
      ...room,
      players: [...room.players, { ...player, isHost: false }]
    };

    this._currentRoom.set(updatedRoom);
    this.updateAvailableRoom(updatedRoom);
    
    return true;
  }

  leaveRoom(): void {
    const room = this._currentRoom();
    const player = this._currentPlayer();
    
    if (!room || !player) return;

    if (this.isHost()) {
      // Host leaving - close room
      this.removeFromAvailableRooms(room.id);
    } else {
      // Player leaving - update room
      const updatedRoom = {
        ...room,
        players: room.players.filter(p => p.id !== player.id)
      };
      this.updateAvailableRoom(updatedRoom);
    }

    this._currentRoom.set(null);
    this._currentSession.set(null);
  }

  // Game Management
  async startGame(): Promise<boolean> {
    const room = this._currentRoom();
    if (!room || !this.canStartGame()) return false;

    // Update room status
    const updatedRoom = { ...room, status: 'starting' as const };
    this._currentRoom.set(updatedRoom);

    // Create game session
    const session: GameSession = {
      roomId: room.id,
      players: room.players,
      startTime: Date.now() + 5000, // 5 second countdown
      currentText: this.generateGameText(room.gameSettings)
    };

    this._currentSession.set(session);
    
    // Simulate countdown and start
    await this.delay(5000);
    
    const gameRoom = { ...updatedRoom, status: 'playing' as const };
    this._currentRoom.set(gameRoom);
    
    return true;
  }

  updatePlayerProgress(wpm: number, accuracy: number, progress: number, score: number): void {
    const player = this._currentPlayer();
    const room = this._currentRoom();
    
    if (!player || !room) return;

    // Update current player stats
    const updatedPlayer = {
      ...player,
      currentWpm: wpm,
      currentAccuracy: accuracy,
      progress,
      score,
      status: 'typing' as const
    };
    
    this._currentPlayer.set(updatedPlayer);

    // Update room player data
    const updatedRoom = {
      ...room,
      players: room.players.map(p => 
        p.id === player.id ? updatedPlayer : p
      )
    };
    
    this._currentRoom.set(updatedRoom);
  }

  finishGame(finalWpm: number, finalAccuracy: number, finalScore: number, wordsTyped: number, mistakes: number): void {
    const player = this._currentPlayer();
    const session = this._currentSession();
    
    if (!player || !session) return;

    // Update player as finished
    const finishedPlayer = {
      ...player,
      currentWpm: finalWpm,
      currentAccuracy: finalAccuracy,
      score: finalScore,
      status: 'finished' as const,
      progress: 100
    };
    
    this._currentPlayer.set(finishedPlayer);

    // Update session results
    const result: SessionResult = {
      playerId: player.id,
      playerName: player.name,
      wpm: finalWpm,
      accuracy: finalAccuracy,
      score: finalScore,
      position: 0, // Will be calculated when all players finish
      wordsTyped,
      mistakes
    };

    // Add result to session
    const updatedSession = {
      ...session,
      results: [...(session.results || []), result]
    };
    
    this._currentSession.set(updatedSession);

    // Update player stats
    this.updatePlayerStats(finalWpm, finalAccuracy, finalScore);
  }

  // Social Features
  sendChatMessage(message: string): void {
    // Mock chat system
    console.log(`Chat: ${this._currentPlayer()?.name}: ${message}`);
  }

  invitePlayer(playerId: string): void {
    // Mock invite system
    console.log(`Inviting player ${playerId} to room`);
  }

  // Statistics
  getPlayerRank(wpm: number): string {
    if (wpm >= 80) return 'Master';
    if (wpm >= 60) return 'Expert';
    if (wpm >= 40) return 'Advanced';
    if (wpm >= 25) return 'Intermediate';
    return 'Beginner';
  }

  // Private helper methods
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private getRandomAvatar(): string {
    const avatars = ['👤', '👨', '👩', '🧑', '👱', '👳', '🧔', '👨‍💻', '👩‍💻'];
    return avatars[Math.floor(Math.random() * avatars.length)];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateGameText(settings: RoomSettings): string {
    // Mock text generation based on settings
    const texts = [
      "The quick brown fox jumps over the lazy dog.",
      "Programming is the art of telling another human what one wants the computer to do.",
      "In the midst of winter, I found there was, within me, an invincible summer.",
      "Technology is best when it brings people together.",
      "The only way to do great work is to love what you do."
    ];
    
    return texts[Math.floor(Math.random() * texts.length)];
  }

  private generateMockRooms(): void {
    const mockRooms: Room[] = [
      {
        id: 'room1',
        name: 'Speed Demons 🔥',
        host: 'host1',
        players: [
          { id: 'host1', name: 'SpeedKing', avatar: '👑', isHost: true, isReady: true, currentWpm: 0, currentAccuracy: 0, progress: 0, score: 0, position: 0, status: 'connected' },
          { id: 'player1', name: 'FastFingers', avatar: '⚡', isHost: false, isReady: true, currentWpm: 0, currentAccuracy: 0, progress: 0, score: 0, position: 0, status: 'connected' }
        ],
        maxPlayers: 4,
        gameSettings: { duration: 60, difficulty: 'Hard', category: 'Common', maxPlayers: 4, allowSpectators: true },
        status: 'waiting',
        createdAt: Date.now() - 120000,
        gameMode: 'speed',
        isPrivate: false
      },
      {
        id: 'room2',
        name: 'Accuracy Masters 🎯',
        host: 'host2',
        players: [
          { id: 'host2', name: 'PrecisionPro', avatar: '🎯', isHost: true, isReady: true, currentWpm: 0, currentAccuracy: 0, progress: 0, score: 0, position: 0, status: 'connected' }
        ],
        maxPlayers: 6,
        gameSettings: { duration: 120, difficulty: 'Medium', category: 'Literature', maxPlayers: 6, allowSpectators: true },
        status: 'waiting',
        createdAt: Date.now() - 60000,
        gameMode: 'accuracy',
        isPrivate: false
      },
      {
        id: 'room3',
        name: 'Casual Typing ☕',
        host: 'host3',
        players: [
          { id: 'host3', name: 'CasualTyper', avatar: '☕', isHost: true, isReady: false, currentWpm: 0, currentAccuracy: 0, progress: 0, score: 0, position: 0, status: 'connected' },
          { id: 'player2', name: 'RelaxedRacer', avatar: '🌸', isHost: false, isReady: true, currentWpm: 0, currentAccuracy: 0, progress: 0, score: 0, position: 0, status: 'connected' },
          { id: 'player3', name: 'ChillChampion', avatar: '🍃', isHost: false, isReady: false, currentWpm: 0, currentAccuracy: 0, progress: 0, score: 0, position: 0, status: 'connected' }
        ],
        maxPlayers: 8,
        gameSettings: { duration: 90, difficulty: 'Easy', category: 'Common', maxPlayers: 8, allowSpectators: true },
        status: 'waiting',
        createdAt: Date.now() - 300000,
        gameMode: 'casual',
        isPrivate: false
      }
    ];

    this._availableRooms.set(mockRooms);
  }

  private addToAvailableRooms(room: Room): void {
    if (!room.isPrivate) {
      this._availableRooms.update(rooms => [...rooms, room]);
    }
  }

  private updateAvailableRoom(updatedRoom: Room): void {
    this._availableRooms.update(rooms => 
      rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r)
    );
  }

  private removeFromAvailableRooms(roomId: string): void {
    this._availableRooms.update(rooms => 
      rooms.filter(r => r.id !== roomId)
    );
  }

  private loadPlayerStats(): void {
    const saved = localStorage.getItem('multiplayerStats');
    if (saved) {
      try {
        this._playerStats.set(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to load multiplayer stats');
      }
    }
  }

  private updatePlayerStats(wpm: number, accuracy: number, score: number): void {
    const current = this._playerStats();
    const updated = {
      gamesPlayed: current.gamesPlayed + 1,
      wins: current.wins, // Would be updated based on position
      averageWpm: Math.round((current.averageWpm * current.gamesPlayed + wpm) / (current.gamesPlayed + 1)),
      bestWpm: Math.max(current.bestWpm, wpm),
      averageAccuracy: Math.round((current.averageAccuracy * current.gamesPlayed + accuracy) / (current.gamesPlayed + 1)),
      totalScore: current.totalScore + score,
      rank: this.getPlayerRank(Math.max(current.bestWpm, wpm))
    };

    this._playerStats.set(updated);
    localStorage.setItem('multiplayerStats', JSON.stringify(updated));
  }
}