/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface CinematicEvent {
  id: string;
  type: 'camera_move' | 'shake' | 'slow_motion' | 'dialogue' | 'event_trigger';
  startTime: number;
  duration: number;
  params: any;
}

export class CinematicEngine {
  private events: CinematicEvent[] = [];
  private activeEvents: Set<string> = new Set();
  private currentTime: number = 0;
  
  // Shared state for the visual engine to read
  public cameraOffset = new THREE.Vector3();
  public cameraRotation = new THREE.Euler();
  public timeScale: number = 1.0;
  public shakeIntensity: number = 0;
  public activeDialogue: string | null = null;

  constructor() {}

  public addEvent(event: CinematicEvent) {
    this.events.push(event);
    // Sort by start time
    this.events.sort((a, b) => a.startTime - b.startTime);
  }

  public update(dt: number, totalTime: number) {
    this.currentTime = totalTime;
    
    // Reset frame-based modifiers
    this.cameraOffset.set(0, 0, 0);
    this.cameraRotation.set(0, 0, 0);
    this.timeScale = 1.0;
    this.shakeIntensity = 0;
    this.activeDialogue = null;

    this.events.forEach(event => {
      const elapsed = this.currentTime - event.startTime;
      
      if (elapsed >= 0 && elapsed < event.duration) {
        this.activeEvents.add(event.id);
        this.processEvent(event, elapsed);
      } else {
        this.activeEvents.delete(event.id);
      }
    });
  }

  private processEvent(event: CinematicEvent, elapsed: number) {
    const progress = elapsed / event.duration;
    
    switch (event.type) {
      case 'camera_move':
        // Linear interpolation for now, can add easing later
        const start = new THREE.Vector3(...event.params.start);
        const end = new THREE.Vector3(...event.params.end);
        this.cameraOffset.lerpVectors(start, end, progress);
        break;
        
      case 'shake':
        this.shakeIntensity = event.params.intensity * (1.0 - progress);
        break;
        
      case 'slow_motion':
        this.timeScale = THREE.MathUtils.lerp(1.0, event.params.scale, progress < 0.5 ? progress * 2 : (1.0 - progress) * 2);
        break;
        
      case 'dialogue':
        this.activeDialogue = event.params.text;
        break;
    }
  }

  public getShakeOffset(): THREE.Vector3 {
    if (this.shakeIntensity === 0) return new THREE.Vector3();
    return new THREE.Vector3(
      (Math.random() - 0.5) * this.shakeIntensity,
      (Math.random() - 0.5) * this.shakeIntensity,
      (Math.random() - 0.5) * this.shakeIntensity
    );
  }
}

export const cinematicEngine = new CinematicEngine();
