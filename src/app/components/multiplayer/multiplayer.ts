import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { MultiplayerService, Room, Player, RoomSettings } from '../../services/multiplayer';
import { SocialService, Friend, Challenge, Notification } from '../../services/social';

@Component({
  selector: 'app-multiplayer',
  imports: [CommonModule, FormsModule],
  templateUrl: './multiplayer.html',
  styleUrl: './multiplayer.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class MultiplayerComponent implements OnInit, OnDestroy {
  
  // Current view state
  currentView: 'lobby' | 'room' | 'game' | 'social' = 'lobby';
  
  // Room creation form
  roomForm = {
    name: '',
    maxPlayers: 4,
    duration: 60,
    difficulty: 'Medium',
    category: 'Common',
    isPrivate: false,
    password: '',
    allowSpectators: true
  };

  // Social features
  searchQuery = '';
  searchResults: Friend[] = [];
  selectedFriends: string[] = [];
  
  // Chat
  chatMessages: any[] = [];
  currentMessage = '';
  
  // UI state
  showCreateRoom = false;
  showInviteFriends = false;
  isConnecting = false;
  connectionError = '';

  constructor(
    public multiplayerService: MultiplayerService,
    public socialService: SocialService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadChatHistory();
    this.checkConnection();
  }

  ngOnDestroy(): void {
    // Clean up any active connections
  }

  // Connection Management
  async connectToServer(): Promise<void> {
    this.isConnecting = true;
    this.connectionError = '';

    try {
      const success = await this.multiplayerService.connect();
      if (success) {
        this.currentView = 'lobby';
      } else {
        this.connectionError = 'Failed to connect to multiplayer server';
      }
    } catch (error) {
      this.connectionError = 'Connection error occurred';
    }

    this.isConnecting = false;
  }

  disconnect(): void {
    this.multiplayerService.disconnect();
    this.currentView = 'lobby';
  }

  // Room Management
  toggleCreateRoom(): void {
    this.showCreateRoom = !this.showCreateRoom;
    if (this.showCreateRoom) {
      this.resetRoomForm();
    }
  }

  async createRoom(): Promise<void> {
    if (!this.roomForm.name.trim()) return;

    try {
      const settings: RoomSettings = {
        duration: this.roomForm.duration,
        difficulty: this.roomForm.difficulty,
        category: this.roomForm.category,
        maxPlayers: this.roomForm.maxPlayers,
        allowSpectators: this.roomForm.allowSpectators
      };

      const room = await this.multiplayerService.createRoom(
        settings,
        this.roomForm.name,
        this.roomForm.isPrivate,
        this.roomForm.password || undefined
      );

      this.currentView = 'room';
      this.showCreateRoom = false;
      
      // Send invites to selected friends
      this.inviteSelectedFriends();
      
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  }

  async joinRoom(roomId: string, password?: string): Promise<void> {
    try {
      const success = await this.multiplayerService.joinRoom(roomId, password);
      if (success) {
        this.currentView = 'room';
      }
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  }

  leaveRoom(): void {
    this.multiplayerService.leaveRoom();
    this.currentView = 'lobby';
  }

  // Game Management
  async startGame(): Promise<void> {
    const success = await this.multiplayerService.startGame();
    if (success) {
      this.currentView = 'game';
      // Navigate to actual game component with multiplayer mode
      this.router.navigate(['/game'], {
        queryParams: { mode: 'multiplayer' }
      });
    }
  }

  // Player Actions
  toggleReady(): void {
    const player = this.multiplayerService.currentPlayer();
    // This would toggle ready status
    console.log('Toggle ready for player:', player?.name);
  }

  kickPlayer(playerId: string): void {
    if (this.multiplayerService.isHost()) {
      console.log('Kicking player:', playerId);
    }
  }

  // Social Features
  switchToSocialView(): void {
    this.currentView = 'social';
  }

  switchToLobbyView(): void {
    this.currentView = 'lobby';
  }

  searchUsers(): void {
    if (this.searchQuery.trim()) {
      this.searchResults = this.socialService.searchUsers(this.searchQuery);
    } else {
      this.searchResults = [];
    }
  }

  sendFriendRequest(userId: string): void {
    this.socialService.sendFriendRequest(userId, 'Let\'s be typing buddies!');
  }

  acceptFriendRequest(requestId: string): void {
    this.socialService.acceptFriendRequest(requestId);
  }

  declineFriendRequest(requestId: string): void {
    this.socialService.declineFriendRequest(requestId);
  }

  sendChallenge(friendId: string): void {
    this.socialService.sendChallenge(
      friendId,
      'standard',
      {
        duration: 60,
        difficulty: 'Medium',
        category: 'Common'
      },
      'Ready for a typing challenge?'
    );
  }

  acceptChallenge(challengeId: string): void {
    this.socialService.acceptChallenge(challengeId);
    // Navigate to game with challenge settings
    this.router.navigate(['/game'], {
      queryParams: { challenge: challengeId }
    });
  }

  declineChallenge(challengeId: string): void {
    this.socialService.declineChallenge(challengeId);
  }

  // Friend Invites
  toggleInviteFriends(): void {
    this.showInviteFriends = !this.showInviteFriends;
    this.selectedFriends = [];
  }

  toggleFriendSelection(friendId: string): void {
    const index = this.selectedFriends.indexOf(friendId);
    if (index > -1) {
      this.selectedFriends.splice(index, 1);
    } else {
      this.selectedFriends.push(friendId);
    }
  }

  inviteSelectedFriends(): void {
    this.selectedFriends.forEach(friendId => {
      this.multiplayerService.invitePlayer(friendId);
    });
    
    this.showInviteFriends = false;
    this.selectedFriends = [];
  }

  // Chat System
  sendChatMessage(): void {
    if (!this.currentMessage.trim()) return;

    const message = {
      id: Date.now().toString(),
      playerId: this.multiplayerService.currentPlayer()?.id,
      playerName: this.multiplayerService.currentPlayer()?.name,
      message: this.currentMessage,
      timestamp: Date.now()
    };

    this.chatMessages.push(message);
    this.multiplayerService.sendChatMessage(this.currentMessage);
    this.currentMessage = '';
    this.saveChatHistory();
  }

  // Notifications
  markNotificationAsRead(notificationId: string): void {
    this.socialService.markNotificationAsRead(notificationId);
  }

  markAllNotificationsAsRead(): void {
    this.socialService.markAllNotificationsAsRead();
  }

  deleteNotification(notificationId: string): void {
    this.socialService.deleteNotification(notificationId);
  }

  // Utility Methods
  getCurrentRoomSettings() {
    const room = this.multiplayerService.currentRoom();
    return {
      duration: room?.gameSettings?.duration || 0,
      difficulty: room?.gameSettings?.difficulty || 'Medium',
      category: room?.gameSettings?.category || 'Common',
      maxPlayers: room?.gameSettings?.maxPlayers || 0
    };
  }

  getCurrentRoomPlayerCount() {
    return this.multiplayerService.currentRoom()?.players?.length || 0;
  }

  getCurrentRoomMaxPlayers() {
    return this.multiplayerService.currentRoom()?.maxPlayers || 0;
  }

  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatRelativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  getStatusIcon(status: string): string {
    const icons = {
      online: '🟢',
      offline: '⚫',
      playing: '🎮',
      idle: '🟡',
      connected: '🔗',
      disconnected: '🔴',
      typing: '⌨️',
      finished: '✅'
    };
    return icons[status as keyof typeof icons] || '❔';
  }

  getPlayerPositionText(position: number): string {
    if (position === 1) return '🥇 1st';
    if (position === 2) return '🥈 2nd';
    if (position === 3) return '🥉 3rd';
    return `${position}th`;
  }

  getRoomStatusColor(status: string): string {
    const colors = {
      waiting: '#10b981',
      starting: '#f59e0b',
      playing: '#ef4444',
      finished: '#6b7280'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  }

  trackByRoomId(index: number, room: Room): string {
    return room.id;
  }

  trackByPlayerId(index: number, player: Player): string {
    return player.id;
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }

  // Private Methods
  private checkConnection(): void {
    if (!this.multiplayerService.isConnected()) {
      this.currentView = 'lobby';
    }
  }

  private resetRoomForm(): void {
    this.roomForm = {
      name: '',
      maxPlayers: 4,
      duration: 60,
      difficulty: 'Medium',
      category: 'Common',
      isPrivate: false,
      password: '',
      allowSpectators: true
    };
  }

  private loadChatHistory(): void {
    const saved = localStorage.getItem('multiplayerChat');
    if (saved) {
      try {
        this.chatMessages = JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to load chat history');
      }
    }
  }

  private saveChatHistory(): void {
    // Keep only last 50 messages
    if (this.chatMessages.length > 50) {
      this.chatMessages = this.chatMessages.slice(-50);
    }
    localStorage.setItem('multiplayerChat', JSON.stringify(this.chatMessages));
  }
}