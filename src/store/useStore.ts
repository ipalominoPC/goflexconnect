import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, Floor, Measurement, Settings } from '../types';
import type { User } from '@supabase/supabase-js';
import { offlineStorage } from '../services/offlineStorage';
import { syncService } from '../services/syncService';

interface AppState {
  projects: Project[];
  floors: Floor[];
  measurements: Measurement[];
  settings: Settings;
  hasCompletedOnboarding: boolean;
  currentProjectId: string | null;
  user: User | null;
  currentUserId: string | null;

  setUser: (user: User | null) => void;
  clearUserData: () => void;
  setProjects: (projects: Project[]) => void;
  setFloors: (floors: Floor[]) => void;
  setMeasurements: (measurements: Measurement[]) => void;
  setHasCompletedOnboarding: (value: boolean) => void;
  setCurrentProject: (projectId: string | null) => void;

  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProjectById: (id: string) => Project | undefined;

  addFloor: (floor: Floor) => void;
  updateFloor: (id: string, updates: Partial<Floor>) => void;
  deleteFloor: (id: string) => void;
  getFloorById: (id: string) => Floor | undefined;
  getFloorsByProject: (projectId: string) => Floor[];

  addMeasurement: (measurement: Measurement) => void;
  getMeasurements: (projectId: string) => Measurement[];
  getMeasurementsByFloor: (floorId: string) => Measurement[];
  deleteMeasurement: (id: string) => void;

  updateSettings: (settings: Partial<Settings>) => void;

  loadProjectsFromOffline: () => Promise<void>;
  loadMeasurementsFromOffline: (projectId: string) => Promise<void>;
}

const defaultSettings: Settings = {
  thresholds: {
    rsrp: {
      good: -90,
      fair: -110,
    },
    sinr: {
      good: 10,
      fair: 0,
    },
  },
  defaultMetric: 'rsrp',
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [],
      floors: [],
      measurements: [],
      settings: defaultSettings,
      hasCompletedOnboarding: false,
      currentProjectId: null,
      user: null,
      currentUserId: null,

      setUser: (user) => {
        const prevUserId = get().currentUserId;
        const newUserId = user?.id || null;

        // If user changed, clear all data (critical for multi-tenant isolation)
        if (prevUserId && newUserId && prevUserId !== newUserId) {
          console.warn('[Store] User changed - clearing all data for security');
          set({
            projects: [],
            floors: [],
            measurements: [],
            currentProjectId: null,
            currentUserId: newUserId,
            user,
          });
        } else {
          set({ user, currentUserId: newUserId });
        }
      },

      clearUserData: () => {
        console.log('[Store] Clearing all user data');
        set({
          projects: [],
          floors: [],
          measurements: [],
          currentProjectId: null,
          user: null,
          currentUserId: null,
        });
      },

      setProjects: (projects) => set({ projects }),
      setFloors: (floors) => set({ floors }),
      setMeasurements: (measurements) => set({ measurements }),

      setHasCompletedOnboarding: (value) => set({ hasCompletedOnboarding: value }),
      setCurrentProject: (projectId) => set({ currentProjectId: projectId }),

      addProject: (project) => {
        offlineStorage.saveProject(project).catch(console.error);
        set((state) => ({
          projects: [...state.projects, project],
        }));
      },

      updateProject: (id, updates) => {
        const project = get().projects.find((p) => p.id === id);
        if (project) {
          const updatedProject = { ...project, ...updates, updatedAt: Date.now() };
          offlineStorage.updateProject(updatedProject).catch(console.error);
        }
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        }));
      },

      deleteProject: (id) => {
        offlineStorage.deleteProject(id).catch(console.error);
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          floors: state.floors.filter((f) => f.projectId !== id),
          measurements: state.measurements.filter((m) => m.projectId !== id),
        }));
      },

      getProjectById: (id) => get().projects.find((p) => p.id === id),

      addFloor: (floor) => {
        offlineStorage.saveFloor(floor).catch(console.error);
        set((state) => ({
          floors: [...state.floors, floor],
        }));
      },

      updateFloor: (id, updates) => {
        const floor = get().floors.find((f) => f.id === id);
        if (floor) {
          const updatedFloor = { ...floor, ...updates, updatedAt: Date.now() };
          offlineStorage.updateFloor(updatedFloor).catch(console.error);
        }
        set((state) => ({
          floors: state.floors.map((f) =>
            f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f
          ),
        }));
      },

      deleteFloor: (id) => {
        offlineStorage.deleteFloor(id).catch(console.error);
        set((state) => ({
          floors: state.floors.filter((f) => f.id !== id),
          measurements: state.measurements.filter((m) => m.floorId !== id),
        }));
      },

      getFloorById: (id) => get().floors.find((f) => f.id === id),

      getFloorsByProject: (projectId) =>
        get().floors.filter((f) => f.projectId === projectId),

      addMeasurement: (measurement) => {
        offlineStorage.saveMeasurement(measurement).then(() => syncService.syncWithServer()).catch(console.error);
        set((state) => ({
          measurements: [...state.measurements, measurement],
        }));
      },

      getMeasurements: (projectId) =>
        get().measurements.filter((m) => m.projectId === projectId),

      getMeasurementsByFloor: (floorId) =>
        get().measurements.filter((m) => m.floorId === floorId),

      deleteMeasurement: (id) => {
        offlineStorage.deleteMeasurement(id).catch(console.error);
        set((state) => ({
          measurements: state.measurements.filter((m) => m.id !== id),
        }));
      },

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      loadProjectsFromOffline: async () => {
        try {
          const projects = await offlineStorage.getAllProjects();
          set({ projects });
        } catch (error) {
          console.error('Failed to load projects from offline storage:', error);
        }
      },

      loadMeasurementsFromOffline: async (projectId) => {
        try {
          const measurements = await offlineStorage.getMeasurementsByProject(projectId);
          set((state) => ({
            measurements: [
              ...state.measurements.filter((m) => m.projectId !== projectId),
              ...measurements,
            ],
          }));
        } catch (error) {
          console.error('Failed to load measurements from offline storage:', error);
        }
      },
    }),
    {
      name: 'goflexconnect-storage',
    }
  )
);

