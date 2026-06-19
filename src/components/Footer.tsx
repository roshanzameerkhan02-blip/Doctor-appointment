import React from 'react';
import { HeartPulse, Phone, Mail, MapPin, CheckCircle, Flame, ExternalLink } from 'lucide-react';

interface FooterProps {
  setCurrentTab: (tab: 'home' | 'directory' | 'admin' | 'doctor-portal') => void;
  onSpecialtySelect: (specialty: string) => void;
  onCitySelect: (city: string) => void;
}

export default function Footer({ setCurrentTab, onSpecialtySelect, onCitySelect }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const specialties = [
    'Surgeon',
    'Cardiologist',
    'Dermatologist',
    'Dentist',
    'General Physician'
  ];

  const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi'];

  return (
    <footer className="bg-slate-900 text-white mt-16 border-t border-slate-800" id="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1 - Brand info */}
          <div className="space-y-4">
            <span 
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => setCurrentTab('home')}
            >
              <div className="bg-blue-600 p-2 rounded-lg">
                <HeartPulse className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Doctor <span className="text-blue-400">Connect</span>
              </span>
            </span>
            <p className="text-slate-400 text-sm leading-relaxed">
              Pakistan's trusted digital health partner. Connecting you with top-certified medical specialists near your city. Experience reliable care with painless booking.
            </p>
            <div className="pt-2 text-xs text-slate-500">
              Approved by PMC verified healthcare guidelines.
            </div>
          </div>

          {/* Column 2 - Specialties */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase mb-4">Popular Specialties</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              {specialties.map((spec) => (
                <li key={spec}>
                  <button
                    onClick={() => onSpecialtySelect(spec)}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-left focus:outline-none"
                    id={`footer-spec-${spec.toLowerCase()}`}
                  >
                    {spec}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Cities & Browse */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase mb-4">Major Cities</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              {cities.map((city) => (
                <li key={city}>
                  <button
                    onClick={() => onCitySelect(city)}
                    className="hover:text-blue-400 transition-colors cursor-pointer text-left focus:outline-none"
                    id={`footer-city-${city.toLowerCase()}`}
                  >
                    Top Doctors in {city}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Contact details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase mb-4">Contact Info</h3>
            <div className="flex items-start gap-2.5 text-slate-400 text-sm">
              <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <span>Office 45, Blue Area, Islamabad, Capital Territory</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-400 text-sm">
              <Phone className="w-4 h-4 text-blue-500" />
              <a href="tel:03063462822" className="hover:text-blue-400 font-mono">03063462822</a>
            </div>
            <div className="flex items-center gap-2.5 text-slate-400 text-sm font-sans">
              <Mail className="w-4 h-4 text-blue-500" />
              <a href="mailto:roshanzameerkhan02@gmail.com" className="hover:text-blue-400">roshanzameerkhan02@gmail.com</a>
            </div>
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={() => setCurrentTab('doctor-portal')}
                className="inline-flex items-center justify-center gap-1 bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition border border-emerald-700 max-w-[170px]"
                id="footer-doctor-portal-link"
              >
                <span>Register as Doctor</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentTab('admin')}
                className="inline-flex items-center justify-center gap-1 bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-950 hover:border-blue-800 border border-slate-700 transition max-w-[170px]"
                id="footer-admin-link"
              >
                <span>Admin Login Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        <hr className="border-slate-800 my-8" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 text-xs">
          <div>
            &copy; {currentYear} Doctor Connect Pakistan. All rights reserved. Registered PMC Healthcare Organization.
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:underline">Terms of Service</a>
            <span>•</span>
            <a href="#" className="hover:underline">PMC Verification</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
