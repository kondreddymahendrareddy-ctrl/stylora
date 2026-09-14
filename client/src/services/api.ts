import { 
  WardrobeItem, 
  Outfit, 
  GenerateOutfitRequest, 
  UserStyleProfile, 
  ClothingCategory 
} from '../types/fashion';
import { getStoredToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` 
  : '/api';

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getStoredToken();
  return {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

export async function fetchWardrobe(category?: ClothingCategory): Promise<WardrobeItem[]> {
  const url = category ? `${API_BASE}/wardrobe?category=${category}` : `${API_BASE}/wardrobe`;
  const res = await fetch(url, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch wardrobe');
  return data.items;
}

export async function analyzeGarmentImage(imageBase64: string, mimeType = 'image/jpeg'): Promise<any> {
  const res = await fetch(`${API_BASE}/wardrobe/analyze`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ imageBase64, mimeType })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to analyze garment image');
  return data.attributes;
}

export async function createWardrobeItem(itemData: Partial<WardrobeItem>): Promise<WardrobeItem> {
  const res = await fetch(`${API_BASE}/wardrobe`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(itemData)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create wardrobe item');
  return data.item;
}

export async function deleteWardrobeItem(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/wardrobe/${id}`, { 
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  return data.success;
}

export async function generateOutfits(request: GenerateOutfitRequest): Promise<Outfit[]> {
  const res = await fetch(`${API_BASE}/outfits/generate`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(request)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to generate outfits');
  return data.outfits;
}

export async function fetchOutfitHistory(): Promise<Outfit[]> {
  const res = await fetch(`${API_BASE}/outfits/history`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch outfit history');
  return data.outfits;
}

export async function fetchStyleAnalytics(filter: '7d' | '30d' | '3m' | 'all' = '30d'): Promise<{
  timeFilter: string;
  totalOutfits: number;
  colorCounts: { name: string; hex: string; count: number }[];
  styleCounts: { style: string; count: number }[];
  categoryCounts: { category: string; count: number }[];
  fitCounts: { fit: string; count: number }[];
  outfits: Outfit[];
}> {
  const res = await fetch(`${API_BASE}/outfits/history?filter=${filter}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch style history analytics');
  return data;
}

export async function submitOutfitFeedback(
  outfitId: string, 
  liked: boolean, 
  worn: boolean, 
  notes?: string
): Promise<{ outfit: Outfit; profile: UserStyleProfile }> {
  const res = await fetch(`${API_BASE}/feedback/outfit`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ outfitId, liked, worn, notes })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to submit feedback');
  return data;
}

export async function fetchProfile(): Promise<UserStyleProfile> {
  const res = await fetch(`${API_BASE}/feedback/profile`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch style profile');
  return data.profile;
}

export async function updateStyleArchetype(archetype: string): Promise<UserStyleProfile> {
  const res = await fetch(`${API_BASE}/feedback/profile/archetype`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ archetype })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update archetype');
  return data.profile;
}

export async function resetWardrobe(): Promise<{ items: WardrobeItem[]; profile: UserStyleProfile }> {
  const res = await fetch(`${API_BASE}/wardrobe/reset`, { 
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to reset wardrobe');
  return { items: data.items, profile: data.profile };
}

export async function seedWardrobe(): Promise<{ items: WardrobeItem[]; profile: UserStyleProfile }> {
  const res = await fetch(`${API_BASE}/wardrobe/seed`, { 
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to seed wardrobe');
  return { items: data.items, profile: data.profile };
}

