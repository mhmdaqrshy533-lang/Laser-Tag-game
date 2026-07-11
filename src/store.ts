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
  type?: 'soldier' | 'boss' | 'drone';
  position: [number, number, number];
  state: EntityState;
  disabledUntil: number;
  health?: number;
  maxHealth?: number;
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
  timeScale: number;
  abilityEnergy: number;
  isTimeDilationActive: boolean;
  enemies: EnemyData[];
  events: GameEvent[];
  
  // Multiplayer
  socket: Socket | null;
  otherPlayers: Record<string, PlayerData>;

  playerLevel: number;
  xp: number;
  selectedStage: 'residential' | 'desert' | 'alien';
  activeDialogue: string | null;
  bossShieldActive: boolean;
  shieldGenerators: { id: string; health: number; position: [number, number, number] }[];
  saveProgress: () => void;
  loadProgress: () => void;
  setSelectedStage: (stage: 'residential' | 'desert' | 'alien') => void;
  setPlayerLevel: (level: number) => void;
  setActiveDialogue: (text: string | null) => void;
  setBossShield: (active: boolean) => void;
  damageGenerator: (id: string, damage: number) => void;

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
  addEvent: (message: string) => void;
  updateEnemies: (time: number) => void;
  setPlayerState: (state: EntityState) => void;
  toggleTimeDilation: (active: boolean) => void;
  updateAbilityEnergy: (delta: number) => void;
  
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
  { id: 'bot-1', type: 'soldier', position: [40, 1, 40], state: 'active', disabledUntil: 0, health: 100, maxHealth: 100 },
  { id: 'bot-2', type: 'soldier', position: [-40, 1, 40], state: 'active', disabledUntil: 0, health: 100, maxHealth: 100 },
  { id: 'bot-3', type: 'soldier', position: [40, 1, -40], state: 'active', disabledUntil: 0, health: 100, maxHealth: 100 },
  { id: 'bot-4', type: 'soldier', position: [-40, 1, -40], state: 'active', disabledUntil: 0, health: 100, maxHealth: 100 },
  { id: 'boss-1', type: 'boss', position: [0, 1, -200], state: 'active', disabledUntil: 0, health: 2000, maxHealth: 2000 },
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
  timeScale: 1.0,
  abilityEnergy: 100,
  isTimeDilationActive: false,
  events: [],
  
  socket: null,
  otherPlayers: {},

  playerLevel: 1,
  xp: 0,
  selectedStage: 'residential',
  activeDialogue: null,
  bossShieldActive: true,
  shieldGenerators: [
    { id: 'gen-1', health: 100, position: [15, 0, -210] },
    { id: 'gen-2', health: 100, position: [-15, 0, -210] },
  ],
  setSelectedStage: (stage) => set({ selectedStage: stage }),
  setPlayerLevel: (playerLevel) => set({ playerLevel }),
  setActiveDialogue: (activeDialogue) => set({ activeDialogue }),
  setBossShield: (bossShieldActive) => set({ bossShieldActive }),
  damageGenerator: (id, damage) => set((state) => {
    const generators = state.shieldGenerators.map(g => {
      if (g.id === id) {
        const newHealth = Math.max(0, g.health - damage);
        return { ...g, health: newHealth };
      }
      return g;
    });
    const anyAlive = generators.some(g => g.health > 0);
    return { shieldGenerators: generators, bossShieldActive: anyAlive };
  }),

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
        enemies: INITIAL_ENEMIES.map(e => ({ ...e, state: 'active', disabledUntil: 0 })),
        bossShieldActive: true,
        shieldGenerators: [
          { id: 'gen-1', health: 100, position: [15, 0, -210] },
          { id: 'gen-2', health: 100, position: [-15, 0, -210] },
        ]
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
        const win = window as any;
        if (win.addLaser) win.addLaser(data.start, data.end, data.color);
        if (win.addParticles) win.addParticles(data.end, data.color);
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
      bossShieldActive: true,
      shieldGenerators: [
        { id: 'gen-1', health: 100, position: [15, 0, -210] },
        { id: 'gen-2', health: 100, position: [-15, 0, -210] },
      ],
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

    let bossKilled = false;
    const enemies = state.enemies.map(e => {
      if (e.id === id && e.state === 'active') {
        if (e.type === 'boss') {
          if (state.bossShieldActive) {
            // Prevent damage if shield is up
            return e;
          }
          const newHealth = Math.max(0, (e.health || 0) - 50);
          if (newHealth <= 0) {
            bossKilled = true;
            return { ...e, state: 'disabled' as EntityState, disabledUntil: Date.now() + 100000, health: 0 };
          }
          return { ...e, health: newHealth };
        }
        return { ...e, state: 'disabled' as EntityState, disabledUntil: Date.now() + 3000 };
      }
      return e;
    });

    let newScore = state.score;
    let newXp = state.xp;
    let newLevel = state.playerLevel;
    let newEvents = state.events;

    if (byPlayer) {
      newScore += bossKilled ? 5000 : 100;
      newXp += bossKilled ? 1000 : 25; 
      
      const xpNeeded = newLevel * 100;
      if (newXp >= xpNeeded) {
        newXp -= xpNeeded;
        newLevel += 1;
        newEvents = [...newEvents, { id: Math.random().toString(), message: `LEVEL UP! You are now level ${newLevel}`, timestamp: Date.now() }];
      } else {
        newEvents = [...newEvents, { id: Math.random().toString(), message: `Tagged target: ${id}`, timestamp: Date.now() }];
      }
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

  setPlayerState: (playerState) => set({ playerState }),

  toggleTimeDilation: (active) => set((state) => {
    if (active && state.abilityEnergy < 20) return state;
    return { 
      isTimeDilationActive: active,
      timeScale: active ? 0.2 : 1.0 
    };
  }),

  updateAbilityEnergy: (delta) => set((state) => {
    let energy = state.abilityEnergy;
    if (state.isTimeDilationActive) {
      energy = Math.max(0, energy - delta * 25);
      if (energy <= 0) {
        return { abilityEnergy: 0, isTimeDilationActive: false, timeScale: 1.0 };
      }
    } else {
      energy = Math.min(100, energy + delta * 10);
    }
    return { abilityEnergy: energy };
  }),

  updatePlayerPosition: (position, rotation) => {
    const { socket } = get();
    if (socket) {
      socket.emit('updatePosition', { position, rotation });
    }
  }
}));
