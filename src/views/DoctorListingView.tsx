import React, { useState, useEffect } from 'react';
import { Search, MapPin, Sliders, RotateCcw, Activity, ShieldCheck } from 'lucide-react';
import { Doctor } from '../types';
import DoctorCard from '../components/DoctorCard';

interface DoctorListingViewProps {
  doctors: Doctor[];
  initialNameQuery?: string;
  initialSpecialtyQuery?: string;
  initialCityQuery?: string;
  onViewProfile: (doctor: Doctor) => void;
  onRequestAppointment: (doctor: Doctor) => void;
}

export default function DoctorListingView({
  doctors,
  initialNameQuery = '',
  initialSpecialtyQuery = '',
  initialCityQuery = '',
  onViewProfile,
  onRequestAppointment
}: DoctorListingViewProps) {
  // Advanced search states
  const [searchTerm, setSearchTerm] = useState(initialNameQuery);
  const [specialtyFilter, setSpecialtyFilter] = useState(initialSpecialtyQuery);
  const [cityFilter, setCityFilter] = useState(initialCityQuery);
  const [maxFee, setMaxFee] = useState('');
  const [sortBy, setSortBy] = useState<'' | 'fee-asc' | 'fee-desc' | 'exp-desc'>('');

  // Update states if props change
  useEffect(() => {
    setSearchTerm(initialNameQuery);
    setSpecialtyFilter(initialSpecialtyQuery);
    setCityFilter(initialCityQuery);
  }, [initialNameQuery, initialSpecialtyQuery, initialCityQuery]);

  // Extract unique cities from doctors
  const uniqueCities = Array.from(new Set(doctors.map(doc => doc.city))).filter(Boolean);
  
  // Extract unique specialties
  const uniqueSpecialties = Array.from(new Set(doctors.map(doc => doc.specialty))).filter(Boolean);

  // Filtered doctors logic
  const filteredDoctors = doctors.filter(doctor => {
    // Only show approved doctors
    const isApproved = doctor.status === 'Approved' || doctor.status === undefined;
    if (!isApproved) return false;

    const matchesName = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (doctor.qualification && doctor.qualification.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSpecialty = specialtyFilter ? doctor.specialty === specialtyFilter : true;
    
    const matchesCity = cityFilter ? doctor.city.toLowerCase().includes(cityFilter.toLowerCase()) : true;
    
    const matchesFee = maxFee ? doctor.fee <= Number(maxFee) : true;

    return matchesName && matchesSpecialty && matchesCity && matchesFee;
  });

  // Sort doctors logic
  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    if (sortBy === 'fee-asc') return a.fee - b.fee;
    if (sortBy === 'fee-desc') return b.fee - a.fee;
    if (sortBy === 'exp-desc') return b.experience - a.experience;
    return 0; // default order
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setSpecialtyFilter('');
    setCityFilter('');
    setMaxFee('');
    setSortBy('');
  };

  return (
    <div className="space-y-8" id="doctor-listing-view">
      {/* Search Header Banner */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-[10px] bg-blue-50 border border-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            PMC Verified Directory
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 font-display">
            Certified Specialist Consultants
          </h2>
          <p className="text-xs text-slate-500">
            Search top consultants, match diagnostic fees, and book live clinical visits instantly.
          </p>
        </div>

        {/* Diagnostic counters */}
        <div className="flex gap-4 text-center shrink-0">
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl w-24 shadow-sm">
            <span className="text-xl font-bold text-slate-800">{sortedDoctors.length}</span>
            <span className="block text-[9px] uppercase font-bold text-slate-400">Found</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl w-24 shadow-sm">
            <span className="text-xl font-bold text-blue-600">{uniqueSpecialties.length}</span>
            <span className="block text-[9px] uppercase font-bold text-slate-400">Specialties</span>
          </div>
        </div>
      </section>

      {/* Main Filter Panel & Listing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Advanced Filters Module (col-span-3) */}
        <aside className="lg:col-span-3 space-y-6 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm h-fit">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-display">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Search Filters</span>
            </h3>
            
            {(searchTerm || specialtyFilter || cityFilter || maxFee || sortBy) && (
              <button
                onClick={handleResetFilters}
                className="text-[10px] text-blue-600 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                id="reset-filters-btn"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            )}
          </div>

          {/* Search by doctor query */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Doctor Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name & qual..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl focus:outline-none text-slate-800"
                id="filter-name"
              />
            </div>
          </div>

          {/* Specialty selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Medical Specialty</label>
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl focus:outline-none text-slate-700"
              id="filter-specialty"
            >
              <option value="">All Specialties</option>
              {uniqueSpecialties.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* City selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Select City</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl focus:outline-none text-slate-700"
              id="filter-city"
            >
              <option value="">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Max Fee Threshold Slider */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span className="font-bold text-slate-500 uppercase tracking-wide">Max Consultation Fee</span>
              <span className="font-mono text-blue-600 font-bold">
                {maxFee ? `Rs. ${Number(maxFee).toLocaleString()}` : 'Any Price'}
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="5000"
              step="500"
              value={maxFee || '5000'}
              onChange={(e) => setMaxFee(e.target.value)}
              className="w-full accent-blue-600 cursor-pointer"
              id="filter-fee-range"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Rs. 1,000</span>
              <span>Rs. 5,000</span>
            </div>
          </div>

          {/* Sorting metrics */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Sort Results By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl focus:outline-none text-slate-700"
              id="filter-sort"
            >
              <option value="">DefaultPMC Ranking</option>
              <option value="fee-asc">Fee: Low to High</option>
              <option value="fee-desc">Fee: High to Low</option>
              <option value="exp-desc">Experience: High to Low</option>
            </select>
          </div>

          {/* Verification indicator */}
          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1 font-bold text-blue-800 uppercase">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>PMC Quality Check</span>
            </div>
            <p className="leading-relaxed text-slate-500">All doctors undergo strict academic, licensing, and clinic physical verifies before directory onboarding.</p>
          </div>

        </aside>

        {/* Right Side: Doctor Cards Grid (col-span-9) */}
        <main className="lg:col-span-9 space-y-6">
          {sortedDoctors.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4" id="empty-directory-view">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-350 text-slate-300">
                <RotateCcw className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-slate-700 text-lg">No specialists match search criteria</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Try resetting filters or modifying your name/specialty/city combinations.</p>
              </div>
              <button
                onClick={handleResetFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition active:scale-95 shadow-sm shadow-blue-100"
                id="reset-empty-btn"
              >
                Clear Search & View All
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="doctors-cards-grid">
              {sortedDoctors.map((doc) => (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  onViewProfile={onViewProfile}
                  onRequestAppointment={onRequestAppointment}
                />
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
