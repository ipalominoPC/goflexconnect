import Dexie, { Table } from 'dexie';

export interface InstallPhoto {
  id?: string;
  userId: string;         // NEW: Security ownership
  projectId: string;
  projectName: string;
  label?: string;          
  azimuth: number;
  latitude: number;
  longitude: number;
  imageBlob: Blob;        
  thumbnail: string;      
  notes?: string;
  createdAt: number;      
  isSynced: boolean;      // NEW: Offline-first tracking
}

export class InstallDatabase extends Dexie {
  installs!: Table<InstallPhoto>;

  constructor() {
    super('GoFlexConnect_Installs');
    // Version 2 for schema migration
    this.version(2).stores({
      installs: 'id, userId, projectId, isSynced, createdAt' 
    });
  }

  async saveInstall(photo: InstallPhoto) {
    const count = await this.installs.count();

    // THE 50-PHOTO LIMIT LOGIC (FIFO)
    if (count >= 50) {
      const oldest = await this.installs.orderBy('createdAt').first();
      if (oldest?.id) {
        await this.installs.delete(oldest.id);
      }
    }

    if (!photo.id) photo.id = crypto.randomUUID();
    return await this.installs.add(photo);
  }

  async getProjectInstalls(projectId: string) {
    return await this.installs
      .where('projectId')
      .equals(projectId)
      .reverse()
      .sortBy('createdAt');
  }

  async getUnsyncedPhotos() {
    return await this.installs
      .where('isSynced')
      .equals(0) // Dexie stores booleans as 0/1 for indexing
      .toArray();
  }

  async markAsSynced(id: string) {
    return await this.installs.update(id, { isSynced: true });
  }

  async deleteInstall(id: string) {
    return await this.installs.delete(id);
  }
}

export const db = new InstallDatabase();