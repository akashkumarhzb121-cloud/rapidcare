# RapidCare — AI-Powered Care Continuity & Emergency Response Platform

> For SIH 26133 — *Accessibility and quality of public healthcare services, particularly in rural and underserved areas*
> **Organization:** Government of Maharashtra · **Theme:** MedTech / BioTech / HealthTech

---

## 🏗️ Architecture
┌───────────────────────────────────────────────┐
│ Frontend (React + Vite + Tailwind + i18n) │
│ Operator · Hospital Staff · CHW │
│ Languages: English · हिंदी · मराठी │
│ Offline-capable with IndexedDB │
└───────────────────────────────────────────────┘
│ REST + WebSocket
▼
┌───────────────────────────────────────────────┐
│ Backend (Node + Express + Socket.IO) │
│ JWT auth · 3 roles · RBAC │
│ Groq AI Triage · Geocoding · Distance │
└───────────────────────────────────────────────┘
│
▼
┌───────────────────────────────────────────────┐
│ MongoDB (Mongoose) │
│ Users · Patients · Facilities · Referrals │
│ Incidents · FollowUpSchedules │
└───────────────────────────────────────────────┘

text

---

## ✨ Features

### 🌐 Multilingual (English · हिंदी · मराठी)
- Complete UI translations
- Per-user language preference persisted
- Voice input & text-to-speech ready

### 📴 Offline-First (IndexedDB)
- Patient registration queued offline
- Symptom triage queued offline
- Auto-sync on reconnect with retry logic
- Pending count badge in header

### 👩‍⚕️ Community Health Worker
- Register patients with longitudinal records
- AI-powered symptom triage
- 🚨 Force Emergency toggle
- Referral tracking · Follow-up worklist
- **Voice input** for symptoms in Hindi/Marathi

### 🚑 Emergency Operator
- AI severity assessment (Groq)
- Distance + travel-time ranked hospital matching
- One-click dispatch with **bed reservation**
- **Awaiting hospital acknowledgment** state

### 🏥 Hospital Staff
- **Verification workflow:**
  - Receive dispatch → **Confirm & Accept** or **Reject**
  - Only after confirmation can patient be completed
- Real-time updates per facility
- Bed + medicine management
- Live counters (Active Emergencies, Completed Today)

### 🗺️ Multi-Facility Isolation
- Maharashtra districts: Mumbai, Pune, Nagpur, Nashik, Thane, Chh. Sambhajinagar, Kolhapur, Solapur, Amravati, Jalgaon
- Each staff sees only their facility's data
- Cross-facility referral routing

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Groq API key — free at https://console.groq.com/keys

### Setup

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env
node seedData.js      # Seed Maharashtra hospitals
npm run dev

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev
Open http://localhost:3000

🔑 Demo Credentials
Password for all accounts: password123

DistrictOperatorStaffCHW
Punepune.operator@rapidcare.compune.staff@rapidcare.compune.chw@rapidcare.com
Mumbaimumbai.operator@rapidcare.commumbai.staff@rapidcare.commumbai.chw@rapidcare.com
Nagpurnagpur.operator@rapidcare.comnagpur.staff@rapidcare.comnagpur.chw@rapidcare.com
Nashiknashik.operator@rapidcare.comnashik.staff@rapidcare.comnashik.chw@rapidcare.com
Thanethane.operator@rapidcare.comthane.staff@rapidcare.comthane.chw@rapidcare.com
Legacy: operator@rapidcare.com · staff@rapidcare.com · chw@rapidcare.com

🔧 Environment Variables
backend/.env
env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rapidcare
JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=your_groq_api_key_here
CORS_ORIGIN=http://localhost:3000
frontend/.env.local
env
VITE_API_BASE_URL=http://localhost:5000
📚 API Reference
Authentication
MethodEndpointAccess
POST/api/auth/registerPublic
POST/api/auth/loginPublic
PATCH/api/auth/languageAuthenticated
Patients
MethodEndpointAccess
POST/api/patientsCHW, Operator
GET/api/patients/search?q=Authenticated
GET/api/patients/:id/historyAuthenticated
Referrals
MethodEndpointAccess
POST/api/referralsCHW, Operator
PATCH/api/referrals/:id/statusAuthenticated
GET/api/referrals/facility/:idAuthenticated
GET/api/referrals/facility/:id/statsAuthenticated
Incidents (Emergency)
MethodEndpointAccess
POST/api/incidentsOperator
GET/api/incidents/:idAuthenticated
GET/api/incidents/facility/:idAuthenticated
PATCH/api/incidents/:id/dispatchOperator
PATCH/api/incidents/:id/acknowledgeStaff ⭐
PATCH/api/incidents/:id/rejectStaff ⭐
PATCH/api/incidents/:id/completeStaff
Facilities & Follow-ups
MethodEndpointAccess
GET/api/facilitiesPublic
GET/api/facilities/:id/dashboardAuthenticated
PATCH/api/facilities/:id/availabilityStaff
GET/api/followups/dueAuthenticated
GET/api/followups/allAuthenticated
PATCH/api/followups/:id/completeAuthenticated
🔄 Incident Verification Workflow
text
Operator creates incident
        ↓
Operator dispatches to hospital → Bed reserved
        ↓
Incident status: 'dispatched' (awaiting staff)
        ↓
Staff dashboard shows: ⚠️ Awaiting Your Confirmation
        ↓
   ┌────┴────┐
   ↓         ↓
Confirm    Reject
   ↓         ↓
'acknowledged'  'cancelled'
   ↓             ↓
Staff marks       Bed released
complete          Operator notified
   ↓
'completed'
📡 Socket.IO Events
EventDirectionPayload
hospitalAvailabilityUpdatedServer → All{ facilityId, availableBeds }
newIncidentAssignedServer → Facility{ incident, requiresAcknowledgment: true }
incidentAcknowledgedServer → Facility{ incident }
incidentStatusChangedServer → Incident room{ incidentId, status }
newReferralReceivedServer → Facility{ referral }
referralStatusChangedServer → Both facilities{ referral }
followUpCreatedServer → CHW{ referralId }
🏥 Real Maharashtra Hospital Data
Sourced from:

ABDM Health Facility Registry — https://nhpr.abdm.gov.in

National Health Portal — https://www.nhp.gov.in

PM-JAY Empanelled Hospitals — https://hospitals.pmjay.gov.in

data.gov.in

25 real facilities across 10 Maharashtra districts:

Mumbai City (KEM, JJ, GT)

Mumbai Suburban (Sion, Nair, Rajawadi)

Pune (Sassoon, Aundh)

Nagpur (GMC, Mayo)

Nashik, Thane, Chh. Sambhajinagar, Kolhapur, Solapur, Amravati, Jalgaon

🚢 Deployment
Backend → Render
Root: backend

Build: npm install

Start: npm start

Env: MONGODB_URI, JWT_SECRET, GROQ_API_KEY, CORS_ORIGIN

Frontend → Vercel
Root: frontend

Framework: Vite

Build: npm run build · Output: dist

Env: VITE_API_BASE_URL

vercel.json includes SPA rewrites for client-side routing.

🔒 Security
JWT (7-day expiry) · bcrypt (10 rounds)

3-role RBAC

Per-facility data isolation

CORS whitelist

📝 License
MIT

Built with ❤️ for rural Maharashtra healthcare
