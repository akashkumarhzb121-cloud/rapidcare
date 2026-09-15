# RapidCare Frontend

> React + Vite + Tailwind CSS + Framer Motion frontend for the RapidCare care continuity platform.

## 🎯 Overview

A modern, mobile-first SPA with **5 role-based dashboards**, multilingual support (EN/HI/MR), voice input, offline-first data entry, and real-time Socket.IO updates.

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build | Vite 5 |
| Routing | React Router 6 |
| Styling | Tailwind CSS 3 |
| Animation | Framer Motion |
| Icons | Lucide React |
| Charts | Recharts |
| Map | Leaflet + React-Leaflet v4 |
| Video | Jitsi Meet iframe |
| Real-time | Socket.IO Client |
| i18n | i18next + react-i18next |
| Voice | Web Speech API |
| Offline | IndexedDB via `idb` |
| HTTP | Axios |

---

## ✨ Features

### 🌐 Platform-Wide
- **5 role-based dashboards** with proper access control
- **Multilingual** — English / हिंदी / मराठी, persisted per user
- **Voice input** on every free-text field
- **Offline mode** for CHW patient registration + triage
- **Real-time updates** via Socket.IO
- **Responsive design** — mobile-first with desktop optimization
- **Animated UI** — Framer Motion transitions, animated backgrounds

### 🔐 Login & Register
- Beautiful gradient login page
- Quick demo login buttons for all 5 roles
- Language switcher in top-right
- Full registration form with role selection

### 🏠 Landing Page
- Hero section with animated background blobs
- 5 role cards with gradient borders
- Access status indicators
- Demo credentials panel

### 🚑 Operator Dashboard
- Report emergency form with **🎤 voice input**
- AI assessment card (severity badge + reasoning)
- **Ranked hospital list** — distance + travel time + live bed count
- **Recommended** badge (green highlight) on top match
- One-click dispatch → bed auto-decrements

### 👩‍⚕️ CHW Dashboard — 7 tabs
1. **Register** — full patient form with chronic/high-risk flags
2. **Triage** — patient search + symptoms + emergency toggle
3. **Referrals** — outgoing referral tracking
4. **Follow-ups** — due + all (auto-created on referral acceptance)
5. **Teleconsult** — request video call with specialist selection
6. **Appointments** — book slots with real-time availability
7. **Diagnostics** — order tests from categorized catalog

### 🏥 Hospital Dashboard — 4 sections
1. **Overview** — KPIs, pending acknowledgments, bed management, referrals
2. **Queue** — live OPD with call next / skip / complete
3. **Appointments** — today's schedule
4. **Diagnostics** — full lifecycle with report upload

### 🩺 Specialist Dashboard — 3 tabs
1. **Pending** — routed consult requests (only for their specialization)
2. **Active** — accepted consults with video call + completion modal
3. **Completed** — past consults with prescriptions

### 📊 Admin Dashboard — 6 tabs
1. **Overview** — KPI cards, distribution charts, district table
2. **Facility Map** — interactive Leaflet map with colored markers
3. **Referral Analytics** — 14-day trend + daily bar chart
4. **Emergency Insights** — by specialization and severity
5. **Facility Ranking** — 🥇🥈🥉 top performers
6. **Medicine Alerts** — shortage list with severity

---

## 📁 Directory Structure
frontend/
├── index.html # Vite entry point
├── vite.config.js # Build + chunk splitting
├── tailwind.config.js # Custom animations
├── postcss.config.js
├── vercel.json # SPA rewrites
├── .env.development # Local API URL
├── .env.production # Production API URL
├── .env.example # Template
└── src/
├── main.jsx # React root + i18n
├── App.jsx # Routing + providers
├── index.css # Tailwind + custom utilities
│
├── context/
│ ├── AuthContext.jsx # JWT + user state
│ ├── SocketContext.jsx # Socket.IO connection + rooms
│ └── OfflineContext.jsx # Online/offline + sync
│
├── services/
│ ├── api.js # Axios instance with JWT
│ └── offlineQueue.js # IndexedDB wrapper
│
├── i18n/
│ ├── index.js # i18next config
│ └── locales/
│ ├── en.json # English
│ ├── hi.json # हिंदी
│ └── mr.json # मराठी
│
├── components/
│ ├── LanguageSwitcher.jsx # Dropdown + buttons variant
│ ├── VoiceInput.jsx # Web Speech API
│ ├── OfflineBadge.jsx # Online/offline indicator
│ ├── TeleconsultRoom.jsx # Jitsi iframe
│ ├── FacilityMap.jsx # Leaflet map
│ └── PrivateRoute.jsx # Route guard
│
└── pages/
├── Login.jsx
├── Register.jsx
├── LandingPage.jsx
├── OperatorDashboard.jsx
├── HospitalDashboard.jsx
├── CHWDashboard.jsx
├── SpecialistDashboard.jsx
└── AdminDashboard.jsx

text

---

## 🔧 Environment Variables

Vite uses `VITE_` prefix and `import.meta.env` (not `process.env`).

### `.env.development`
```env
VITE_API_BASE_URL=http://localhost:5000
.env.production
env
VITE_API_BASE_URL=https://your-backend.onrender.com
.env.example
env
VITE_API_BASE_URL=http://localhost:5000
🚀 Setup
bash
# Install
npm install

# Configure
cp .env.example .env.local
# Edit .env.local with your backend URL

# Run
npm run dev        # Dev server at http://localhost:3000
npm run build      # Production build → dist/
npm run preview    # Preview production build
🎨 UI Components
Reusable Utilities (defined in index.css)
ClassPurpose
.glass-cardFrosted glass card with backdrop blur
.btn-gradient-primarySky → Indigo gradient button
.btn-gradient-dangerRed → Rose gradient
.btn-gradient-successEmerald → Teal gradient
.btn-gradient-purpleViolet → Purple gradient
.input-modernRounded input with focus ring
.badge-criticalRed badge for critical severity
.badge-moderateAmber badge
.badge-mildGreen badge
.mesh-bgAnimated mesh gradient background
VoiceInput Props
jsx
<VoiceInput
  onTranscript={(text) => setField(text)}   // Called with transcribed text
  currentValue={field}                       // Current field value
/>
Automatically detects browser support, shows mic animation while listening, and uses the current i18n language for recognition.

LanguageSwitcher Props
jsx
<LanguageSwitcher variant="dropdown" />   // Default: dropdown
<LanguageSwitcher variant="buttons" />    // Inline buttons
📱 Dashboards Guide
🚑 Operator Dashboard (/operator)
Report Emergency form with voice input for symptoms

Find Hospitals triggers AI triage

AI Assessment card shows severity + reasoning

Matched Hospitals list sorted by distance

Dispatch Here button reserves a bed

Live bed count updates via Socket.IO

👩‍⚕️ CHW Dashboard (/chw)
Register tab:

Patient name, age, gender, village, district, phone

Chronic conditions (multi-select)

High-risk flags (multi-select)

Voice input compatible

Offline-capable (queued in IndexedDB)

Triage tab:

Patient search with debounced autocomplete

Symptoms with voice input

Emergency toggle (forces critical classification)

Facility selection

Referrals tab:

Card layout with status badges

Emergency flag visible

Linked incident indicator

Follow-ups tab:

Due today list with priority

All follow-ups with completion status

One-click complete

Teleconsult tab:

3-step request modal: Patient → Symptoms → Specialist

Specialist grid with specialization icons

Join Call button on accepted requests

Prescription shown when completed

Appointments tab:

Upcoming appointments with facility + time

Book modal with real-time slot picker

Slot conflicts shown with strikethrough

Diagnostics tab:

Order history with status

Test-by-test lifecycle

View Report link when ready

🏥 Hospital Dashboard (/hospital)
Overview:

5 KPI cards (beds, referrals, emergencies, completed, diagnostics)

⚠️ Awaiting Confirmation section for dispatched incidents

Accepted Patients list

Bed availability editor

Incoming Referrals grid

Queue:

Stats banner (waiting, in-consult, avg time, clear-by)

Big Call Next Patient button

Live queue list with token numbers

Priority badges (🚨 Emergency, ⚡ High)

Status actions per entry

Appointments:

Today's schedule with time slots

Status badges

Diagnostics:

Stats: Pending / In Progress / Ready / Completed Today

Order list with per-test status

Upload button per test → modal for report URL

Workflow buttons: sample collected → in-progress → delivered

🩺 Specialist Dashboard (/specialist)
Pending tab:

Routed consults only (matches their specialization)

Full patient context (age, village, chronic conditions, high-risk flags)

Symptoms + AI reasoning

Accept & Join Call button → Jitsi

Reject button → reason modal

Active tab:

Accepted consults with Start / Rejoin Call button

Completed tab:

Past consults with diagnosis + prescription + duration

📊 Admin Dashboard (/admin)
Overview:

4 KPI cards (facilities, occupancy, referral completion, emergencies)

4 secondary KPIs (patients, follow-ups due, diagnostics pending/ready)

Emergency types pie chart

Severity distribution pie chart

District-wise overview table

Facility Map:

Interactive Leaflet map of Maharashtra

Markers color-coded by bed status

Filter by facility type or district

Click marker → popup with details

Legend in bottom-left

Side drawer shows full facility details

Referral Analytics:

14-day trend line chart (total / completed / critical)

Daily bar chart

Emergency Insights:

Counts (total / active / completed)

Horizontal bar chart by specialization

Horizontal bar chart by severity

Facility Ranking:

🥇🥈🥉 top 3 highlighted

Performance metrics per facility

Medicine Alerts:

Counts by severity (critical / high / medium)

List with facility + medicine + quantity

🌐 Internationalization
Adding a New Language
Create src/i18n/locales/xx.json with the same key structure

Add to src/i18n/index.js:

javascript
import xx from './locales/xx.json';
resources: { en, hi, mr, xx }
supportedLngs: ['en', 'hi', 'mr', 'xx']
Add to LANGUAGES array in LanguageSwitcher.jsx

Translation Keys Structure
text
common.*        — Global labels (login, logout, loading)
roles.*         — Role names
auth.*          — Login/register
landing.*       — Landing page
chw.*           — CHW-specific
operator.*      — Operator-specific
hospital.*      — Hospital-specific
triage.*        — Severity terms
referral.*      — Referral status
specializations.* — Medical specializations
followUp.*      — Follow-up types
errors.*        — Error messages
emergency.*     — Emergency UI
Using in Components
jsx
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t, i18n } = useTranslation();
  return <h1>{t('common.appName')}</h1>;
};
📡 Real-Time Behavior
Socket.IO Room Joining
javascript
// Hospital staff
socket.emit('joinHospitalRoom', facilityId);
socket.emit('joinFacilityRoom', facilityId);

// Any user
socket.emit('joinUserRoom', userId);

// Operator tracking
socket.emit('joinIncidentRoom', incidentId);
Events Handled
Every dashboard subscribes to relevant events and updates UI without refresh:

Bed availability

New incidents dispatched

New referrals received

Status changes across the ecosystem

Follow-up creation

Queue updates

Appointment bookings

Diagnostic order progress

Teleconsult accept/start/complete/reject

📴 Offline Mode
How It Works
Detect: navigator.onLine + online/offline events

Queue: Form submissions saved to IndexedDB

Indicate: Amber badge in header with pending count

Sync: Auto-runs on reconnect (500ms delay)

Retry: Up to 5 attempts before dropping

Persist: Survives page refresh and browser restart

Test Flow
Open Chrome DevTools → Network → Offline

Register a patient → "📦 Saved offline" message

Badge shows "📦 1 pending"

Switch back to Online

Badge shows "✅ Synced" within 1 second

🎨 Styling System
Custom Animations (in tailwind.config.js)
fade-in — opacity 0 → 1

slide-up — translateY + fade

pulse-slow — slow pulse

float — floating motion

glow — glowing box-shadow

shimmer — shimmer effect

Custom Utilities (in index.css)
.glass-card — frosted glass

.btn-gradient-* — 4 gradient button variants

.input-modern — modern input

.badge-critical/moderate/mild — severity badges

.mesh-bg — animated mesh background

.text-gradient-primary — gradient text

Design Tokens
Primary palette: sky-500 → indigo-600

Danger: red-500 → rose-600

Success: emerald-500 → teal-600

Purple: violet-500 → purple-600

Neutral: slate-50 → slate-900

🚢 Deployment (Vercel)
Steps
Push to GitHub

Vercel → Import Project → select repo

Configure:

Root Directory: frontend

Framework Preset: Vite

Build Command: npm run build

Output Directory: dist

Environment Variables:

VITE_API_BASE_URL = https://your-backend.onrender.com

Deploy

SPA Routing (vercel.json)
json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ]
}
Vercel Env Warning
VITE_API_BASE_URL is exposed to the browser (that's fine — it's just a URL, not a secret). Mark it as safe.

🐛 Common Issues
process is not defined
You're using CRA-style process.env. Switch to import.meta.env.VITE_*.

White screen after Vercel deploy
Check vercel.json rewrite rule — must exclude /assets/ paths.

Unexpected token '<' in console
Rewrites too broad — HTML served for JS files. Fix vercel.json as above.

react-is missing
npm install react-is (peer dependency of recharts).

render2 is not a function
react-leaflet v5 doesn't support React 18. Downgrade:
npm install react-leaflet@4.2.1 leaflet@1.9.4

Map not rendering
Ensure import 'leaflet/dist/leaflet.css'; is present in FacilityMap.jsx.

API requests hitting localhost in production
Set VITE_API_BASE_URL in Vercel environment variables.

Tailwind not applying
Verify:

tailwind.config.js has correct content paths

postcss.config.js exists

index.css has @tailwind base/components/utilities

CSS bundle in dist/assets/*.css is >15 kB

401 on every request
Session storage cleared or token expired. Log out and log back in.

Role-based redirect loop
Check PrivateRoute role mapping matches the App.jsx route roles.

📄 License
MIT
