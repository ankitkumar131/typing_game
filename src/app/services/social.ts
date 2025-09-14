import { Injectable, signal, computed } from '@angular/core';

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  status: 'online' | 'offline' | 'playing' | 'idle';
  level: number;
  wpm: number;
  lastActive: number;
  isOnline: boolean;
  gameStats: {
    gamesPlayed: number;
    averageWpm: number;
    bestWpm: number;
    averageAccuracy: number;
    totalScore: number;
  };
}

export interface SocialProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  level: number;
  experience: number;
  joinDate: number;
  stats: {
    gamesPlayed: number;
    totalPlayTime: number;
    averageWpm: number;
    bestWpm: number;
    averageAccuracy: number;
    totalScore: number;
    achievements: string[];
    favoriteMode: string;
  };
  preferences: {
    privacy: 'public' | 'friends' | 'private';
    allowFriendRequests: boolean;
    allowChallenges: boolean;
    showOnlineStatus: boolean;
  };
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  fromAvatar: string;
  message?: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'declined';
}

export interface Challenge {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUsername: string;
  toUsername: string;
  gameMode: string;
  settings: {
    duration: number;
    difficulty: string;
    category: string;
  };
  message?: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  expiresAt: number;
}

export interface Notification {
  id: string;
  type: 'friend_request' | 'challenge' | 'achievement' | 'game_result' | 'system';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  data?: any;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocialService {
  
  // User profile state
  private _currentProfile = signal<SocialProfile | null>(null);
  private _friends = signal<Friend[]>([]);
  private _friendRequests = signal<FriendRequest[]>([]);
  private _challenges = signal<Challenge[]>([]);
  private _notifications = signal<Notification[]>([]);
  
  // Social features state
  private _onlineFriends = computed(() => 
    this._friends().filter(f => f.status === 'online' || f.status === 'playing')
  );
  private _unreadNotifications = computed(() => 
    this._notifications().filter(n => !n.isRead)
  );
  private _pendingFriendRequests = computed(() => 
    this._friendRequests().filter(r => r.status === 'pending')
  );
  private _pendingChallenges = computed(() => 
    this._challenges().filter(c => c.status === 'pending' && c.expiresAt > Date.now())
  );

  // Public computed properties
  currentProfile = this._currentProfile.asReadonly();
  friends = this._friends.asReadonly();
  friendRequests = this._friendRequests.asReadonly();
  challenges = this._challenges.asReadonly();
  notifications = this._notifications.asReadonly();
  onlineFriends = this._onlineFriends;
  unreadNotifications = this._unreadNotifications;
  pendingFriendRequests = this._pendingFriendRequests;
  pendingChallenges = this._pendingChallenges;

  constructor() {
    this.initializeSocialData();
    this.startNotificationPolling();
  }

  // Profile Management
  createProfile(username: string, displayName: string, bio: string = ''): SocialProfile {
    const profile: SocialProfile = {
      id: this.generateId(),
      username,
      displayName,
      bio,
      avatar: this.getRandomAvatar(),
      level: 1,
      experience: 0,
      joinDate: Date.now(),
      stats: {
        gamesPlayed: 0,
        totalPlayTime: 0,
        averageWpm: 0,
        bestWpm: 0,
        averageAccuracy: 0,
        totalScore: 0,
        achievements: [],
        favoriteMode: 'standard'
      },
      preferences: {
        privacy: 'public',
        allowFriendRequests: true,
        allowChallenges: true,
        showOnlineStatus: true
      }
    };

    this._currentProfile.set(profile);
    this.saveProfile(profile);
    return profile;
  }

  updateProfile(updates: Partial<SocialProfile>): void {
    const current = this._currentProfile();
    if (!current) return;

    const updated = { ...current, ...updates };
    this._currentProfile.set(updated);
    this.saveProfile(updated);
  }

  updateStats(gameResult: any): void {
    const profile = this._currentProfile();
    if (!profile) return;

    const updatedStats = {
      ...profile.stats,
      gamesPlayed: profile.stats.gamesPlayed + 1,
      totalPlayTime: profile.stats.totalPlayTime + (gameResult.duration || 60),
      averageWpm: Math.round((profile.stats.averageWpm * profile.stats.gamesPlayed + gameResult.wpm) / (profile.stats.gamesPlayed + 1)),
      bestWpm: Math.max(profile.stats.bestWpm, gameResult.wpm),
      averageAccuracy: Math.round((profile.stats.averageAccuracy * profile.stats.gamesPlayed + gameResult.accuracy) / (profile.stats.gamesPlayed + 1)),
      totalScore: profile.stats.totalScore + gameResult.score
    };

    this.updateProfile({ stats: updatedStats });
  }

  // Friend Management
  searchUsers(query: string): Friend[] {
    // Mock user search
    const mockUsers: Friend[] = [
      {
        id: 'user1',
        username: 'speedtyper123',
        displayName: 'Speed Typer',
        avatar: '⚡',
        status: 'online',
        level: 15,
        wpm: 85,
        lastActive: Date.now() - 300000,
        isOnline: true,
        gameStats: { gamesPlayed: 234, averageWpm: 82, bestWpm: 95, averageAccuracy: 94, totalScore: 45600 }
      },
      {
        id: 'user2',
        username: 'accuracyking',
        displayName: 'Accuracy King',
        avatar: '🎯',
        status: 'playing',
        level: 12,
        wpm: 72,
        lastActive: Date.now() - 60000,
        isOnline: true,
        gameStats: { gamesPlayed: 156, averageWpm: 68, bestWpm: 78, averageAccuracy: 98, totalScore: 32100 }
      },
      {
        id: 'user3',
        username: 'typingnovice',
        displayName: 'Typing Novice',
        avatar: '🌱',
        status: 'offline',
        level: 3,
        wpm: 35,
        lastActive: Date.now() - 7200000,
        isOnline: false,
        gameStats: { gamesPlayed: 45, averageWpm: 32, bestWpm: 42, averageAccuracy: 87, totalScore: 5400 }
      }
    ];

    return mockUsers.filter(user => 
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.displayName.toLowerCase().includes(query.toLowerCase())
    );
  }

  sendFriendRequest(userId: string, message?: string): void {
    const profile = this._currentProfile();
    if (!profile) return;

    const request: FriendRequest = {
      id: this.generateId(),
      fromUserId: profile.id,
      toUserId: userId,
      fromUsername: profile.username,
      fromDisplayName: profile.displayName,
      fromAvatar: profile.avatar,
      message,
      timestamp: Date.now(),
      status: 'pending'
    };

    // In a real app, this would be sent to the server
    this.addNotification({
      type: 'friend_request',
      title: 'Friend Request Sent',
      message: `Friend request sent to user`,
      timestamp: Date.now(),
      isRead: false,
      icon: '👥'
    });
  }

  acceptFriendRequest(requestId: string): void {
    const requests = this._friendRequests();
    const request = requests.find(r => r.id === requestId);
    
    if (!request) return;

    // Update request status
    this._friendRequests.update(reqs => 
      reqs.map(r => r.id === requestId ? { ...r, status: 'accepted' as const } : r)
    );

    // Add to friends list
    const newFriend: Friend = {
      id: request.fromUserId,
      username: request.fromUsername,
      displayName: request.fromDisplayName,
      avatar: request.fromAvatar,
      status: 'online',
      level: 5,
      wpm: 45,
      lastActive: Date.now(),
      isOnline: true,
      gameStats: { gamesPlayed: 67, averageWpm: 42, bestWpm: 58, averageAccuracy: 89, totalScore: 8900 }
    };

    this._friends.update(friends => [...friends, newFriend]);
    this.saveFriends();

    this.addNotification({
      type: 'friend_request',
      title: 'Friend Request Accepted',
      message: `You are now friends with ${request.fromDisplayName}`,
      timestamp: Date.now(),
      isRead: false,
      icon: '✅'
    });
  }

  declineFriendRequest(requestId: string): void {
    this._friendRequests.update(reqs => 
      reqs.map(r => r.id === requestId ? { ...r, status: 'declined' as const } : r)
    );
  }

  removeFriend(friendId: string): void {
    this._friends.update(friends => friends.filter(f => f.id !== friendId));
    this.saveFriends();
  }

  // Challenge System
  sendChallenge(friendId: string, gameMode: string, settings: Challenge['settings'], message?: string): void {
    const profile = this._currentProfile();
    const friend = this._friends().find(f => f.id === friendId);
    
    if (!profile || !friend) return;

    const challenge: Challenge = {
      id: this.generateId(),
      fromUserId: profile.id,
      toUserId: friendId,
      fromUsername: profile.username,
      toUsername: friend.username,
      gameMode,
      settings,
      message,
      timestamp: Date.now(),
      status: 'pending',
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    this._challenges.update(challenges => [...challenges, challenge]);

    this.addNotification({
      type: 'challenge',
      title: 'Challenge Sent',
      message: `Challenge sent to ${friend.displayName}`,
      timestamp: Date.now(),
      isRead: false,
      icon: '⚔️'
    });
  }

  acceptChallenge(challengeId: string): void {
    this._challenges.update(challenges => 
      challenges.map(c => c.id === challengeId ? { ...c, status: 'accepted' as const } : c)
    );

    const challenge = this._challenges().find(c => c.id === challengeId);
    if (challenge) {
      this.addNotification({
        type: 'challenge',
        title: 'Challenge Accepted',
        message: `Starting challenge with ${challenge.fromUsername}`,
        timestamp: Date.now(),
        isRead: false,
        icon: '🎮'
      });
    }
  }

  declineChallenge(challengeId: string): void {
    this._challenges.update(challenges => 
      challenges.map(c => c.id === challengeId ? { ...c, status: 'declined' as const } : c)
    );
  }

  // Notification Management
  addNotification(notification: Omit<Notification, 'id'>): void {
    const fullNotification: Notification = {
      id: this.generateId(),
      ...notification
    };

    this._notifications.update(notifications => [fullNotification, ...notifications]);
    this.saveNotifications();
  }

  markNotificationAsRead(notificationId: string): void {
    this._notifications.update(notifications => 
      notifications.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    this.saveNotifications();
  }

  markAllNotificationsAsRead(): void {
    this._notifications.update(notifications => 
      notifications.map(n => ({ ...n, isRead: true }))
    );
    this.saveNotifications();
  }

  deleteNotification(notificationId: string): void {
    this._notifications.update(notifications => 
      notifications.filter(n => n.id !== notificationId)
    );
    this.saveNotifications();
  }

  // Social Features
  getFriendActivity(): any[] {
    return this._friends().filter(f => f.isOnline).map(friend => ({
      friendId: friend.id,
      friendName: friend.displayName,
      activity: friend.status === 'playing' ? 'Playing a typing game' : 'Online',
      timestamp: friend.lastActive,
      wpm: friend.wpm
    }));
  }

  getLeaderboard(): Friend[] {
    return [...this._friends()]
      .sort((a, b) => b.gameStats.bestWpm - a.gameStats.bestWpm)
      .slice(0, 10);
  }

  // Private helper methods
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private getRandomAvatar(): string {
    const avatars = ['👤', '👨', '👩', '🧑', '👱', '👳', '🧔', '👨‍💻', '👩‍💻', '🦸', '🎮', '⚡', '🎯', '🔥'];
    return avatars[Math.floor(Math.random() * avatars.length)];
  }

  private initializeSocialData(): void {
    this.loadProfile();
    this.loadFriends();
    this.loadNotifications();
    this.generateMockFriendRequests();
  }

  private generateMockFriendRequests(): void {
    const mockRequests: FriendRequest[] = [
      {
        id: 'req1',
        fromUserId: 'user1',
        toUserId: 'current',
        fromUsername: 'speedtyper123',
        fromDisplayName: 'Speed Typer',
        fromAvatar: '⚡',
        message: 'Hey! Want to practice typing together?',
        timestamp: Date.now() - 3600000,
        status: 'pending'
      },
      {
        id: 'req2',
        fromUserId: 'user2',
        toUserId: 'current',
        fromUsername: 'accuracyking',
        fromDisplayName: 'Accuracy King',
        fromAvatar: '🎯',
        timestamp: Date.now() - 7200000,
        status: 'pending'
      }
    ];

    this._friendRequests.set(mockRequests);
  }

  private startNotificationPolling(): void {
    // Simulate periodic notifications
    setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every interval
        this.generateRandomNotification();
      }
    }, 30000); // Check every 30 seconds
  }

  private generateRandomNotification(): void {
    const notifications = [
      {
        type: 'achievement' as const,
        title: 'New Achievement!',
        message: 'You unlocked "Speed Demon" achievement!',
        icon: '🏆'
      },
      {
        type: 'system' as const,
        title: 'Daily Challenge',
        message: 'New daily challenge available!',
        icon: '🎯'
      },
      {
        type: 'friend_request' as const,
        title: 'Friend Activity',
        message: 'Your friend just beat their personal record!',
        icon: '🎉'
      }
    ];

    const notification = notifications[Math.floor(Math.random() * notifications.length)];
    this.addNotification({
      ...notification,
      timestamp: Date.now(),
      isRead: false
    });
  }

  // Data persistence
  private saveProfile(profile: SocialProfile): void {
    localStorage.setItem('socialProfile', JSON.stringify(profile));
  }

  private loadProfile(): void {
    const saved = localStorage.getItem('socialProfile');
    if (saved) {
      try {
        this._currentProfile.set(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to load social profile');
      }
    }
  }

  private saveFriends(): void {
    localStorage.setItem('socialFriends', JSON.stringify(this._friends()));
  }

  private loadFriends(): void {
    const saved = localStorage.getItem('socialFriends');
    if (saved) {
      try {
        this._friends.set(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to load friends list');
        this.generateMockFriends();
      }
    } else {
      this.generateMockFriends();
    }
  }

  private generateMockFriends(): void {
    const mockFriends: Friend[] = [
      {
        id: 'friend1',
        username: 'typingpro',
        displayName: 'Typing Pro',
        avatar: '🏆',
        status: 'online',
        level: 20,
        wpm: 95,
        lastActive: Date.now() - 300000,
        isOnline: true,
        gameStats: { gamesPlayed: 456, averageWpm: 89, bestWpm: 112, averageAccuracy: 96, totalScore: 87500 }
      },
      {
        id: 'friend2',
        username: 'keyboardninja',
        displayName: 'Keyboard Ninja',
        avatar: '🥷',
        status: 'playing',
        level: 18,
        wpm: 88,
        lastActive: Date.now() - 120000,
        isOnline: true,
        gameStats: { gamesPlayed: 389, averageWpm: 85, bestWpm: 103, averageAccuracy: 93, totalScore: 76200 }
      },
      {
        id: 'friend3',
        username: 'wordspeeder',
        displayName: 'Word Speeder',
        avatar: '💨',
        status: 'idle',
        level: 14,
        wpm: 76,
        lastActive: Date.now() - 1800000,
        isOnline: true,
        gameStats: { gamesPlayed: 267, averageWpm: 73, bestWpm: 89, averageAccuracy: 91, totalScore: 54300 }
      }
    ];

    this._friends.set(mockFriends);
    this.saveFriends();
  }

  private saveNotifications(): void {
    localStorage.setItem('socialNotifications', JSON.stringify(this._notifications()));
  }

  private loadNotifications(): void {
    const saved = localStorage.getItem('socialNotifications');
    if (saved) {
      try {
        this._notifications.set(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to load notifications');
      }
    }
  }
}