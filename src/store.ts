/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { create } from 'zustand';
import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';

export type GameState = 'menu' | 'playing' | 'gameover';
export type EntityState = 'active' | 'disabled';

export interface EnemyData {
  id: string;
  position: [number, number, number];
  state: EntityState;
  disabledUntil: number;
}

export interface PlayerData {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  state: EntityState;
  disabledUntil: number;
  score: number;
  color: string;
}

export interface LaserData {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  timestamp: number;
  color: string;
}

export interface ParticleData {
  id: string;
  position: [number, number, number];
  timestamp: number;
  color: string;
}

export interface GameEvent {
  id: string;
  message: string;
  timestamp: number;
}

interface GameStore {
  gameState: GameState;
  score: number;
  timeLeft: number;
  playerState: EntityState;
  playerDisabledUntil: number;
  enemies: EnemyData[];
  lasers: LaserData[];
  particles: ParticleData[];
  events: GameEvent[];
  
  // Multiplayer
  socket: Socket | null;
  otherPlayers: Record<string, PlayerData>;

  playerLevel: number;
  xp: number;
  selectedStage: 'residential' | 'desert' | 'alien';
  saveProgress: () => void;
  loadProgress: () => void;
  setSelectedStage: (stage: 'residential' | 'desert' | 'alien') => void;
  setPlayerLevel: (level: number) => void;

  // Arabic UI Cyber Sovereign States
  currentScreen: 'lobby' | 'hangar' | 'campaign' | 'missions' | 'about';
  isIntroActive: boolean;
  setScreen: (screen: 'lobby' | 'hangar' | 'campaign' | 'missions' | 'about') => void;
  setIntroActive: (active: boolean) => void;

  // Customizations
  migJetFlame: 'cyan' | 'purple' | 'amber';
  migJetLivery: 'camo' | 'stealth' | 'sovereign';
  exosuitArmorLvl: number; // 1, 2, 3
  weaponPlasmaLvl: number; // 1, 2, 3
  setHangarSpecs: (specs: Partial<{ migJetFlame: 'cyan' | 'purple' | 'amber'; migJetLivery: 'camo' | 'stealth' | 'sovereign'; exosuitArmorLvl: number; weaponPlasmaLvl: number }>) => void;

  // Bottom Center Vitals & Active Weapon States
  health: number;
  armor: number;
  energy: number;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  activeWeapon: string;
  setHealth: (health: number) => void;
  setArmor: (armor: number) => void;
  setEnergy: (energy: number) => void;
  setAmmo: (ammo: number) => void;
  setReserveAmmo: (reserveAmmo: number) => void;
  setActiveWeapon: (weapon: string) => void;
  useMedkit: () => void;
  useArmorKit: () => void;
  useEnergyDrink: () => void;

  startGame: () => void;
  endGame: () => void;
  leaveGame: () => void;
  updateTime: (delta: number) => void;
  hitPlayer: () => void;
  hitEnemy: (id: string, byPlayer?: boolean) => void;
  addLaser: (start: [number, number, number], end: [number, number, number], color: string) => void;
  addParticles: (position: [number, number, number], color: string) => void;
  addEvent: (message: string) => void;
  updateEnemies: (time: number) => void;
  cleanupEffects: (time: number) => void;
  setPlayerState: (state: EntityState) => void;
  
  // Multiplayer actions
  updatePlayerPosition: (position: [number, number, number], rotation: [number, number, number]) => void;

  // Plane specifics
  speed: number;
  altitude: number;
  setPlaneStats: (speed: number, altitude: number) => void;

  // Mobile Controls
  mobileInput: {
    move: { x: number, y: number };
    look: { x: number, y: number };
    shooting: boolean;
    crouch: boolean;
    prone: boolean;
    jump: boolean;
    scope: boolean;
    fpp: boolean;
  };
  setMobileInput: (input: Partial<{
    move: { x: number, y: number };
    look: { x: number, y: number };
    shooting: boolean;
    crouch: boolean;
    prone: boolean;
    jump: boolean;
    scope: boolean;
    fpp: boolean;
  }>) => void;
}

const INITIAL_ENEMIES: EnemyData[] = [
  { id: 'bot-1', position: [40, 1, 40], state: 'active', disabledUntil: 0 },
  { id: 'bot-2', position: [-40, 1, 40], state: 'active', disabledUntil: 0 },
  { id: 'bot-3', position: [40, 1, -40], state: 'active', disabledUntil: 0 },
  { id: 'bot-4', position: [-40, 1, -40], state: 'active', disabledUntil: 0 },
  { id: 'bot-5', position: [0, 1, -50], state: 'active', disabledUntil: 0 },
  { id: 'bot-6', position: [60, 1, 0], state: 'active', disabledUntil: 0 },
  { id: 'bot-7', position: [-60, 1, 0], state: 'active', disabledUntil: 0 },
  { id: 'bot-8', position: [0, 1, 50], state: 'active', disabledUntil: 0 },
];

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'menu',
  score: 0,
  timeLeft: 120, // 2 minutes
  playerState: 'active',
  playerDisabledUntil: 0,
  speed: 20,
  altitude: 100,
  setPlaneStats: (speed, altitude) => set({ speed, altitude }),
  enemies: [],
  lasers: [],
  particles: [],
  events: [],
  
  socket: null,
  otherPlayers: {},

  playerLevel: 1,
  xp: 0,
  selectedStage: 'residential',
  setSelectedStage: (stage) => set({ selectedStage: stage }),
  setPlayerLevel: (playerLevel) => set({ playerLevel }),

  // Arabic UI Cyber Sovereign initial states
  currentScreen: 'lobby',
  isIntroActive: true, // Starts with intro!
  setScreen: (screen) => set({ currentScreen: screen }),
  setIntroActive: (active) => set({ isIntroActive: active }),

  // Hangar specs defaults
  migJetFlame: 'cyan',
  migJetLivery: 'sovereign',
  exosuitArmorLvl: 1,
  weaponPlasmaLvl: 1,
  setHangarSpecs: (specs) => set((state) => ({ ...state, ...specs })),

  // Initial values for HUD as requested: HEALTH (80%), ARMOR (60%), ENERGY (70%), activeWeapon HKA16 with 30/180 ammo
  health: 80,
  armor: 60,
  energy: 70,
  ammo: 30,
  maxAmmo: 30,
  reserveAmmo: 180,
  activeWeapon: 'HKA16',
  setHealth: (health) => set({ health }),
  setArmor: (armor) => set({ armor }),
  setEnergy: (energy) => set({ energy }),
  setAmmo: (ammo) => set({ ammo }),
  setReserveAmmo: (reserveAmmo) => set({ reserveAmmo }),
  setActiveWeapon: (activeWeapon) => set({ activeWeapon }),
  useMedkit: () => set((state) => {
    if (state.gameState !== 'playing') return state;
    return { 
      health: 100, 
      events: [...state.events, { id: Math.random().toString(), message: 'Quick Medkit used! HEALTH restored to 100%', timestamp: Date.now() }] 
    };
  }),
  useArmorKit: () => set((state) => {
    if (state.gameState !== 'playing') return state;
    return { 
      armor: 100, 
      events: [...state.events, { id: Math.random().toString(), message: 'Armor Repair done! ARMOR restored to 100%', timestamp: Date.now() }] 
    };
  }),
  useEnergyDrink: () => set((state) => {
    if (state.gameState !== 'playing') return state;
    return { 
      energy: 100, 
      events: [...state.events, { id: Math.random().toString(), message: 'Energy Drink consumed! ENERGY boosted to 100%', timestamp: Date.now() }] 
    };
  }),

  saveProgress: () => {
    const { playerLevel, xp } = get();
    localStorage.setItem('tenkel_progress', JSON.stringify({ playerLevel, xp }));
  },
  loadProgress: () => set((state) => {
    try {
      const data = localStorage.getItem('tenkel_progress');
      if (data) {
        const parsed = JSON.parse(data);
        return { playerLevel: parsed.playerLevel || 1, xp: parsed.xp || 0 };
      }
    } catch(e) {}
    return state;
  }),

  mobileInput: {
    move: { x: 0, y: 0 },
    look: { x: 0, y: 0 },
    shooting: false,
    crouch: false,
    prone: false,
    jump: false,
    scope: false,
    fpp: false
  },

  setMobileInput: (input) => set((state) => ({
    mobileInput: { ...state.mobileInput, ...input }
  })),

  startGame: () => {
    const { socket } = get();
    
    if (socket) {
      socket.disconnect();
    }

    let newSocket: Socket | null = null;

    // Initialize multiplayer
    newSocket = io(window.location.origin);
    
    newSocket.on('connect', () => {
      newSocket!.emit('joinGame');
    });

    newSocket.on('gameError', (msg: string) => {
      alert(msg);
      get().leaveGame();
    });

    newSocket.on('gameJoined', (players: Record<string, PlayerData>) => {
      const otherPlayers = { ...players };
      delete otherPlayers[newSocket!.id!];
      set({ 
        otherPlayers,
        gameState: 'playing',
        timeLeft: 120,
        score: 0,
        enemies: INITIAL_ENEMIES.map(e => ({ ...e, state: 'active', disabledUntil: 0 }))
      });
    });

      newSocket.on('playerJoined', (player: PlayerData) => {
        set(state => ({
          otherPlayers: { ...state.otherPlayers, [player.id]: player },
          events: [...state.events, { id: Math.random().toString(), message: `${player.name} joined`, timestamp: Date.now() }]
        }));
      });

      newSocket.on('playerMoved', (data: { id: string, position: [number, number, number], rotation: [number, number, number] }) => {
        set(state => {
          if (!state.otherPlayers[data.id]) return state;
          return {
            otherPlayers: {
              ...state.otherPlayers,
              [data.id]: {
                ...state.otherPlayers[data.id],
                position: data.position,
                rotation: data.rotation
              }
            }
          };
        });
      });

      newSocket.on('playerShot', (data: { id: string, start: [number, number, number], end: [number, number, number], color: string }) => {
        set(state => ({
          lasers: [...state.lasers, { id: Math.random().toString(36).substr(2, 9), start: data.start, end: data.end, timestamp: Date.now(), color: data.color }],
          particles: [...state.particles, { id: Math.random().toString(36).substr(2, 9), position: data.end, timestamp: Date.now(), color: data.color }]
        }));
      });

      newSocket.on('playerHit', (data: { targetId: string, shooterId: string, targetDisabledUntil: number, shooterScore: number }) => {
        set(state => {
          const now = Date.now();
          const isLocalShooter = data.shooterId === newSocket!.id;
          const isLocalTarget = data.targetId === newSocket!.id;
          
          const shooterName = isLocalShooter ? 'You' : (state.otherPlayers[data.shooterId]?.name || 'Unknown');
          const targetName = isLocalTarget ? 'You' : (state.otherPlayers[data.targetId]?.name || 'Unknown');
          const eventMsg = `${shooterName} tagged ${targetName}`;
          const newEvent = { id: Math.random().toString(), message: eventMsg, timestamp: now };

          let newState: Partial<GameStore> = {
            events: [...state.events, newEvent]
          };

          if (isLocalTarget) {
            newState.playerState = 'disabled';
            newState.playerDisabledUntil = data.targetDisabledUntil;
          }

          if (isLocalShooter) {
            newState.score = data.shooterScore;
          }

          // Update other players' states
          const players = { ...state.otherPlayers };
          let playersChanged = false;

          if (!isLocalTarget && players[data.targetId]) {
            players[data.targetId] = {
              ...players[data.targetId],
              state: 'disabled',
              disabledUntil: data.targetDisabledUntil
            };
            playersChanged = true;
          }

          if (!isLocalShooter && players[data.shooterId]) {
            players[data.shooterId] = {
              ...players[data.shooterId],
              score: data.shooterScore
            };
            playersChanged = true;
          }

          if (playersChanged) {
            newState.otherPlayers = players;
          }

          return newState;
        });
      });

      newSocket.on('playerLeft', (id: string) => {
        set(state => {
          const players = { ...state.otherPlayers };
          const playerName = players[id]?.name || 'Unknown';
          delete players[id];
          return { 
            otherPlayers: players,
            events: [...state.events, { id: Math.random().toString(), message: `${playerName} left`, timestamp: Date.now() }]
          };
        });
      });
    set({
      gameState: 'playing',
      score: 0,
      timeLeft: 120,
      playerState: 'active',
      playerDisabledUntil: 0,
      enemies: INITIAL_ENEMIES.map(e => ({ ...e, state: 'active', disabledUntil: 0 })),
      lasers: [],
      particles: [],
      events: [],
      socket: newSocket,
      otherPlayers: {},
      health: 80,
      armor: 60,
      energy: 70,
      ammo: 30,
      reserveAmmo: 180,
      activeWeapon: 'HKA16',
    });
  },

  endGame: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({ gameState: 'gameover', socket: null });
  },

  leaveGame: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({
      gameState: 'menu',
      socket: null,
      otherPlayers: {},
      enemies: [],
      lasers: [],
      particles: [],
      events: [],
      score: 0,
      timeLeft: 120,
      playerState: 'active'
    });
  },

  updateTime: (delta) => set((state) => {
    if (state.gameState !== 'playing') return state;
    const newTime = state.timeLeft - delta;
    if (newTime <= 0) {
      if (state.socket) state.socket.disconnect();
      return { timeLeft: 0, gameState: 'gameover', socket: null, roomId: null };
    }
    return { timeLeft: newTime };
  }),

  hitPlayer: () => set((state) => {
    if (state.playerState === 'disabled' || state.gameState !== 'playing') return state;
    
    // Calculate damage absorbed by armor
    const damage = 25; // standard base damage
    let newArmor = state.armor;
    let newHealth = state.health;
    
    if (newArmor > 0) {
      newArmor = Math.max(0, newArmor - damage * 0.6); // Armor absorbs 60% of damage
      newHealth = Math.max(0, newHealth - damage * 0.4); // Player takes remaining 40%
    } else {
      newHealth = Math.max(0, newHealth - damage); // Player takes full damage if no armor
    }
    
    if (newHealth <= 0) {
      return {
        health: 0,
        armor: newArmor,
        playerState: 'disabled',
        playerDisabledUntil: Date.now() + 3000,
        score: Math.max(0, state.score - 50), // Penalty for getting hit
        events: [...state.events, { id: Math.random().toString(), message: 'AlphaOne STUNNED! Respawning in 3s...', timestamp: Date.now() }]
      };
    } else {
      return {
        health: newHealth,
        armor: newArmor,
        events: [...state.events, { id: Math.random().toString(), message: `AlphaOne hit! HEALTH: ${Math.floor(newHealth)}% | ARMOR: ${Math.floor(newArmor)}%`, timestamp: Date.now() }]
      };
    }
  }),

  hitEnemy: (id, byPlayer = false) => set((state) => {
    if (state.gameState !== 'playing') return state;
    
    // Check if it's a multiplayer player
    if (state.socket && state.otherPlayers[id]) {
      state.socket.emit('hitPlayer', id);
      return state;
    }

    const enemies = state.enemies.map(e => {
      if (e.id === id && e.state === 'active') {
        return { ...e, state: 'disabled' as EntityState, disabledUntil: Date.now() + 3000 };
      }
      return e;
    });

    let newScore = state.score;
    let newXp = state.xp;
    let newLevel = state.playerLevel;
    let newEvents = state.events;

    if (byPlayer) {
      newScore += 100;
      newXp += 25; // Gain XP
      const xpNeeded = newLevel * 100;
      if (newXp >= xpNeeded) {
        newXp -= xpNeeded;
        newLevel += 1;
        newEvents = [...newEvents, { id: Math.random().toString(), message: `LEVEL UP! You are now level ${newLevel}`, timestamp: Date.now() }];
      } else {
        newEvents = [...newEvents, { id: Math.random().toString(), message: `You tagged ${id}`, timestamp: Date.now() }];
      }
      // Schedule save progress (using macro task to avoid blocking main thread on frame)
      setTimeout(() => get().saveProgress(), 0);
    }

    return {
      enemies,
      score: newScore,
      xp: newXp,
      playerLevel: newLevel,
      events: newEvents
    };
  }),

  addLaser: (start, end, color) => {
    const { socket } = get();
    if (socket) {
      socket.emit('shoot', { start, end, color });
    }
    set((state) => ({
      lasers: [...state.lasers, { id: Math.random().toString(36).substr(2, 9), start, end, timestamp: Date.now(), color }]
    }));
  },

  addParticles: (position, color) => set((state) => ({
    particles: [...state.particles, { id: Math.random().toString(36).substr(2, 9), position, timestamp: Date.now(), color }]
  })),

  addEvent: (message) => set((state) => ({
    events: [...state.events, { id: Math.random().toString(), message, timestamp: Date.now() }]
  })),

  updateEnemies: (time) => set((state) => {
    let changed = false;
    const enemies = state.enemies.map(e => {
      if (e.state === 'disabled' && time > e.disabledUntil) {
        changed = true;
        return { ...e, state: 'active' as EntityState };
      }
      return e;
    });
    
    // Also update other players' states
    let otherPlayers = state.otherPlayers;
    let playersChanged = false;
    Object.values(state.otherPlayers).forEach(p => {
      if (p.state === 'disabled' && time > p.disabledUntil) {
        if (!playersChanged) {
          otherPlayers = { ...state.otherPlayers };
          playersChanged = true;
        }
        otherPlayers[p.id] = { ...p, state: 'active' };
      }
    });

    if (state.playerState === 'disabled' && time > state.playerDisabledUntil) {
      return { 
        enemies, 
        playerState: 'active', 
        otherPlayers: playersChanged ? otherPlayers : state.otherPlayers,
        health: 80,
        armor: 60,
        energy: 70,
        ammo: 30
      };
    }
    return changed || playersChanged ? { enemies, otherPlayers } : state;
  }),

  cleanupEffects: (time) => set((state) => {
    const lasers = state.lasers.filter(l => time - l.timestamp < 200); // Lasers last 200ms
    const particles = state.particles.filter(p => time - p.timestamp < 500); // Particles last 500ms
    const events = state.events.filter(e => time - e.timestamp < 5000); // Events last 5s
    if (lasers.length !== state.lasers.length || particles.length !== state.particles.length || events.length !== state.events.length) {
      return { lasers, particles, events };
    }
    return state;
  }),

  setPlayerState: (playerState) => set({ playerState }),

  updatePlayerPosition: (position, rotation) => {
    const { socket } = get();
    if (socket) {
      socket.emit('updatePosition', { position, rotation });
    }
  }
}));
