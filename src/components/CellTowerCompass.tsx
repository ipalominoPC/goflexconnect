import { useState, useEffect } from 'react';
import { ArrowLeft, Radio, Navigation, MapPin, Compass as CompassIcon, RefreshCw, AlertCircle, Loader } from 'lucide-react';
import { getNearbyCellTowers, CellTowerWithDistance } from '../services/openCelliDService';

interface CellTowerCompassProps {
  onBack: () => void;
}

export default function CellTowerCompass({ onBack }: CellTowerCompassProps) {
  const [heading, setHeading] = useState(0);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [towers, setTowers] = useState<CellTowerWithDistance[]>([]);
  const [selectedTower, setSelectedTower] = useState<string | null>(null);
  const [compassSupported, setCompassSupported] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(5);

  useEffect(() => {
    let headingInterval: NodeJS.Timeout;

    if ('DeviceOrientationEvent' in window) {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        if (event.alpha !== null) {
          setHeading(360 - event.alpha);
        }
      };

      window.addEventListener('deviceorientation', handleOrientation);
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    } else {
      setCompassSupported(false);
      headingInterval = setInterval(() => {
        setHeading((prev) => (prev + 1) % 360);
      }, 50);
    }

    return () => {
      if (headingInterval) clearInterval(headingInterval);
    };
  }, []);

  const loadTowers = async (lat: number, lon: number, searchRadius: number) => {
    setLoading(true);
    setError(null);
    try {
      const nearbyTowers = await getNearbyCellTowers(lat, lon, searchRadius);
      if (nearbyTowers.length === 0) {
        setError('No cell towers found in this area. Try increasing the search radius.');
      } else {
        setTowers(nearbyTowers);
        setSelectedTower(nearbyTowers[0].cellId);
      }
    } catch (err) {
      setError('Failed to load cell tower data. Using mock data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLocation({ lat, lon });
          loadTowers(lat, lon, radius);
        },
        (error) => {
          setError('Failed to get your location. Please enable GPS.');
          console.error('Geolocation error:', error);
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
    }
  }, []);

  const handleRefresh = () => {
    if (location) {
      loadTowers(location.lat, location.lon, radius);
    }
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (location) {
      loadTowers(location.lat, location.lon, newRadius);
    }
  };

  const getSignalColor = (signal: number) => {
    if (signal >= -80) return 'text-green-600';
    if (signal >= -90) return 'text-blue-600';
    if (signal >= -100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const selected = towers.find(t => t.cellId === selectedTower);
  const relativeBearing = selected ? (selected.bearing - heading + 360) % 360 : 0;

  return (
    <div className="min-h-screen bg-goflex-bg">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Cell Tower Compass</h1>
                <p className="text-gray-600">Real cell tower locations from OpenCelliD</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
                </button>
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <CompassIcon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {!compassSupported && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Device orientation not supported. Showing simulated compass.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Radius: {radius} km
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={radius}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="w-12 h-12 text-cyan-600 animate-spin" />
              </div>
            ) : towers.length > 0 ? (
              <>
                <div className="relative w-80 h-80 mx-auto mb-8">
                  <div
                    className="absolute inset-0 rounded-full border-8 border-gray-200"
                    style={{
                      background: 'radial-gradient(circle, #f8fafc 0%, #e2e8f0 100%)',
                    }}
                  >
                    <div
                      className="absolute inset-0 transition-transform duration-200"
                      style={{ transform: `rotate(${-heading}deg)` }}
                    >
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-red-600 font-bold text-xl">
                        N
                      </div>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-xl">
                        E
                      </div>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-gray-600 font-bold text-xl">
                        S
                      </div>
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-xl">
                        W
                      </div>

                      {towers.slice(0, 8).map((tower) => {
                        const angle = tower.bearing;
                        const radius = 130;
                        const x = Math.sin((angle * Math.PI) / 180) * radius;
                        const y = -Math.cos((angle * Math.PI) / 180) * radius;

                        return (
                          <div
                            key={tower.cellId}
                            className={`absolute left-1/2 top-1/2 w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                              selectedTower === tower.cellId
                                ? 'bg-cyan-500 scale-125 shadow-lg'
                                : 'bg-gray-400 hover:bg-cyan-400'
                            }`}
                            style={{
                              transform: `translate(${x}px, ${y}px)`,
                            }}
                            onClick={() => setSelectedTower(tower.cellId)}
                          >
                            <Radio className="w-4 h-4 text-white" />
                          </div>
                        );
                      })}
                    </div>

                    {selected && (
                      <div
                        className="absolute left-1/2 top-1/2 w-0 h-0 transition-transform duration-200"
                        style={{
                          transform: `translate(-50%, -50%) rotate(${relativeBearing}deg)`,
                        }}
                      >
                        <div className="relative">
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-32 bg-gradient-to-t from-cyan-500 to-transparent" />
                          <Navigation
                            className="absolute bottom-32 left-1/2 -translate-x-1/2 w-8 h-8 text-cyan-600"
                            style={{ transform: 'translate(-50%, 0)' }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white rounded-full p-4 shadow-lg">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-900">
                            {Math.round(heading)}°
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Heading</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -bottom-12 left-0 right-0 text-center">
                    <p className="text-sm text-gray-600">
                      {selected && `${Math.round(relativeBearing)}° to tower`}
                    </p>
                  </div>
                </div>

                {location && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Your location:</span>{' '}
                      {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Radio className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No cell towers found</p>
              </div>
            )}
          </div>

          {towers.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Nearby Cell Towers ({towers.length})
              </h2>
              <div className="space-y-4">
                {towers.map((tower) => (
                  <div
                    key={tower.cellId}
                    onClick={() => setSelectedTower(tower.cellId)}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedTower === tower.cellId
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-gray-200 hover:border-cyan-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{tower.operator}</h3>
                        <p className="text-sm text-gray-600">Cell ID: {tower.cellId}</p>
                        <p className="text-xs text-gray-500">
                          MCC: {tower.mcc} | MNC: {tower.mnc} | LAC: {tower.lac}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${getSignalColor(tower.averageSignal)}`}>
                        {tower.averageSignal} dBm
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">Technology:</span>
                        <div className="font-medium text-gray-900">{tower.radio}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Frequency:</span>
                        <div className="font-medium text-gray-900">{tower.frequency}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Direction:</span>
                        <div className="font-medium text-gray-900">{Math.round(tower.bearing)}°</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Distance:</span>
                        <div className="font-medium text-gray-900">{tower.distance.toFixed(2)} km</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs border-t border-gray-200 pt-3">
                      <div>
                        <span className="text-gray-500">Range:</span>
                        <span className="ml-2 font-medium text-gray-700">{tower.range}m</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Samples:</span>
                        <span className="ml-2 font-medium text-gray-700">{tower.samples}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Updated:</span>
                        <span className="ml-2 font-medium text-gray-700">
                          {new Date(tower.updated).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-400">
                      Location: {tower.lat.toFixed(6)}, {tower.lon.toFixed(6)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
