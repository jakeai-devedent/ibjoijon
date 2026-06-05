/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Team {
  id: string;
  name: string;
  flag: string;
  power: number; // 50 to 99
  reflex: number; // 50 to 99
  speed: number; // 50 to 99
  color: string; // Tailwind hex or class name
  secondaryColor: string;
}

export type ItemType = 'ball' | 'glove' | 'stadium';

export interface ShopItem {
  id: string;
  name: string;
  type: ItemType;
  price: number;
  unlocked: boolean;
  value: string; // Style code or design detail
  description: string;
  perk: string; // Visual or boost explanation
}

export interface PlayerProfile {
  coins: number;
  selectedTeamId: string;
  selectedBallId: string;
  selectedGloveId: string;
  selectedStadiumId: string;
  careerGoals: number;
  careerSaves: number;
  matchesPlayed: number;
  matchesWon: number;
  unlockedItemIds: string[];
  trophies: string[]; // List of won cup tournament names
}

export type PlayMode = 'SHOOT' | 'SAVE' | 'RESULT';

export interface ShotResult {
  playerTarget: { x: number; y: number } | null;
  aiTarget: { x: number; y: number } | null;
  success: boolean;
  message: string;
}

export interface InteractiveMatch {
  opponentTeam: Team;
  playerScore: number;
  opponentScore: number;
  currentTurn: number; // 1 to 5, and then sudden death
  isPlayerTurnToShoot: boolean; // true = Shoot, false = Save
  history: {
    playerShot: { target: { x: number; y: number }; success: boolean; saved: boolean } | null;
    opponentShot: { target: { x: number; y: number }; success: boolean; saved: boolean } | null;
  }[];
  isOver: boolean;
  winnerId: string | null;
}

export interface TournamentMatch {
  id: string;
  teamA: Team;
  teamB: Team;
  scoreA?: number;
  scoreB?: number;
  winnerId?: string;
  isPlayed: boolean;
}

export interface TournamentState {
  currentStageIdx: number; // 0 = Quarter-finals (8 teams), 1 = Semi-finals (4 teams), 2 = Finals (2 teams)
  stages: {
    name: string;
    matches: TournamentMatch[];
  }[];
  isTournamentActive: boolean;
  userEliminated: boolean;
  userWonCup: boolean;
}
