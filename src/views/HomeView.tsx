import React, { useState } from 'react';
import { Search, MapPin, UserCheck, Award, ThumbsUp, Calendar, ArrowRight, ShieldCheck, Sparkles, HeartPulse } from 'lucide-react';
import { Doctor } from '../types';
import DoctorCard from '../components/DoctorCard';

interface HomeViewProps {
  doctors: Doctor[];
  onSearch: (nameQuery: string, specialtyQuery: string, cityQuery: string) => void;
  onSpecialtySelect: (specialty: string) => void;
  onViewProfile: (doctor: Doctor) => void;
  onRequestAppointment: (doctor: Doctor) => void;
  openBookingWithNoDoc: () => void;
}

export default function HomeView({
  doctors,
  onSearch,
  onSpecialtySelect,
  onViewProfile,
  onRequestAppointment,
  openBookingWithNoDoc
}: HomeViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');

  const popularSpecialties = [
    { name: 'Surgeon', icon: '🩺', description: 'General & laparoscopic care' },
    { name: 'Cardiologist', icon: '❤️', description: 'Hear health and blood flow' },
    { name: 'Dermatologist', icon: '✨', description: 'Skin, cosmetology & laser' },
    { name: 'Dentist', icon: '🦷', description: 'Orthodontics & dental wellness' },
    { name: 'General Physician', icon: '👨‍⚕️', description: 'Routine medical treatments' }
  ];

  const approvedDoctors = doctors.filter(doc => doc.status === 'Approved' || doc.status === undefined);
  const featuredDoctors = approvedDoctors.filter(doc => doc.featured).slice(0, 3);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm, specialty, city);
  };

  return (
    <div className="space-y-16" id="home-view">
      {/* 1. Hero Section with Pakistan Medical theme (Clean Minimalism) */}
      <section className="relative bg-white border border-slate-200 rounded-3xl py-12 px-6 sm:px-12 overflow-hidden shadow-sm" id="hero-section">
        {/* Decorative subtle Grid Patterns */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>
        
        {/* Ambient colored glowing orbs */}
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-blue-300/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/12 w-64 h-64 bg-slate-100 rounded-full blur-3xl"></div>
 
        <div className="relative max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider font-sans shadow-none">
              <Sparkles className="w-4 h-4 text-blue-500 animate-spin" style={{ animationDuration: '6s' }} />
              <span>PMC Verified Specialist Directory</span>
            </span>
            
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12] font-display">
              Find Certified Doctors <br />
              & <span className="text-blue-600">Book Instant Slots</span>
            </h1>
            
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
              Skip clinic queues. Search top medical experts in Mianwali, Islamabad, Rawalpindi, and get treated under safe, PMC accredited consultation clinics.
            </p>
 
            <div className="flex flex-col sm:flex-row items-center gap-3.5 justify-center lg:justify-start">
              <button
                onClick={openBookingWithNoDoc}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-3.5 rounded-2xl shadow-sm shadow-blue-200 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                id="hero-book-btn"
              >
                <span>Book Appointment Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>100% Free Consultation Search</span>
              </div>
            </div>
 
            {/* Micro Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 max-w-md mx-auto lg:mx-0 text-center sm:text-left">
              <div>
                <span className="block text-2xl font-extrabold text-slate-900">50+</span>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Accredited Doctors</span>
              </div>
              <div>
                <span className="block text-2xl font-extrabold text-slate-900">20K+</span>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Monthly Consults</span>
              </div>
              <div>
                <span className="block text-2xl font-extrabold text-slate-900">99%</span>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Patient Happiness</span>
              </div>
            </div>
          </div>
 
          {/* Hero Right Graphic */}
          <div className="lg:col-span-5 hidden lg:flex justify-center relative">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-blue-500 to-blue-200 opacity-20 blur-lg"></div>
              <img 
                src="/src/assets/images/medical_hero_illust_1781893445908.jpg"
                alt="Healthcare Consultation Pakistan" 
                className="w-80 h-96 object-cover object-center rounded-2xl border border-slate-200 shadow-md relative"
                referrerPolicy="no-referrer"
              />
              {/* Trust Badge Card Overlay */}
              <div className="absolute -bottom-6 -left-6 bg-white border border-slate-200 p-4 rounded-xl shadow-lg flex items-center gap-3 max-w-xs">
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">24-Hour Doctor Desk</h4>
                  <p className="text-[10px] text-slate-500">Certified online clinical desk ready</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
 
      {/* 2. Interactive Find Doctor Search Bar */}
      <section className="-mt-20 relative z-30" id="search-section">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg border border-slate-200 p-5 sm:p-7">
          <form onSubmit={handleSearchSubmit} className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
            
            <div className="flex-1 space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Doctor Name / Keyword</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search 'Ali', 'Zainab'..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl focus:ring-0 focus:outline-none text-slate-900"
                  id="search-input-name"
                />
              </div>
            </div>

            <div className="w-full sm:w-56 space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Specialty</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl focus:ring-0 focus:outline-none text-slate-700"
                id="search-input-spec"
              >
                <option value="">All Specialties</option>
                <option value="Surgeon">Surgeon</option>
                <option value="Cardiologist">Cardiologist</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Dentist">Dentist</option>
                <option value="General Physician">General Physician</option>
              </select>
            </div>
 
            <div className="w-full sm:w-48 space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Select City</label>
              <input
                type="text"
                placeholder="Lahore / Karachi..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl focus:ring-0 focus:outline-none text-slate-900"
                id="search-input-city"
              />
            </div>
 
            <div className="pt-5 sm:pt-4">
              <button
                type="submit"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-sm shadow-blue-100 flex items-center justify-center gap-1.5 active:scale-95 transition"
                id="directory-search-submit-btn"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
 
          </form>
        </div>
      </section>
 
      {/* 3. Popular Specialties Grid */}
      <section className="space-y-6" id="specialties-section">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight font-display">Popular Specialties</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">Explore clinical care with medical experts from top Pakistani healthcare facilities.</p>
        </div>
 
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {popularSpecialties.map((spec) => (
            <div
              key={spec.name}
              onClick={() => onSpecialtySelect(spec.name)}
              className="bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-200 p-5 rounded-2xl shadow-sm text-center cursor-pointer transition-all hover:scale-102 group"
              id={`popular-spec-card-${spec.name.toLowerCase()}`}
            >
              <span className="text-3xl block mb-3 group-hover:scale-110 transition">{spec.icon}</span>
              <h3 className="font-extrabold text-sm text-slate-800 group-hover:text-blue-600 transition-colors font-display">{spec.name}</h3>
              <p className="text-[10px] text-slate-400 mt-1">{spec.description}</p>
            </div>
          ))}
        </div>
      </section>
 
      {/* 4. Featured Doctors (PMC verified top doctors) */}
      <section className="space-y-6" id="featured-doctors-section">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-1.5 justify-center sm:justify-start font-display">
              <span>PMC Top-Rated Experts</span>
              <span className="bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Staff Picks</span>
            </h2>
            <p className="text-sm text-slate-500">Highly qualified general & specialized consultants available this week.</p>
          </div>
          
          <button
            onClick={() => onSearch('', '', '')}
            className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-4.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95 border border-blue-100"
            id="view-all-docs-btn"
          >
            <span>Browse All Doctors</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
 
        {featuredDoctors.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-400 text-sm border border-slate-200">
            No featured doctors listed currently. Check back later or use general search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDoctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                onViewProfile={onViewProfile}
                onRequestAppointment={onRequestAppointment}
              />
            ))}
          </div>
        )}
      </section>
 
      {/* 5. Trust Accents banner */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center sm:text-left">
        <div className="flex gap-4 items-center">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl mx-auto sm:mx-0 shrink-0 border border-blue-100/60">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-800">Verified Practitioners</h4>
            <p className="text-xs text-slate-400 mt-0.5">Every clinic file is strictly mapped with PMC registration registry.</p>
          </div>
        </div>
 
        <div className="flex gap-4 items-center">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl mx-auto sm:mx-0 shrink-0 border border-blue-100/60">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-800">Modern Digital Booking</h4>
            <p className="text-xs text-slate-400 mt-0.5">Automated request updates via client dashboard & direct WhatsApp desk.</p>
          </div>
        </div>
 
        <div className="flex gap-4 items-center">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl mx-auto sm:mx-0 shrink-0 border border-blue-100/60">
            <ThumbsUp className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-800">Pakistan's Health Partner</h4>
            <p className="text-xs text-slate-400 mt-0.5">Helping patients reach reliable healthcare specialists across 10+ cities.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
