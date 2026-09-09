import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English translations
const enTranslations = {
  common: {
    appName: 'RapidCare',
    tagline: 'AI-Powered Care Continuity & Emergency Response Platform',
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success'
  },
  patient: {
    register: 'Register Patient',
    name: 'Full Name',
    age: 'Age',
    gender: 'Gender',
    village: 'Village',
    district: 'District',
    phone: 'Phone Number',
    language: 'Preferred Language',
    chronicConditions: 'Chronic Conditions',
    highRiskFlags: 'High Risk Flags',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    registerSuccess: 'Patient registered successfully',
    searchPlaceholder: 'Search by name, village, or ABHA ID'
  },
  triage: {
    symptoms: 'Describe Symptoms',
    location: 'Location',
    analyze: 'Analyze & Find Care',
    analyzing: 'Analyzing...',
    severity: 'Severity',
    specialization: 'Specialization',
    aiReasoning: 'AI Analysis',
    critical: 'Critical',
    moderate: 'Moderate',
    mild: 'Mild'
  },
  referral: {
    create: 'Create Referral',
    status: 'Status',
    initiated: 'Initiated',
    inTransit: 'In Transit',
    received: 'Received',
    completed: 'Completed',
    cancelled: 'Cancelled',
    timeline: 'Referral Timeline',
    fromFacility: 'From Facility',
    toFacility: 'To Facility',
    linkedIncident: 'Linked Emergency'
  },
  followUp: {
    title: 'Follow-up Worklist',
    due: 'Due Follow-ups',
    complete: 'Complete',
    completed: 'Completed',
    missed: 'Missed',
    scheduled: 'Scheduled'
  }
};

// Hindi translations
const hiTranslations = {
  common: {
    appName: 'रैपिडकेयर',
    tagline: 'एआई-संचालित देखभाल निरंतरता और आपातकालीन प्रतिक्रिया मंच',
    login: 'लॉगिन',
    logout: 'लॉगआउट',
    register: 'पंजीकरण',
    submit: 'जमा करें',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    search: 'खोजें',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता'
  },
  patient: {
    register: 'रोगी पंजीकरण',
    name: 'पूरा नाम',
    age: 'आयु',
    gender: 'लिंग',
    village: 'गाँव',
    district: 'जिला',
    phone: 'फोन नंबर',
    language: 'पसंदीदा भाषा',
    chronicConditions: 'पुरानी बीमारियाँ',
    highRiskFlags: 'उच्च जोखिम चिह्न',
    male: 'पुरुष',
    female: 'महिला',
    other: 'अन्य',
    registerSuccess: 'रोगी सफलतापूर्वक पंजीकृत',
    searchPlaceholder: 'नाम, गाँव, या ABHA ID से खोजें'
  },
  triage: {
    symptoms: 'लक्षण बताएं',
    location: 'स्थान',
    analyze: 'विश्लेषण करें और देखभाल खोजें',
    analyzing: 'विश्लेषण हो रहा है...',
    severity: 'गंभीरता',
    specialization: 'विशेषज्ञता',
    aiReasoning: 'एआई विश्लेषण',
    critical: 'गंभीर',
    moderate: 'मध्यम',
    mild: 'हल्का'
  },
  referral: {
    create: 'रेफरल बनाएं',
    status: 'स्थिति',
    initiated: 'शुरू किया गया',
    inTransit: 'पारगमन में',
    received: 'प्राप्त हुआ',
    completed: 'पूर्ण',
    cancelled: 'रद्द',
    timeline: 'रेफरल समयरेखा',
    fromFacility: 'से सुविधा',
    toFacility: 'को सुविधा',
    linkedIncident: 'जुड़ी आपातकाल'
  },
  followUp: {
    title: 'फॉलो-अप कार्यसूची',
    due: 'देय फॉलो-अप',
    complete: 'पूर्ण करें',
    completed: 'पूर्ण',
    missed: 'छूटा हुआ',
    scheduled: 'निर्धारित'
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      hi: { translation: hiTranslations }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
