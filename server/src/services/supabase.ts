import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { WardrobeItem, Outfit, UserStyleProfile } from '../types/fashion.js';
import { User } from '../types/auth.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

export let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('⚡ [STYLORA] Supabase Database & Storage connected successfully.');
  } catch (err) {
    console.warn('⚠️ [STYLORA] Supabase client initialization error:', err);
  }
} else {
  console.log('ℹ️ [STYLORA] SUPABASE_URL / SUPABASE_KEY not yet configured in server/.env. Running with in-memory persistence fallback.');
}

/**
 * SQL Schema DDL to run in Supabase SQL Editor:
 * 
 * -- 1. Create Users Table
 * create table if not exists public.users (
 *   id text primary key,
 *   name text not null,
 *   email text unique not null,
 *   password_hash text not null,
 *   salt text not null,
 *   style_archetype text default 'minimalist',
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- 2. Create Wardrobe Items Table
 * create table if not exists public.wardrobe_items (
 *   id text primary key,
 *   user_id text,
 *   name text not null,
 *   category text not null,
 *   subcategory text,
 *   primary_color jsonb not null,
 *   pattern text default 'solid',
 *   material text,
 *   texture text,
 *   fit text default 'regular',
 *   formality_score integer default 5,
 *   seasonality jsonb default '["spring","summer","fall","winter"]'::jsonb,
 *   image_url text,
 *   times_worn integer default 0,
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- 3. Create Outfits Table
 * create table if not exists public.outfits (
 *   id text primary key,
 *   user_id text,
 *   name text not null,
 *   occasion text not null,
 *   color_harmony_type text,
 *   harmony_score integer,
 *   overall_score integer,
 *   pieces jsonb not null,
 *   stylist_rationale jsonb,
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- 4. Create Storage Bucket for Garment Photos
 * insert into storage.buckets (id, name, public) 
 * values ('garments', 'garments', true) 
 * on conflict (id) do nothing;
 */

/**
 * Uploads a base64 image string to Supabase Storage ('garments' bucket) and returns the public CDN URL
 */
export async function uploadGarmentPhotoToSupabase(
  imageBase64: string,
  filenamePrefix = 'garment',
  userId = 'default'
): Promise<string | null> {
  if (!supabase) return null;

  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    // Store in per-user folder: users/{userId}/garment-...
    const filePath = `users/${userId}/${filenamePrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.jpg`;

    const { data, error } = await supabase.storage
      .from('garments')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.warn('⚠️ Supabase Storage Upload Warning:', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('garments')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn('⚠️ Supabase Photo Upload Error:', err);
    return null;
  }
}
