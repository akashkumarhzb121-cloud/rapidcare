# RapidCare — AI-Powered Care Continuity & Emergency Response Platform

> A full-stack MERN platform that uses AI-driven triage to route rural patients to the correct level of care — from village sub-centres to district hospitals — tracking them across their journey, with emergency ambulance dispatch as the escalation path for critical cases.

**Problem Statement:** SIH 26133 — *Accessibility and quality of public healthcare services, particularly in rural and underserved areas*  
**Category:** Software | **Theme:** MedTech / BioTech / HealthTech

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Frontend (React + Vite)                     │
│        Operator  ·  Staff  ·  Community Health Worker       │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend (Express + Node)                    │
│    Auth  ·  Patients  ·  Referrals  ·  Facilities  ·  Incidents│
│                  Groq AI Triage Engine                      │
│                  Socket.IO Real-Time                        │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   MongoDB (Mongoose ODM)                    │
│      Users  ·  Patients  ·  Facilities  ·  Referrals        │
│                Incidents  ·  FollowUps                      │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🩺 Community Health Worker (CHW)
- **Patient Registration:** Register patients with comprehensive longitudinal digital health records.
- **AI Triage:** AI-powered symptom triage using Groq API for rapid level-of-care assessment.
- **Critical Care Override:** 🚨 **Force Emergency** toggle to immediately escalate critical cases.
- **Referral Tracking:** Track outgoing referrals sent to higher-tier hospitals in real time.
- **Follow-up Worklist:** Dedicated queue to manage follow-up care for maternal, child, and chronic health patients.

### 🚑 Emergency Operator
- **AI Severity Assessment:** Real-time AI triage and severity assessment via Groq.
- **Intelligent Hospital Matching:** Distance and travel-time ranked hospital recommendations.
- **One-Click Dispatch:** Instant ambulance dispatch system with automatic bed count decrement.
- **Live Bed Tracking:** Real-time visibility into available hospital beds across districts.

### 🏥 Hospital Staff
- **Isolated Dashboards:** Multi-city isolated regional dashboards (Delhi / Mumbai / Jaipur).
- **Incoming Alerts:** Real-time notification stream for incoming referrals and emergency alerts.
- **Automated Workflow:** Accept or complete referrals with automatic CHW follow-up creation.
- **Resource Management:** Live bed availability and medicine stock inventory management.
- **Key Performance Counters:** Real-time counters tracking active emergencies and today's completed cases.

### 🌐 Platform Features
- **Role-Based Access Control (RBAC):** 3-role granular RBAC (CHW, Operator, Staff) secured with JWT.
- **Real-Time Engine:** Websocket integration via Socket.IO for instant system-wide updates.
- **Offline Capabilities:** Local queued sync capability for low-connectivity rural environments.
- **Localization:** Dual English and Hindi interface support.
- **Responsive Design:** Mobile-first, fully responsive UI designed for handheld field devices.

---

## 📁 Project Structure

```text
rapidcare/
├── backend/                  # Express API Backend
│   ├── controllers/          # Request handlers and route logic
│   ├── middleware/           # Authentication, authorization, RBAC
│   ├── models/               # Mongoose schemas (User, Patient, Facility, etc.)
│   ├── routes/               # API route definitions
│   ├── services/             # Business logic (AI engine, referrals, follow-ups)
│   └── server.js             # Entry point
├── frontend/                 # React + Vite Web Client
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React context (Auth, Socket)
│   │   ├── pages/            # View components & dashboards
│   │   └── services/         # API integration layer
│   └── index.html
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **MongoDB** (Local instance or MongoDB Atlas)
- **Groq API Key** ([Get free key](https://console.groq.com/keys))

### 1. Clone & Install Dependencies

```bash
# Clone repository
git clone https://github.com/akashkumarhzb121-cloud/rapidcare.git
cd rapidcare

# Install Backend Dependencies
cd backend
npm install
cp .env.example .env

# Install Frontend Dependencies
cd ../frontend
npm install
cp .env.example .env.local
```

### 2. Seed Database

```bash
cd backend
node seedData.js
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open your browser at **`http://localhost:3000`**

---

## 🔑 Demo Credentials

> **Default Password for all accounts:** `password123`

| City | Operator | Hospital Staff | CHW |
| :--- | :--- | :--- | :--- |
| **Delhi** | `delhi.operator@rapidcare.com` | `delhi.staff@rapidcare.com` *(AIIMS)* | `delhi.chw@rapidcare.com` |
| **Mumbai** | `mumbai.operator@rapidcare.com` | `mumbai.staff@rapidcare.com` *(KEM)* | `mumbai.chw@rapidcare.com` |
| **Jaipur** | `jaipur.operator@rapidcare.com` | `jaipur.staff@rapidcare.com` *(SMS)* | `jaipur.chw@rapidcare.com` |
| **Legacy** | `operator@rapidcare.com` | `staff@rapidcare.com` | `chw@rapidcare.com` |

---

## 🔧 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rapidcare
JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=your_groq_api_key_here
CORS_ORIGIN=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 📚 API Reference

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user (3 roles available) |
| `POST` | `/api/auth/login` | User login & JWT generation |

### Patients
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/patients` | Register patient (CHW / Operator) |
| `GET` | `/api/patients/search?q=` | Search patient by name, village, or ABHA ID |
| `GET` | `/api/patients/:id/history` | Retrieve complete patient history |

### Referrals
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/referrals` | Create referral with AI triage |
| `PATCH` | `/api/referrals/:id/status` | Update referral status (triggers auto follow-up) |
| `GET` | `/api/referrals/facility/:id` | List facility referrals |
| `GET` | `/api/referrals/facility/:id/stats` | Dashboard analytical counters |

### Incidents (Emergency)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/incidents` | Report emergency incident |
| `GET` | `/api/incidents/:id` | Get incident details |
| `GET` | `/api/incidents/facility/:id` | List facility emergency incidents |
| `PATCH` | `/api/incidents/:id/dispatch` | Dispatch emergency response (auto-decrements beds) |
| `PATCH` | `/api/incidents/:id/complete` | Mark emergency incident complete |

### Facilities
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/facilities` | List all healthcare facilities |
| `GET` | `/api/facilities/:id/dashboard` | Beds, medicine, and diagnostic metrics |
| `PATCH` | `/api/facilities/:id/availability` | Update facility resource availability |

### Follow-ups
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/followups/due` | List due follow-up tasks |
| `GET` | `/api/followups/all` | List all assigned follow-ups |
| `PATCH` | `/api/followups/:id/complete` | Mark follow-up as complete |

---

## 📡 Real-Time Events (Socket.IO)

| Event Name | Direction | Trigger |
| :--- | :--- | :--- |
| `hospitalAvailabilityUpdated` | Server → All | Bed count or resource changes |
| `newIncidentAssigned` | Server → Facility | New emergency dispatch to hospital |
| `newReferralReceived` | Server → Facility | New referral routed to facility |
| `referralStatusChanged` | Server → Both Facilities | Referral status change |
| `followUpCreated` | Server → CHW | Referral accepted, generating CHW task |
| `facilityStatsUpdated` | Server → Facility | Real-time counter updates |

---

## 🏥 Real Hospital Data

Hospital data configured in `seedData.js` is curated from authoritative Indian government sources:

- **National Health Portal:** [nhp.gov.in](https://www.nhp.gov.in/hospital-directory)
- **ABDM Health Facility Registry:** [facility.abdm.gov.in](https://facility.abdm.gov.in)
- **PM-JAY Empanelled Hospitals:** [pmjay.gov.in](https://pmjay.gov.in)
- **Open Data Portal:** [data.gov.in](https://data.gov.in)

**Curated Hospitals:**
- **Delhi:** AIIMS, Safdarjung Hospital, RML Hospital, Lok Nayak Hospital, GTB Hospital
- **Mumbai:** KEM Hospital, Sion Hospital, Nair Hospital, JJ Hospital
- **Jaipur:** SMS Hospital (and multi-tier sub-centres)

*Note: All facility geographical coordinates are verified against Google Maps / OpenStreetMap.*

---

## 🚢 Deployment

### Backend (Render)
1. Push code to GitHub repository.
2. Go to **Render** → Create **New Web Service** → Connect repository.
3. Configuration:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Set Environment Variables (`MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`, `CORS_ORIGIN`).

### Frontend (Vercel)
1. Go to **Vercel** → Import Project → Select repository.
2. Configuration:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
3. Set Environment Variable (`VITE_API_BASE_URL`).

---

## 🔒 Security

- **JSON Web Tokens (JWT):** Secure session handling with 7-day token expiry.
- **Role-Based Access Control:** Strict authorization boundaries across roles.
- **Password Hashing:** Bcrypt encryption with 10 salt rounds.
- **CORS Protection:** Whitelisted origin filtering.
- **Environment Isolation:** Sensitive credential encapsulation.
- **Data Isolation:** Regional and per-facility data partitioning.

---

## 🗺️ Roadmap

- [ ] ABDM ABHA ID integration for patient identity.
- [ ] Offline-first IndexedDB queue for CHW field data entry.
- [ ] Expanded regional language support (Marathi, Tamil, Bengali).
- [ ] Real-time GPS tracking for dispatched ambulances.
- [ ] Automated WhatsApp / SMS patient notification workflows.
- [ ] Integration with government health data APIs (data.gov.in).

---

## 🤝 Contributing

1. Fork the project repository.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

## 🙏 Acknowledgments

- **SIH 26133** — Maharashtra State Innovation Society
- **Groq** — Fast AI inference platform
- **ABDM / NHA** — Health Facility Registry
- **National Health Portal** — Public health directory data

---
*Built with ❤️ for rural India's healthcare accessibility.*