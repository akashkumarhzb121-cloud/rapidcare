import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, BedDouble, Star, X, Filter, Building2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

// Fix Leaflet default marker icons with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom colored markers based on facility status
function createMarkerIcon(color, facilityType) {
  const emoji = {
    'sub-centre': '🏠',
    'phc': '🏥',
    'rural-hospital': '🏨',
    'district-hospital': '🏛️'
  }[facilityType] || '🏥';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${color};
          opacity: 0.3;
          animation: pulse 2s infinite;
        "></div>
        <div style="
          position: relative;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        ">${emoji}</div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.5); opacity: 0.1; }
          100% { transform: scale(1); opacity: 0.4; }
        }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
}

// Fit bounds to markers
function FitBounds({ facilities }) {
  const map = useMap();
  useEffect(() => {
    if (facilities.length > 0) {
      const bounds = L.latLngBounds(facilities.map(f => [f.location.lat, f.location.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
    }
  }, [facilities, map]);
  return null;
}

const FacilityMap = ({ height = '600px', showFilters = true, onFacilityClick = null }) => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');

  const fetchFacilities = async () => {
    try {
      const params = {};
      if (filterType !== 'all') params.facilityType = filterType;
      if (filterDistrict !== 'all') params.district = filterDistrict;

      const res = await api.get('/api/analytics/map', { params });
      setFacilities(res.data.facilities || []);
    } catch (err) {
      console.error('Failed to load facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [filterType, filterDistrict]);

  const districts = ['all', ...Array.from(new Set(facilities.map(f => f.district).filter(Boolean)))];

  const facilityTypes = [
    { value: 'all', label: 'All' },
    { value: 'sub-centre', label: '🏠 Sub-Centre' },
    { value: 'phc', label: '🏥 PHC' },
    { value: 'rural-hospital', label: '🏨 Rural' },
    { value: 'district-hospital', label: '🏛️ District' }
  ];

  // Legend
  const legend = [
    { label: 'Available', color: '#10b981' },
    { label: 'Busy (75%+)', color: '#f59e0b' },
    { label: 'Critical (90%+)', color: '#ef4444' },
    { label: 'Full', color: '#dc2626' }
  ];

  if (loading) {
    return (
      <div className="glass-card p-12 flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="text-slate-500 mt-3 text-sm">Loading facilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {showFilters && (
        <div className="mb-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-600 uppercase">Filters</span>
          </div>

          {/* Facility Type Filter */}
          <div className="flex gap-1 bg-white/70 rounded-xl p-1 border border-slate-200">
            {facilityTypes.map(t => (
              <button
                key={t.value}
                onClick={() => setFilterType(t.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterType === t.value
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* District Filter */}
          {districts.length > 1 && (
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium bg-white/70"
            >
              {districts.map(d => (
                <option key={d} value={d}>{d === 'all' ? 'All Districts' : d}</option>
              ))}
            </select>
          )}

          {/* Count */}
          <span className="ml-auto text-xs font-semibold text-slate-600 bg-white/70 px-3 py-1.5 rounded-xl border border-slate-200">
            {facilities.length} facilities
          </span>
        </div>
      )}

      {/* Map */}
      <div className="glass-card overflow-hidden relative" style={{ height }}>
        <MapContainer
          center={[19.7515, 75.7139]}
          zoom={7}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds facilities={facilities} />

          {facilities.map(facility => (
            <React.Fragment key={facility._id}>
              {/* Glow circle */}
              <Circle
                center={[facility.location.lat, facility.location.lng]}
                radius={2000}
                pathOptions={{
                  color: facility.markerColor,
                  fillColor: facility.markerColor,
                  fillOpacity: 0.1,
                  weight: 1
                }}
              />
              {/* Marker */}
              <Marker
                position={[facility.location.lat, facility.location.lng]}
                icon={createMarkerIcon(facility.markerColor, facility.facilityType)}
                eventHandlers={{
                  click: () => {
                    setSelectedFacility(facility);
                    if (onFacilityClick) onFacilityClick(facility);
                  }
                }}
              >
                <Popup>
                  <div style={{ minWidth: '200px', padding: '4px' }}>
                    <div className="flex items-start gap-2 mb-2">
                      <div className="text-lg">
                        {facility.facilityType === 'district-hospital' ? '🏛️' :
                         facility.facilityType === 'rural-hospital' ? '🏨' :
                         facility.facilityType === 'phc' ? '🏥' : '🏠'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm leading-tight">{facility.name}</p>
                        <p className="text-xs text-slate-500">{facility.facilityType.replace('-', ' ')}</p>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-slate-600">📍 {facility.taluka}, {facility.district}</p>
                      <p className="text-slate-600">📞 {facility.contactNumber}</p>
                      <p className={`font-bold ${
                        facility.availableBeds > 10 ? 'text-emerald-600' :
                        facility.availableBeds > 5 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        🛏️ {facility.availableBeds}/{facility.totalBeds} beds available
                      </p>
                      <p className="text-slate-500">Occupancy: {facility.occupancyRate}%</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
        </MapContainer>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-3 z-[400] border border-slate-200">
          <p className="text-xs font-bold text-slate-700 mb-2">Bed Availability</p>
          {legend.map(l => (
            <div key={l.label} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
              <span className="text-xs text-slate-600">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Facility Drawer */}
      <AnimatePresence>
        {selectedFacility && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute top-20 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-[500]"
          >
            <button
              onClick={() => setSelectedFacility(null)}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-sky-500 to-indigo-600 p-2 rounded-xl">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm truncate">{selectedFacility.name}</h3>
                <p className="text-xs text-slate-500 capitalize">{selectedFacility.facilityType.replace('-', ' ')}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-600">{selectedFacility.address}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <p className="text-xs text-slate-600">{selectedFacility.contactNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-slate-400" />
                <p className="text-xs text-slate-600">
                  <strong className={selectedFacility.availableBeds > 10 ? 'text-emerald-600' : 'text-amber-600'}>
                    {selectedFacility.availableBeds}
                  </strong>/{selectedFacility.totalBeds} beds ({selectedFacility.occupancyRate}% occupied)
                </p>
              </div>
              {selectedFacility.rating && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <p className="text-xs text-slate-600">{selectedFacility.rating}/5.0 rating</p>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-600 uppercase mb-1.5">Specializations</p>
              <div className="flex flex-wrap gap-1">
                {selectedFacility.specializations?.map(s => (
                  <span key={s} className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full capitalize">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FacilityMap;
