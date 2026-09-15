# RapidCare Backend API

> Node.js + Express + MongoDB backend for the RapidCare care continuity platform.

## 🎯 Overview

This is the backend for RapidCare — the AI-powered care continuity and emergency response platform for rural Maharashtra. It exposes a complete REST API with real-time Socket.IO updates, JWT authentication, and 5-role RBAC.

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js v18+ |
| Framework | Express.js |
| Database | MongoDB + Mongoose ODM |
| AI | Groq SDK (Llama-3) with keyword fallback |
| Auth | JWT + bcryptjs |
| Real-time | Socket.IO |
| Geocoding | OpenStreetMap Nominatim |
| Distance | Haversine formula |

---

## ✨ Features

### 🔐 Authentication & RBAC
- JWT-based auth with 7-day expiry
- bcrypt password hashing (10 rounds)
- **5 roles:**
  - `ambulance_operator`
  - `hospital_staff`
  - `community_health_worker`
  - `specialist`
  - `district_admin`
- Per-facility data isolation
- Language preference persistence

### 🤖 AI Triage Engine
- **Primary:** Groq Llama-3 (`openai/gpt-oss-120b`)
- **Fallback:** Keyword-based classifier
- **Output:** `{ severity, requiredSpecialization, aiReasoning }`
- Strict system prompt + JSON validation
- Safe defaults on any failure
- Every call logged server-side

### 🔀 Dual-Path Referral System
- **Critical** → auto-creates Incident → dispatches ambulance
- **Moderate/Mild** → creates Referral → routes to correct facility tier
- Same AI engine drives both

### 📅 Auto Follow-Up Scheduling
- Referral accepted → CHW follow-up auto-created (7 days)
- Teleconsult completed with follow-up days → auto-scheduled
- Maternal/child/chronic flagged with high priority

### 🚑 Emergency Dispatch
- Distance + travel-time ranking
- **Bed reservation on dispatch**
- **Hospital staff verification:** confirm/reject
- Automatic bed release on rejection
- Multi-facility isolation

### 📹 Teleconsultation
- Jitsi room generation
- Specialist routing by specialization
- Accept / Reject / Complete lifecycle
- Prescription + diagnosis + follow-up days

### 🎫 Queue Management
- Token-based per facility
- Priority: emergency > high > normal
- Estimated wait time calculation
- Call next / skip / complete actions

### 📅 Appointment Booking
- Real-time slot availability (30-min slots, 9am–5pm)
- Conflict detection (±15 min window)
- Department routing

### 🔬 Diagnostics
- **22-test catalog** with categories and turnaround times
- Per-test status tracking
- Report URL upload by staff
- CHW gets notified when reports ready

### 📊 Analytics
- Facility map data with live bed status
- District overview KPIs
- 14-day referral trend
- Emergency/severity distributions
- Facility performance ranking
- Medicine shortage alerts

---

## 📁 Directory Structure
backend/
├── models/ # Mongoose schemas
│ ├── User.js # 5 roles, language, specialization
│ ├── Patient.js # Longitudinal records
│ ├── Facility.js # Tiered (4 types), taluka, stock
│ ├── Referral.js # Timeline, emergency flag, linkedIncident
│ ├── Incident.js # Verification workflow, bedReserved
│ ├── FollowUpSchedule.js # Maternal/child/chronic tracking
│ ├── Teleconsultation.js # Video consults, prescription
│ ├── Queue.js # Token, priority, wait-time
│ ├── Appointment.js # Slot, department, status
│ └── DiagnosticOrder.js # Tests array, per-test status
│
├── controllers/ # Route handlers
│ ├── authController.js # Register, login, language update
│ ├── incidentController.js # Create, dispatch, acknowledge, reject, complete
│ └── hospitalController.js # List, dashboard, availability
│
├── services/ # Business logic
│ ├── aiService.js # Groq integration + fallback
│ ├── locationService.js # Geocoding + travel time
│ ├── distanceService.js # Haversine ranking
│ ├── patientService.js # Register + history aggregation
│ ├── referralService.js # Auto-incident + auto-followup
│ ├── followUpService.js # Scheduling + completion
│ ├── teleconsultService.js # Specialist routing
│ ├── queueService.js # Wait-time estimation
│ ├── appointmentService.js # Slot availability + conflicts
│ ├── diagnosticService.js # Catalog + lifecycle
│ └── analyticsService.js # District aggregations
│
├── routes/ # Express routers
│ ├── authRoutes.js
│ ├── patientRoutes.js
│ ├── referralRoutes.js
│ ├── incidentRoutes.js
│ ├── hospitalRoutes.js
│ ├── facilityRoutes.js
│ ├── followUpRoutes.js
│ ├── teleconsultRoutes.js
│ ├── queueRoutes.js
│ ├── appointmentRoutes.js
│ ├── diagnosticRoutes.js
│ └── analyticsRoutes.js
│
├── middleware/
│ └── authMiddleware.js # JWT verify + roleMiddleware
│
├── server.js # Express app + Socket.IO setup
├── seedData.js # 25 real Maharashtra facilities
├── add-specialists.js # 5 specialist users
├── add-admin.js # 2 district admin users
├── test-system.js # Full API test suite
└── package.json

text

---

## 🔧 Environment Variables

Create `.env` from `.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rapidcare
JWT_SECRET=replace_with_strong_secret
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
CORS_ORIGIN=http://localhost:3000
VariableRequiredDescription
PORTNoServer port (default 5000)
MONGODB_URIYesMongoDB connection string
JWT_SECRETYesSecret for JWT signing
GROQ_API_KEYNoGroq API key (falls back to keyword triage)
CORS_ORIGINYesAllowed frontend origin
🚀 Setup
bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Edit .env with your credentials

# 3. Seed (in order)
node seedData.js            # 25 facilities + users + sample patients
node add-specialists.js     # 5 specialists across 5 specializations
node add-admin.js           # 2 district admins

# 4. Run
npm run dev      # nodemon (development)
npm start        # production
Server runs at http://localhost:5000

📊 Data Models
User
javascript
{
  name, email, password (bcrypt),
  role: 'ambulance_operator' | 'hospital_staff' | 'community_health_worker' | 'specialist' | 'district_admin',
  linkedFacilityId, linkedHospitalId,
  languagePreference: 'en' | 'hi' | 'mr',
  specialization: 'cardiac' | 'trauma' | ... | null,
  isAvailableForConsult: Boolean
}
Patient (Longitudinal Record)
javascript
{
  name, age, gender, village, district, state, phone,
  languagePreference, chronicConditions[], highRiskFlags[],
  abhaId (future), registeredBy, registeredAtFacility,
  lastVisitDate
}
Facility (Tiered)
javascript
{
  name, facilityType: 'sub-centre' | 'phc' | 'rural-hospital' | 'district-hospital',
  location: { lat, lng }, address, district, taluka, state,
  parentFacility (tier hierarchy),
  specializations[], totalBeds, availableBeds,
  contactNumber, staffUserId, accreditation,
  emergencyServices[], medicineStock[], diagnosticServices[],
  averageResponseTime, rating
}
Referral
javascript
{
  patientId, fromFacilityId, toFacilityId,
  reason, aiReasoning, severity, requiredSpecialization,
  referralType: 'routine' | 'urgent' | 'emergency',
  status: 'initiated' | 'in-transit' | 'received' | 'completed' | 'cancelled',
  isEmergencyFlagged, linkedIncident,
  acceptedAt, completedAt,
  timeline: [{ status, timestamp, updatedBy, facilityId, notes }],
  createdBy
}
Incident (Emergency)
javascript
{
  patientDescription, severity, requiredSpecialization, aiReasoning,
  status: 'pending' | 'matched' | 'dispatched' | 'acknowledged' | 'completed' | 'cancelled',
  assignedHospitalId, ambulanceLocation: { lat, lng, address, displayName },
  patientLocation, patientId, linkedReferral,
  bedReserved, dispatchedAt, acknowledgedAt, acknowledgedBy,
  verificationNotes, rejectedReason, completedAt, createdBy
}
FollowUpSchedule
javascript
{
  patientId, referralId, condition,
  scheduleType: 'maternal' | 'child' | 'chronic' | 'post-referral' | 'post-discharge',
  dueDate, status: 'scheduled' | 'completed' | 'missed' | 'cancelled',
  priority: 'high' | 'medium' | 'low',
  assignedTo, notes, completedDate, completedBy
}
Teleconsultation
javascript
{
  patientId, chwId, doctorId, roomId (Jitsi),
  symptoms, requiredSpecialization,
  aiSeverity, aiReasoning,
  status: 'requested' | 'accepted' | 'active' | 'completed' | 'cancelled',
  priority, requestedAt, acceptedAt, startedAt, endedAt, durationMinutes,
  prescription, notes, diagnosis, followUpDays
}
Queue
javascript
{
  facilityId, patientId, addedBy, tokenNumber,
  priority: 'emergency' | 'high' | 'normal',
  reason, status: 'waiting' | 'called' | 'in-consultation' | 'done' | 'skipped' | 'cancelled',
  joinedAt, calledAt, consultStartedAt, completedAt,
  estimatedMinutes, notes
}
Appointment
javascript
{
  patientId, facilityId, bookedBy, scheduledAt, durationMinutes,
  department, reason, status, doctorId, reminderSent24h, reminderSent2h,
  notes, cancellationReason
}
DiagnosticOrder
javascript
{
  patientId, facilityId, orderedBy,
  tests: [{ name, category, status, reportUrl, reportNotes, completedAt }],
  status: 'ordered' | 'sample-collected' | 'in-progress' | 'ready' | 'delivered' | 'cancelled',
  priority, reason, clinicalNotes, expectedReadyBy,
  orderedAt, sampleCollectedAt, inProgressAt, readyAt, deliveredAt,
  processedBy
}
📚 Complete API Reference
See the Root README's API Reference for the full endpoint list.

Quick Reference by Role
Unauthenticated:

POST /api/auth/register

POST /api/auth/login

GET /api/facilities

Any authenticated user:

GET /api/patients/search?q=

GET /api/patients/:id/history

GET /api/facilities/:id/dashboard

GET /api/incidents/:id

GET /api/incidents/facility/:id

GET /api/referrals/facility/:id

GET /api/referrals/facility/:id/stats

GET /api/analytics/map

Various read endpoints

CHW only:

POST /api/patients

POST /api/referrals

GET /api/followups/due

GET /api/followups/all

GET /api/teleconsults/my-requests

GET /api/appointments/my-upcoming

GET /api/diagnostics/my-orders

Operator only:

POST /api/incidents

PATCH /api/incidents/:id/dispatch

Staff only:

PATCH /api/incidents/:id/acknowledge

PATCH /api/incidents/:id/reject

PATCH /api/incidents/:id/complete

PATCH /api/facilities/:id/availability

PATCH /api/queue/facility/:id/call-next

PATCH /api/queue/:id/status

PATCH /api/diagnostics/:id/status

PATCH /api/diagnostics/:id/upload-report

Specialist only:

GET /api/teleconsults/pending

GET /api/teleconsults/my-consults

PATCH /api/teleconsults/:id/accept|reject|start|complete

District Admin only:

GET /api/analytics/overview

GET /api/analytics/referral-trend

GET /api/analytics/emergency-distribution

GET /api/analytics/severity-distribution

GET /api/analytics/medicine-shortages

GET /api/analytics/facility-ranking

GET /api/analytics/district-breakdown

🤖 AI Triage Engine
How It Works
text
Patient description (free-text)
        ↓
Groq API call with strict system prompt
        ↓
JSON response validation
        ↓
{ severity, requiredSpecialization, aiReasoning }
        ↓
       ├─ critical → auto-create Incident → dispatch
       └─ moderate/mild → create Referral
System Prompt
text
You are a medical triage assistant for an ambulance dispatch system.
Analyze the patient description and return ONLY a JSON object with:
{
  "severity": "critical" | "moderate" | "mild",
  "requiredSpecialization": "cardiac" | "trauma" | "respiratory" | "general" | "neurology" | "pediatric",
  "aiReasoning": "One sentence explanation"
}
Rules:
- Return ONLY the JSON object, no markdown, no code blocks
- severity must be exactly one of: critical, moderate, mild
- requiredSpecialization must match the enum exactly
Fallback Classifier
If Groq fails (network, invalid key, malformed response), a keyword-based classifier kicks in:

KeywordSeveritySpecialization
chest pain, heart, cardiaccriticalcardiac
breathing, asthma, suffocatcriticalrespiratory
bleeding, fracture, accidentcriticaltrauma
seizure, stroke, unconsciouscriticalneurology
child, baby, infant, toddlermoderatepediatric
pregnant, labormoderategeneral
fever, infectionmoderategeneral
headache, migrainemildgeneral
Logging
Every Groq call logs:

=== AI Analysis Start ===

Patient description

Raw Groq response

Validated response

=== AI Analysis End ===

📡 Socket.IO Rooms
RoomJoined ByEvents
hospital_<facilityId>StaffAvailability, incidents, referrals
facility_<facilityId>Staff, CHWAvailability, incidents, referrals
incident_<incidentId>Operator trackingStatus changes
operator_<userId>OperatorPersonal notifications
user_<userId>Any userPersonal notifications
🧪 Testing
Manual Health Check
bash
curl http://localhost:5000/health
Full Test Suite
bash
node test-system.js
Runs 11 test cases covering:

Health check

CHW login

Patient registration

Facility listing

Mild referral

Critical referral → auto-incident

Patient history

Facility dashboard

Due follow-ups

Operator login

Staff login

🚢 Deployment (Render)
Steps
Push code to GitHub

Render Dashboard → New Web Service → Connect repo

Configure:

Root Directory: backend

Environment: Node

Build: npm install

Start: npm start

Set environment variables in Render dashboard

Deploy

Seed Production Database
After first deploy, open Render Shell:

bash
node seedData.js
node add-specialists.js
node add-admin.js
MongoDB Atlas
Create free cluster at https://cloud.mongodb.com

Add IP whitelist 0.0.0.0/0 (or Render's egress IP)

Create database user

Copy connection string → use as MONGODB_URI

🐛 Common Issues
Cannot connect to MongoDB Atlas
Whitelist your IP in Atlas: Network Access → Add IP Address → 0.0.0.0/0 (dev only)

Groq 404 model not found
Check your available models: node test-groq-models.js
Update aiService.js with a working model name from the list.

nodemon: command not found
Install globally: npm install -g nodemon
Or run: node server.js directly

JWT malformed on every request
Ensure JWT_SECRET in .env is set and consistent across restarts.

Role-based 403 Forbidden
Check the user's role in MongoDB. Role values must exactly match the enum.

📄 License
MIT
