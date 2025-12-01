import { Project, Floor, Measurement, SpeedTestResult } from '../types';

const DB_NAME = 'GoFlexConnectDB';
const DB_VERSION = 3;
const PROJECTS_STORE = 'projects';
const FLOORS_STORE = 'floors';
const MEASUREMENTS_STORE = 'measurements';
const SPEED_TESTS_STORE = 'speedTests';
const PHOTOS_STORE = 'photos';
const PENDING_SYNC_STORE = 'pendingSync';

interface PendingSyncItem {
  id: string;
  type: 'project' | 'floor' | 'measurement' | 'speedTest';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(FLOORS_STORE)) {
          const floorStore = db.createObjectStore(FLOORS_STORE, { keyPath: 'id' });
          floorStore.createIndex('projectId', 'projectId', { unique: false });
        }

        if (!db.objectStoreNames.contains(MEASUREMENTS_STORE)) {
          const measurementStore = db.createObjectStore(MEASUREMENTS_STORE, { keyPath: 'id' });
          measurementStore.createIndex('projectId', 'projectId', { unique: false });
        }

        if (!db.objectStoreNames.contains(SPEED_TESTS_STORE)) {
          db.createObjectStore(SPEED_TESTS_STORE, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
          db.createObjectStore(PHOTOS_STORE, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(PENDING_SYNC_STORE)) {
          db.createObjectStore(PENDING_SYNC_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  async saveProject(project: Project): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([PROJECTS_STORE], 'readwrite');
    const store = tx.objectStore(PROJECTS_STORE);
    await store.put(project);
    await this.addToPendingSync('project', 'create', project);
  }

  async updateProject(project: Project): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([PROJECTS_STORE], 'readwrite');
    const store = tx.objectStore(PROJECTS_STORE);
    await store.put(project);
    await this.addToPendingSync('project', 'update', project);
  }

  async getProject(id: string): Promise<Project | undefined> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([PROJECTS_STORE], 'readonly');
    const store = tx.objectStore(PROJECTS_STORE);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProjects(): Promise<Project[]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([PROJECTS_STORE], 'readonly');
    const store = tx.objectStore(PROJECTS_STORE);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProject(id: string): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([PROJECTS_STORE, FLOORS_STORE, MEASUREMENTS_STORE], 'readwrite');
    const projectStore = tx.objectStore(PROJECTS_STORE);
    const floorStore = tx.objectStore(FLOORS_STORE);
    const measurementStore = tx.objectStore(MEASUREMENTS_STORE);

    await projectStore.delete(id);

    const floorIndex = floorStore.index('projectId');
    const floors = await new Promise<Floor[]>((resolve, reject) => {
      const request = floorIndex.getAll(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    for (const floor of floors) {
      await floorStore.delete(floor.id);
    }

    const measurementIndex = measurementStore.index('projectId');
    const measurements = await new Promise<Measurement[]>((resolve, reject) => {
      const request = measurementIndex.getAll(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    for (const measurement of measurements) {
      await measurementStore.delete(measurement.id);
    }

    await this.addToPendingSync('project', 'delete', { id });
  }

  async saveFloor(floor: Floor): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([FLOORS_STORE], 'readwrite');
    const store = tx.objectStore(FLOORS_STORE);
    await store.put(floor);
    await this.addToPendingSync('floor', 'create', floor);
  }

  async updateFloor(floor: Floor): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([FLOORS_STORE], 'readwrite');
    const store = tx.objectStore(FLOORS_STORE);
    await store.put(floor);
    await this.addToPendingSync('floor', 'update', floor);
  }

  async getFloor(id: string): Promise<Floor | undefined> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([FLOORS_STORE], 'readonly');
    const store = tx.objectStore(FLOORS_STORE);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getFloorsByProject(projectId: string): Promise<Floor[]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([FLOORS_STORE], 'readonly');
    const store = tx.objectStore(FLOORS_STORE);
    const index = store.index('projectId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(projectId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFloor(id: string): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([FLOORS_STORE, MEASUREMENTS_STORE], 'readwrite');
    const floorStore = tx.objectStore(FLOORS_STORE);
    const measurementStore = tx.objectStore(MEASUREMENTS_STORE);

    await floorStore.delete(id);

    const measurements = await new Promise<Measurement[]>((resolve, reject) => {
      const request = measurementStore.getAll();
      request.onsuccess = () => {
        const allMeasurements = request.result;
        resolve(allMeasurements.filter((m: Measurement) => m.floorId === id));
      };
      request.onerror = () => reject(request.error);
    });

    for (const measurement of measurements) {
      await measurementStore.delete(measurement.id);
    }

    await this.addToPendingSync('floor', 'delete', { id });
  }

  async saveMeasurement(measurement: Measurement): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([MEASUREMENTS_STORE], 'readwrite');
    const store = tx.objectStore(MEASUREMENTS_STORE);
    await store.put(measurement);
    await this.addToPendingSync('measurement', 'create', measurement);
  }

  async getMeasurementsByProject(projectId: string): Promise<Measurement[]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([MEASUREMENTS_STORE], 'readonly');
    const store = tx.objectStore(MEASUREMENTS_STORE);
    const index = store.index('projectId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(projectId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMeasurement(id: string): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([MEASUREMENTS_STORE], 'readwrite');
    const store = tx.objectStore(MEASUREMENTS_STORE);
    await store.delete(id);
    await this.addToPendingSync('measurement', 'delete', { id });
  }

  async saveSpeedTest(speedTest: SpeedTestResult): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([SPEED_TESTS_STORE], 'readwrite');
    const store = tx.objectStore(SPEED_TESTS_STORE);
    await store.put(speedTest);
    await this.addToPendingSync('speedTest', 'create', speedTest);
  }

  async getAllSpeedTests(): Promise<SpeedTestResult[]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([SPEED_TESTS_STORE], 'readonly');
    const store = tx.objectStore(SPEED_TESTS_STORE);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async addToPendingSync(
    type: PendingSyncItem['type'],
    operation: PendingSyncItem['operation'],
    data: any
  ): Promise<void> {
    if (!this.db) return;
    const tx = this.db.transaction([PENDING_SYNC_STORE], 'readwrite');
    const store = tx.objectStore(PENDING_SYNC_STORE);

    const syncItem: PendingSyncItem = {
      id: `${type}_${operation}_${data.id}_${Date.now()}`,
      type,
      operation,
      data,
      timestamp: Date.now(),
    };

    await store.put(syncItem);
  }

  async getPendingSyncItems(): Promise<PendingSyncItem[]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([PENDING_SYNC_STORE], 'readonly');
    const store = tx.objectStore(PENDING_SYNC_STORE);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeSyncItem(id: string): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([PENDING_SYNC_STORE], 'readwrite');
    const store = tx.objectStore(PENDING_SYNC_STORE);
    await store.delete(id);
  }

  async clearAllPendingSync(): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([PENDING_SYNC_STORE], 'readwrite');
    const store = tx.objectStore(PENDING_SYNC_STORE);
    await store.clear();
  }

  /**
   * CRITICAL: Clear ALL data from IndexedDB
   * Must be called on logout to prevent data leakage between users
   */
  async clearAllData(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => {
        console.log('[OfflineStorage] All data cleared');
        resolve();
      };
      request.onerror = () => {
        console.error('[OfflineStorage] Failed to clear data');
        reject(request.error);
      };
      request.onblocked = () => {
        console.warn('[OfflineStorage] Database deletion blocked');
        // Still resolve - we'll try again on next init
        resolve();
      };
    });
  }

  async savePhoto(id: string, photoData: string): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([PHOTOS_STORE], 'readwrite');
    await tx.objectStore(PHOTOS_STORE).put({ id, data: photoData });
  }

  async getPhoto(id: string): Promise<string | null> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([PHOTOS_STORE], 'readonly');
      const request = tx.objectStore(PHOTOS_STORE).get(id);
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePhoto(id: string): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction([PHOTOS_STORE], 'readwrite');
    await tx.objectStore(PHOTOS_STORE).delete(id);
  }
}

export const offlineStorage = new OfflineStorage();
