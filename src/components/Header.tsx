import React, { useState } from 'react';
import { HeartPulse, Menu, X, Users, BookOpen, Search, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentTab: 'home' | 'directory' | 'admin' | 'doctor-portal';
  setCurrentTab: (tab: 'home' | 'directory' | 'admin' | 'doctor-portal') => void;
  openBookingWithNoDoc: () => void;
}

export default function Header({ currentTab, setCurrentTab, openBookingWithNoDoc }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm" id="header">
      {/* Top emergency & contact banner */}
      <div className="bg-slate-50 text-slate-600 text-[11px] py-2 px-4 flex justify-between items-center font-sans border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="font-semibold tracking-wide uppercase">Connecting Patients across Pakistan • Available 24/7</span>
        </div>
        <div className="flex items-center gap-4 font-semibold text-slate-500">
          <a href="tel:03063462822" className="hover:underline">Helpline: 03063462822</a>
          <span className="hidden sm:inline opacity-30">|</span>
          <span className="hidden sm:inline text-blue-600">Fast Booking via WhatsApp</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            {/* Logo */}
            <div 
              className="flex items-center gap-2.5 cursor-pointer group" 
              onClick={() => { setCurrentTab('home'); setIsOpen(false); }}
              id="logo"
            >
              <div className="bg-blue-600 p-2.5 rounded-xl group-hover:bg-blue-700 transition-all duration-300 shadow-sm shadow-blue-100">
                <HeartPulse className="h-6 w-6 text-white transition-colors" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-1 font-display">
                  Doctor <span className="text-blue-600 font-extrabold">Connect</span>
                </span>
                <span className="block text-[10px] text-slate-400 font-semibold tracking-widest uppercase -mt-1 font-mono">Pakistan</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                currentTab === 'home'
                  ? 'text-blue-600 bg-blue-50/70'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
              }`}
              id="nav-home"
            >
              Home
            </button>
            <button
              onClick={() => setCurrentTab('directory')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                currentTab === 'directory'
                  ? 'text-blue-600 bg-blue-50/70'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
              }`}
              id="nav-directory"
            >
              Find Doctors
            </button>
            <button
              onClick={() => setCurrentTab('doctor-portal')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                currentTab === 'doctor-portal'
                  ? 'text-blue-600 bg-blue-50/70'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
              }`}
              id="nav-doctor-portal"
            >
              <Users className="w-4 h-4" />
              Register as Doctor
            </button>
            <button
              onClick={() => setCurrentTab('admin')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                currentTab === 'admin'
                  ? 'text-blue-600 bg-blue-50/70'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
              }`}
              id="nav-admin"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Portal
            </button>
            
            <span className="h-6 w-[1px] bg-slate-200 mx-2"></span>

            <button
              onClick={openBookingWithNoDoc}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-blue-100 active:scale-95 transition-all duration-150"
              id="nav-book-btn"
            >
              Book Appointment
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-50 border border-slate-100"
              id="mobile-menu-toggle"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white" id="mobile-menu">
          <div className="px-2 pt-3 pb-4 space-y-1.5 sm:px-3">
            <button
              onClick={() => { setCurrentTab('home'); setIsOpen(false); }}
              className={`block w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                currentTab === 'home'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
              }`}
              id="mobile-nav-home"
            >
              Home
            </button>
            <button
              onClick={() => { setCurrentTab('directory'); setIsOpen(false); }}
              className={`block w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                currentTab === 'directory'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
              }`}
              id="mobile-nav-directory"
            >
              Find Doctors
            </button>
            <button
              onClick={() => { setCurrentTab('doctor-portal'); setIsOpen(false); }}
              className={`block w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-colors flex items-center gap-2 ${
                currentTab === 'doctor-portal'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
              }`}
              id="mobile-nav-doctor-portal"
            >
              <Users className="w-5 h-5 text-slate-500" />
              Register as Doctor
            </button>
            <button
              onClick={() => { setCurrentTab('admin'); setIsOpen(false); }}
              className={`block w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-colors flex items-center gap-2 ${
                currentTab === 'admin'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
              }`}
              id="mobile-nav-admin"
            >
              <ShieldCheck className="w-5 h-5 text-slate-500" />
              Admin Portal
            </button>

            <div className="pt-4 px-4">
              <button
                onClick={() => { openBookingWithNoDoc(); setIsOpen(false); }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-xl text-base font-semibold shadow-md active:scale-95 transition-all"
                id="mobile-nav-book-btn"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
