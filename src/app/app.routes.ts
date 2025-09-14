import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./components/home/home').then(m => m.Home)
  },
  {
    path: 'game',
    loadComponent: () => import('./components/game/game').then(m => m.Game)
  },
  {
    path: 'game-modes',
    loadComponent: () => import('./components/game-modes/game-modes').then(m => m.GameModesComponent)
  },
  {
    path: 'daily-challenges',
    loadComponent: () => import('./components/daily-challenges/daily-challenges').then(m => m.DailyChallengesComponent)
  },
  {
    path: 'custom-text',
    loadComponent: () => import('./components/custom-text/custom-text').then(m => m.CustomTextComponent)
  },
  {
    path: 'leaderboard',
    loadComponent: () => import('./components/leaderboard/leaderboard').then(m => m.Leaderboard)
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile').then(m => m.Profile)
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings').then(m => m.Settings)
  },
  {
    path: 'multiplayer',
    loadComponent: () => import('./components/multiplayer/multiplayer').then(m => m.MultiplayerComponent)
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
