import crypto from 'crypto';
import { User, SignupRequest, LoginRequest } from '../types/auth.js';
import { supabase } from './supabase.js';

interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

class UserStore {
  private users: Map<string, StoredUser> = new Map(); // key: email
  private usersById: Map<string, StoredUser> = new Map(); // key: userId
  private sessions: Map<string, string> = new Map(); // key: token, value: userId

  constructor() {
    // Seed default demo user for instant offline testing
    this.seedDemoUser();
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private seedDemoUser(): void {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword('password123', salt);
    const demoUser: StoredUser = {
      id: 'user-demo-01',
      name: 'Alexander Vance',
      email: 'demo@stylora.ai',
      styleArchetype: 'old_money_aesthetic',
      gender: 'men',
      skinTone: 'medium_olive',
      createdAt: new Date().toISOString(),
      passwordHash,
      salt
    };

    this.users.set(demoUser.email.toLowerCase(), demoUser);
    this.usersById.set(demoUser.id, demoUser);
  }

  async signup(data: SignupRequest): Promise<{ user: User; token: string }> {
    const normalizedEmail = data.email.trim().toLowerCase();

    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Please enter a valid full name (minimum 2 characters).');
    }

    if (!data.password || data.password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    if (this.users.has(normalizedEmail)) {
      throw new Error('An account with this email address already exists.');
    }

    let supabaseUserId: string | null = null;
    let supabaseSessionToken: string | null = null;

    // 1. Register user directly in Supabase Authentication & Database
    if (supabase) {
      try {
        console.log(`📡 [STYLORA] Registering user in Supabase: ${normalizedEmail}`);
        
        let authUser: any = null;
        let authSessionToken: string | null = null;

        // Try admin.createUser first (works with service_role key, bypasses email rate limits)
        try {
          const { data: adminData, error: adminErr } = await supabase.auth.admin.createUser({
            email: normalizedEmail,
            password: data.password,
            email_confirm: true,
            user_metadata: {
              name: data.name.trim(),
              styleArchetype: data.styleArchetype || 'minimalist',
              gender: data.gender || 'unisex',
              skinTone: data.skinTone || 'medium_olive'
            }
          });
          if (!adminErr && adminData?.user) {
            authUser = adminData.user;
            console.log(`✅ [STYLORA] Stored user via Supabase Admin (ID: ${authUser.id})`);
          }
        } catch {
          // Ignore if anon key
        }

        // Fallback to standard Supabase Auth SignUp if admin was not permitted
        if (!authUser) {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: normalizedEmail,
            password: data.password,
            options: {
              data: {
                name: data.name.trim(),
                styleArchetype: data.styleArchetype || 'minimalist',
                gender: data.gender || 'unisex',
                skinTone: data.skinTone || 'medium_olive'
              }
            }
          });

          if (authError) {
            console.warn('⚠️ [STYLORA] Supabase Auth SignUp notice:', authError.message);
            if (authError.message.toLowerCase().includes('already registered')) {
              throw new Error('An account with this email address already exists in Supabase.');
            }
            if (authError.message.toLowerCase().includes('rate limit')) {
              throw new Error('Supabase email rate limit exceeded! In your Supabase Dashboard: Go to Authentication -> Providers -> Email and turn OFF "Confirm email" (or add SUPABASE_SERVICE_ROLE_KEY to server/.env).');
            }
            throw new Error(`Supabase Auth error: ${authError.message}`);
          } else if (authData?.user) {
            authUser = authData.user;
            authSessionToken = authData.session?.access_token || null;
            console.log(`✅ [STYLORA] Successfully stored user in Supabase Auth (User ID: ${authUser.id})`);
          }
        }

        if (authUser) {
          supabaseUserId = authUser.id;
          supabaseSessionToken = authSessionToken;
        }
      } catch (err: any) {
        console.warn('⚠️ [STYLORA] Supabase Auth Exception:', err.message);
        throw err;
      }
    }

    // Hash password for local persistence and public.users storage
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(data.password, salt);
    const userId = supabaseUserId || `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // 2. Also save to Supabase public.users table
    if (supabase) {
      try {
        const { error: dbError } = await supabase.from('users').upsert({
          id: userId,
          name: data.name.trim(),
          email: normalizedEmail,
          password_hash: passwordHash,
          salt,
          style_archetype: data.styleArchetype || 'minimalist',
          gender: data.gender || 'unisex',
          skin_tone: data.skinTone || 'medium_olive',
          created_at: new Date().toISOString()
        });

        if (dbError) {
          console.warn('⚠️ [STYLORA] Supabase public.users table insert notice:', dbError.message);
        } else {
          console.log(`✅ [STYLORA] Successfully stored user in Supabase public.users table.`);
        }
      } catch (dbErr: any) {
        console.warn('⚠️ [STYLORA] Supabase public.users exception:', dbErr.message);
      }
    }

    const newUser: StoredUser = {
      id: userId,
      name: data.name.trim(),
      email: normalizedEmail,
      styleArchetype: data.styleArchetype || 'minimalist',
      gender: data.gender || 'unisex',
      skinTone: data.skinTone || 'medium_olive',
      createdAt: new Date().toISOString(),
      passwordHash,
      salt
    };

    this.users.set(normalizedEmail, newUser);
    this.usersById.set(userId, newUser);

    const token = supabaseSessionToken || this.generateToken();
    this.sessions.set(token, userId);

    const { passwordHash: _, salt: __, ...userProfile } = newUser;
    return { user: userProfile, token };
  }

  async login(data: LoginRequest): Promise<{ user: User; token: string }> {
    const normalizedEmail = data.email.trim().toLowerCase();

    // 1. Try Supabase Auth SignIn first
    if (supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: data.password
        });

        if (!authError && authData?.user) {
          const userMeta = authData.user.user_metadata || {};
          const user: User = {
            id: authData.user.id,
            name: userMeta.name || authData.user.email?.split('@')[0] || 'User',
            email: authData.user.email || normalizedEmail,
            styleArchetype: userMeta.styleArchetype || 'minimalist',
            gender: userMeta.gender || 'unisex',
            skinTone: userMeta.skinTone || 'medium_olive',
            createdAt: authData.user.created_at
          };

          const token = authData.session?.access_token || this.generateToken();
          this.sessions.set(token, user.id);
          return { user, token };
        }
      } catch (sbErr) {
        console.warn('⚠️ [STYLORA] Supabase login check notice:', sbErr);
      }
    }

    // 2. Check local store or public.users
    let storedUser = this.users.get(normalizedEmail);

    if (!storedUser && supabase) {
      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (dbUser) {
          storedUser = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            styleArchetype: dbUser.style_archetype || 'minimalist',
            gender: dbUser.gender || 'unisex',
            skinTone: dbUser.skin_tone || 'medium_olive',
            createdAt: dbUser.created_at,
            passwordHash: dbUser.password_hash,
            salt: dbUser.salt
          };
          this.users.set(normalizedEmail, storedUser);
          this.usersById.set(storedUser.id, storedUser);
        }
      } catch (fetchErr) {
        console.warn('⚠️ [STYLORA] Error fetching user from Supabase:', fetchErr);
      }
    }

    if (!storedUser) {
      throw new Error('No account found with this email address.');
    }

    const inputHash = this.hashPassword(data.password, storedUser.salt);
    if (inputHash !== storedUser.passwordHash) {
      throw new Error('Incorrect password. Please try again.');
    }

    const token = this.generateToken();
    this.sessions.set(token, storedUser.id);

    const { passwordHash: _, salt: __, ...userProfile } = storedUser;
    return { user: userProfile, token };
  }

  async getUserByToken(token: string): Promise<User | undefined> {
    const userId = this.sessions.get(token);
    if (userId) {
      const storedUser = this.usersById.get(userId);
      if (storedUser) {
        const { passwordHash: _, salt: __, ...userProfile } = storedUser;
        return userProfile;
      }
    }

    // Validate with Supabase Auth if session token came from Supabase
    if (supabase) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          const userMeta = user.user_metadata || {};
          return {
            id: user.id,
            name: userMeta.name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            styleArchetype: userMeta.styleArchetype || 'minimalist',
            gender: userMeta.gender || 'unisex',
            skinTone: userMeta.skinTone || 'medium_olive',
            createdAt: user.created_at
          };
        }
      } catch (err) {
        // invalid token
      }
    }

    return undefined;
  }

  async getUserById(userId: string): Promise<User | undefined> {
    let storedUser = this.usersById.get(userId);
    if (storedUser) {
      const { passwordHash: _, salt: __, ...userProfile } = storedUser;
      return userProfile;
    }

    if (supabase) {
      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (dbUser) {
          storedUser = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            styleArchetype: dbUser.style_archetype || 'minimalist',
            gender: dbUser.gender || 'unisex',
            skinTone: dbUser.skin_tone || 'medium_olive',
            createdAt: dbUser.created_at,
            passwordHash: dbUser.password_hash || '',
            salt: dbUser.salt || ''
          };
          this.usersById.set(userId, storedUser);
          const { passwordHash: _, salt: __, ...userProfile } = storedUser;
          return userProfile;
        }
      } catch (err) {
        console.warn('⚠️ [STYLORA] Error fetching user by ID from Supabase:', err);
      }
    }

    return undefined;
  }

  logout(token: string): boolean {
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    return this.sessions.delete(token);
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<User | undefined> {
    let storedUser = this.usersById.get(userId);
    if (storedUser) {
      if (updates.name) storedUser.name = updates.name;
      if (updates.styleArchetype) storedUser.styleArchetype = updates.styleArchetype;
      if (updates.gender) storedUser.gender = updates.gender;
      if (updates.skinTone) storedUser.skinTone = updates.skinTone;
    }

    if (supabase) {
      try {
        const dbUpdates: Record<string, any> = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.styleArchetype) dbUpdates.style_archetype = updates.styleArchetype;
        if (updates.gender) dbUpdates.gender = updates.gender;
        if (updates.skinTone) dbUpdates.skin_tone = updates.skinTone;

        await supabase.from('users').update(dbUpdates).eq('id', userId);
      } catch (err) {
        console.warn('⚠️ [STYLORA] Failed to update user profile in Supabase:', err);
      }
    }

    if (storedUser) {
      const { passwordHash: _, salt: __, ...userProfile } = storedUser;
      return userProfile;
    }

    return this.getUserById(userId);
  }

  async updateArchetype(userId: string, archetype: User['styleArchetype']): Promise<User | undefined> {
    return this.updateProfile(userId, { styleArchetype: archetype });
  }
}

export const userStore = new UserStore();
