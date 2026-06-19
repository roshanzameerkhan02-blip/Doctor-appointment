import React, { useState } from 'react';
import { X, Award, MapPin, Clock, Phone, Stethoscope, ShieldCheck, Mail, Calendar, MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Doctor, Appointment, getDoctorAvatar } from '../types';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

interface DoctorDetailModalProps {
  doctor: Doctor;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DoctorDetailModal({ doctor, isOpen, onClose, onSuccess }: DoctorDetailModalProps) {
  const [patientName, setPatientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [city, setCity] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [problem, setProblem] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  if (!isOpen) return null;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!patientName.trim()) {
      setErrorMsg('Patient Name is required.');
      return;
    }
    if (!mobileNumber.trim()) {
      setErrorMsg('Mobile Number is required.');
      return;
    }
    if (!age || isNaN(Number(age)) || Number(age) <= 0) {
      setErrorMsg('Please enter a valid age.');
      return;
    }
    if (!city.trim()) {
      setErrorMsg('City is required.');
      return;
    }
    if (!appointmentDate) {
      setErrorMsg('Please choose an appointment date.');
      return;
    }

    setIsSubmitting(true);

    try {
      const appointmentsCol = collection(db, 'appointments');
      const appointmentData = {
        patientName: patientName.trim(),
        mobileNumber: mobileNumber.trim(),
        age: Number(age),
        gender,
        city: city.trim(),
        message: problem.trim(),
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        date: appointmentDate,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(appointmentsCol, appointmentData);
      
      // Automatic real-time Email dispatch queuing
      try {
        const emailsCol = collection(db, 'appointment_emails');
        const docEmail = doctor.email || `${doctor.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@doctorconnect.pk`;
        
        // 1. Queue email to doctor
        await addDoc(emailsCol, {
          to: docEmail,
          subject: `Urgent: New Referral Assignment [ID: ${docRef.id}]`,
          body: `Dear ${doctor.name},\n\nYou have received a new consultation request on Doctor Connect.\n\n` +
                `Patient Details:\n` +
                `- Session ID: ${docRef.id}\n` +
                `- Patient Name: ${patientName.trim()}\n` +
                `- Clinical Mobile: ${mobileNumber.trim()}\n` +
                `- Age & Gender: ${age} Years Old, ${gender}\n` +
                `- City: ${city.trim()}\n` +
                `- Proposed Date: ${appointmentDate}\n` +
                `- Patient Concern: "${problem.trim() || 'General Specialist routing'}"\n\n` +
                `Please login to your Doctor Workspace Web Portal to update patient reservation statuses.\n\n` +
                `Doctor Connect Pakistan Gateways`,
          createdAt: new Date().toISOString(),
          type: 'doctor_notification'
        });

        // 2. Queue email to admin
        await addDoc(emailsCol, {
          to: 'roshanzameerkhan02@gmail.com',
          subject: `Alert: New Referral Booking Opened [ID: ${docRef.id}]`,
          body: `Dear Admin,\n\nA new clinical patient appointment reservation has been registered.\n\n` +
                `- Associated Specialist: ${doctor.name} (${doctor.specialty})\n` +
                `- Patient: ${patientName.trim()}\n` +
                `- Preferred Date: ${appointmentDate}\n\n` +
                `Please review eligibility approvals in your Master Admin panel.\n` +
                `System Automated Core`,
          createdAt: new Date().toISOString(),
          type: 'admin_notification'
        });
      } catch (mailErr) {
        console.error("Failed to queue automated notification records:", mailErr);
      }

      setCreatedAppointment({
        id: docRef.id,
        ...appointmentData
      } as Appointment);

      setSubmitSuccess(true);
      onSuccess();
    } catch (e: any) {
      console.error("Error booking specific appointment:", e);
      setErrorMsg('Could not submit booking request. Please check firestore settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppURL = () => {
    if (!createdAppointment) return '#';
    const docWhatsAppRaw = doctor.whatsAppNumber || doctor.contactNumber || doctor.contact || '03001234567';
    const cleanNum = docWhatsAppRaw.replace(/\D/g, '');
    const formattedNum = cleanNum.startsWith('03') ? '92' + cleanNum.slice(1) : (cleanNum.startsWith('3') ? '92' + cleanNum : cleanNum);

    const text = `*Doctor Connect Pakistan - Appointment Booking*%0A%0A` +
      `*Appointment ID:* ${createdAppointment.id}%0A` +
      `*Patient:* ${createdAppointment.patientName} (${createdAppointment.gender}, ${createdAppointment.age} Yrs)%0A` +
      `*City:* ${createdAppointment.city}%0A` +
      `*WhatsApp:* ${createdAppointment.mobileNumber}%0A` +
      `*Doctor:* ${doctor.name} (${doctor.specialty})%0A` +
      `*Date:* ${createdAppointment.date}%0A` +
      `*Services:* ${(doctor.services || []).slice(0, 2).join(', ')}%0A` +
      `*Problem:* ${createdAppointment.message || 'Routine checkup'}`;
    return `https://wa.me/${formattedNum || '923001234567'}?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" id="profile-modal-overlay">
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col"
        id="profile-modal-content"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50 sticky top-0 bg-white z-20">
          <div>
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              PMC Certified Profile
            </span>
            <h3 className="text-xl font-bold text-slate-800 mt-1">
              About {doctor.name}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-100 transition"
            id="close-profile-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Panels */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 overflow-y-auto flex-1">
          
          {/* Left panel: Detailed Profile */}
          <div className="p-6 md:p-8 md:col-span-6 space-y-6 border-r border-slate-100 overflow-y-auto">
            {/* Top overview */}
            <div className="flex gap-4 items-start">
              <img 
                src={getDoctorAvatar(doctor)} 
                alt={doctor.name} 
                className="w-24 h-24 object-cover object-top rounded-2xl ring-4 ring-emerald-50 border border-slate-100 shadow-sm shrink-0" 
                onError={(e) => {
                  e.currentTarget.src = "/src/assets/images/doc_avatar_m1_1781893187039.jpg";
                }}
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className="text-xl font-extrabold text-slate-800">{doctor.name}</h4>
                <p className="text-sm text-emerald-600 font-bold mt-0.5">{doctor.specialty}</p>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{doctor.qualification}</p>
                
                <div className="flex gap-2 mt-3 text-[11px] font-bold text-slate-600">
                  <span className="bg-slate-100 px-2 py-1 rounded-md">{doctor.city}</span>
                  <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded-md">PMC ID Verified</span>
                </div>
              </div>
            </div>

            {/* Quick specifications */}
            <div className="grid grid-cols-2 gap-3.5 pt-4 border-t border-slate-50">
              <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-2.5 border border-slate-100">
                <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Experience</span>
                  <span className="text-xs font-bold text-slate-700">{doctor.experience} Years active</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-2.5 border border-slate-100">
                <span className="w-5 h-5 text-emerald-600 shrink-0 font-extrabold text-sm text-center">Rs.</span>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Consultation Fee</span>
                  <span className="text-xs font-bold text-slate-700">Rs. {doctor.fee.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Services provided */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <span>Expert Services & Treatments</span>
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {doctor.services.map((serv, index) => (
                  <span 
                    key={index} 
                    className="bg-emerald-50/75 border border-emerald-100 text-emerald-800 text-xs px-3 py-1.5 rounded-xl font-medium"
                  >
                    {serv}
                  </span>
                ))}
              </div>
            </div>

            {/* Clinic Details */}
            <div className="space-y-3 pt-4 border-t border-slate-50">
              <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Clinic Location & Timings</h5>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 block mb-0.5">{doctor.clinicName}</strong>
                    <span>{doctor.clinicAddress}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-slate-600 border-t border-slate-200/50 pt-2.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>{doctor.timing}</span>
                </div>
              </div>
            </div>

            {/* Phone/WhatsApp contacts */}
            <div className="space-y-3">
              <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Direct Contact Info</h5>
              <div className="flex gap-2 text-xs text-slate-600">
                <div className="flex-1 bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>{doctor.contact}</span>
                </div>
                <div className="flex-1 bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <span>PMC Verified Portal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Integrated Appointment Form */}
          <div className="p-6 md:p-8 md:col-span-6 bg-slate-50/50 flex flex-col justify-between overflow-y-auto">
            {submitSuccess ? (
              <div className="text-center py-10 space-y-4 my-auto" id="specific-success-view">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-slate-900">Request Registered!</h4>
                <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Thank you, <strong className="text-slate-800">{patientName}</strong>. Your consultation file with <strong className="text-emerald-700">{doctor.name}</strong> is generated.
                </p>

                {/* Receipt Card */}
                <div className="bg-white rounded-2xl p-4 text-left border border-slate-100 text-xs space-y-2 max-w-sm mx-auto shadow-sm">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-400">
                    <span>Reference ID:</span>
                    <span className="font-mono font-bold text-slate-700">{createdAppointment?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Patient Name:</span>
                    <strong className="text-slate-800">{patientName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Specialist Selected:</span>
                    <strong className="text-slate-800">{doctor.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Appointment Date:</span>
                    <strong className="text-emerald-700">{createdAppointment?.date}</strong>
                  </div>
                </div>

                {/* Automated Mail Dispatch Status Indicator */}
                <div className="bg-blue-50/80 border border-blue-105 rounded-2xl p-3 text-left text-xs text-blue-800 space-y-1 max-w-sm mx-auto shadow-sm">
                  <span className="font-extrabold text-[10px] uppercase tracking-wider block text-blue-900 flex items-center gap-1.5">
                    <Send className="w-3 h-3 animate-bounce" />
                    📧 Notification dispatch alerts sent:
                  </span>
                  <p className="text-[10px] leading-relaxed text-slate-600 font-sans">
                    • Copy sent to Doctor Email (<strong className="text-blue-900">{doctor.email || `${doctor.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@doctorconnect.pk`}</strong>)<br />
                    • Copy sent to Admin Email (<strong className="text-blue-900">roshanzameerkhan02@gmail.com</strong>)
                  </p>
                </div>

                {/* Direct WhatsApp Confirmation - Requested specifically */}
                <div className="space-y-3 pt-4 max-w-sm mx-auto">
                  <a
                    href={getWhatsAppURL()}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/20 active:scale-95 text-white py-3 px-4 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                    id="specific-whatsapp-confirm-btn"
                  >
                    <MessageSquare className="w-4 h-4 fill-white" />
                    <span>Chat on WhatsApp with Doctor</span>
                  </a>
                  
                  <button
                    onClick={() => {
                      setSubmitSuccess(false);
                      setPatientName('');
                      setMobileNumber('');
                      setAge('');
                      setCity('');
                      setProblem('');
                      setAppointmentDate('');
                      onClose();
                    }}
                    className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-2.5 px-4 rounded-xl text-xs font-semibold transition"
                    id="specific-done-success-btn"
                  >
                    Close Sheet
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-4" id="specific-booking-form">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">Book Consultation Slot</h4>
                  <p className="text-xs text-slate-400 mt-1">Check-in online instantly. Fill secure clinic form below.</p>
                </div>

                <hr className="border-slate-200" />

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Roshan Zameer Khan"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-xs bg-white"
                    id="profile-patient-name"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile / WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0311xxxxxxx"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-mono bg-white"
                    id="profile-patient-phone"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Age *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 24"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-xs bg-white"
                      id="profile-patient-age"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-xs bg-white"
                      id="profile-patient-gender"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Patient City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Faisalabad"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-xs bg-white"
                      id="profile-patient-city"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Consult Date *</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-sans bg-white"
                      id="profile-patient-date"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Clinical Concerns / Reason</label>
                  <textarea
                    rows={2}
                    placeholder="Describe chest pain, teeth staining, skin rash etc."
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2 text-xs bg-white"
                    id="profile-patient-message"
                  />
                </div>

                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-2.5 text-rose-700 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
                  id="profile-submit-booking-btn"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting Form...' : 'Schedule Appointment Request'}</span>
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
