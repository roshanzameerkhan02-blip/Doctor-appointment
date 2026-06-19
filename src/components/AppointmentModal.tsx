import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Phone, CheckCircle, MessageSquare, AlertCircle, Sparkles, Send } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Doctor, Appointment, getDoctorAvatar } from '../types';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  preselectedDoctor: Doctor | null;
  onSuccess: () => void;
}

export default function AppointmentModal({ isOpen, onClose, doctors, preselectedDoctor, onSuccess }: AppointmentModalProps) {
  const [selectedDocId, setSelectedDocId] = useState('');
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

  useEffect(() => {
    if (preselectedDoctor) {
      setSelectedDocId(preselectedDoctor.id);
    } else if (doctors.length > 0) {
      setSelectedDocId(doctors[0].id);
    }
  }, [preselectedDoctor, doctors]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Validations
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
      setErrorMsg('Please choose a preferred appointment date.');
      return;
    }

    const selectedDoc = doctors.find(d => d.id === selectedDocId);
    if (!selectedDoc) {
      setErrorMsg('Please select a valid doctor.');
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
        doctorId: selectedDoc.id,
        doctorName: selectedDoc.name,
        doctorSpecialty: selectedDoc.specialty,
        date: appointmentDate,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(appointmentsCol, appointmentData);
      
      // Automatic real-time Email dispatch queuing
      try {
        const emailsCol = collection(db, 'appointment_emails');
        const docEmail = selectedDoc.email || `${selectedDoc.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@doctorconnect.pk`;
        
        // 1. Queue email to doctor
        await addDoc(emailsCol, {
          to: docEmail,
          subject: `Urgent: New Patient Consultation File [Ref: ${docRef.id}]`,
          body: `Dear ${selectedDoc.name},\n\nYou have received a new consultation request on Doctor Connect.\n\n` +
                `Patient Details:\n` +
                `- Clinical File ID: ${docRef.id}\n` +
                `- Patient Name: ${patientName.trim()}\n` +
                `- Contact Number: ${mobileNumber.trim()}\n` +
                `- Age & Gender: ${age} Years Old, ${gender}\n` +
                `- City: ${city.trim()}\n` +
                `- Proposed Session Date: ${appointmentDate}\n` +
                `- Concerns: "${problem.trim() || 'General Specialist routing'}"\n\n` +
                `Please log into your Doctor Workspace Dashboard to modify session statuses and edit clinic timings.\n` +
                `Regards,\nDoctor Connect Pakistan Healtcare Gateways`,
          createdAt: new Date().toISOString(),
          type: 'doctor_notification'
        });

        // 2. Queue email to admin
        await addDoc(emailsCol, {
          to: 'roshanzameerkhan02@gmail.com',
          subject: `Alert: New Patient Reservation Opened [ID: ${docRef.id}]`,
          body: `Dear Admin,\n\nA new clinical patient appointment reservation has been registered.\n\n` +
                `- Associated Specialist: ${selectedDoc.name} (${selectedDoc.specialty})\n` +
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
      console.error("Error booking appointment: ", e);
      setErrorMsg('Could not submit booking request. Please check firestore settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDocInfo = doctors.find(d => d.id === selectedDocId);

  // Construct direct WhatsApp URL prefilled with details targeting doctor's custom WhatsApp number
  const getWhatsAppURL = () => {
    if (!createdAppointment || !selectedDocInfo) return '#';
    const docWhatsAppRaw = selectedDocInfo.whatsAppNumber || selectedDocInfo.contactNumber || selectedDocInfo.contact || '03001234567';
    const cleanNum = docWhatsAppRaw.replace(/\D/g, '');
    const formattedNum = cleanNum.startsWith('03') ? '92' + cleanNum.slice(1) : (cleanNum.startsWith('3') ? '92' + cleanNum : cleanNum);

    const text = `*Doctor Connect Pakistan - Appointment Booking*%0A%0A` +
      `*Appointment ID:* ${createdAppointment.id}%0A` +
      `*Patient:* ${createdAppointment.patientName} (${createdAppointment.gender}, ${createdAppointment.age} Yrs)%0A` +
      `*Mobile:* ${createdAppointment.mobileNumber}%0A` +
      `*City:* ${createdAppointment.city}%0A` +
      `*Doctor:* ${createdAppointment.doctorName} (${createdAppointment.doctorSpecialty})%0A` +
      `*Date:* ${createdAppointment.date}%0A` +
      `*Reason/Problem:* ${createdAppointment.message || 'General checkup'}`;
    return `https://wa.me/${formattedNum || '923001234567'}?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" id="booking-modal-overlay">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col justify-between"
        id="booking-modal-content"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-emerald-600" />
              {submitSuccess ? 'Booking Successful' : 'Request Appointment'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {submitSuccess ? 'Your request has been filed.' : 'Fill out quick medical file for instant check-in.'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-100"
            id="close-booking-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto">
          {submitSuccess ? (
            <div className="text-center py-6 space-y-4" id="booking-success-view">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-800">Appointment Registered!</h4>
              <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                Thank you, <strong className="text-slate-800">{patientName}</strong>. Your request for <strong className="text-emerald-700">{selectedDocInfo?.name}</strong> has been generated successfully and is currently under review.
              </p>

              {/* Patient File Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 max-w-sm mx-auto text-xs space-y-2.5">
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5 text-slate-400">
                  <span>Reference ID:</span>
                  <span className="font-mono text-[10px] font-bold text-slate-600">{createdAppointment?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">City / Patient:</span>
                  <span className="font-semibold text-slate-700">{createdAppointment?.city} / {createdAppointment?.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Doctor:</span>
                  <span className="font-semibold text-slate-700">{createdAppointment?.doctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-semibold text-emerald-700">{createdAppointment?.date}</span>
                </div>
              </div>

              {/* Automated Mail Dispatch Status Indicator */}
              <div className="bg-blue-50/80 border border-blue-105 rounded-2xl p-3.5 text-left text-xs text-blue-800 space-y-1 max-w-sm mx-auto shadow-sm">
                <span className="font-extrabold text-[10px] uppercase tracking-wider block text-blue-900 flex items-center gap-1.5">
                  <Send className="w-3 h-3 animate-bounce" />
                  📧 Notification dispatch alerts sent:
                </span>
                <p className="text-[11px] leading-relaxed text-slate-600 font-sans">
                  • Automated copy sent to Doctor Email (<strong className="text-blue-850 text-blue-900">{selectedDocInfo?.email || `${selectedDocInfo?.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'doctor'}@doctorconnect.pk`}</strong>)<br />
                  • Alert notification sent to Admin Email (<strong className="text-blue-850 text-blue-900">roshanzameerkhan02@gmail.com</strong>)
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 max-w-sm mx-auto">
                {/* WHATSAPP CTA - User requested direct WhatsApp appointment button */}
                <a
                  href={getWhatsAppURL()}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/20 active:scale-95 text-white py-3.5 px-4 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                  id="whatsapp-confirm-btn"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span>Chat on WhatsApp with Doctor</span>
                </a>
                
                <button
                  onClick={() => {
                    setSubmitSuccess(false);
                    // Clear fields
                    setPatientName('');
                    setMobileNumber('');
                    setAge('');
                    setCity('');
                    setProblem('');
                    setAppointmentDate('');
                    onClose();
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl text-sm font-semibold transition"
                  id="done-success-btn"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" id="appointment-booking-form">
              {/* Select Doctor Field */}
              {!preselectedDoctor && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Doctor *</label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-sm bg-white text-slate-800 font-medium"
                    id="form-select-doctor"
                  >
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.specialty} - Rs. {doc.fee})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Preselected Doctor Widget */}
              {preselectedDoctor && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-center">
                  <img 
                    src={getDoctorAvatar(preselectedDoctor)} 
                    alt={preselectedDoctor.name} 
                    className="w-12 h-12 object-cover rounded-xl border border-white"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Booking Consultation With</span>
                    <h4 className="font-bold text-slate-800 text-sm">{preselectedDoctor.name}</h4>
                    <p className="text-xs text-slate-500">{preselectedDoctor.specialty} • Fee: Rs. {preselectedDoctor.fee}</p>
                  </div>
                </div>
              )}

              <hr className="border-slate-100 my-2" />

              {/* Patient Personal Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Patient Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Roshan Zameer"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm"
                      id="form-patient-name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">WhatsApp / Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 03001234567"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono"
                      id="form-patient-phone"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Age (Years) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    placeholder="Children/Adult Age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-sm"
                    id="form-patient-age"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-sm bg-white"
                    id="form-patient-gender"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Lahore / Islamabad etc"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-sm"
                    id="form-patient-city"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Appointment Preferred Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]} // prevent past dates
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-sm font-sans"
                    id="form-patient-date"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Describe Problem / Message (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Severe chest pain, recurring fever since yesterday, orthodontic consultation request."
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-sm"
                  id="form-patient-message"
                />
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Call to action buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-xl text-sm font-semibold transition border border-slate-100"
                  id="cancel-booking-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 active:scale-95 transition-all ${
                    isSubmitting ? 'opacity-80 cursor-not-allowed' : ''
                  }`}
                  id="submit-booking-btn"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>{isSubmitting ? 'Submitting File...' : 'Book Appointment'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
