// Avatar-themed game types

// Player state types
export type PlayerState = 'waiting' | 'riding' | 'fallen' | 'missed';

// Dragon animation state
export type DragonState = 'normal' | 'swooping' | 'diving';

// Avatar position type
export interface AvatarPosition {
  x: number; // x position (date index)
  y: number; // y position (price)
}

// Animation settings
export interface AnimationSettings {
  dragonOpacity: number;
  dragonScale: number;
  avatarScale: number;
  avatarRotation: number;
}

// Game event type
export interface GameEvent {
  type: 'mount' | 'fall' | 'miss' | 'success';
  timestamp: number;
  position: AvatarPosition;
}
