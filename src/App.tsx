import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeView from './views/HomeView';
import DoctorListingView from './views/DoctorListingView';
import AdminView from './views/AdminView';
import DoctorPortalView from './views/DoctorPortalView';

import AppointmentModal from './components/AppointmentModal';
import DoctorDetailModal from './components/DoctorDetailModal';

import { Doctor } from './types';
import { db, seedDatabaseIfEmpty } from './firebase';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { ShieldAlert, RefreshCw, HeartPulse, Send, MessageSquare } from 'lucide-react';

export default function App() {
  // Navigation states
  const [currentTab, setCurrentTab] = useState<'home' | 'directory' | 'admin' | 'doctor-portal'>('home');

  // Search parameters forwarded to Doctor Directory listing view
  const [searchName, setSearchName] = useState('');
  const [searchSpecialty, setSearchSpecialty] = useState('');
  const [searchCity, setSearchCity] = useState('');

  // Loaded doctors cache
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [hospitalApprovals, setHospitalApprovals] = useState<Record<string, 'Approved' | 'Pending'>>({});

  // Modal active states
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [preselectedBookingDoctor, setPreselectedBookingDoctor] = useState<Doctor | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDetailDoctor, setSelectedDetailDoctor] = useState<Doctor | null>(null);

  // Run initial seeding and establish real-time Firestore listeners for doctor directory
  useEffect(() => {
    let unsubscribeDocs = () => {};
    let unsubscribeApprovals = () => {};

    async function initDb() {
      // Seed first if required
      await seedDatabaseIfEmpty();

      // Listen in real-time to the 'doctors' collection
      const doctorsCol = collection(db, 'doctors');
      unsubscribeDocs = onSnapshot(doctorsCol, (snapshot) => {
        const list: Doctor[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Doctor);
        });
        setDoctors(list);
        setLoadingDoctors(false);
      }, (error) => {
        console.error("Firestore loading error:", error);
        setLoadingDoctors(false);
      });

      // Listen in real-time to 'hospital_approvals' collection
      const approvalsCol = collection(db, 'hospital_approvals');
      unsubscribeApprovals = onSnapshot(approvalsCol, (snapshot) => {
        const approvalsMap: Record<string, 'Approved' | 'Pending'> = {};
        snapshot.forEach((docSnap) => {
          approvalsMap[docSnap.id] = docSnap.data().status;
        });
        setHospitalApprovals(approvalsMap);
      }, (error) => {
        console.error("Firestore hospital approvals loading error:", error);
      });
    }

    initDb();

    return () => {
      unsubscribeDocs();
      unsubscribeApprovals();
    };
  }, []);

  // Sync refreshed list manually if needed by admin
  const handleRefreshDoctors = async () => {
    try {
      const doctorsCol = collection(db, 'doctors');
      const snapshot = await getDocs(doctorsCol);
      const list: Doctor[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Doctor);
      });
      setDoctors(list);
    } catch (e) {
      console.error(e);
    }
  };

  // Triggers search action, sets appropriate parameters and switches tab to directory
  const handleSearchTransfer = (nameQuery: string, specialtyQuery: string, cityQuery: string) => {
    setSearchName(nameQuery);
    setSearchSpecialty(specialtyQuery);
    setSearchCity(cityQuery);
    setCurrentTab('directory');
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleSpecialtyFilterTransfer = (specialtyQuery: string) => {
    setSearchName('');
    setSearchSpecialty(specialtyQuery);
    setSearchCity('');
    setCurrentTab('directory');
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleCityFilterTransfer = (cityQuery: string) => {
    setSearchName('');
    setSearchSpecialty('');
    setSearchCity(cityQuery);
    setCurrentTab('directory');
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  // Opens book modal for specific doctor
  const handleOpenAppointmentSpecific = (doctor: Doctor) => {
    setPreselectedBookingDoctor(doctor);
    setIsBookingOpen(true);
  };

  // Opens booking modal from main navbar layout (none selected)
  const handleOpenBookingGeneral = () => {
    setPreselectedBookingDoctor(null);
    setIsBookingOpen(true);
  };

  // Closes booking overlay
  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    setPreselectedBookingDoctor(null);
  };

  // Opens full professional details card view
  const handleOpenProfileDetail = (doctor: Doctor) => {
    setSelectedDetailDoctor(doctor);
    setIsDetailOpen(true);
  };

  const handleCloseProfileDetail = () => {
    setIsDetailOpen(false);
    setSelectedDetailDoctor(null);
  };

  const handleSuccessAppointment = () => {
    // Optional success callback
  };

  // Filter public directory list - real-time Doctor Approval System & Hospital Matrix Authorization
  const publicDoctors = doctors.filter((doc) => {
    // 1. Doctor individual status filter
    const docStatus = doc.status || 'Approved';
    if (docStatus === 'Pending' || docStatus === 'Rejected') {
      return false;
    }

    // 2. Associated clinical facility status check
    const hospitalName = (doc.hospital || doc.clinicName || '').trim();
    if (hospitalName) {
      const hospitalKey = hospitalName.replace(/\//g, '-');
      const hospitalStatus = hospitalApprovals[hospitalKey] || 'Approved';
      if (hospitalStatus === 'Pending') {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between font-sans selection:bg-emerald-100 selection:text-emerald-990" id="doctor-connect-app">
      
      {/* 1. Header widget with current tab selection */}
      <Header 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        openBookingWithNoDoc={handleOpenBookingGeneral} 
      />

      {/* 2. Main content container */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {loadingDoctors ? (
          <div className="flex flex-col items-center justify-center p-24 text-center space-y-4" id="main-global-loader">
            <RefreshCw className="w-10 h-10 animate-spin text-emerald-600" />
            <h3 className="font-extrabold text-slate-705">Loading Doctor Connect Pakistan</h3>
            <p className="text-xs text-slate-400">Verifying secure PMC connection gates...</p>
          </div>
        ) : (
          <div>
            {currentTab === 'home' && (
              <HomeView 
                doctors={publicDoctors}
                onSearch={handleSearchTransfer}
                onSpecialtySelect={handleSpecialtyFilterTransfer}
                onViewProfile={handleOpenProfileDetail}
                onRequestAppointment={handleOpenAppointmentSpecific}
                openBookingWithNoDoc={handleOpenBookingGeneral}
              />
            )}

            {currentTab === 'directory' && (
              <DoctorListingView 
                doctors={publicDoctors}
                initialNameQuery={searchName}
                initialSpecialtyQuery={searchSpecialty}
                initialCityQuery={searchCity}
                onViewProfile={handleOpenProfileDetail}
                onRequestAppointment={handleOpenAppointmentSpecific}
              />
            )}

            {currentTab === 'admin' && (
              <AdminView 
                doctors={doctors}
                refreshDoctors={handleRefreshDoctors}
              />
            )}

            {currentTab === 'doctor-portal' && (
              <DoctorPortalView 
                doctors={doctors}
                refreshDoctors={handleRefreshDoctors}
              />
            )}
          </div>
        )}
      </main>

      {/* 3. Global professional footer wrapper */}
      <Footer 
        setCurrentTab={setCurrentTab} 
        onSpecialtySelect={handleSpecialtyFilterTransfer} 
        onCitySelect={handleCityFilterTransfer} 
      />

      {/* 4. Global generic/specific Appointmentbooking form modal */}
      <AppointmentModal 
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
        doctors={publicDoctors}
        preselectedDoctor={preselectedBookingDoctor}
        onSuccess={handleSuccessAppointment}
      />

      {/* 5. Doctor detailed profile card modal with embedded consult form */}
      {selectedDetailDoctor && (
        <DoctorDetailModal 
          doctor={selectedDetailDoctor}
          isOpen={isDetailOpen}
          onClose={handleCloseProfileDetail}
          onSuccess={handleSuccessAppointment}
        />
      )}

    </div>
  );
}
