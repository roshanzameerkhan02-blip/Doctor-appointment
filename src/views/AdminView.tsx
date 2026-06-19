import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Doctor, Appointment } from '../types';
import { 
  Users, Calendar, CheckCircle2, Clock, Trash2, Edit, PlusCircle, Search, 
  Filter, MapPin, Award, LogOut, Check, ArrowUpRight, Lock, Key, AlertCircle, FilePlus, X, RefreshCw
} from 'lucide-react';

interface AdminViewProps {
  doctors: Doctor[];
  refreshDoctors: () => void;
}

// Preset doctor avatars to simplify image selection for newly added doctors
const PRESET_AVATARS = [
  { name: 'Professional Male Cartoon 1', url: '/src/assets/images/doc_avatar_m1_1781893187039.jpg' },
  { name: 'Professional Female Cartoon 1', url: '/src/assets/images/doc_avatar_f1_1781893207396.jpg' },
  { name: 'Professional Male Cartoon 2', url: '/src/assets/images/doc_avatar_m2_1781893228161.jpg' },
  { name: 'Professional Female Cartoon 2', url: '/src/assets/images/doc_avatar_f2_1781893248533.jpg' }
];

export default function AdminView({ doctors, refreshDoctors }: AdminViewProps) {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin password recovery states
  const [showAdminForgot, setShowAdminForgot] = useState(false);
  const [adminResetEmail, setAdminResetEmail] = useState('');
  const [adminResetStep, setAdminResetStep] = useState<1 | 2 | 3>(1); // 1: Enter email, 2: Enter code, 3: Enter new pass
  const [adminGeneratedCode, setAdminGeneratedCode] = useState('');
  const [adminEnteredCode, setAdminEnteredCode] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminSuccessMsg, setAdminSuccessMsg] = useState('');

  // Firestore lists states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Active sub-tab under dev dashboard: now supports doctors, appointments, hospitals approval, and bulk import pages!
  const [activeTab, setActiveTab ] = useState<'appointments' | 'doctors' | 'hospitals' | 'bulk_import'>('appointments');

  // Doctor ADD/EDIT modal states
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  // Form states for adding/editing doctor
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('Surgeon');
  const [docQualification, setDocQualification] = useState('');
  const [docExperience, setDocExperience] = useState('');
  const [docClinicName, setDocClinicName] = useState('');
  const [docClinicAddress, setDocClinicAddress] = useState('');
  const [docContact, setDocContact] = useState('');
  const [docTiming, setDocTiming] = useState('');
  const [docFee, setDocFee] = useState('');
  const [docCity, setDocCity] = useState('');
  const [docImageUrl, setDocImageUrl] = useState(PRESET_AVATARS[0].url);
  const [docFeatured, setDocFeatured] = useState(false);
  const [docServices, setDocServices] = useState<string>(''); // comma-separated in UI

  // Additional fields requested by user
  const [docHospital, setDocHospital] = useState('');
  const [docClinic, setDocClinic] = useState('');
  const [docRating, setDocRating] = useState('4.7');
  const [docReviews, setDocReviews] = useState('10');
  const [docAvailability, setDocAvailability] = useState('');
  const [docWhatsAppNumber, setDocWhatsAppNumber] = useState('');
  const [docStatus, setDocStatus] = useState('Approved');

  // Filter and search states for admin lists
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [searchHospitalQuery, setSearchHospitalQuery] = useState(''); // Separate hospital search!
  const [filterDocSpecialty, setFilterDocSpecialty] = useState('');
  const [filterDocCity, setFilterDocCity] = useState('');
  const [filterDocStatus, setFilterDocStatus] = useState(''); // Status filter for doctors
  const [searchPatQuery, setSearchPatQuery] = useState('');
  const [filterPatStatus, setFilterPatStatus] = useState('');

  // Hospital Approvals Map State
  const [hospitalApprovals, setHospitalApprovals] = useState<Record<string, 'Approved' | 'Pending'>>({});

  // Search and Input states for newly added executive tabs
  const [searchHospitalApprovalQuery, setSearchHospitalApprovalQuery ] = useState('');
  const [bulkJsonInput, setBulkJsonInput ] = useState('');

  // Auto load / listen to appointments and hospital approvals from Firestore
  useEffect(() => {
    if (!isLoggedIn) return;

    setLoading(true);
    const appointmentsCol = collection(db, 'appointments');
    
    // Set up real-time listener for clinical appointment submissions
    const unsubscribeAppointments = onSnapshot(appointmentsCol, (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAppointments(list);
      setLoading(false);
    }, (error) => {
      console.error("Firestore listening error: ", error);
      setLoading(false);
    });

    // Set up real-time listener for hospital approvals
    const approvalsCol = collection(db, 'hospital_approvals');
    const unsubscribeApprovals = onSnapshot(approvalsCol, (snapshot) => {
      const approvals: Record<string, 'Approved' | 'Pending'> = {};
      snapshot.forEach((docSnap) => {
        approvals[docSnap.id] = (docSnap.data().status || 'Approved') as 'Approved' | 'Pending';
      });
      setHospitalApprovals(approvals);
    }, (error) => {
      console.error("Firestore hospital approvals load error: ", error);
    });

    return () => {
      unsubscribeAppointments();
      unsubscribeApprovals();
    };
  }, [isLoggedIn]);

  // Auto-seed admin credentials if database doesn't have them
  useEffect(() => {
    const seedAdmin = async () => {
      try {
        const adminsCol = collection(db, 'admins');
        const snap = await getDocs(adminsCol);
        if (snap.empty) {
          // Preset master credentials in database
          await setDoc(doc(db, 'admins', 'master'), {
            email: 'roshanzameerkhan02@gmail.com',
            password: 'adminpk12345'
          });
        }
      } catch (err) {
        console.error("Error seeding master admin account:", err);
      }
    };
    seedAdmin();
  }, []);

  // Handle Admin Login dynamically pulling credentials from admins collection in Firestore
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const adminsCol = collection(db, 'admins');
      const snap = await getDocs(adminsCol);
      let matched = false;

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.email && data.email.trim().toLowerCase() === trimmedEmail && data.password === password.trim()) {
          matched = true;
        }
      });

      if (matched) {
        setIsLoggedIn(true);
        setLoginError('');
      } else {
        setLoginError('Invalid Administrator credentials. Only registered administrative gateways have entry rights.');
      }
    } catch (err) {
      console.error("Database authentication error: ", err);
      setLoginError('Authentication service failed. Database connection error.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
  };

  // Secure Admin Password Recovery through automated verification code dispatches
  const handleAdminResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setAdminSuccessMsg('');

    if (adminResetStep === 1) {
      if (!adminResetEmail.trim()) {
        setLoginError('Please specify the administrator email address.');
        return;
      }

      setIsLoggingIn(true);
      try {
        const trimmedResetEmail = adminResetEmail.trim().toLowerCase();
        const adminsCol = collection(db, 'admins');
        const snap = await getDocs(adminsCol);
        let foundAdminId = '';

        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.email && data.email.trim().toLowerCase() === trimmedResetEmail) {
            foundAdminId = docSnap.id;
          }
        });

        if (!foundAdminId) {
          setLoginError('No matching administrator profile located.');
          setIsLoggingIn(false);
          return;
        }

        // Generate a 6-digit random code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setAdminGeneratedCode(code);

        // Store reset state in firestore (admin_resets)
        await setDoc(doc(db, 'admin_resets', 'latest_request'), {
          adminEmail: trimmedResetEmail,
          adminId: foundAdminId,
          code: code,
          createdAt: new Date().toISOString()
        });

        // Queue automated email via "appointment_emails"
        const emailsCol = collection(db, 'appointment_emails');
        await addDoc(emailsCol, {
          to: trimmedResetEmail,
          subject: '[Doctor Connect] Admin Access Recovery Verification Code',
          body: `Hello Admin,\n\nAn administrative recovery request has been triggered for your Doctor Connect Pakistan Admin Hub.\n\n` +
                `Your 6-digit access recovery verification code is: ${code}\n\n` +
                `Please input this verification code inside the app to securely update your administrative access key.\n\n` +
                `If you did not initiate this request, please audit security logs immediately.`,
          createdAt: new Date().toISOString(),
          type: 'admin_reset_notification'
        });

        setAdminResetStep(2);
        setAdminSuccessMsg(`Administrative verification code dispatched. Please review your inbox at ${trimmedResetEmail}.`);
      } catch (err) {
        console.error("Admin forgot password dispatch failed: ", err);
        setLoginError('Database write or email dispatch service error.');
      } finally {
        setIsLoggingIn(false);
      }
    } else if (adminResetStep === 2) {
      // Verify code
      if (adminEnteredCode.trim() === adminGeneratedCode && adminGeneratedCode !== '') {
        setAdminResetStep(3);
        setAdminSuccessMsg('Administrative code verified successfully! Please define your new Master access password.');
      } else {
        setLoginError('Verification code mismatch. Please review the 6-digit key.');
      }
    } else if (adminResetStep === 3) {
      if (!adminNewPassword.trim() || adminNewPassword.trim().length < 6) {
        setLoginError('Master Password must consist of at least 6 characters.');
        return;
      }

      setIsLoggingIn(true);
      try {
        const trimmedResetEmail = adminResetEmail.trim().toLowerCase();
        const adminsCol = collection(db, 'admins');
        const snap = await getDocs(adminsCol);
        let foundAdminId = 'master'; // default master ID

        snap.forEach((docSnap) => {
          if (docSnap.data().email && docSnap.data().email.toLowerCase() === trimmedResetEmail) {
            foundAdminId = docSnap.id;
          }
        });

        const adminRef = doc(db, 'admins', foundAdminId);
        await updateDoc(adminRef, { password: adminNewPassword.trim() });

        setAdminSuccessMsg('Administrator portal password has been changed successfully! You may now sign in using your new credentials.');
        setShowAdminForgot(false);
        setAdminResetStep(1);
        setPassword('');
        setEmail(adminResetEmail.trim());
      } catch (err) {
        console.error("Failed to commit new admin password:", err);
        setLoginError('Database error. Failed to save new master key.');
      } finally {
        setIsLoggingIn(false);
      }
    }
  };

  // Status transitions
  const handleStatusChange = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      const appRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appRef, { status: newStatus });
    } catch (e) {
      console.error("Error updating status:", e);
    }
  };

  // Add or Update doctor
  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!docName.trim() || !docQualification.trim() || !docClinicAddress.trim() || !docContact.trim() || !docFee || !docCity.trim()) {
      alert('Please fill out all required doctor fields (Name, Qualification, Address, Contact, Fee, City).');
      return;
    }

    // Prepare unified doctor document conforming exactly to User Requested specs
    const docData: Omit<Doctor, 'id'> = {
      name: docName.trim(),
      specialty: docSpecialty,
      qualification: docQualification.trim(),
      experience: Number(docExperience) || 0,
      clinicName: docClinicName.trim() || docClinic.trim() || docHospital.trim(),
      clinicAddress: docClinicAddress.trim(),
      contact: docContact.trim(),
      timing: docTiming.trim() || docAvailability.trim() || 'By Appointment',
      fee: Number(docFee) || 1500,
      city: docCity.trim(),
      imageUrl: docImageUrl,
      featured: docFeatured,
      services: docServices.split(',').map(s => s.trim()).filter(Boolean),

      // New database fields requested
      hospital: docHospital.trim() || docClinicName.trim(),
      clinic: docClinic.trim() || docClinicName.trim(),
      rating: Number(docRating) || 4.5,
      reviews: Number(docReviews) || 0,
      availability: docAvailability.trim() || docTiming.trim() || 'By Appointment',
      contactNumber: docContact.trim(),
      whatsAppNumber: docWhatsAppNumber.trim() || docContact.trim(),
      status: docStatus || 'Approved'
    };

    try {
      if (modalMode === 'add') {
        const doctorsCol = collection(db, 'doctors');
        await addDoc(doctorsCol, docData);
      } else if (modalMode === 'edit' && editingDocId) {
        const docRef = doc(db, 'doctors', editingDocId);
        await updateDoc(docRef, docData);
      }

      setShowDoctorModal(false);
      resetDocForm();
      refreshDoctors(); // let the parent fetch the refreshed doctors!
    } catch (e) {
      console.error("Error saving doctor document:", e);
      alert('Save operation failed. Verify browser or database settings.');
    }
  };

  // Quick status update for doctor approval system
  const handleDocStatusChange = async (doctorId: string, newStatus: string) => {
    try {
      const docRef = doc(db, 'doctors', doctorId);
      await updateDoc(docRef, { status: newStatus });
      refreshDoctors();
    } catch (e) {
      console.error("Error updating doctor status:", e);
      alert("Failed to update status.");
    }
  };

  // Persistent toggle for hospital approval status
  const handleToggleHospitalApproval = async (hospitalName: string, currentApproval: 'Approved' | 'Pending') => {
    try {
      const nextApprovalStatus = currentApproval === 'Approved' ? 'Pending' : 'Approved';
      // Make a safe document key (remove slashes, leading/trailing whitespace)
      const docId = hospitalName.trim().replace(/\//g, '-');
      const docRef = doc(db, 'hospital_approvals', docId);
      await setDoc(docRef, { status: nextApprovalStatus });
    } catch (e) {
      console.error("Error toggling hospital approval:", e);
      alert("Failed to update hospital approval status.");
    }
  };

  // Delete doctor
  const handleDocDelete = async (doctorId: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this doctor? This action is irreversible.')) {
      return;
    }

    try {
      const docRef = doc(db, 'doctors', doctorId);
      await deleteDoc(docRef);
      refreshDoctors();
    } catch (e) {
      console.error("Error deleting doctor:", e);
      alert('Delete operation failed.');
    }
  };

  const resetDocForm = () => {
    setDocName('');
    setDocSpecialty('Surgeon');
    setDocQualification('');
    setDocExperience('10');
    setDocClinicName('');
    setDocClinicAddress('');
    setDocContact('');
    setDocTiming('04:00 PM - 08:00 PM (Mon - Fri)');
    setDocFee('1000');
    setDocCity('Mianwali');
    setDocImageUrl(PRESET_AVATARS[0].url);
    setDocFeatured(false);
    setDocServices('General Consultation, Diagnosis, Minor Procedures');
    setDocHospital('');
    setDocClinic('');
    setDocRating('4.5');
    setDocReviews('0');
    setDocAvailability('04:00 PM - 08:00 PM (Mon - Fri)');
    setDocWhatsAppNumber('');
    setDocStatus('Approved');
    setEditingDocId(null);
  };

  const openAddDoctor = () => {
    resetDocForm();
    setModalMode('add');
    setShowDoctorModal(true);
  };

  const openEditDoctor = (doctor: Doctor) => {
    setDocName(doctor.name);
    setDocSpecialty(doctor.specialty);
    setDocQualification(doctor.qualification);
    setDocExperience(String(doctor.experience));
    setDocClinicName(doctor.clinicName || doctor.clinic || '');
    setDocClinicAddress(doctor.clinicAddress);
    setDocContact(doctor.contact || doctor.contactNumber || '');
    setDocTiming(doctor.timing || doctor.availability || '');
    setDocFee(String(doctor.fee));
    setDocCity(doctor.city);
    setDocImageUrl(doctor.imageUrl || PRESET_AVATARS[0].url);
    setDocFeatured(doctor.featured || false);
    setDocServices(doctor.services.join(', '));
    // Load new user fields
    setDocHospital(doctor.hospital || '');
    setDocClinic(doctor.clinic || '');
    setDocRating(String(doctor.rating || '4.5'));
    setDocReviews(String(doctor.reviews || '0'));
    setDocAvailability(doctor.availability || doctor.timing || '');
    setDocWhatsAppNumber(doctor.whatsAppNumber || '');
    setDocStatus(doctor.status || 'Approved');
    setEditingDocId(doctor.id);
    setModalMode('edit');
    setShowDoctorModal(true);
  };

  // Statistics summaries
  const totalDoctors = doctors.length;
  const totalRequests = appointments.length;
  const pendingRequests = appointments.filter(app => app.status === 'Pending').length;
  const completedRequests = appointments.filter(app => app.status === 'Completed').length;

  // Filtered Patient bookings
  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = app.patientName.toLowerCase().includes(searchPatQuery.toLowerCase()) || 
      app.doctorName.toLowerCase().includes(searchPatQuery.toLowerCase()) || 
      app.mobileNumber.includes(searchPatQuery);
    const matchesStatus = filterPatStatus ? app.status === filterPatStatus : true;
    return matchesSearch && matchesStatus;
  });

  // Filtered Admin Doctors List
  const filteredAdminDoctors = doctors.filter(doc => {
    const matchesName = doc.name.toLowerCase().includes(searchDocQuery.toLowerCase());
    
    const hospitalField = (doc.hospital || doc.clinicName || doc.clinic || '');
    const matchesHospital = hospitalField.toLowerCase().includes(searchHospitalQuery.toLowerCase());
    
    const matchesSpecialty = filterDocSpecialty ? doc.specialty === filterDocSpecialty : true;
    
    const matchesCity = filterDocCity ? doc.city.toLowerCase().includes(filterDocCity.toLowerCase()) : true;
    
    const currentStatus = doc.status || 'Approved';
    const matchesStatus = filterDocStatus ? currentStatus === filterDocStatus : true;
    
    return matchesName && matchesHospital && matchesSpecialty && matchesCity && matchesStatus;
  });

  // Extract unique elements for admin listings from underlying dataset
  const docCities = Array.from(new Set(doctors.map(d => d.city))).filter(Boolean);
  const docSpecialties = Array.from(new Set(doctors.map(d => d.specialty))).filter(Boolean);

  // If NOT LOGGED IN, present beautiful admin portal entry gates
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-12 px-4" id="admin-login-screen">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 space-y-6">
          {!showAdminForgot ? (
            /* --- ADMIN LOGIN FORM --- */
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Admin Gate Entry</h2>
                <p className="text-xs text-slate-500">Access Doctor Connect Pakistani Practitioner Management Core Hub</p>
              </div>

              {adminSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl text-xs font-sans leading-relaxed">
                  ✓ {adminSuccessMsg}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4" id="admin-login-form">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Admin Email</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="admin@doctorconnect.pk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 focus:border-emerald-500 rounded-xl bg-slate-50 focus:bg-white"
                      id="admin-email-field"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center mb-1 pl-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Master Key</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAdminForgot(true);
                        setAdminResetStep(1);
                        setAdminResetEmail(email);
                        setAdminEnteredCode('');
                        setAdminNewPassword('');
                        setLoginError('');
                        setAdminSuccessMsg('');
                      }}
                      className="text-xs text-emerald-600 hover:text-emerald-800 hover:underline font-bold transition focus:outline-none text-[11px]"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 focus:border-emerald-500 rounded-xl bg-slate-50 focus:bg-white"
                      id="admin-password-field"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  id="admin-login-submit"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating Gate...</span>
                    </>
                  ) : (
                    <span>Sign In to Dashboard</span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* --- ADMIN FORGOT PASSWORD FLOW --- */
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto shadow-sm">
                  <Key className="w-6 h-6 animate-pulse" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Admin Key Reset</h2>
                <p className="text-xs text-slate-500">Secure automated master credentials verification system</p>
              </div>

              {adminSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl text-xs font-sans leading-relaxed">
                  ✓ {adminSuccessMsg}
                </div>
              )}

              <form onSubmit={handleAdminResetSubmit} className="space-y-4" id="admin-reset-form">
                {adminResetStep === 1 && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Admin Email Address</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="admin@doctorconnect.pk"
                        value={adminResetEmail}
                        onChange={(e) => setAdminResetEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 focus:border-indigo-500 rounded-xl bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 italic leading-relaxed pl-1 pt-1">
                      We will verify your administrator configuration and dispatch an encrypted 6-digit verification code to reset the account password.
                    </p>
                  </div>
                )}

                {adminResetStep === 2 && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest text-center pl-1 font-sans">Enter 6-Digit Admin Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={adminEnteredCode}
                      onChange={(e) => setAdminEnteredCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-[0.5em] text-lg font-bold border border-slate-200 focus:border-indigo-550 rounded-xl py-2.5 bg-slate-50 font-mono"
                    />
                    <p className="text-[10px] text-slate-400 italic leading-relaxed text-center pt-1">
                      Verification code dispatched on-the-fly. Please check your admin inbox at <strong className="text-slate-600">{adminResetEmail}</strong>.
                    </p>
                  </div>
                )}

                {adminResetStep === 3 && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase pl-1">New Master Admin Key</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Choose a strong password (min. 6 chars)"
                        value={adminNewPassword}
                        onChange={(e) => setAdminNewPassword(e.target.value)}
                        className="w-full border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                )}

                {loginError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminForgot(false);
                      setAdminResetStep(1);
                      setLoginError('');
                      setAdminSuccessMsg('');
                    }}
                    className="w-1/3 bg-slate-105 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs active:scale-95 transition tracking-wide uppercase border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs shadow-md active:scale-95 transition tracking-wide uppercase flex items-center justify-center gap-2"
                  >
                    {isLoggingIn && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{adminResetStep === 1 ? 'Dispatch Code' : adminResetStep === 2 ? 'Verify Code' : 'Save Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // LOGGED IN DASHBOARD
  return (
    <div className="space-y-8" id="admin-dashboard-panel">
      
      {/* Admin Title Bar */}
      <section className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
        
        <div className="space-y-1 relative z-10 text-center sm:text-left">
          <span className="bg-emerald-500 text-slate-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest">
            Executive Control Session
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight pt-1">
            Doctor Connect Admin Hub
          </h2>
          <p className="text-xs text-slate-400">
            Provision clinical resources, update specialties, and process patient consultations securely.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="relative z-10 bg-slate-800 border border-slate-750 text-slate-300 hover:text-white px-4.5 py-2 rounded-xl text-xs font-bold font-sans transition-colors hover:bg-rose-950 hover:border-rose-900 flex items-center gap-1.5 active:scale-95"
          id="admin-logout-btn"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Admin</span>
        </button>
      </section>

      {/* 1. Statistics Cards Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats-section">
        
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">Total Doctors</span>
            <span className="text-2xl font-black text-slate-800">{totalDoctors}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">Patient Consults</span>
            <span className="text-2xl font-black text-slate-800">{totalRequests}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">Pending Review</span>
            <span className="text-2xl font-black text-amber-700">{pendingRequests}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">Completed Files</span>
            <span className="text-2xl font-black text-emerald-600">{completedRequests}</span>
          </div>
        </div>

      </section>

      {/* 2. Main Dashboard Navigation tab selection */}
      <div className="border-b border-slate-150 flex flex-wrap gap-4 md:gap-6">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 font-extrabold text-xs sm:text-sm relative transition-all ${
            activeTab === 'appointments'
              ? 'text-emerald-700 font-extrabold border-b-2 border-emerald-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          id="tab-btn-appointments"
        >
          Patient Request Logs ({appointments.length})
        </button>
        
        <button
          onClick={() => setActiveTab('doctors')}
          className={`pb-3 font-extrabold text-xs sm:text-sm relative transition-all ${
            activeTab === 'doctors'
              ? 'text-emerald-700 font-extrabold border-b-2 border-emerald-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          id="tab-btn-doctors"
        >
          Manage Certified Doctors ({doctors.length})
        </button>

        <button
          onClick={() => setActiveTab('hospitals')}
          className={`pb-3 font-extrabold text-xs sm:text-sm relative transition-all ${
            activeTab === 'hospitals'
              ? 'text-emerald-700 font-extrabold border-b-2 border-emerald-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          id="tab-btn-hospitals"
        >
          Clinics & Hospitals Approvals
        </button>

        <button
          onClick={() => setActiveTab('bulk_import')}
          className={`pb-3 font-extrabold text-xs sm:text-sm relative transition-all ${
            activeTab === 'bulk_import'
              ? 'text-emerald-700 font-extrabold border-b-2 border-emerald-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          id="tab-btn-bulk-import"
        >
          Bulk Import Engine
        </button>
      </div>

      {/* Tab Panel 1: Patient Request Management Log */}
      {activeTab === 'appointments' && (
        <div className="space-y-4" id="appointments-tab-panel">
          {/* Appointment Filters bar */}
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center flex-1">
              <div className="relative min-w-xs flex-1">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient, cellphone, doctor..."
                  value={searchPatQuery}
                  onChange={(e) => setSearchPatQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.8 text-xs bg-white border border-slate-200 focus:border-emerald-550 rounded-xl focus:outline-none"
                  id="admin-search-pat"
                />
              </div>

              <select
                value={filterPatStatus}
                onChange={(e) => setFilterPatStatus(e.target.value)}
                className="px-3.5 py-1 text-xs border border-slate-200 bg-white rounded-xl focus:outline-none text-slate-500"
                id="admin-filter-pat-status"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Contacted">Contacted</option>
                <option value="Sent to Doctor">Sent to Doctor</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            
            {(searchPatQuery || filterPatStatus) && (
              <button 
                onClick={() => { setSearchPatQuery(''); setFilterPatStatus(''); }}
                className="text-[10px] text-emerald-600 font-bold hover:underline"
              >
                Reset Fields
              </button>
            )}
          </div>

          {/* Table list */}
          {loading ? (
            <div className="text-center py-10 bg-white border border-slate-100 rounded-3xl" id="appointments-loading">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto opacity-70" />
              <p className="text-xs text-slate-400 mt-2 font-medium">Fetching real-time medical directories from Firestore...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl text-sm" id="empty-appointments-msg">
              <p className="text-slate-400 font-bold">No patient request logs matched details.</p>
              <p className="text-xs text-slate-350 mt-1">When customers use the book button, logs instantly synchronize here.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden" id="appointments-table-container">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left text-xs text-slate-500">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Submission Detail ID</th>
                      <th className="px-6 py-4">Patient Information</th>
                      <th className="px-6 py-4">Factual Specialty & Doctor</th>
                      <th className="px-6 py-4">Diagnostic Remarks</th>
                      <th className="px-6 py-4">Appointment Date</th>
                      <th className="px-6 py-4">Review Status State</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-slate-105/50 divide-slate-100 bg-white text-slate-700">
                    {filteredAppointments.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition-colors" id={`appointment-row-${app.id}`}>
                        <td className="px-6 py-4 font-mono font-bold text-slate-400 text-[10px]">
                          {app.id.slice(0, 10)}...
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-800 text-xs">{app.patientName}</div>
                          <div className="text-slate-500">{app.gender}, {app.age} Yrs</div>
                          <div className="text-[10px] font-bold text-emerald-700 mt-1 font-mono">{app.mobileNumber}</div>
                          <div className="text-[10px] text-slate-400">{app.city}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-850 text-slate-800 text-xs">{app.doctorName}</div>
                          <div className="text-[10px] text-slate-400">{app.doctorSpecialty}</div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="italic text-slate-500 leading-relaxed truncate" title={app.message}>
                            "{app.message || 'General consultation request'}"
                          </p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-xs text-slate-600">
                          {app.date}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value as any)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border-none focus:ring-1 focus:ring-emerald-500 font-sans cursor-pointer ${
                              app.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                              app.status === 'Contacted' ? 'bg-blue-105 bg-blue-100 text-blue-700' :
                              app.status === 'Sent to Doctor' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-emerald-110 bg-emerald-100 text-emerald-800'
                            }`}
                            id={`status-selector-${app.id}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Sent to Doctor">Sent to Doctor</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Panel 2: Certified Doctor Directory CRUD */}
      {activeTab === 'doctors' && (
        <div className="space-y-4" id="doctors-tab-panel">
          {/* Doctor Management Search bar */}
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 flex-1">
              {/* Name Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Doctor Name..."
                  value={searchDocQuery}
                  onChange={(e) => setSearchDocQuery(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.8 text-xs bg-white border border-slate-200 focus:border-emerald-550 rounded-xl focus:outline-none"
                  id="admin-search-doc"
                />
              </div>

              {/* Hospital Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="HospitalName..."
                  value={searchHospitalQuery}
                  onChange={(e) => setSearchHospitalQuery(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.8 text-xs bg-white border border-slate-200 focus:border-emerald-550 rounded-xl focus:outline-none"
                  id="admin-search-hospital"
                />
              </div>

              {/* Specialty Filter */}
              <select
                value={filterDocSpecialty}
                onChange={(e) => setFilterDocSpecialty(e.target.value)}
                className="px-2 py-1.8 text-xs border border-slate-200 bg-white rounded-xl focus:outline-none text-slate-500 font-sans"
                id="admin-filter-doc-spec"
              >
                <option value="">All Specialties</option>
                {docSpecialties.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>

              {/* City Filter */}
              <select
                value={filterDocCity}
                onChange={(e) => setFilterDocCity(e.target.value)}
                className="px-2 py-1.8 text-xs border border-slate-200 bg-white rounded-xl focus:outline-none text-slate-500 font-sans"
                id="admin-filter-doc-city"
              >
                <option value="">All Cities</option>
                {docCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterDocStatus}
                onChange={(e) => setFilterDocStatus(e.target.value)}
                className="px-2 py-1.8 text-xs border border-slate-200 bg-white rounded-xl focus:outline-none text-slate-500 font-sans"
                id="admin-filter-doc-status"
              >
                <option value="">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="flex gap-2 shrink-0 justify-end">
              {(searchDocQuery || searchHospitalQuery || filterDocSpecialty || filterDocCity || filterDocStatus) && (
                <button
                  onClick={() => {
                    setSearchDocQuery('');
                    setSearchHospitalQuery('');
                    setFilterDocSpecialty('');
                    setFilterDocCity('');
                    setFilterDocStatus('');
                  }}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  Clear
                </button>
              )}
              <button
                onClick={openAddDoctor}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
                id="add-doc-entry-btn"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span>Add Certified Doctor</span>
              </button>
            </div>
          </div>

          {/* Doctors admin records list */}
          {filteredAdminDoctors.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl" id="empty-doctors-admin-msg">
              <p className="text-slate-400 font-bold">No doctor records match query.</p>
              <p className="text-xs text-slate-350 mt-1">Try resetting search parameters above or add a new specialist profile.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="doctors-admin-cards-grid">
              {filteredAdminDoctors.map((doc) => {
                const currentStatus = doc.status || 'Approved';
                return (
                  <div 
                    key={doc.id}
                    className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row gap-4 items-start shadow-sm hover:border-slate-200 transition-all text-xs"
                    id={`admin-doc-card-${doc.id}`}
                  >
                    <div className="flex sm:flex-col gap-2 items-center shrink-0 w-full sm:w-auto">
                      <img 
                        src={doc.imageUrl || PRESET_AVATARS[0].url} 
                        alt={doc.name} 
                        className="w-16 h-16 rounded-xl object-cover border border-slate-100 object-top"
                      />
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-0.5 text-amber-500 font-bold text-xs">
                          <span>⭐</span>
                          <span>{doc.rating || '4.5'}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-medium">({doc.reviews || 0} reviews)</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-2 min-w-0 w-full">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{doc.name}</h4>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg inline-block mt-1">
                            {doc.specialty} • Fee: Rs. {doc.fee}
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {doc.featured ? (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase font-sans">
                              Featured
                            </span>
                          ) : null}
                          
                          {/* Live inline doctor approval picker */}
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold uppercase text-slate-400 font-sans">Approval:</span>
                            <select
                              value={currentStatus}
                              onChange={(e) => handleDocStatusChange(doc.id, e.target.value)}
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded border border-slate-200 focus:outline-none cursor-pointer ${
                                currentStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                                currentStatus === 'Pending' ? 'bg-amber-100 text-amber-800' :
                                'bg-rose-100 text-rose-800'
                              }`}
                              id={`status-doc-${doc.id}`}
                            >
                              <option value="Approved">Approved</option>
                              <option value="Pending">Pending</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
                        <div><strong className="text-slate-700">Qual:</strong> {doc.qualification}</div>
                        <div><strong className="text-slate-700">Exp:</strong> {doc.experience} Years Active</div>
                        <div><strong className="text-slate-700">Hospital:</strong> {doc.hospital || doc.clinicName || 'N/A'}</div>
                        {doc.clinic && doc.clinic !== doc.hospital && (
                          <div><strong className="text-slate-700">Clinic:</strong> {doc.clinic}</div>
                        )}
                        <div><strong className="text-slate-700">City:</strong> <span className="font-semibold text-slate-800">{doc.city}</span></div>
                        <div><strong className="text-slate-700">Timing:</strong> {doc.timing || doc.availability}</div>
                        <div><strong className="text-slate-700">Phone:</strong> {doc.contact || doc.contactNumber}</div>
                        {doc.whatsAppNumber && (
                          <div><strong className="text-slate-700 text-emerald-600">WhatsApp:</strong> {doc.whatsAppNumber}</div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-350 font-mono">ID: {doc.id.slice(0, 6)}...</span>
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEditDoctor(doc)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                            id={`edit-doc-${doc.id}`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          
                          <button
                            onClick={() => handleDocDelete(doc.id)}
                            className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                            id={`delete-doc-${doc.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Panel 3: Clinics & Hospitals persistent Approvals */}
      {activeTab === 'hospitals' && (
        <div className="space-y-4" id="hospitals-tab-panel">
          <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-800">Hospital & Clinic Authorization Matrix</h3>
              <p className="text-xs text-slate-400">
                Extracted unique hospital listings from your database. Update approval statuses in real-time.
              </p>
            </div>

            {/* Hospital Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search hospital or clinic name..."
                value={searchHospitalApprovalQuery}
                onChange={(e) => setSearchHospitalApprovalQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.8 text-xs bg-slate-50 border border-slate-200 focus:border-emerald-550 rounded-xl focus:outline-none"
                id="search-hospital-approval"
              />
            </div>

            {/* List */}
            {(() => {
              const uniqueHospitals = Array.from(new Set(doctors.map(d => d.hospital || d.clinicName || d.clinic || '').map(h => h.trim()).filter(Boolean)));
              const filteredHospitals = uniqueHospitals.filter(h => h.toLowerCase().includes(searchHospitalApprovalQuery.toLowerCase()));

              if (filteredHospitals.length === 0) {
                return (
                  <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                    No clinical facilities matching directory search.
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="min-w-full divide-y divide-slate-100 text-left text-xs text-slate-500">
                    <thead className="bg-slate-50 font-bold text-slate-700">
                      <tr>
                        <th className="px-6 py-3">Facility Name</th>
                        <th className="px-6 py-3">Associated Practitioners</th>
                        <th className="px-6 py-3">Authorized Status</th>
                        <th className="px-6 py-3 text-right">Quick Toggle Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100 text-slate-800 font-sans">
                      {filteredHospitals.map(hName => {
                        const count = doctors.filter(d => (d.hospital || d.clinicName || d.clinic || '').trim() === hName).length;
                        const status: 'Approved' | 'Pending' = hospitalApprovals[hName.replace(/\//g, '-')] || 'Approved';
                        return (
                          <tr key={hName} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-3.5 font-bold text-slate-700">
                              {hName}
                            </td>
                            <td className="px-6 py-3.5 font-mono text-xs font-semibold text-slate-500">
                              {count} {count === 1 ? 'Doctor' : 'Doctors'} Registered
                            </td>
                            <td className="px-6 py-3.5">
                              <span className={`px-2 py-0.8 rounded text-[10px] font-extrabold tracking-widest uppercase ${
                                status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <button
                                onClick={() => handleToggleHospitalApproval(hName, status)}
                                className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition duration-150 ${
                                  status === 'Approved'
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                {status === 'Approved' ? 'Suspend Approval' : 'Grant Approval'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tab Panel 4: Bulk JSON Data Import Engine */}
      {activeTab === 'bulk_import' && (
        <div className="space-y-4" id="bulk-import-tab-panel">
          <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                <span>Bulk Import / Seed Engine</span>
                <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">Interactive</span>
              </h3>
              <p className="text-xs text-slate-400">
                Write or paste a JSON array of doctors to instantly load them to Firestore. Duplicates with existing names will be updated.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const demoFormat = [
                    {
                      name: "Dr Rana Haseeb Ahmed",
                      specialty: "General Surgeon, Hernia & Laparoscopic Surgeon",
                      qualification: "MBBS, FCPS, FACS (USA)",
                      experience: 9,
                      fee: 1000,
                      rating: 4.7,
                      reviews: 522,
                      city: "Mianwali",
                      hospital: "Rehman Hospital",
                      clinic: "Rehman Hospital",
                      timing: "04:00 PM - 08:00 PM (Mon - Fri)",
                      contact: "0300-1234567"
                    }
                  ];
                  setBulkJsonInput(JSON.stringify(demoFormat, null, 2));
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition active:scale-95"
              >
                Insert Import Format Template
              </button>

              <button
                onClick={() => {
                  const fullSeeds = [
                    {
                      name: "Dr Rana Haseeb Ahmed",
                      specialty: "General Surgeon",
                      qualification: "MBBS, FCPS, FACS (USA)",
                      experience: 9,
                      fee: 1000,
                      rating: 4.7,
                      reviews: 522,
                      city: "Mianwali",
                      hospital: "Rehman Hospital",
                      clinic: "Rehman Hospital",
                      clinicName: "Rehman Hospital",
                      clinicAddress: "Gulberg Chowk, Mianwali",
                      contact: "0300-1234567",
                      whatsAppNumber: "0300-1234567",
                      timing: "04:00 PM - 08:00 PM (Mon - Fri)",
                      services: ["Hernia Surgery", "Laparoscopy Consult", "Abdominal Diagnostics"],
                      status: "Approved",
                      imageUrl: "/src/assets/images/doc_avatar_m1_1781893187039.jpg"
                    },
                    {
                      name: "Dr Sara Haseeb",
                      specialty: "Gynecologist",
                      qualification: "MBBS, FCPS",
                      experience: 8,
                      fee: 600,
                      rating: 4.6,
                      reviews: 148,
                      city: "Mianwali",
                      hospital: "Rehman Hospital",
                      clinic: "Rehman Hospital",
                      clinicName: "Rehman Hospital",
                      clinicAddress: "Gulberg Chowk, Mianwali",
                      contact: "0301-7654321",
                      whatsAppNumber: "0301-7654321",
                      timing: "02:00 PM - 06:00 PM (Mon - Sat)",
                      services: ["Obstetrics consult", "Antenatal wellness", "Women health general review"],
                      status: "Approved",
                      imageUrl: "/src/assets/images/doc_avatar_f1_1781893207396.jpg"
                    },
                    {
                      name: "Dr Maheen Iqbal",
                      specialty: "General Physician",
                      qualification: "MBBS, MCPS",
                      experience: 5,
                      fee: 700,
                      rating: 4.5,
                      reviews: 82,
                      city: "Mianwali",
                      hospital: "Al Shifa General Hospital",
                      clinic: "Al Shifa General Hospital",
                      clinicName: "Al Shifa General Hospital",
                      clinicAddress: "Balokhel Road, Mianwali",
                      contact: "0345-1122334",
                      whatsAppNumber: "0345-1122334",
                      timing: "09:00 AM - 01:00 PM (Mon - Fri)",
                      services: ["General physical routine checkup", "Infectious symptoms diagnosis"],
                      status: "Approved",
                      imageUrl: "/src/assets/images/doc_avatar_f2_1781893248533.jpg"
                    },
                    {
                      name: "Dr Zahid Abbas",
                      specialty: "Cardiologist",
                      qualification: "MBBS, Dip Card, FCPS (Cardiology)",
                      experience: 12,
                      fee: 800,
                      rating: 4.9,
                      reviews: 231,
                      city: "Mianwali",
                      hospital: "Obaid Noor Hospital",
                      clinic: "Obaid Noor Hospital",
                      clinicName: "Obaid Noor Hospital",
                      clinicAddress: "Balokhel road custom office opposite near bus stop, Mianwali",
                      contact: "0333-9988776",
                      whatsAppNumber: "0333-9988776",
                      timing: "10:00 AM - 04:00 PM (Mon - Sun)",
                      services: ["Echo mapping reviews", "Angioplasty file reviews", "ECG assessment"],
                      status: "Approved",
                      imageUrl: "/src/assets/images/doc_avatar_m2_1781893228161.jpg"
                    },
                    {
                      name: "Dr Arshad Mehmood",
                      specialty: "Dermatologist",
                      qualification: "MBBS, MCPS, Clinical Dermatology (UK)",
                      experience: 15,
                      fee: 1000,
                      rating: 4.8,
                      reviews: 605,
                      city: "Mianwali",
                      hospital: "Dr Arshad Skin And Laser Clinic",
                      clinic: "Dr Arshad Skin And Laser Clinic",
                      clinicName: "Dr Arshad Skin And Laser Clinic",
                      clinicAddress: "Balokhel Road near GPO Office, Mianwali",
                      contact: "0300-8889997",
                      whatsAppNumber: "0300-8889997",
                      timing: "05:00 PM - 09:00 PM (Mon - Fri)",
                      services: ["Acne treatment consult", "Laser skin ablation review", "General cosmetology advise"],
                      status: "Approved",
                      imageUrl: "/src/assets/images/doc_avatar_m1_1781893187039.jpg"
                    }
                  ];
                  setBulkJsonInput(JSON.stringify(fullSeeds, null, 2));
                }}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-xl text-xs transition active:scale-95"
              >
                Insert Mianwali Verified Seeds JSON
              </button>
            </div>

            <div>
              <textarea
                placeholder="Paste JSON array format of your practitioners right here..."
                rows={12}
                value={bulkJsonInput}
                onChange={(e) => setBulkJsonInput(e.target.value)}
                className="w-full text-[11px] font-mono p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none"
                id="bulk-import-textarea"
              />
            </div>

            <button
              onClick={async () => {
                try {
                  const parsed = JSON.parse(bulkJsonInput);
                  if (!Array.isArray(parsed)) {
                    alert("Import inputs must be a valid JSON Array: [ { ... } ]");
                    return;
                  }

                  if (!window.confirm(`Are you sure you want to bulk import ${parsed.length} doctor profiles?`)) {
                    return;
                  }

                  const doctorsCol = collection(db, 'doctors');
                  let count = 0;
                  for (const raw of parsed) {
                    const docData = {
                      name: String(raw.name || "Default Doctor"),
                      specialty: String(raw.specialty || "General Physician"),
                      qualification: String(raw.qualification || "MBBS"),
                      experience: Number(raw.experience) || 5,
                      clinicName: String(raw.clinicName || raw.clinic || raw.hospital || "General Clinic"),
                      clinicAddress: String(raw.clinicAddress || "City Centre"),
                      contact: String(raw.contact || "N/A"),
                      timing: String(raw.timing || raw.availability || "By Appointment"),
                      fee: Number(raw.fee) || 1000,
                      city: String(raw.city || "Islamabad"),
                      imageUrl: String(raw.imageUrl || PRESET_AVATARS[0].url),
                      featured: Boolean(raw.featured || false),
                      services: Array.isArray(raw.services) ? raw.services : ["General consultation"],
                      // Custom field compliance
                      hospital: String(raw.hospital || raw.clinicName || ""),
                      clinic: String(raw.clinic || raw.clinicName || ""),
                      rating: Number(raw.rating) || 4.5,
                      reviews: Number(raw.reviews) || 0,
                      availability: String(raw.availability || raw.timing || "By Appointment"),
                      contactNumber: String(raw.contactNumber || raw.contact || "N/A"),
                      whatsAppNumber: String(raw.whatsAppNumber || raw.contact || ""),
                      status: String(raw.status || "Approved")
                    };

                    await addDoc(doctorsCol, docData);
                    count++;
                  }

                  alert(`Successfully imported ${count} doctor records into Firestore!`);
                  setBulkJsonInput('');
                  refreshDoctors();
                } catch (err: any) {
                  alert("Failed to parse or save. Check JSON syntax trace: " + err.message);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold w-full py-3 rounded-2xl text-xs shadow-md shadow-emerald-100 transition active:scale-98"
              id="bulk-submit-import-btn"
            >
              Parse & Process Bulk Import
            </button>
          </div>
        </div>
      )}

      {/* 3. ADD / EDIT Doctor Detailed Modal Overlay - Unified design */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" id="doctor-editor-overlay">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col justify-between">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                  <FilePlus className="w-5 h-5 text-emerald-600" />
                  <span>{modalMode === 'add' ? 'Add New Certified Doctor' : 'Edit Specialist Profile'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">Provide correct clinical attributes according to PMC licensing.</p>
              </div>
              <button 
                onClick={() => setShowDoctorModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-150"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleDocSubmit} className="p-6 space-y-4 text-xs font-sans" id="doctor-admin-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">Doctor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Hammad Khan"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-xs"
                    id="form-doc-name"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">Medical Specialty *</label>
                  <select
                    value={docSpecialty}
                    onChange={(e) => setDocSpecialty(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-xs bg-white text-slate-700"
                    id="form-doc-spec"
                  >
                    <option value="Surgeon">Surgeon</option>
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Dermatologist">Dermatologist</option>
                    <option value="Dentist">Dentist</option>
                    <option value="General Physician">General Physician</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">Qualification Degrees *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBBS, FCPS (Dermatology)"
                    value={docQualification}
                    onChange={(e) => setDocQualification(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-xs"
                    id="form-doc-qualification"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">Experience Years *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 12"
                    value={docExperience}
                    onChange={(e) => setDocExperience(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-xs"
                    id="form-doc-experience"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">Consultation Fee (PKR) *</label>
                  <input
                    type="number"
                    required
                    min="500"
                    placeholder="e.g. 2000"
                    value={docFee}
                    onChange={(e) => setDocFee(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-xs"
                    id="form-doc-fee"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">Onsite City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Lahore / Islamabad..."
                    value={docCity}
                    onChange={(e) => setDocCity(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-xs"
                    id="form-doc-city"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">Onsite Contact *</label>
                  <input
                    type="text"
                    required
                    placeholder="0300xxxxxxx"
                    value={docContact}
                    onChange={(e) => setDocContact(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-xs font-mono"
                    id="form-doc-contact"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">Hospital (Optional/Verified)</label>
                  <input
                    type="text"
                    placeholder="e.g. Rehman Hospital / Kulsum International"
                    value={docHospital}
                    onChange={(e) => setDocHospital(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-xs"
                    id="form-doc-hospital"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">Clinic / Suite</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr Arshad Laser Clinic / Main Wing"
                    value={docClinic}
                    onChange={(e) => setDocClinic(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-xs"
                    id="form-doc-clinic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">Clinic Name (Legacy Display Ref) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shifa Laser & Skin Clinic"
                    value={docClinicName}
                    onChange={(e) => setDocClinicName(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-xs"
                    id="form-doc-clinic-name"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">Available Hours / Timing *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 05:00 PM - 09:00 PM (Mon - Fri)"
                    value={docTiming}
                    onChange={(e) => setDocTiming(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-xs"
                    id="form-doc-timing"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">Rating (e.g. 4.7) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    required
                    value={docRating}
                    onChange={(e) => setDocRating(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-xs"
                    id="form-doc-rating"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">Reviews Count *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={docReviews}
                    onChange={(e) => setDocReviews(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-xs"
                    id="form-doc-reviews"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    placeholder="0300xxxxxxx"
                    value={docWhatsAppNumber}
                    onChange={(e) => setDocWhatsAppNumber(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-xs font-mono"
                    id="form-doc-whatsapp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">Availability Hours Specific</label>
                  <input
                    type="text"
                    placeholder="e.g. Mon, Wed, Fri (4 PM - 8 PM)"
                    value={docAvailability}
                    onChange={(e) => setDocAvailability(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-xs"
                    id="form-doc-availability"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">Doctor Status Approval *</label>
                  <select
                    value={docStatus}
                    onChange={(e) => setDocStatus(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-xs bg-white text-slate-700"
                    id="form-doc-status"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">Clinic Full Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street and Sector location details"
                  value={docClinicAddress}
                  onChange={(e) => setDocClinicAddress(e.target.value)}
                  className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-xs"
                  id="form-doc-address"
                />
              </div>

              {/* Service tags */}
              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wide mb-1">Clinic Services (Comma Separated)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Heart surgery consult, Angioplasty file reviews, Echo mapping"
                  value={docServices}
                  onChange={(e) => setDocServices(e.target.value)}
                  className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-1.8 text-xs"
                  id="form-doc-services"
                />
              </div>

              {/* Avatar Selector and Custom URL upload field */}
              <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-600 block text-[10px] uppercase tracking-wide">Image Presentation Selection</span>
                  <span className="text-[10px] text-slate-400">Pick preset avatar OR enter custom photo URL</span>
                </div>

                {/* Preset Picker */}
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDocImageUrl(preset.url)}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition ${
                        docImageUrl === preset.url ? 'border-emerald-600 ring-2 ring-emerald-50' : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover object-top" />
                      {docImageUrl === preset.url && (
                        <div className="absolute inset-0 bg-emerald-650 bg-emerald-600/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white font-bold" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom input URL */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 pl-1">Photo Link Address</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/your-custom-doctor-portrait"
                    value={docImageUrl}
                    onChange={(e) => setDocImageUrl(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-550 rounded-xl px-3 py-2 text-[11px] font-mono"
                    id="form-doc-image-url"
                  />
                </div>
              </div>

              {/* Featured toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="doc-featured-check"
                  checked={docFeatured}
                  onChange={(e) => setDocFeatured(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="doc-featured-check" className="font-bold text-slate-600 cursor-pointer select-none">
                  Display this Doctor profile as Featured / Staff Pick on homepage
                </label>
              </div>

              {/* Action ctads */}
              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl border border-slate-100 font-bold"
                  id="form-doc-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition"
                  id="form-doc-submit"
                >
                  Save Specialist Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
