import { supabase } from './supabaseClient';
import { offlineStorage } from './offlineStorage';
import { useStore } from '../store/useStore';

// PHASE 4.9: Hierarchy integrity priorities
const SYNC_PRIORITY: Record<string, number> = {
  'project': 0,
  'floor': 1,
  'measurement': 2,
  'speedTest': 3
};

class SyncService {
  private syncInProgress = false;
  private onlineStatusListeners: ((isOnline: boolean) => void)[] = [];

  constructor() {
    this.initOnlineStatusTracking();
  }

  private initOnlineStatusTracking() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notifyOnlineStatusChange(true);
        this.syncWithServer();
      });
      window.addEventListener('offline', () => {
        this.notifyOnlineStatusChange(false);
      });
    }
  }

  isOnline(): boolean { return typeof navigator !== 'undefined' ? navigator.onLine : true; }

  onOnlineStatusChange(callback: (isOnline: boolean) => void) {
    this.onlineStatusListeners.push(callback);
    callback(this.isOnline());
    return () => {
      this.onlineStatusListeners = this.onlineStatusListeners.filter(cb => cb !== callback);
    };
  }

  private notifyOnlineStatusChange(isOnline: boolean) {
    this.onlineStatusListeners.forEach(callback => callback(isOnline));
  }

  async syncWithServer() {
    if (this.syncInProgress || !this.isOnline()) return;
    this.syncInProgress = true;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const pendingItems = await offlineStorage.getPendingSyncItems();
      
      // TRUTH: Enforce dependency order (Project -> Floor -> Measurement)
      const sortedItems = [...pendingItems].sort((a, b) => 
        (SYNC_PRIORITY[a.type] ?? 99) - (SYNC_PRIORITY[b.type] ?? 99)
      );

      for (const item of sortedItems) {
        try {
          if (item.type === 'project') {
            await this.syncProject(item, user.id);
          } else if (item.type === 'measurement') {
            await this.syncMeasurement(item, user.id);
          } else if (item.type === 'floor') {
            await this.syncFloor(item, user.id);
          } else if (item.type === 'speedTest') {
            await this.syncSpeedTest(item, user.id);
          }
          await offlineStorage.removeSyncItem(item.id);
        } catch (err) { 
          console.error(`[SyncService] Reconciliation failure for ${item.type}:`, err);
          // TRUTH: Leave in queue for next handshake if dependency isn't met
        }
      }
    } catch (error) { 
      console.error('Sync error:', error);
    } finally { 
      this.syncInProgress = false; 
    }
  }

  private async syncProject(item: any, userId: string) {
    const { data: d } = item;
    const { error } = await supabase.from('projects').upsert({
      id: d.id, user_id: userId, name: d.name, location: d.location || null,
      building_level: d.buildingLevel || null, notes: d.notes || null,
      floor_plan_image: d.floorPlanImage || null,
      created_at: new Date(d.createdAt).toISOString(),
      updated_at: new Date(d.updatedAt).toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
  }

  private async syncFloor(item: any, userId: string) {
    const { data: d } = item;
    const { error } = await supabase.from('floors').upsert({
      id: d.id, project_id: d.projectId, user_id: userId, name: d.name, level: d.level,
      floor_plan_image: d.floorPlanImage || null, grid_size: d.gridSize || 5,
      created_at: new Date(d.createdAt).toISOString(),
      updated_at: new Date(d.updatedAt).toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
  }

  private async syncMeasurement(item: any, userId: string) {
    const { data: d } = item;
    const { error } = await supabase.from('measurements').upsert({
      id: d.id, project_id: d.projectId, floor_id: d.floorId || null, user_id: userId,
      x: d.x, y: d.y, location_number: d.locationNumber,
      rsrp: d.rsrp, rsrq: d.rsrq, sinr: d.sinr, rssi: d.rssi,
      cell_id: d.cellId || 'Unknown', tech_type: d.techType,
      carrier_name: d.carrierName || 'Unknown', // Phase 4.9: Standardized key mapping
      latitude: d.latitude || null, longitude: d.longitude || null, band: d.band || null,
      timestamp: new Date(d.timestamp).toISOString()
    }, { onConflict: 'id' });
    if (error) throw error;
  }

  private async syncSpeedTest(item: any, userId: string) {
    const { data: d } = item;
    const { error } = await supabase.from('speed_tests').insert({
      id: d.id, user_id: userId, download_speed: d.downloadSpeed, upload_speed: d.uploadSpeed,
      ping: d.ping, provider: d.provider, timestamp: new Date(d.timestamp).toISOString(),
    });
    if (error) throw error;
  }

  async loadDataFromServer() {
    if (!this.isOnline()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // PHASE 4.9: Recursive Reconciliation Handshake
      const { data: projects } = await supabase.from('projects').select('*').eq('user_id', user.id);
      if (projects) {
        useStore.getState().setProjects(projects.map(p => ({
          id: p.id, name: p.name, location: p.location, buildingLevel: p.building_level,
          notes: p.notes, floorPlanImage: p.floor_plan_image,
          createdAt: new Date(p.created_at).getTime(), updatedAt: new Date(p.updated_at).getTime(),
        })));
      }

      const { data: floors } = await supabase.from('floors').select('*').eq('user_id', user.id);
      if (floors) {
        useStore.getState().setFloors(floors.map(f => ({
          id: f.id, projectId: f.project_id, name: f.name, level: f.level,
          floorPlanImage: f.floor_plan_image, gridSize: f.grid_size,
          createdAt: new Date(f.created_at).getTime(), updatedAt: new Date(f.updated_at).getTime(),
        })));
      }

      const { data: measurements } = await supabase.from('measurements').select('*').eq('user_id', user.id);
      if (measurements) {
        useStore.getState().setMeasurements(measurements.map(m => ({
          id: m.id, projectId: m.project_id, floorId: m.floor_id,
          x: m.x, y: m.y, locationNumber: m.location_number,
          rsrp: m.rsrp, rsrq: m.rsrq, sinr: m.sinr, rssi: m.rssi,
          cellId: m.cell_id, techType: m.tech_type, carrierName: m.carrier_name || 'Unknown',
          latitude: m.latitude, longitude: m.longitude, band: m.band,
          timestamp: new Date(m.timestamp).getTime(),
        })));
      }

      console.log('[SyncService] Handshake Complete:', { 
        projects: projects?.length, 
        floors: floors?.length, 
        measurements: measurements?.length 
      });
    } catch (error) { 
      console.error('Handshake error:', error); 
    }
  }
}
export const syncService = new SyncService();