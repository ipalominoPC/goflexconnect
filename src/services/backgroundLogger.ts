import { supabase } from './supabaseClient';

interface BackgroundLogConfig {
  projectId: string;
  floorId?: string;
  userId: string;
  interval: number;
  enabled: boolean;
}

class BackgroundLogger {
  private config: BackgroundLogConfig | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private watchId: number | null = null;
  private isRunning = false;
  private listeners: Array<(data: any) => void> = [];

  start(config: BackgroundLogConfig) {
    if (this.isRunning) {
      this.stop();
    }

    this.config = config;
    this.isRunning = true;

    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.logMeasurement(position);
      },
      (error) => {
        console.error('Background logging error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    this.intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => this.logMeasurement(position),
        (error) => console.error('Periodic log error:', error)
      );
    }, config.interval * 1000);

    this.notifyListeners({ status: 'started', timestamp: Date.now() });
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    this.notifyListeners({ status: 'stopped', timestamp: Date.now() });
  }

  private async logMeasurement(position: GeolocationPosition) {
    if (!this.config) return;

    const { latitude, longitude, accuracy } = position.coords;

    const mockSignals = {
      rsrp: -70 - Math.random() * 30,
      rsrq: -10 - Math.random() * 10,
      sinr: 10 + Math.random() * 20,
      rssi: -60 - Math.random() * 40,
      cellId: `CELL${Math.floor(Math.random() * 1000)}`,
    };

    const measurement = {
      project_id: this.config.projectId,
      floor_id: this.config.floorId,
      user_id: this.config.userId,
      x: longitude,
      y: latitude,
      location_number: Date.now(),
      rsrp: mockSignals.rsrp,
      rsrq: mockSignals.rsrq,
      sinr: mockSignals.sinr,
      rssi: mockSignals.rssi,
      cell_id: mockSignals.cellId,
      tech_type: '5G',
    };

    try {
      const { error } = await supabase.from('measurements').insert(measurement);

      if (error) {
        console.error('Failed to log measurement:', error);
        this.notifyListeners({ status: 'error', error, timestamp: Date.now() });
      } else {
        this.notifyListeners({
          status: 'logged',
          measurement: {
            ...mockSignals,
            latitude,
            longitude,
            accuracy,
            timestamp: Date.now(),
          },
        });
      }
    } catch (err) {
      console.error('Background logging exception:', err);
    }
  }

  subscribe(callback: (data: any) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(callback => callback(data));
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
    };
  }
}

export const backgroundLogger = new BackgroundLogger();
