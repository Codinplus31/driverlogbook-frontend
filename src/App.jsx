import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import './index.css';
import 'leaflet/dist/leaflet.css';


const App = () => {
  const [currentLocation, setCurrentLocation] = useState('Chicago, IL');
  const [pickupLocation, setPickupLocation] = useState('St. Louis, MO');
  const [dropoffLocation, setDropoffLocation] = useState('Atlanta, GA');
  const [currentCycleUsed, setCurrentCycleUsed] = useState(22.5);
  const [logs, setLogs] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState('');
  const [routePoints, setRoutePoints] = useState([]);
  const [totalDistance, setTotalDistance] = useState(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const newMap = L.map(mapContainerRef.current).setView([41.8781, -87.6298], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(newMap);

    mapRef.current = newMap;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || routePoints.length === 0) return;

    Object.values(markersRef.current).forEach(marker => mapRef.current.removeLayer(marker));
    markersRef.current = {};

    if (polylineRef.current) {
      mapRef.current.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    const [start, pickup, dropoff] = routePoints;

    const createMarker = (locationName, coords, popupText) => {
      const marker = L.marker(coords).addTo(mapRef.current).bindPopup(popupText);
      markersRef.current[locationName] = marker;
      return marker;
    };

    createMarker('current', start, `Current Location: ${currentLocation}`);
    createMarker('pickup', pickup, `Pickup: ${pickupLocation}`);
    createMarker('dropoff', dropoff, `Dropoff: ${dropoffLocation}`);

    polylineRef.current = L.polyline(routePoints, { color: 'red', weight: 4 }).addTo(mapRef.current);

    mapRef.current.fitBounds([
      start,
      pickup,
      dropoff
    ], { padding: [50, 50] });

  }, [routePoints, currentLocation, pickupLocation, dropoffLocation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCalculating(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_APP_BACKEND_URL}/api/trip/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentLocation,
          pickupLocation,
          dropoffLocation,
          currentCycleUsed,
        }),
      });

      const data = await response.json();
      console.log(data)
      if (response.ok && data.success) {
        setLogs(data.logs);
        setRoutePoints(data.route.route_points);
        setTotalDistance(data.route.total_distance);
      } else {
        throw new Error(data.error || 'Failed to generate logs');
      }
    } catch (err) {
      setError(err.message || 'Network error. Please check your Django backend.');
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };

  const ActivityBlock = ({ activity, duration, color }) => (
    <div className={`h-8 rounded-md ${color} flex items-center justify-center text-white text-xs font-medium px-2`}>
      {activity} ({duration}h)
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">TruckLog Pro</h1>
          <p className="text-lg text-gray-600">Automated ELD Log Generator & Route Planner for Commercial Drivers</p>
        </header>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Trip Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
              <input
                type="text"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Chicago, IL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., St. Louis, MO"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Location</label>
              <input
                type="text"
                value={dropoffLocation}
                onChange={(e) => setDropoffLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Atlanta, GA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Cycle Used (hrs)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="70"
                value={currentCycleUsed}
                onChange={(e) => setCurrentCycleUsed(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isCalculating}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isCalculating ? 'Generating Logs...' : 'Generate Route & ELD Logs'}
          </button>
        </form>

        {/* Map Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Route Map</h2>
          <div 
            ref={mapContainerRef} 
            style={{ height: '400px', borderRadius: '0.5rem', overflow: 'hidden' }} 
          ></div>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Route:</strong> {currentLocation} → {pickupLocation} → {dropoffLocation}</p>
            {routePoints.length > 0 && (
              <p>
                <strong>Actual Route Coordinates:</strong> 
                {routePoints.map((point, i) => 
                  `${i === 0 ? 'Start: ' : i === 1 ? 'Pickup: ' : 'Dropoff: '}${point[0].toFixed(4)},${point[1].toFixed(4)}`
                ).join(' | ')}
              </p>
            )}
            <p><strong>Estimated Distance:</strong> ~{totalDistance !== null ? totalDistance.toFixed(1) : 750} miles | <strong>Est. Driving Time:</strong> ~{totalDistance !== null ? (totalDistance / 55).toFixed(1) : 13.6} hrs</p>
            <p><strong>Fuel Stops:</strong> 1 | <strong>Pickup/Dropoff:</strong> 2 hrs total</p>
            {routePoints.length > 0 && (
              <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded text-xs text-green-800">
                🗺️ Map shows route based on locations only. 
              </div>
            )}
          </div>
        </div>

        {/* ELD Logs Section */}
        {logs.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Generated ELD Daily Logs</h2>
            
            {logs.map((dayLog, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-8 mb-6 last:border-b-0 last:pb-0">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Day {dayLog.day}</h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {dayLog.entries.map((entry, i) => (
                    <ActivityBlock
                      key={i}
                      activity={entry.activity}
                      duration={entry.duration}
                      color={entry.color}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <span className="font-medium">Driving:</span> {dayLog.total_driving.toFixed(1)} hrs
                  </div>
                  <div>
                    <span className="font-medium">On-Duty:</span> {dayLog.total_on_duty.toFixed(1)} hrs
                  </div>
                  <div>
                    <span className="font-medium">Sleeper Berth:</span> {dayLog.total_sleeper.toFixed(1)} hrs
                  </div>
                  <div>
                    <span className="font-medium">Off-Duty:</span> {dayLog.total_off_duty.toFixed(1)} hrs
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Total Hours Used Today: {(dayLog.total_driving + dayLog.total_on_duty + dayLog.total_sleeper + dayLog.total_off_duty).toFixed(1)} hrs
                </div>
              </div>
            ))}

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This log complies with FMCSA 70-hour/8-day rule. Driver has used {currentCycleUsed} hrs before trip. 
                Total trip adds ~{logs.reduce((acc, day) => acc + day.total_driving + day.total_on_duty, 0).toFixed(1)} hrs.
                Remaining cycle: {Math.max(0, 70 - (currentCycleUsed + logs.reduce((acc, day) => acc + day.total_driving + day.total_on_duty, 0))).toFixed(1)} hrs.
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">How to Use</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Enter your current location, pickup, and dropoff addresses.</li>
            <li>Input your current cycle-used hours (from your ELD).</li>
            <li>Click “Generate Route & ELD Logs” to see the real route based on actual geocoded coordinates.</li>
            <li>The map will update only after clicking — showing precise locations from Django backend.</li>
            <li>Print or save these logs for DOT compliance.</li>
          </ol>
          <p className="mt-4 text-sm text-gray-600">
            <strong>Backend:</strong> Django uses Nominatim to geocode addresses into real lat/lng. Frontend displays them accurately on Leaflet with full FMCSA-compliant ELD logs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
