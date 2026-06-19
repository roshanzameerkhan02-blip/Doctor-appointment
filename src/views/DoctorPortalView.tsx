import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc } from 'firebase/firestore';
import { Doctor, Appointment, getDoctorAvatar } from '../types';
import { 
  User, Mail, Phone, Lock, Calendar, Clock, MapPin, Award, 
  Settings, CheckCircle, RefreshCw, LogOut, Edit3, Save, 
  MessageSquare, Users, DollarSign, Activity, ChevronRight 
} from 'lucide-react';

interface DoctorPortalViewProps {
  doctors: Doctor[];
  refreshDoctors: () => Promise<void>;
}

const PRESET_AVATARS = [
  { name: 'Professional Male Cartoon 1', url: '/src/assets/images/doc_avatar_m1_1781893187039.jpg' },
  { name: 'Professional Female Cartoon 1', url: '/src/assets/images/doc_avatar_f1_1781893207396.jpg' },
  { name: 'Professional Male Cartoon 2', url: '/src/assets/images/doc_avatar_m2_1781893228161.jpg' },
  { name: 'Professional Female Cartoon 2', url: '/src/assets/images/doc_avatar_f2_1781893248533.jpg' }
];

export default function DoctorPortalView({ doctors, refreshDoctors }: DoctorPortalViewProps) {
  // Navigation: 'login' | 'register' | 'registered-success' | 'dashboard'
  const [portalMode, setPortalMode] = useState<'login' | 'register' | 'registered-success'>('login');
  
  // Logged-in state
  const [currentUser, setCurrentUser] = useState<Doctor | null>(null);

  // Form errors / success status messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regWhatsApp, setRegWhatsApp] = useState('');
  const [regSpecialty, setRegSpecialty] = useState('General Physician');
  const [regQualification, setRegQualification] = useState('');
  const [regExperience, setRegExperience] = useState('');
  const [regHospital, setRegHospital] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('Mianwali');
  const [regFee, setRegFee] = useState('');
  const [regAvailableDays, setRegAvailableDays] = useState('Mon - Fri');
  const [regTiming, setRegTiming] = useState('09:00 AM - 05:00 PM');
  const [regAbout, setRegAbout] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regImageUrl, setRegImageUrl] = useState(PRESET_AVATARS[0].url);
  const [regPmdcNumber, setRegPmdcNumber] = useState('');

  // Doctor Forgot Password States
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1); // 1: Enter email, 2: Enter code, 3: Enter new password
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Dashboard state & collections
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [activeAppFilter, setActiveAppFilter] = useState<'all' | 'Pending' | 'Contacted' | 'Sent to Doctor' | 'Completed'>('all');
  
  // Selected Patient Details Modal state
  const [selectedPatientApp, setSelectedPatientApp] = useState<Appointment | null>(null);
  
  // Edit Profile mode within Dashboard
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFee, setEditFee] = useState('');
  const [editTiming, setEditTiming] = useState('');
  const [editHospital, setEditHospital] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editQualification, setEditQualification] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [editAbout, setEditAbout] = useState('');

  // Auto-refresh appointments listen and update state
  useEffect(() => {
    if (!currentUser) {
      setAppointments([]);
      setLoadingApps(false);
      return;
    }

    setLoadingApps(true);
    // Listen to ALL appointments and filter client-side to bypass composite indexing requirement
    const appCol = collection(db, 'appointments');
    const unsubscribe = onSnapshot(appCol, (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.doctorId === currentUser.id) {
          list.push({ id: docSnap.id, ...data } as Appointment);
        }
      });
      // Sort appointments by date descending or creation time
      list.sort((a,b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      setAppointments(list);
      setLoadingApps(false);
    }, (error) => {
      console.error("Firestore appointments listener failed:", error);
      setLoadingApps(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Handle Login submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Please specify both Email Address and Password to login.');
      return;
    }

    // Find doctor with matching email and password
    const docMatch = doctors.find(
      (d) => 
        (d.email && d.email.trim().toLowerCase() === loginEmail.trim().toLowerCase()) && 
        (d.password && d.password === loginPassword.trim())
    );

    if (!docMatch) {
      setErrorMsg('Invalid credentials. Double check the registration email or password.');
      return;
    }

    // Check doctor status - must be Approved to log in
    if (docMatch.status === 'Pending') {
      setErrorMsg('Your registration request is currently "Pending Approval" by PMC gatekeepers. Please log in once approved.');
      return;
    }

    if (docMatch.status === 'Rejected') {
      setErrorMsg('Your registration request has been "Rejected" by PMC verification. Please contact support.');
      return;
    }

    // Successfully log in
    setCurrentUser(docMatch);
    setEditFee(docMatch.fee.toString());
    setEditTiming(docMatch.timing || docMatch.availability || '09:00 AM - 05:00 PM');
    setEditHospital(docMatch.hospital || docMatch.clinicName || '');
    setEditAddress(docMatch.clinicAddress || '');
    setEditCity(docMatch.city || 'Mianwali');
    setEditQualification(docMatch.qualification || '');
    setEditExperience(docMatch.experience.toString());
    setEditAbout(docMatch.about || '');
    setSuccessMsg(`Welcome back, Dr. ${docMatch.name}!`);
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    setLoginPassword('');
    setLoginEmail('');
    setIsEditingProfile(false);
  };

  // Handle Doctor password recovery submissions
  const handleDoctorResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (resetStep === 1) {
      if (!resetEmail.trim()) {
        setErrorMsg('Please specify medical account email.');
        return;
      }
      // Check if email exists on any doctor (both approved or pending/rejected)
      const targetDoc = doctors.find(d => d.email && d.email.trim().toLowerCase() === resetEmail.trim().toLowerCase());
      if (!targetDoc) {
        setErrorMsg('No doctor account located under this email address.');
        return;
      }

      try {
        // Generate a 6-digit random code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);

        // Queue automated email via "appointment_emails"
        const emailsCol = collection(db, 'appointment_emails');
        await addDoc(emailsCol, {
          to: resetEmail.trim().toLowerCase(),
          subject: '[Doctor Connect] Practitioner Account Verification Code',
          body: `Dear Dr. ${targetDoc.name},\n\nYou have requested to recover your Doctor Portal access credentials.\n\n` +
                `Your 6-digit recovery verification code is: ${code}\n\n` +
                `Please input this verification code inside the app to securely update your portal access key.\n\n` +
                `Regards,\nDoctor Connect Pakistan Practitioner Administration`,
          createdAt: new Date().toISOString(),
          type: 'doctor_reset_notification'
        });

        setResetStep(2);
        setSuccessMsg(`Verification code successfully sent via email to ${resetEmail.trim().toLowerCase()}! Please check your inbox.`);
      } catch (err) {
        console.error("Error sending reset email:", err);
        setErrorMsg('Failed to dispatch recovery code to email. Database write error.');
      }
    } else if (resetStep === 2) {
      if (enteredCode.trim() === generatedCode && generatedCode !== '') {
        setResetStep(3);
        setSuccessMsg('Email verification code matches successfully! Please specify your new strong password.');
      } else {
        setErrorMsg('Verification code mismatch. Please review the code and try again.');
      }
    } else if (resetStep === 3) {
      if (!newPassword.trim() || newPassword.trim().length < 6) {
        setErrorMsg('Password must consist of at least 6 characters.');
        return;
      }

      try {
        const targetDoc = doctors.find(d => d.email && d.email.trim().toLowerCase() === resetEmail.trim().toLowerCase());
        if (!targetDoc) {
          setErrorMsg('An unexpected error occurred. Doctor account not found.');
          return;
        }

        const docRef = doc(db, 'doctors', targetDoc.id);
        await updateDoc(docRef, { password: newPassword.trim() });

        setSuccessMsg('Your account portal password has been updated successfully! You can now log in using your new password.');
        setShowForgotPwd(false);
        setResetStep(1);
        setLoginPassword('');
        setLoginEmail(resetEmail.trim());
        setPortalMode('login');
        await refreshDoctors(); // reload directory
      } catch (err) {
        console.error("Error updating doctor password:", err);
        setErrorMsg('Failed to write new password to database.');
      }
    }
  };

  // Handle Registration submission
  const handleRegisterInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    // Form validation
    if (!regName.trim() || !regEmail.trim() || !regMobile.trim() || !regWhatsApp.trim() || !regPassword.trim() || !regQualification.trim() || !regExperience.trim() || !regHospital.trim() || !regAddress.trim() || !regFee.trim() || !regPmdcNumber.trim()) {
      setErrorMsg('All fields marked on the form (including PMDC Number) are strictly required.');
      setIsSubmitting(false);
      return;
    }

    // Check duplicate PMDC Number
    const pmdcDuplicate = doctors.find(d => d.pmdcNumber && d.pmdcNumber.trim() === regPmdcNumber.trim());
    if (pmdcDuplicate) {
      setErrorMsg('A practitioner has already registered with this PMDC License Number. Please verify yours or contact administrative gateways.');
      setIsSubmitting(false);
      return;
    }

    // Check duplicate email
    const duplicate = doctors.find(d => d.email && d.email.trim().toLowerCase() === regEmail.trim().toLowerCase());
    if (duplicate) {
      setErrorMsg('A doctor has already registered with this email address. Please use another.');
      setIsSubmitting(false);
      return;
    }

    try {
      const docCol = collection(db, 'doctors');
      const newDocId = `registered-${Date.now()}`;
      
      const newDoctorData: Omit<Doctor, 'id'> = {
        name: regName.trim(),
        imageUrl: regImageUrl,
        email: regEmail.trim().toLowerCase(),
        contact: regMobile.trim(),
        contactNumber: regMobile.trim(),
        whatsAppNumber: regWhatsApp.trim(),
        specialty: regSpecialty,
        qualification: regQualification.trim(),
        experience: Number(regExperience),
        clinicName: regHospital.trim(),
        clinicAddress: regAddress.trim(),
        hospital: regHospital.trim(),
        clinic: regHospital.trim(),
        city: regCity,
        fee: Number(regFee),
        availableDays: regAvailableDays,
        timing: regTiming.trim(),
        availability: regTiming.trim(),
        about: regAbout.trim(),
        password: regPassword.trim(),
        pmdcNumber: regPmdcNumber.trim(),
        status: 'Pending', // Sent to Admin Approval
        featured: false,
        services: regSpecialty.split(',').map(s => s.trim()),
        rating: 5.0,
        reviews: 0
      };

      // Add document to doctors collection
      await addDoc(docCol, newDoctorData);
      
      // Trigger directory reload
      await refreshDoctors();

      // Show success screen
      setPortalMode('registered-success');
    } catch (err: any) {
      console.error("Error creating doctor profile in firebase:", err);
      setErrorMsg('Failed to create account. Cloud DB write permissions error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update profile details from dashboard
  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      // Reference directly
      const docRef = doc(db, 'doctors', currentUser.id);
      
      const updatedData = {
        fee: Number(editFee),
        timing: editTiming,
        availability: editTiming,
        clinicName: editHospital,
        hospital: editHospital,
        clinic: editHospital,
        clinicAddress: editAddress,
        city: editCity,
        qualification: editQualification,
        experience: Number(editExperience),
        about: editAbout,
      };

      await updateDoc(docRef, updatedData);

      // Mutate local state
      const updatedUserCopy = {
        ...currentUser,
        ...updatedData
      };
      setCurrentUser(updatedUserCopy);
      
      // Trigger directory reload
      await refreshDoctors();

      setSuccessMsg('Your specialist details have been synchronized live with the directory successfully.');
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setErrorMsg('Could not write updates. Verify firestore network settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change Appointment Status inside Dashboard
  const handleUpdateAppStatus = async (appId: string, newStatus: Appointment['status']) => {
    try {
      const appRef = doc(db, 'appointments', appId);
      await updateDoc(appRef, { status: newStatus });
      setSuccessMsg('Appointment check-in status updated successfully.');
      if (selectedPatientApp && selectedPatientApp.id === appId) {
        setSelectedPatientApp({
          ...selectedPatientApp,
          status: newStatus
        });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to update check-in status.');
    }
  };

  // Stats calculation
  const totalAppointments = appointments.length;
  const pendingAppointments = appointments.filter(a => a.status === 'Pending').length;
  const completedAppointments = appointments.filter(a => a.status === 'Completed').length;

  const filteredAppointments = appointments.filter((app) => {
    if (activeAppFilter === 'all') return true;
    return app.status === activeAppFilter;
  });

  // Render Logged In Dashboard
  if (currentUser) {
    return (
      <div className="bg-slate-50 min-h-screen" id="doctor-dashboard-container">
        {/* Top welcome section */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0 flex items-center gap-4">
                <img 
                  src={getDoctorAvatar(currentUser)}
                  alt={currentUser.name} 
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-100 ring-4 ring-emerald-50 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.src = "/src/assets/images/doc_avatar_m1_1781893187039.jpg";
                  }}
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                      Dr. {currentUser.name}
                    </h2>
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      PMC Active
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
                    {currentUser.specialty} • {currentUser.qualification}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="inline-flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition"
                  id="dashboard-toggle-edit-profile-btn"
                >
                  {isEditingProfile ? 'Cancel Editing' : 'Update Profile Details'}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center px-4 py-2.5 border border-red-200 rounded-xl shadow-sm text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition"
                  id="dashboard-logout-btn"
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status notification panel */}
        {successMsg && (
          <div className="bg-emerald-50 border-b border-emerald-100 text-emerald-800 px-4 py-3.5 text-xs font-semibold text-center uppercase tracking-wide flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-100 text-rose-800 px-4 py-3.5 text-xs font-bold text-center uppercase tracking-wide">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {isEditingProfile ? (
            /* --- EDIT PROFILE VIEW --- */
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-4xl mx-auto shadow-md">
              <div className="mb-6 flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Edit Practitioner Registry details</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Customize consultation pricing, timings, and onsite city details instantly.</p>
                </div>
                <Award className="w-8 h-8 text-emerald-600 opacity-20" />
              </div>

              <form onSubmit={handleProfileUpdateSubmit} className="space-y-6" id="edit-doctor-profile-form">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Consultation Fee (PKR) *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400 text-sm font-extrabold">Rs.</span>
                      <input
                        type="number"
                        required
                        value={editFee}
                        onChange={(e) => setEditFee(e.target.value)}
                        className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold"
                        id="edit-field-fee"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Available Daily Timings *</label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 05:00 PM - 09:00 PM (Mon - Sat)"
                        value={editTiming}
                        onChange={(e) => setEditTiming(e.target.value)}
                        className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm"
                        id="edit-field-timing"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hospital / Clinic *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={editHospital}
                        onChange={(e) => setEditHospital(e.target.value)}
                        className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm"
                        id="edit-field-hospital"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Onsite Clinic Address *</label>
                    <input
                      type="text"
                      required
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm"
                      id="edit-field-address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">City Location *</label>
                    <select
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm bg-white"
                      id="edit-field-city"
                    >
                      <option value="Karachi">Karachi</option>
                      <option value="Lahore">Lahore</option>
                      <option value="Islamabad">Islamabad</option>
                      <option value="Multan">Multan</option>
                      <option value="Faisalabad">Faisalabad</option>
                      <option value="Rawalpindi">Rawalpindi</option>
                      <option value="Peshawar">Peshawar</option>
                      <option value="Quetta">Quetta</option>
                      <option value="Sargodha">Sargodha</option>
                      <option value="Mianwali">Mianwali</option>
                      <option value="Bhakkar">Bhakkar</option>
                      <option value="Layyah">Layyah</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Qualifications *</label>
                    <input
                      type="text"
                      required
                      value={editQualification}
                      onChange={(e) => setEditQualification(e.target.value)}
                      className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm"
                      id="edit-field-qualification"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Years of Experience *</label>
                    <input
                      type="number"
                      required
                      value={editExperience}
                      onChange={(e) => setEditExperience(e.target.value)}
                      className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm"
                      id="edit-field-experience"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">About Professional Biography</label>
                  <textarea
                    rows={4}
                    placeholder="Provide professional expertise details e.g. specialist surgeon reviews, daily clinic focus etc."
                    value={editAbout}
                    onChange={(e) => setEditAbout(e.target.value)}
                    className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm"
                    id="edit-field-about"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition text-xs uppercase tracking-wider"
                    id="edit-btn-cancel"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow-md transition text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                    id="edit-btn-save"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Saving to PMC...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Apply Live Profile Updates
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* --- DASHBOARD STATISTICS & MEETING REQUESTS --- */
            <div className="space-y-8">
              {/* Stats overview boxes */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3" id="dashboard-statistics">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Patients Filed</span>
                    <span className="text-2xl font-extrabold text-slate-800">{totalAppointments}</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                    <Activity className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending Check-Ins</span>
                    <span className="text-2xl font-extrabold text-amber-600">{pendingAppointments}</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Consultancy Fee</span>
                    <span className="text-xl font-extrabold text-emerald-700">Rs. {currentUser.fee.toLocaleString()}</span>
                    <span className="text-[9px] text-slate-400 block -mt-0.5">Per offline session visit</span>
                  </div>
                </div>
              </div>

              {/* Main Table/Grid of patient reservation appointments */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                {/* Table Header Filter */}
                <div className="p-6 border-b border-slate-100 sm:flex sm:items-center sm:justify-between bg-slate-50/50">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Patient Appointments & Booking Sheets</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Review patient complaints, mobile number, and status records in real-time.</p>
                  </div>

                  <div className="mt-4 sm:mt-0 flex gap-1 bg-white border border-slate-200 p-1 rounded-xl">
                    {(['all', 'Pending', 'Contacted', 'Completed'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setActiveAppFilter(filter)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                          activeAppFilter === filter 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                        }`}
                        id={`filter-tab-${filter}`}
                      >
                        {filter === 'all' ? 'All Books' : filter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table list */}
                {loadingApps ? (
                  <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                    <span>Loading patient records...</span>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <p className="font-bold">No appointment sheets match this criteria.</p>
                    <p className="text-xs mt-1 text-slate-400">Patient reservations will appear automatically as they book on your profile.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-sm h-px">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">
                        <tr>
                          <th className="px-6 py-4">Patient details</th>
                          <th className="px-6 py-4">Preferred consult date</th>
                          <th className="px-6 py-4">Diagnostic concern</th>
                          <th className="px-6 py-4">Register status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                        {filteredAppointments.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-6 py-4">
                              <span className="block font-bold text-slate-800">{app.patientName}</span>
                              <span className="text-xs text-slate-400 block mt-0.5">
                                {app.gender} • {app.age} Yrs • {app.city}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-emerald-800">{app.date}</span>
                            </td>
                            <td className="px-6 py-4 truncate max-w-xs block py-5">
                              {app.message || <span className="italic text-slate-350">General Consultation Visit</span>}
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={app.status}
                                onChange={(e) => handleUpdateAppStatus(app.id, e.target.value as Appointment['status'])}
                                className={`text-[11px] font-bold px-2 py-1.5 rounded-lg border-0 cursor-pointer shadow-sm focus:ring-0 ${
                                  app.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                                  app.status === 'Contacted' ? 'bg-blue-100 text-blue-800' :
                                  app.status === 'Sent to Doctor' ? 'bg-indigo-100 text-indigo-800' :
                                  'bg-emerald-100 text-emerald-800'
                                }`}
                                id={`doctor-app-status-${app.id}`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Sent to Doctor">Sent to Doctor</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setSelectedPatientApp(app)}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-xl transition"
                                id={`view-patient-detail-${app.id}`}
                              >
                                View patient details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected Patient details modal */}
        {selectedPatientApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" id="patient-details-dialog">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                <div>
                  <h4 className="text-base font-bold text-slate-800">Patient Consultation File</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Reference Reservation ID: {selectedPatientApp.id}</p>
                </div>
                <button
                  onClick={() => setSelectedPatientApp(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-xl text-xs transition font-semibold"
                >
                  Close
                </button>
              </div>

              <div className="p-6 space-y-5 text-sm text-slate-700">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Full Patient Name</span>
                  <p className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-2">{selectedPatientApp.patientName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mobile Number</span>
                    <p className="font-semibold text-slate-700">{selectedPatientApp.mobileNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">City / Origin</span>
                    <p className="font-semibold text-slate-700">{selectedPatientApp.city}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Age (Years)</span>
                    <p className="font-semibold text-slate-700">{selectedPatientApp.age} Years Old</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gender</span>
                    <p className="font-semibold text-slate-700">{selectedPatientApp.gender}</p>
                  </div>
                </div>

                <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Clinical Complaints & Concerns</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans italic whitespace-pre-wrap">
                    "{selectedPatientApp.message || 'General consultant routing'}"
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Modify Session Check-In Status</span>
                  <div className="flex gap-2">
                    {(['Pending', 'Contacted', 'Completed'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateAppStatus(selectedPatientApp.id, st)}
                        className={`text-xs font-bold py-1.8 px-3 rounded-xl border flex-1 transition-all ${
                          selectedPatientApp.status === st 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                        id={`patient-modal-status-${st}`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Patient-to-Doctor Chat via WhatsApp */}
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${selectedPatientApp.mobileNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 uppercase tracking-wide"
                  >
                    <MessageSquare className="w-4 h-4 fill-white" />
                    Open Chat with Patient
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Portal Authentication (Login & Profile Creation Form View)
  return (
    <div className="max-w-4xl mx-auto py-8 px-4" id="doctor-portal-auth-view">
      <div className="text-center mb-8 space-y-3">
        <span className="bg-blue-105 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Professional Medical Network
        </span>
        <h2 className="text-3xl font-extrabold text-slate-800">
          Pakistan Specialist Practitioner Portal
        </h2>
        <p className="text-xs text-slate-550 leading-relaxed max-w-lg mx-auto">
          Register your clinic details or log in to manage active patient files, consult fees, on-duty hours, and verified certifications.
        </p>

        {/* Switcher Navigation Tabs */}
        <div className="flex justify-center pt-4">
          <div className="bg-slate-150 bg-slate-200/60 border border-slate-200/50 p-1 rounded-2xl flex gap-1">
            <button
              onClick={() => { setPortalMode('login'); setErrorMsg(''); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                portalMode === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-blue-600'
              }`}
              id="switch-to-login"
            >
              Sign In to Dashboard
            </button>
            <button
              onClick={() => { setPortalMode('register'); setErrorMsg(''); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                portalMode === 'register' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-blue-600'
              }`}
              id="switch-to-register"
            >
              Register as Doctor
            </button>
          </div>
        </div>
      </div>

      {/* Message Notifications */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl text-xs font-bold leading-normal mb-6" id="auth-error-banner">
          ⚠️ {errorMsg}
        </div>
      )}

      {portalMode === 'registered-success' && (
        <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center space-y-6 shadow-md max-w-xl mx-auto" id="registration-success-banner">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-800">Specialist account filed successfully!</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Thank you, <strong className="text-slate-800">Dr. {regName}</strong>. Your clinical request credentials have been logged in the secure PMC routing registry.
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 text-xs text-left text-slate-605 space-y-1.5 max-w-sm mx-auto border border-slate-100">
            <div>• Registry Name: <strong className="text-slate-705">Dr. {regName}</strong></div>
            <div>• Registered Specialty: <strong className="text-slate-705">{regSpecialty}</strong></div>
            <div>• Validation Gate: <span className="text-amber-600 font-bold">Pending Admin Approval</span></div>
          </div>
          <p className="text-[10px] text-slate-400 italic">
            Once authorized by our medical board panel, your certified profile will auto-publish dynamically inside the hospital directory list.
          </p>
          <button
            onClick={() => { setPortalMode('login'); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md active:scale-95 transition tracking-wide uppercase"
            id="success-go-to-login"
          >
            Acknowledge & Sign In
          </button>
        </div>
      )}

      {portalMode === 'login' && (
        <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-md max-w-md mx-auto" id="login-form-container">
          {!showForgotPwd ? (
            /* --- DOCTOR PORTAL LOGIN FORM --- */
            <div>
              <div className="mb-6 flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Sign In to Practitioner Workspace</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Enter registered physician credentials to load dashboard.</p>
                </div>
                <Lock className="w-5 h-5 text-blue-600" />
              </div>

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl text-xs font-sans leading-relaxed mb-4">
                  ✓ {successMsg}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4" id="doctor-signin-form">
                <div>
                  <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 pl-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. yourname@doctorconnect.pk"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm"
                      id="login-field-email"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5 pl-1">
                    <label className="block text-xs font-bold text-slate-550 uppercase">Password *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPwd(true);
                        setResetStep(1);
                        setResetEmail(loginEmail);
                        setEnteredCode('');
                        setNewPassword('');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-bold transition focus:outline-none"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm"
                      id="login-field-password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs shadow-md active:scale-95 transition uppercase tracking-wide flex items-center justify-center gap-1.5"
                  id="login-submit-btn"
                >
                  Sign In to Patient Hub
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            /* --- DOCTOR PORTAL FORGOT PASSWORD --- */
            <div>
              <div className="mb-6 flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Practitioner Password Recovery</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Secure automated Verification gateway</p>
                </div>
                <Lock className="w-5 h-5 text-indigo-600 animate-pulse" />
              </div>

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl text-xs font-sans leading-relaxed mb-4">
                  ✓ {successMsg}
                </div>
              )}

              <form onSubmit={handleDoctorResetSubmit} className="space-y-4" id="doctor-reset-form">
                {resetStep === 1 && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-550 uppercase pl-1">Doctor Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="yourname@doctorconnect.pk"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 italic pl-1 leading-relaxed">
                      We will verify your PMDC registration email and dispatch an encrypted 6-digit verification code to reset your account password.
                    </p>
                  </div>
                )}

                {resetStep === 2 && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-550 uppercase pl-1">Enter 6-Digit Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={enteredCode}
                      onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-[0.5em] text-lg font-bold border border-slate-200 focus:border-indigo-500 rounded-xl py-2.5 bg-slate-50 font-mono"
                    />
                    <p className="text-[10px] text-slate-400 italic leading-relaxed text-center">
                      Email dispatch queue processed. Please enter the recovery key code sent to <strong className="text-slate-600">{resetEmail}</strong>.
                    </p>
                  </div>
                )}

                {resetStep === 3 && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-550 uppercase pl-1">Enter New Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Choose a secure password (min. 6 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPwd(false);
                      setResetStep(1);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="w-1/3 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs active:scale-95 transition tracking-wide uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs shadow-md active:scale-95 transition tracking-wide uppercase"
                  >
                    {resetStep === 1 ? 'Send Code' : resetStep === 2 ? 'Verify Code' : 'Save Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {portalMode === 'register' && (
        /* --- REGISTER AS DOCTOR FORM --- */
        <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-md" id="register-form-container">
          <div className="mb-6 flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Physician Registration Form</h3>
              <p className="text-xs text-slate-400 mt-0.5">Build your professional verified profile. Requires PMC credential evaluation.</p>
            </div>
            <Award className="w-6 h-6 text-blue-600" />
          </div>

          <form onSubmit={handleRegisterInputSubmit} className="space-y-6" id="doctor-signup-register-form">
            
            {/* Image selection row with Presets */}
            <div className="bg-slate-50 p-4 rounded-2xl space-y-3 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-600 block text-[10px] uppercase tracking-wide">Image Presentation Selection</span>
                <span className="text-[10px] text-slate-400">Pick preset avatar OR enter custom photo URL</span>
              </div>

              {/* Preset Picker */}
              <div className="grid grid-cols-4 gap-3 max-w-sm">
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRegImageUrl(preset.url)}
                    className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition ${
                      regImageUrl === preset.url ? 'border-blue-600 ring-2 ring-blue-50' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover object-top" />
                    {regImageUrl === preset.url && (
                      <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white fill-blue-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom input URL */}
              <div className="space-y-1 pt-1">
                <label className="block text-[10px] uppercase font-bold text-slate-400 pl-1">Photo Link Address</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/your-custom-doctor-portrait"
                  value={regImageUrl}
                  onChange={(e) => setRegImageUrl(e.target.value)}
                  className="w-full border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-[11px] font-mono bg-white text-slate-700"
                  id="register-field-image"
                />
              </div>
            </div>

            {/* Base credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 pl-1">Doctor Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rana Haseeb Ahmed"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm"
                    id="register-field-name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 pl-1">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. rana.haseeb@doctorconnect.pk"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm"
                    id="register-field-email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 pl-1">PMDC Number (Required) *</label>
                <div className="relative">
                  <Award className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12345-P or PMDC-992-M"
                    value={regPmdcNumber}
                    onChange={(e) => setRegPmdcNumber(e.target.value)}
                    className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold"
                    id="register-field-pmdc"
                  />
                </div>
              </div>
            </div>

            {/* Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 pl-1">Mobile Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 03001112223"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono"
                    id="register-field-mobile"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 pl-1">WhatsApp Number *</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 03001112223"
                    value={regWhatsApp}
                    onChange={(e) => setRegWhatsApp(e.target.value)}
                    className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono"
                    id="register-field-whatsapp"
                  />
                </div>
              </div>
            </div>

            {/* Qualifications and specialties */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 pl-1">City / Location *</label>
                <select
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm bg-white text-slate-700"
                  id="register-field-city"
                >
                  <option value="Mianwali">Mianwali</option>
                  <option value="Sargodha">Sargodha</option>
                  <option value="Bhakkar">Bhakkar</option>
                  <option value="Layyah">Layyah</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Multan">Multan</option>
                  <option value="Faisalabad">Faisalabad</option>
                  <option value="Peshawar">Peshawar</option>
                  <option value="Quetta">Quetta</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 pl-1">Medical Specialist Field / Specialty *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. General Surgeon, Gynaecologist, Pediatrician"
                  value={regSpecialty}
                  onChange={(e) => setRegSpecialty(e.target.value)}
                  className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm"
                  id="register-field-specialty"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 pl-1">Qualification Degrees *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MBBS, FCPS, FACS (USA)"
                  value={regQualification}
                  onChange={(e) => setRegQualification(e.target.value)}
                  className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm"
                  id="register-field-qual"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 pl-1">Experience Years *</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 10"
                  value={regExperience}
                  onChange={(e) => setRegExperience(e.target.value)}
                  className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm"
                  id="register-field-exp"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 pl-1">Consultation Fee (Rs.) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1000"
                  value={regFee}
                  onChange={(e) => setRegFee(e.target.value)}
                  className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                  id="register-field-fee"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 pl-1">Hospital / Clinic Onsite *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rehman Hospital, DHQ Mianwali"
                  value={regHospital}
                  onChange={(e) => setRegHospital(e.target.value)}
                  className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm"
                  id="register-field-hospital"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 pl-1">Full Clinic Address *</label>
              <input
                type="text"
                required
                placeholder="e.g. Gulberg Chowk near PMC Gate, Mianwali"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm"
                id="register-field-address"
              />
            </div>

            {/* Schedule & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 pl-1">Available Days *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mon - Fri or Mon, Wed, Fri"
                  value={regAvailableDays}
                  onChange={(e) => setRegAvailableDays(e.target.value)}
                  className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm"
                  id="register-field-days"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 pl-1">Timing Hours *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 09:00 AM - 05:00 PM"
                  value={regTiming}
                  onChange={(e) => setRegTiming(e.target.value)}
                  className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm"
                  id="register-field-timing"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 pl-1">About / Biography Brief</label>
              <textarea
                rows={3}
                placeholder="Briefly review your clinical expertise, surgical reviews, or background highlight details..."
                value={regAbout}
                onChange={(e) => setRegAbout(e.target.value)}
                className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm"
                id="register-field-about"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-550 uppercase mb-1.5 pl-1">Choose Portal Access Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Create password for future portal logins (mind. 6 chars)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold"
                  id="register-field-pwd"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-md active:scale-95 transition uppercase tracking-wider flex items-center justify-center gap-1.5"
              id="register-form-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Logging Registry to Cloud...
                </>
              ) : (
                'Submit Specialist Registration for Approval'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
