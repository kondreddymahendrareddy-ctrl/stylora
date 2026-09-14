import { UserStyleProfile } from './fashion.js';

export type GenderPreference = 'women' | 'men' | 'non_binary' | 'unisex';

export type SkinTone = 
  | 'fair_light'      // Fair / Porcelain (Cool/Neutral)
  | 'light_warm'      // Light Warm (Peach/Golden)
  | 'medium_olive'    // Medium / Olive (Neutral)
  | 'tan_warm'        // Warm Tan (Caramel/Bronze)
  | 'deep_rich'       // Deep / Rich (Chestnut/Almond)
  | 'dark_espresso';  // Deep Espresso (Ebony/Dark Cocoa)

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  styleArchetype: UserStyleProfile['styleArchetype'];
  gender?: GenderPreference;
  skinTone?: SkinTone;
  createdAt: string;
}

export interface UserSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  styleArchetype?: UserStyleProfile['styleArchetype'];
  gender?: GenderPreference;
  skinTone?: SkinTone;
}

export interface LoginRequest {
  email: string;
  password: string;
}
