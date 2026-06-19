import React from 'react';
import { Award, Clock, MapPin, ArrowUpRight, PhoneCall, Heart } from 'lucide-react';
import { Doctor, getDoctorAvatar } from '../types';

interface DoctorCardProps {
  doctor: Doctor;
  onViewProfile: (doctor: Doctor) => void;
  onRequestAppointment: (doctor: Doctor) => void;
  key?: string;
}

export default function DoctorCard({ doctor, onViewProfile, onRequestAppointment }: DoctorCardProps) {
  // Safe image placeholder fallback
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "/src/assets/images/doc_avatar_m1_1781893187039.jpg";
  };

  return (
    <div 
      className="bg-white rounded-3xl border border-slate-200 hover:border-blue-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden"
      id={`doctor-card-${doctor.id}`}
    >
      {/* Upper info with Badge overlay */}
      <div className="relative">
        <img 
          src={getDoctorAvatar(doctor)}
          alt={doctor.name}
          className="w-full h-56 object-cover object-top"
          onError={handleImageError}
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end">
          <span className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
            {doctor.specialty}
          </span>
          {doctor.featured && (
            <span className="bg-amber-500 text-slate-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
              ★ PMC Top Rated
            </span>
          )}
        </div>
        
        {/* City tag overlay */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 border border-slate-100 shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span>{doctor.city}</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Doctor Name & Qualifications */}
          <div className="mb-2">
            <h3 className="text-lg font-bold text-slate-805 leading-snug group-hover:text-blue-600 transition-colors font-display">
              {doctor.name}
            </h3>
            <p className="text-xs text-blue-600 font-medium truncate mt-0.5" title={doctor.qualification}>
              {doctor.qualification}
            </p>
          </div>

          {/* Quick stats badges */}
          <div className="flex gap-2.5 my-3.5 text-xs text-slate-500">
            <div className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg flex items-center gap-1 flex-1 justify-center">
              <Award className="w-4 h-4 text-blue-600 shrink-0" />
              <span><strong>{doctor.experience}Y</strong> Exp</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg flex items-center gap-1 flex-1 justify-center">
              <span className="text-blue-600 font-extrabold text-xs">Rs.</span>
              <span><strong>{doctor.fee.toLocaleString()}</strong> Fee</span>
            </div>
          </div>

          {/* Clinic & Timings metadata */}
          <div className="space-y-2 text-sm text-slate-600 border-t border-slate-50 pt-3">
            <div className="flex items-start gap-2">
              <span className="text-[11px] tracking-wide font-bold uppercase text-slate-400 mt-0.5 shrink-0 w-11">Clinic:</span>
              <span className="font-semibold text-xs text-slate-700 line-clamp-1">{doctor.clinicName}</span>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-500 line-clamp-1">{doctor.timing}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Action Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
          <button
            onClick={() => onViewProfile(doctor)}
            className="flex-1 border border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 text-slate-700 hover:text-blue-600 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 active:scale-95"
            id={`view-profile-btn-${doctor.id}`}
          >
            <span>View Profile</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => onRequestAppointment(doctor)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-2 rounded-xl text-xs font-bold shadow-sm shadow-blue-100 transition-all duration-250 flex items-center justify-center gap-1 active:scale-95"
            id={`book-appointment-btn-${doctor.id}`}
          >
            <span>Book Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
