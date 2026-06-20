export interface Doctor {
  id: string;
  name: string; // Doctor Name
  specialty: string; // Specialty
  qualification: string; // Qualification
  experience: number; // Experience (number of years)
  clinicName: string; // fallback or legacy Clinic Name mapping
  clinicAddress: string; // fallback or legacy Clinic Address mapping
  contact: string; // fallback or legacy Contact Number mapping
  timing: string; // fallback or legacy Available Hours mapping
  fee: number; // Fee (PKR)
  city: string; // City
  imageUrl: string; // Profile Image URL (mapped to Profile Image)
  featured: boolean; // featured list status
  services: string[]; // list of services

  // Mandatory fields requested by user
  hospital?: string; // Hospital Name
  clinic?: string; // Clinic Name
  rating?: number; // Rating (e.g. 4.7)
  reviews?: number; // Reviews count (e.g. 522)
  availability?: string; // Availability (e.g. "9 AM - 11 PM" or "24/7" or custom timings)
  contactNumber?: string; // Contact Number
  whatsAppNumber?: string; // WhatsApp Number
  status: 'Pending' | 'Approved' | 'Rejected' | string; // Status (e.g. 'Approved' or 'Pending')
  
  // Registration and Dashboard extensions
  password?: string;
  email?: string;
  about?: string;
  availableDays?: string;
  pmdcNumber?: string; // PMDC registration reference
}

export interface Appointment {
  id: string;
  patientName: string;
  mobileNumber: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  city: string;
  message: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string; // appointment date
  status: 'Pending' | 'Contacted' | 'Sent to Doctor' | 'Completed';
  createdAt: string;
}

export function getDoctorAvatar(doc: { name?: string; id?: string; imageUrl?: string }): string {
  const avatars = [
    '/src/assets/images/doc_avatar_m1_1781893187039.jpg',
    '/src/assets/images/doc_avatar_f1_1781893207396.jpg',
    '/src/assets/images/doc_avatar_m2_1781893228161.jpg',
    '/src/assets/images/doc_avatar_f2_1781893248533.jpg'
  ];
  
  // If the imageUrl is defined, return it directly (covers local presets, base64 uploads, and custom URLs)
  if (doc.imageUrl && doc.imageUrl.trim() !== '') {
    return doc.imageUrl;
  }
  
  // Choose avatar based on gender hints in the doctor's name
  const name = (doc.name || '').toLowerCase();
  const isFemale = name.includes('sara') || 
                   name.includes('maheen') || 
                   name.includes('shagufta') || 
                   name.includes('farhat') || 
                   name.includes('farah') || 
                   name.includes('maryam') || 
                   name.includes('zainab') || 
                   name.includes('nadia') || 
                   name.includes('sarah') || 
                   name.includes('misbah') || 
                   name.includes('aiesha') || 
                   name.includes('ms. ') || 
                   name.includes('shagufta') || 
                   name.includes('sultana') ||
                   name.includes('shehwish');
  
  // Choose stable index 0 or 1 based on id or name hash
  const seedString = doc.id || doc.name || 'default';
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 2;
  
  if (isFemale) {
    return index === 0 ? avatars[1] : avatars[3]; // Female 1 or Female 2
  } else {
    return index === 0 ? avatars[0] : avatars[2]; // Male 1 or Male 2
  }
}

