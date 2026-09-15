# RapidCare — AI-Powered Care Continuity & Emergency Response Platform

> **Smart India Hackathon 2026 — Problem Statement 26133**
> *Accessibility and quality of public healthcare services, particularly in rural and underserved areas*
> **Organization:** Government of Maharashtra · **Theme:** MedTech / BioTech / HealthTech

---

## 🎯 What is RapidCare?

RapidCare is a full-stack platform that uses **AI-driven triage** to route rural patients to the **correct level of care** — from village sub-centres to district hospitals — tracking them across their journey, with **emergency ambulance dispatch** as the escalation path for critical cases.

**One AI engine, two outcomes:**
- If a case is **routine/moderate** → creates a **trackable referral** to the right facility tier
- If a case is **critical** → **automatically dispatches an ambulance** to the nearest hospital with matching specialization and available beds

Both paths feed into a **single longitudinal patient record** — finally giving rural health workers continuity that the current system doesn't have.

---

## 🏥 Problem Statement Coverage

RapidCare directly addresses every requirement in **SIH PS 26133**:

| PS Requirement | RapidCare Feature | Status |
|----------------|-------------------|--------|
| Assisted teleconsultation | Jitsi-based video rooms with specialist routing | ✅ |
| Appointment & queue management | Live OPD queue + slot-based appointment booking | ✅ |
| Digital triage | Groq Llama-3 severity + specialization classification | ✅ |
| Longitudinal patient records | Patient model with full history, referrals, incidents | ✅ |
| Referral tracking | Full lifecycle: initiated → in-transit → received → completed | ✅ |
| Diagnostic coordination | Test ordering + report upload + CHW visibility | ✅ |
| Medicine availability | Per-facility stock with low-stock alerts | ✅ |
| High-risk patient follow-up | Auto-scheduled worklists for maternal/child/chronic | ✅ |
| Facility dashboards | Role-based: CHW, Staff, Operator, Specialist, District Admin | ✅ |
| Emergency escalation | Real-time ambulance dispatch with bed reservation | ✅ |
| Interoperable records (ABDM) | `abhaId` field + ABDM HFR data source | ⚠️ Partial |
| Multilingual interaction | English · हिंदी · मराठी with voice input | ✅ |
| Low-connectivity support | IndexedDB offline queue with auto-sync | ✅ |
| Frontline health worker support | Dedicated CHW role + voice-first UI | ✅ |

---

## 🏗️ Architecture
┌──────────────────────────────────────────────────────────────────┐
│ FRONTEND (React 18 + Vite + Tailwind) │
│ │
│ ┌─────────┐ ┌──────────┐ ┌──────┐ ┌───────────┐ ┌────────────┐│
│ │Operator │ │Hospital │ │ CHW │ │Specialist │ │District ││
│ │Dashboard│ │Staff │ │ │ │Doctor │ │Admin ││
│ └─────────┘ └──────────┘ └──────┘ └───────────┘ └────────────┘│
│ │
│ i18n (EN/HI/MR) · Voice I/O · IndexedDB offline · Framer Motion │
└──────────────────────────────────────────────────────────────────┘
│
REST API + WebSocket (Socket.IO)
│
┌──────────────────────────────────────────────────────────────────┐
│ BACKEND (Node + Express + Socket.IO) │
│ │
│ Auth · Patients · Referrals · Incidents · Facilities │
│ Teleconsults · Queue · Appointments · Diagnostics · Analytics │
│ │
│ ┌────────────┐ ┌──────────────┐ ┌────────────────┐ │
│ │ Groq AI │ │ Geocoding │ │ Haversine │ │
│ │ Llama-3 │ │ (OSM) │ │ Distance │ │
│ └────────────┘ └──────────────┘ └────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
│
┌──────────────────────────────────────────────────────────────────┐
│ MongoDB (Mongoose ODM) │
│ │
│ Users · Patients · Facilities · Referrals · Incidents │
│ Teleconsultations · Queues · Appointments │
│ DiagnosticOrders · FollowUpSchedules │
└──────────────────────────────────────────────────────────────────┘

text

---

## ✨ Complete Feature Set

### 🌐 Platform-Wide
- **Multilingual UI** — English, हिंदी (Hindi), मराठी (Marathi) with persistent preference
- **Voice input** on every free-text field (Web Speech API)
- **Offline-first** — IndexedDB queue for patient registration, syncs on reconnect
- **Real-time updates** — Socket.IO with role- and facility-scoped rooms
- **JWT auth** — 3-role + 2-special RBAC (Operator, Staff, CHW, Specialist, District Admin)
- **Responsive design** — mobile-first Tailwind CSS with animated UI

### 👩‍⚕️ Community Health Worker (CHW)
- Register patients with full longitudinal records
- AI-powered symptom triage with voice input
- 🚨 Force Emergency toggle for critical cases
- Referral tracking with status timeline
- **Follow-up worklist** for maternal/child/chronic patients
- **Teleconsultation requests** — pick a specific specialist
- **Queue management** — add patients to any facility's OPD queue
- **Appointment booking** — real-time slot availability
- **Diagnostic ordering** — categorized test catalog (22 tests)
- **Offline-capable** — forms queue locally when offline

### 🚑 Emergency Operator
- AI severity assessment via Groq Llama-3
- Distance + travel-time ranked hospital matching
- One-click ambulance dispatch with **automatic bed reservation**
- **Voice input** on patient symptoms
- Real-time bed availability updates
- Incident status tracking (dispatched → acknowledged → completed)

### 🏥 Hospital Staff
- **Per-hospital isolation** — staff sees only their facility's data
- **Dispatch verification workflow:**
  - Receive dispatched incident → **Confirm & Accept** or **Reject**
  - Bed reserved on dispatch, released on rejection
- **Live OPD Queue** — token-based with priority + estimated wait
- **Appointments** — today's schedule
- **Diagnostics queue** — full lifecycle: ordered → collected → in-progress → ready → delivered
- **Referral handling** — accept (auto-creates CHW follow-up) or complete
- Bed + medicine availability management
- Live counters (Active Emergencies, Completed Today, Pending Referrals)

### 🩺 Specialist Doctor
- Receive routed teleconsult requests (by specialization)
- **Accept / Reject** with reason
- **Jitsi video call** embedded
- **Post-call completion modal** — diagnosis + prescription + clinical notes + follow-up scheduling
- Full patient context visible during consultation

### 📊 District Admin
- **Interactive facility map** (Leaflet) with color-coded markers:
  - 🟢 Available · 🟡 Busy · 🟠 Critical · 🔴 Full
- Filter by facility type or district
- **KPI dashboard** — facilities, occupancy, referral completion, active emergencies
- **Referral trend chart** (14-day line + bar)
- **Emergency distribution** by specialization and severity
- **Facility performance ranking** (🥇🥈🥉)
- **Medicine shortage alerts** with severity levels

---

## 📁 Project Structure
rapidcare/
├── backend/ # Express API server
│ ├── models/
│ │ ├── User.js # 5 roles
│ │ ├── Patient.js # Longitudinal records
│ │ ├── Facility.js # Tiered (sub-centre → district)
│ │ ├── Referral.js # With timeline + emergency flag
│ │ ├── Incident.js # Emergency dispatch
│ │ ├── FollowUpSchedule.js # High-risk tracking
│ │ ├── Teleconsultation.js # Video consults
│ │ ├── Queue.js # Token-based OPD
│ │ ├── Appointment.js # Slot-based booking
│ │ └── DiagnosticOrder.js # Test orders + reports
│ ├── controllers/
│ │ ├── authController.js
│ │ ├── incidentController.js
│ │ └── hospitalController.js
│ ├── services/
│ │ ├── aiService.js # Groq + keyword fallback
│ │ ├── locationService.js # OSM geocoding
│ │ ├── distanceService.js # Haversine ranking
│ │ ├── patientService.js
│ │ ├── referralService.js # Auto-incident on critical
│ │ ├── followUpService.js
│ │ ├── teleconsultService.js # Specialist routing
│ │ ├── queueService.js # Wait-time estimation
│ │ ├── appointmentService.js # Slot availability
│ │ ├── diagnosticService.js # Test catalog + workflow
│ │ └── analyticsService.js # District aggregations
│ ├── routes/ # 11 route files
│ ├── middleware/authMiddleware.js # JWT + RBAC
│ ├── server.js # Express + Socket.IO
│ ├── seedData.js # Maharashtra hospitals
│ ├── add-specialists.js # 5 specialist users
│ └── add-admin.js # 2 district admin users
│
├── frontend/ # React + Vite SPA
│ ├── src/
│ │ ├── pages/
│ │ │ ├── Login.jsx
│ │ │ ├── Register.jsx
│ │ │ ├── LandingPage.jsx
│ │ │ ├── OperatorDashboard.jsx
│ │ │ ├── HospitalDashboard.jsx
│ │ │ ├── CHWDashboard.jsx
│ │ │ ├── SpecialistDashboard.jsx
│ │ │ └── AdminDashboard.jsx
│ │ ├── components/
│ │ │ ├── LanguageSwitcher.jsx
│ │ │ ├── VoiceInput.jsx
│ │ │ ├── OfflineBadge.jsx
│ │ │ ├── TeleconsultRoom.jsx
│ │ │ ├── FacilityMap.jsx
│ │ │ └── PrivateRoute.jsx
│ │ ├── context/
│ │ │ ├── AuthContext.jsx
│ │ │ ├── SocketContext.jsx
│ │ │ └── OfflineContext.jsx
│ │ ├── services/
│ │ │ ├── api.js # axios with JWT
│ │ │ └── offlineQueue.js # IndexedDB
│ │ ├── i18n/
│ │ │ ├── index.js
│ │ │ └── locales/{en,hi,mr}.json
│ │ ├── App.jsx # Routing
│ │ ├── main.jsx
│ │ └── index.css # Tailwind + custom
│ ├── index.html
│ ├── vite.config.js
│ ├── tailwind.config.js
│ ├── postcss.config.js
│ ├── vercel.json
│ └── .env.development / .env.production
│
└── README.md

text

---

## 🚀 Quick Start

### Prerequisites
- Node.js **v18+**
- MongoDB (local or [Atlas](https://www.mongodb.com/cloud/atlas))
- Groq API key — free at https://console.groq.com/keys

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
node seedData.js          # Maharashtra hospitals
node add-specialists.js   # 5 specialist doctors
node add-admin.js         # 2 district admins
npm run dev
Frontend Setup
bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
Open http://localhost:3000

🔑 Demo Credentials
All passwords: password123

District Users (Maharashtra)
DistrictOperatorStaffCHW
Punepune.operator@rapidcare.compune.staff@rapidcare.com (Sassoon)pune.chw@rapidcare.com
Mumbai Citymumbai.operator@rapidcare.commumbai.staff@rapidcare.com (KEM)mumbai.chw@rapidcare.com
Nagpurnagpur.operator@rapidcare.comnagpur.staff@rapidcare.com (GMC)nagpur.chw@rapidcare.com
Nashiknashik.operator@rapidcare.comnashik.staff@rapidcare.comnashik.chw@rapidcare.com
Thanethane.operator@rapidcare.comthane.staff@rapidcare.comthane.chw@rapidcare.com
Specialists
SpecializationEmail
Cardiaccardio.specialist@rapidcare.com
Neurologyneuro.specialist@rapidcare.com
Pediatricpediatric.specialist@rapidcare.com
Generalgeneral.specialist@rapidcare.com
Respiratoryrespiratory.specialist@rapidcare.com
District Admins
RoleEmail
State Health Commissioneradmin@rapidcare.com
Pune District Officerpune.admin@rapidcare.com
Legacy Credentials
operator@rapidcare.com · staff@rapidcare.com · chw@rapidcare.com

🔧 Environment Variables
backend/.env
env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rapidcare
JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=your_groq_api_key_here
CORS_ORIGIN=http://localhost:3000
frontend/.env.local (Development)
env
VITE_API_BASE_URL=http://localhost:5000
frontend/.env.production (Production)
env
VITE_API_BASE_URL=https://your-backend.onrender.com
📚 API Reference
Authentication (/api/auth)
MethodEndpointAccess
POST/registerPublic
POST/loginPublic
PATCH/languageAuthenticated
Patients (/api/patients)
MethodEndpointAccess
POST/CHW, Operator
GET/search?q=Authenticated
GET/:id/historyAuthenticated
Referrals (/api/referrals)
MethodEndpointAccess
POST/CHW, Operator
PATCH/:id/statusAuthenticated
GET/facility/:id?type=Authenticated
GET/facility/:id/statsAuthenticated
Incidents (/api/incidents) — Emergency
MethodEndpointAccess
POST/Operator
GET/:idAuthenticated
GET/facility/:idAuthenticated
PATCH/:id/dispatchOperator
PATCH/:id/acknowledgeStaff
PATCH/:id/rejectStaff
PATCH/:id/completeStaff
Facilities (/api/facilities)
MethodEndpointAccess
GET/Public
GET/:id/dashboardAuthenticated
PATCH/:id/availabilityStaff
Follow-ups (/api/followups)
MethodEndpointAccess
GET/dueAuthenticated
GET/allAuthenticated
PATCH/:id/completeAuthenticated
Teleconsults (/api/teleconsults)
MethodEndpointAccess
GET/specialistsAuthenticated
POST/CHW, Operator
GET/pendingSpecialist
GET/my-consultsSpecialist
GET/my-requestsCHW
PATCH/:id/acceptSpecialist
PATCH/:id/rejectSpecialist
PATCH/:id/startSpecialist
PATCH/:id/completeSpecialist
Queue (/api/queue)
MethodEndpointAccess
POST/CHW, Operator, Staff
GET/facility/:idAuthenticated
PATCH/facility/:id/call-nextStaff
PATCH/:id/statusStaff
PATCH/:id/skipStaff
GET/patient/:idAuthenticated
Appointments (/api/appointments)
MethodEndpointAccess
POST/CHW, Operator, Staff
GET/facility/:idAuthenticated
GET/facility/:id/statsAuthenticated
GET/facility/:id/slots?date=Authenticated
GET/my-upcomingCHW
PATCH/:id/statusStaff
PATCH/:id/cancelAuthenticated
Diagnostics (/api/diagnostics)
MethodEndpointAccess
GET/catalogAuthenticated
POST/CHW, Operator, Staff
GET/facility/:idAuthenticated
GET/facility/:id/statsAuthenticated
GET/my-ordersCHW
GET/patient/:idAuthenticated
PATCH/:id/statusStaff
PATCH/:id/upload-reportStaff
PATCH/:id/cancelAuthenticated
Analytics (/api/analytics)
MethodEndpointAccess
GET/mapAuthenticated
GET/overviewDistrict Admin
GET/referral-trendDistrict Admin
GET/emergency-distributionDistrict Admin
GET/severity-distributionDistrict Admin
GET/medicine-shortagesDistrict Admin
GET/facility-rankingDistrict Admin
GET/district-breakdownDistrict Admin
📡 Socket.IO Events
EventDirectionPayload
hospitalAvailabilityUpdatedServer → All{ facilityId, availableBeds }
newIncidentAssignedServer → Facility{ incident, requiresAcknowledgment }
incidentAcknowledgedServer → Facility{ incident }
incidentStatusChangedServer → Incident room{ incidentId, status }
newReferralReceivedServer → Facility{ referral }
referralStatusChangedServer → Both facilities{ referral }
followUpCreatedServer → CHW{ referralId }
facilityStatsUpdatedServer → Facility{ facilityId, stats }
queueUpdatedServer → Facility{ action, entry }
appointmentBookedServer → Facility{ appointment }
newDiagnosticOrderServer → Facility{ order }
diagnosticOrderUpdatedServer → Facility + CHW{ order }
diagnosticReportReadyServer → CHW{ order, reportUrl }
newTeleconsultRequestServer → Specialist{ consult, preAssigned }
teleconsultAcceptedServer → CHW{ consultId }
teleconsultStartedServer → CHW{ consultId }
teleconsultCompletedServer → CHW{ consultId, prescription }
teleconsultRejectedServer → CHW{ consultId, reason }
🏥 Real Maharashtra Hospital Data
All facility data is curated from authoritative Indian government sources:

SourceLink
National Health Portalhttps://www.nhp.gov.in/hospital-directory
ABDM Health Facility Registryhttps://nhpr.abdm.gov.in
PM-JAY Empanelled Hospitalshttps://hospitals.pmjay.gov.in
data.gov.inhttps://data.gov.in
25 real facilities across 11 Maharashtra districts:

Mumbai City: KEM, JJ, GT

Mumbai Suburban: Sion, Nair, Rajawadi, Urban Health Centre Dharavi

Pune: Sassoon, Aundh, PHC Wagholi, Sub-Centre Uruli Kanchan

Nagpur: GMC, Mayo, PHC Kamptee

Nashik: Civil Hospital, PHC Igatpuri

Thane: Civil Hospital, Horizon, Sub-Centre Badlapur

Chh. Sambhajinagar: GMC Aurangabad, PHC Paithan

Kolhapur, Solapur, Amravati, Jalgaon: District civil hospitals

Coordinates verified against Google Maps / OpenStreetMap.

🚢 Deployment
Backend → Render
Push to GitHub

Render → New Web Service → Connect repo

Root Directory: backend

Build: npm install · Start: npm start

Environment variables:

MONGODB_URI (MongoDB Atlas connection string)

JWT_SECRET

GROQ_API_KEY

CORS_ORIGIN=https://your-vercel-url.vercel.app

Deploy → run node seedData.js, node add-specialists.js, node add-admin.js in Render Shell

Frontend → Vercel
Vercel → Import Project → select repo

Root Directory: frontend

Framework: Vite

Environment variable:

VITE_API_BASE_URL=https://your-backend.onrender.com

Deploy

vercel.json handles SPA rewrites.

🔒 Security
JWT authentication (7-day expiry)

bcrypt password hashing (salt rounds: 10)

Role-Based Access Control (5 roles)

Per-facility data isolation

CORS whitelist

Environment variable isolation

Server-side input validation on every endpoint

📊 Impact & Outcomes
RapidCare directly addresses the PS's expected outcomes:

Expected OutcomeHow RapidCare Delivers
Reduced travel & waiting timeDistance-ranked hospital matching + live queue ETA
Earlier consultationAI triage in seconds + teleconsultation
Improved referral completionAuto-tracking + status updates both directions
Better follow-up for maternal/child/chronicAuto-scheduled follow-up worklists
Improved medicine/diagnostic visibilityLive stock + diagnostics dashboard
Enhanced quality monitoringDistrict admin analytics + performance ranking
🗺️ Roadmap
□ Full ABDM ABHA integration (create/fetch patient ABHA IDs)
□ Real-time ambulance GPS tracking with live route
□ SMS/WhatsApp notifications via Twilio
□ Patient-facing mobile view with QR code
□ Voice input in Marathi/Hindi dialects
□ Blockchain-anchored audit trail for AI triage decisions
□ Multi-state expansion (Karnataka, Gujarat, Rajasthan)
🧪 Testing Checklist
□ Backend health: curl http://localhost:5000/health
□ CHW: Register patient → Triage → Referral
□ CHW: Force Emergency → Incident created
□ CHW: Teleconsult → Specialist accepts → Video call
□ CHW: Add to Queue → Staff calls next
□ CHW: Book Appointment → Staff sees on schedule
□ CHW: Order Diagnostics → Staff uploads report
□ Operator: Create incident → Dispatch → Staff acknowledges
□ Specialist: Accept → Video call → Prescribe → Completed
□ Admin: Overview KPIs → Map → Ranking → Shortages
□ Offline: Toggle network off → register patient → toggle on → sync
□ Multilingual: Switch EN → HI → MR on all pages
🤝 Contributing
Fork the repo

Create a feature branch (git checkout -b feature/your-feature)

Commit (git commit -m 'Add amazing feature')

Push (git push origin feature/your-feature)

Open a Pull Request

📄 License
MIT License

🙏 Acknowledgments
Smart India Hackathon 2026 — Problem Statement 26133

Maharashtra State Innovation Society — Problem owner

Groq — Sub-second AI inference

OpenStreetMap — Free geocoding

Jitsi Meet — Free WebRTC video

National Health Portal & ABDM — Real facility data

Built with ❤️ for rural Maharashtra's healthcare accessibility
