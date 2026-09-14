import { UserStyleProfile } from './fashion';

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

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
  message?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  styleArchetype?: UserStyleProfile['styleArchetype'];
  gender?: GenderPreference;
  skinTone?: SkinTone;
}
