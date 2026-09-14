import { Request } from 'express';
import { userStore } from '../services/userStore.js';

/**
 * Extracts and verifies the active user ID from the request Authorization header.
 * Defaults to 'guest' if no token or invalid session.
 */
export async function getUserIdFromRequest(req: Request): Promise<string> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const user = await userStore.getUserByToken(token);
      if (user?.id) {
        return user.id;
      }
    }
  } catch (err) {
    console.warn('Error resolving user from token:', err);
  }

  // Fallback to client-provided guest header or default guest
  const customUser = req.headers['x-user-id'] as string;
  return customUser || 'guest';
}
