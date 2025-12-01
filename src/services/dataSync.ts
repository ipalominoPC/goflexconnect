/**
 * Data Synchronization Service
 *
 * Handles loading user-specific data from Supabase
 * Ensures proper multi-tenant isolation
 */

import { supabase } from './supabaseClient';
import { Project, Floor, Measurement } from '../types';

/**
 * Load all projects for the current user
 */
export async function loadUserProjects(): Promise<Project[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load projects:', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    location: row.location || '',
    buildingLevel: row.building_level || '',
    notes: row.notes || '',
    floorPlanImage: row.floor_plan_image || undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }));
}

/**
 * Load all floors for the current user
 */
export async function loadUserFloors(): Promise<Floor[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('floors')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load floors:', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    level: row.level,
    floorPlanImage: row.floor_plan_image || undefined,
    floorPlanFilename: row.floor_plan_filename || undefined,
    notes: row.notes || '',
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    gridSize: row.grid_size || 5,
    gridEnabled: row.grid_enabled || false,
  }));
}

/**
 * Load all measurements for the current user
 */
export async function loadUserMeasurements(): Promise<Measurement[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Failed to load measurements:', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    floorId: row.floor_id || undefined,
    x: Number(row.x),
    y: Number(row.y),
    locationNumber: row.location_number,
    rsrp: Number(row.rsrp),
    rsrq: Number(row.rsrq),
    sinr: Number(row.sinr),
    rssi: Number(row.rssi),
    cellId: row.cell_id,
    techType: row.tech_type,
    timestamp: new Date(row.timestamp).getTime(),
    photoId: row.photo_id || undefined,
    photoCaption: row.photo_caption || undefined,
    gridX: row.grid_x || undefined,
    gridY: row.grid_y || undefined,
  }));
}

/**
 * Clear all local storage and IndexedDB for the current session
 * CRITICAL: Must be called on logout to prevent data leakage
 */
export function clearAllLocalData(): void {
  // Clear localStorage
  try {
    localStorage.removeItem('goflexconnect-storage');
    console.log('[DataSync] Cleared localStorage');
  } catch (error) {
    console.error('[DataSync] Failed to clear localStorage:', error);
  }

  // Clear IndexedDB
  try {
    const deleteRequest = indexedDB.deleteDatabase('GoFlexConnectDB');
    deleteRequest.onsuccess = () => {
      console.log('[DataSync] Cleared IndexedDB');
    };
    deleteRequest.onerror = () => {
      console.error('[DataSync] Failed to clear IndexedDB');
    };
  } catch (error) {
    console.error('[DataSync] Failed to clear IndexedDB:', error);
  }
}

/**
 * Load all user data from Supabase
 * Should be called on login/app start
 */
export async function syncUserData(): Promise<{
  projects: Project[];
  floors: Floor[];
  measurements: Measurement[];
}> {
  console.log('[DataSync] Loading user data from Supabase...');

  const [projects, floors, measurements] = await Promise.all([
    loadUserProjects(),
    loadUserFloors(),
    loadUserMeasurements(),
  ]);

  console.log(`[DataSync] Loaded ${projects.length} projects, ${floors.length} floors, ${measurements.length} measurements`);

  return { projects, floors, measurements };
}
