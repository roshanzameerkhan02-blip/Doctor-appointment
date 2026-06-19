import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { SEED_DOCTORS } from './data/seed';

// Firebase configuration using provisioned details
const firebaseConfig = {
  apiKey: "AIzaSyDrb6wR8kJb-WQ0kNZbnI29m8-oeLfrMbA",
  authDomain: "ceremonial-alliance-xv7sv.firebaseapp.com",
  projectId: "ceremonial-alliance-xv7sv",
  storageBucket: "ceremonial-alliance-xv7sv.firebasestorage.app",
  messagingSenderId: "771651127982",
  appId: "1:771651127982:web:d89073556c178afaa73b3f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore targeting the specific provisioned database ID with long polling
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "ai-studio-51c0ae7c-6ad5-49c5-a8e1-fc82f6bc18da");

// Helper to seed database with default Pakistani doctors, if empty or containing legacy data
export async function seedDatabaseIfEmpty() {
  try {
    const doctorsCol = collection(db, 'doctors');
    const snapshot = await getDocs(doctorsCol);
    
    let hasLegacyData = false;
    const legacyDocIds = ['doc-1', 'doc-2', 'doc-3', 'doc-4', 'doc-5', 'doc-6'];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        legacyDocIds.includes(docSnap.id) || 
        data.city === 'Lahore' || 
        data.city === 'Karachi' || 
        data.name?.includes('Ali') || 
        data.name?.includes('Fatima')
      ) {
        hasLegacyData = true;
      }
    });

    if (snapshot.empty || hasLegacyData) {
      console.log('Detected empty database or legacy records. Performing a clean seed of verified Pakistani doctors...');
      
      // Delete existing doctors to avoid mixing fake data with verified data
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, 'doctors', docSnap.id));
      }

      // Delete existing sample appointments to clean up sample medical records
      try {
        const appointmentsCol = collection(db, 'appointments');
        const appointmentsSnapshot = await getDocs(appointmentsCol);
        for (const appSnap of appointmentsSnapshot.docs) {
          await deleteDoc(doc(db, 'appointments', appSnap.id));
        }
        console.log('Sample appointment records cleared successfully.');
      } catch (appErr) {
        console.error('Error clearing sample appointments:', appErr);
      }

      // Seed verified doctors
      for (const doctor of SEED_DOCTORS) {
        await setDoc(doc(db, 'doctors', doctor.id), doctor);
      }
      console.log('Verified database seeding completed successfully!');
    } else {
      console.log('Database already upgraded and contains verified doctor profiles. Seeding skipped.');
    }
  } catch (error) {
    console.error('Error during database seeding check:', error);
  }
}
