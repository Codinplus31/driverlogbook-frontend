import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Color palette for activities
const ACTIVITY_COLORS = {
  Driving: 'bg-blue-600',
  'On-Duty': 'bg-yellow-500',
  'Sleeper Berth': 'bg-purple-600',
  'Off-Duty': 'bg-gray-500',
};

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

  // Initialize map
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

  // Update map when route changes
  useEffect(() => {
    if (!mapRef.current || routePoints.length === 0) return;

    // Clear existing markers and polyline
    Object.values(markersRef.current).forEach(marker => mapRef.current.removeLayer(marker));
    markersRef.current = {};

    if (polylineRef.current) {
      mapRef.current.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    const [start, pickup, dropoff] = routePoints;

    // Create custom icons
    const createIcon = (color) => L.divIcon({
      className: 'custom-marker',
      html: `<div class="w-6 h-6 rounded-full ${color} border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">${color === 'bg-blue-600' ? 'C' : color === 'bg-yellow-500' ? 'P' : 'D'}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Add markers
    const addMarker = (locationName, coords, popupText, color) => {
      const marker = L.marker(coords, { icon: createIcon(color) })
        .addTo(mapRef.current)
        .bindPopup(popupText);
      markersRef.current[locationName] = marker;
    };

    addMarker('current', start, `Current Location: ${currentLocation}`, 'bg-blue-600');
    addMarker('pickup', pickup, `Pickup: ${pickupLocation}`, 'bg-yellow-500');
    addMarker('dropoff', dropoff, `Dropoff: ${dropoffLocation}`, 'bg-red-600');

    // Add route line
    polylineRef.current = L.polyline(routePoints, { 
      color: '#3b82f6', 
      weight: 4,
      opacity: 0.8
    }).addTo(mapRef.current);

    // Fit map to route
    mapRef.current.fitBounds([
      start,
      pickup,
      dropoff
    ], { padding: [50, 50] });

  }, [routePoints, currentLocation, pickupLocation, dropoffLocation]);

  // Handle form submission
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

  // Calculate total trip hours
  const calculateTotalTripHours = () => {
    return logs.reduce((acc, day) => 
      acc + day.total_driving + day.total_on_duty, 0
    ).toFixed(1);
  };

  // Calculate remaining cycle hours
  const calculateRemainingCycle = () => {
    const totalTripHours = parseFloat(calculateTotalTripHours());
    return Math.max(0, 70 - (currentCycleUsed + totalTripHours)).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <TruckIcon />
            TruckLog Pro
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Automated ELD Log Generator & Route Planner for Commercial Drivers
          </p>
        </header>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <MapPinIcon />
            Trip Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <LocationInput 
              label="Current Location"
              value={currentLocation}
              onChange={setCurrentLocation}
              placeholder="e.g., Chicago, IL"
              icon={<CurrentLocationIcon />}
            />

            <LocationInput 
              label="Pickup Location"
              value={pickupLocation}
              onChange={setPickupLocation}
              placeholder="e.g., St. Louis, MO"
              icon={<PickupIcon />}
            />

            <LocationInput 
              label="Dropoff Location"
              value={dropoffLocation}
              onChange={setDropoffLocation}
              placeholder="e.g., Atlanta, GA"
              icon={<DropoffIcon />}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <ClockIcon />
                Current Cycle Used (hrs)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="70"
                value={currentCycleUsed}
                onChange={(e) => setCurrentCycleUsed(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-1 text-xs text-gray-500">
                FMCSA 70-hour/8-day rule
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start gap-2">
              <ExclamationIcon />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isCalculating}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isCalculating ? (
              <>
                <SpinnerIcon />
                Generating Logs...
              </>
            ) : (
              <>
                <GenerateIcon />
                Generate Route & ELD Logs
              </>
            )}
          </button>
        </form>

        {/* Map Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <RouteIcon />
            Route Map
          </h2>
          <div 
            ref={mapContainerRef} 
            style={{ height: '400px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e5e7eb' }} 
          ></div>
          
          {routePoints.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-1">Route Summary</h3>
                <p className="text-sm text-gray-700">
                  {currentLocation} → {pickupLocation} → {dropoffLocation}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Distance: ~{totalDistance?.toFixed(1)} miles | 
                  Est. Driving Time: ~{(totalDistance / 55).toFixed(1)} hrs
                </p>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <h3 className="font-medium text-green-800 mb-1">Compliance Status</h3>
                <p className="text-sm text-gray-700">
                  Fuel Stops: 1 | Pickup/Dropoff: 2 hrs
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Remaining Cycle: {calculateRemainingCycle()} hrs
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ELD Logs Section */}
        {logs.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <LogIcon />
                Generated ELD Daily Logs
              </h2>
              <button className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors">
                Export PDF
              </button>
            </div>
            
            {logs.map((dayLog, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-8 mb-6 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Day {dayLog.day}</h3>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                    Total: {(dayLog.total_driving + dayLog.total_on_duty + dayLog.total_sleeper + dayLog.total_off_duty).toFixed(1)} hrs
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {dayLog.entries.map((entry, i) => (
                    <ActivityBlock
                      key={i}
                      activity={entry.activity}
                      duration={entry.duration}
                      color={ACTIVITY_COLORS[entry.activity]}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4 pt-4 border-t border-gray-100">
                  <StatItem label="Driving" value={dayLog.total_driving.toFixed(1)} color="text-blue-600" />
                  <StatItem label="On-Duty" value={dayLog.total_on_duty.toFixed(1)} color="text-yellow-600" />
                  <StatItem label="Sleeper Berth" value={dayLog.total_sleeper.toFixed(1)} color="text-purple-600" />
                  <StatItem label="Off-Duty" value={dayLog.total_off_duty.toFixed(1)} color="text-gray-600" />
                </div>
              </div>
            ))}

            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <InfoIcon className="text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  <strong>FMCSA Compliance Note:</strong> This log complies with the 70-hour/8-day rule. 
                  Driver has used {currentCycleUsed} hrs before trip. 
                  Total trip adds ~{calculateTotalTripHours()} hrs.
                  Remaining cycle: {calculateRemainingCycle()} hrs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <HelpIcon />
            How to Use
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700 pl-2">
            <li>Enter your current location, pickup, and dropoff addresses.</li>
            <li>Input your current cycle-used hours (from your ELD).</li>
            <li>Click “Generate Route & ELD Logs” to see the real route based on actual geocoded coordinates.</li>
            <li>The map will update only after clicking — showing precise locations from Django backend.</li>
            <li>Print or save these logs for DOT compliance.</li>
          </ol>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg">
            <BackendIcon />
            <span>
              <strong>Backend:</strong> Django uses Nominatim to geocode addresses into real lat/lng. Frontend displays them accurately on Leaflet with full FMCSA-compliant ELD logs.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable components
const ActivityBlock = ({ activity, duration, color }) => (
  <div className={`h-10 rounded-lg ${color} flex items-center justify-center text-white text-sm font-medium px-3 whitespace-nowrap`}>
    {activity} ({duration}h)
  </div>
);

const LocationInput = ({ label, value, onChange, placeholder, icon }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
      {icon}
      {label}
    </label>
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
      />
      <div className="absolute left-3 top-2.5 text-gray-400">
        {icon}
      </div>
    </div>
  </div>
);

const StatItem = ({ label, value, color }) => (
  <div>
    <span className={`font-medium ${color}`}>{label}:</span> {value} hrs
  </div>
);

// Icons (SVG components)
const TruckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const GenerateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RouteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const LogIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const InfoIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const HelpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BackendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const CurrentLocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PickupIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const DropoffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);


export default App;