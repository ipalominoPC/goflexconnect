import { supabase } from './supabaseClient';
import { offlineStorage } from './offlineStorage';

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

class SyncService {
  private syncInProgress = false;
  private onlineStatusListeners: ((isOnline: boolean) => void)[] = [];

  constructor() {
    this.initOnlineStatusTracking();
  }

  private initOnlineStatusTracking() {
    window.addEventListener('online', () => {
      this.notifyOnlineStatusChange(true);
      this.syncWithServer();
    });

    window.addEventListener('offline', () => {
      this.notifyOnlineStatusChange(false);
    });
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

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

  async syncWithServer(): Promise<{ success: boolean; synced: number; failed: number }> {
    if (this.syncInProgress || !this.isOnline()) {
      return { success: false, synced: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let synced = 0;
    let failed = 0;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const pendingItems = await offlineStorage.getPendingSyncItems();

      for (const item of pendingItems) {
        try {
          if (!isValidUUID(item.data.id)) {
            console.warn('Invalid UUID detected, removing from sync queue:', item.data.id);
            await offlineStorage.removeSyncItem(item.id);
            failed++;
            continue;
          }

          if (item.type === 'project') {
            await this.syncProject(item, user.id);
          } else if (item.type === 'measurement') {
            await this.syncMeasurement(item, user.id);
          } else if (item.type === 'speedTest') {
            await this.syncSpeedTest(item, user.id);
          } else if (item.type === 'floor') {
            await this.syncFloor(item, user.id);
          }

          await offlineStorage.removeSyncItem(item.id);
          synced++;
        } catch (error) {
          console.error('Failed to sync item:', item, error);
          failed++;
        }
      }

      return { success: true, synced, failed };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, synced, failed };
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncProject(item: any, userId: string) {
    const { operation, data } = item;

    if (operation === 'create' || operation === 'update') {
      const projectData = {
        id: data.id,
        user_id: userId,
        name: data.name,
        location: data.location || null,
        building_level: data.buildingLevel || null,
        notes: data.notes || null,
        floor_plan_image: data.floorPlanImage || null,
        created_at: new Date(data.createdAt).toISOString(),
        updated_at: new Date(data.updatedAt).toISOString(),
      };

      const { error } = await supabase
        .from('projects')
        .upsert(projectData, { onConflict: 'id' });

      if (error) throw error;
    } else if (operation === 'delete') {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', data.id)
        .eq('user_id', userId);

      if (error) throw error;
    }
  }

  private async syncFloor(item: any, userId: string) {
    const { operation, data } = item;

    if (operation === 'create' || operation === 'update') {
      const floorData = {
        id: data.id,
        project_id: data.projectId,
        user_id: userId,
        name: data.name,
        level: data.level,
        floor_plan_image: data.floorPlanImage || null,
        floor_plan_filename: data.floorPlanFilename || null,
        notes: data.notes || null,
        grid_size: data.gridSize || 5,
        grid_enabled: data.gridEnabled || false,
        created_at: new Date(data.createdAt).toISOString(),
        updated_at: new Date(data.updatedAt).toISOString(),
      };

      const { error } = await supabase
        .from('floors')
        .upsert(floorData, { onConflict: 'id' });

      if (error) throw error;
    } else if (operation === 'delete') {
      const { error } = await supabase
        .from('floors')
        .delete()
        .eq('id', data.id)
        .eq('user_id', userId);

      if (error) throw error;
    }
  }

  private async syncMeasurement(item: any, userId: string) {
    const { operation, data } = item;

    if (operation === 'create') {
      const measurementData = {
        id: data.id,
        project_id: data.projectId,
        floor_id: data.floorId || null,
        user_id: userId,
        x: data.x,
        y: data.y,
        location_number: data.locationNumber,
        rsrp: data.rsrp,
        rsrq: data.rsrq,
        sinr: data.sinr,
        rssi: data.rssi,
        cell_id: data.cellId,
        tech_type: data.techType,
        timestamp: new Date(data.timestamp).toISOString(),
        photo_id: data.photoId || null,
        photo_caption: data.photoCaption || null,
        grid_x: data.gridX ?? null,
        grid_y: data.gridY ?? null,
      };

      const { error } = await supabase
        .from('measurements')
        .upsert(measurementData, { onConflict: 'id' });

      if (error) throw error;
    } else if (operation === 'delete') {
      const { error } = await supabase
        .from('measurements')
        .delete()
        .eq('id', data.id)
        .eq('user_id', userId);

      if (error) throw error;
    }
  }

  private async syncSpeedTest(item: any, userId: string) {
    const { operation, data } = item;

    if (operation === 'create') {
      const speedTestData = {
        id: data.id,
        user_id: userId,
        download_speed: data.downloadSpeed,
        upload_speed: data.uploadSpeed,
        ping: data.ping,
        jitter: data.jitter || null,
        rsrp: data.rsrp,
        rsrq: data.rsrq,
        sinr: data.sinr,
        rssi: data.rssi,
        cell_id: data.cellId,
        provider: data.provider,
        frequency: data.frequency,
        band: data.band,
        connection_type: data.connectionType,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        timestamp: new Date(data.timestamp).toISOString(),
      };

      const { error } = await supabase
        .from('speed_tests')
        .insert(speedTestData);

      if (error) throw error;
    }
  }

  async loadDataFromServer() {
    if (!this.isOnline()) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [projectsResult, floorsResult, speedTestsResult] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('floors').select('*').eq('user_id', user.id),
        supabase.from('speed_tests').select('*').eq('user_id', user.id),
      ]);

      if (projectsResult.data) {
        for (const project of projectsResult.data) {
          await offlineStorage.saveProject({
            id: project.id,
            name: project.name,
            location: project.location,
            buildingLevel: project.building_level,
            notes: project.notes,
            floorPlanImage: project.floor_plan_image,
            createdAt: new Date(project.created_at).getTime(),
            updatedAt: new Date(project.updated_at).getTime(),
          });

          const { data: measurements } = await supabase
            .from('measurements')
            .select('*')
            .eq('project_id', project.id);

          if (measurements) {
            for (const measurement of measurements) {
              await offlineStorage.saveMeasurement({
                id: measurement.id,
                projectId: measurement.project_id,
                floorId: measurement.floor_id || '',
                x: measurement.x,
                y: measurement.y,
                locationNumber: measurement.location_number,
                rsrp: measurement.rsrp,
                rsrq: measurement.rsrq,
                sinr: measurement.sinr,
                rssi: measurement.rssi,
                cellId: measurement.cell_id,
                techType: measurement.tech_type,
                timestamp: new Date(measurement.timestamp).getTime(),
                photoId: measurement.photo_id,
                photoCaption: measurement.photo_caption,
                gridX: measurement.grid_x,
                gridY: measurement.grid_y,
              });
            }
          }
        }
      }

      if (floorsResult.data) {
        for (const floor of floorsResult.data) {
          await offlineStorage.saveFloor({
            id: floor.id,
            projectId: floor.project_id,
            name: floor.name,
            level: floor.level,
            floorPlanImage: floor.floor_plan_image,
            floorPlanFilename: floor.floor_plan_filename,
            notes: floor.notes,
            gridSize: floor.grid_size,
            gridEnabled: floor.grid_enabled,
            createdAt: new Date(floor.created_at).getTime(),
            updatedAt: new Date(floor.updated_at).getTime(),
          });
        }
      }

      if (speedTestsResult.data) {
        for (const speedTest of speedTestsResult.data) {
          await offlineStorage.saveSpeedTest({
            id: speedTest.id,
            timestamp: new Date(speedTest.timestamp).getTime(),
            downloadSpeed: speedTest.download_speed,
            uploadSpeed: speedTest.upload_speed,
            ping: speedTest.ping,
            jitter: speedTest.jitter,
            rsrp: speedTest.rsrp,
            rsrq: speedTest.rsrq,
            sinr: speedTest.sinr,
            rssi: speedTest.rssi,
            cellId: speedTest.cell_id,
            provider: speedTest.provider,
            frequency: speedTest.frequency,
            band: speedTest.band,
            connectionType: speedTest.connection_type,
            latitude: speedTest.latitude,
            longitude: speedTest.longitude,
          });
        }
      }
    } catch (error) {
      console.error('Error loading data from server:', error);
    }
  }
}

export const syncService = new SyncService();
