# RapidCare Backend API

> Node.js + Express + MongoDB backend microservice for the RapidCare care continuity and emergency response platform.

---

## 🏗️ Features

- 🔐 **Authentication & Authorization:** Secure JWT-based authentication with 3-role Role-Based Access Control (RBAC).
- 🤖 **AI Medical Triage:** Integrated Groq AI triage engine with keyword-based fallback mechanism.
- 📍 **Geospatial Intelligence:** Geocoding and Haversine distance ranking for optimal facility routing.
- 📡 **Real-Time Communication:** Socket.IO websocket rooms partitioned by facility, incident, and user role.
- 🏥 **Tiered Healthcare Hierarchy:** Multi-tier health facility architecture (Sub-Centre → PHC → Rural Hospital → District Hospital).
- 🔗 **Automated Incident Escalation:** Auto-creation of emergency incidents from critical referral triggers.
- 📅 **Automated Follow-ups:** Automated scheduling of follow-up tasks upon referral acceptance.

---

## 📁 Project Structure

```text
backend/
├── models/                     # Mongoose Schemas & Data Models
│   ├── User.js
│   ├── Patient.js
│   ├── Facility.js
│   ├── Referral.js
│   ├── Incident.js
│   └── FollowUpSchedule.js
├── controllers/                # HTTP Request Handlers
│   ├── authController.js
│   ├── incidentController.js
│   ├── hospitalController.js
│   └── ...
├── services/                   # Business & Domain Logic
│   ├── aiService.js            # Groq AI integration & fallback
│   ├── locationService.js      # Geocoding & travel time estimation
│   ├── distanceService.js      # Haversine distance ranking
│   ├── patientService.js
│   ├── referralService.js
│   └── followUpService.js
├── routes/                     # API Route Definitions
│   ├── authRoutes.js
│   ├── patientRoutes.js
│   ├── referralRoutes.js
│   ├── facilityRoutes.js
│   ├── incidentRoutes.js
│   └── followUpRoutes.js
├── middleware/                 # Middleware Functions
│   └── authMiddleware.js       # JWT & RBAC Middleware
├── server.js                   # Application Entry Point
└── seedData.js                 # Database Seeding Script
```

---

## 🔧 Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/rapidcare` |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens | `replace_with_strong_secret` |
| `GROQ_API_KEY` | API key for Groq AI service | `gsk_xxxxxxxxxxxxxxxxxxxx` |
| `CORS_ORIGIN` | Allowed cross-origin frontend URL | `http://localhost:3000` |

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rapidcare
JWT_SECRET=replace_with_strong_secret
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
CORS_ORIGIN=http://localhost:3000
```

---

## 🚀 Setup & Execution

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your environment settings

# Seed database with authentic healthcare facility data
node seedData.js

# Run development server (with auto-reload)
npm run dev

# Run production server
npm start
```

---

## 🗄️ Data Models

### User
- `name`, `email`, `password` *(hashed with bcrypt)*, `role`
- **Supported Roles:** `ambulance_operator` | `hospital_staff` | `community_health_worker`
- `linkedFacilityId` *(staff/CHW)*, `languagePreference`

### Patient
- `name`, `age`, `gender`, `village`, `district`, `state`, `phone`
- `languagePreference`, `chronicConditions[]`, `highRiskFlags[]`
- `abhaId` *(future ABDM integration)*, `registeredBy`, `registeredAtFacility`

### Facility *(Tiered)*
- **Facility Types:** `sub-centre` | `phc` | `rural-hospital` | `district-hospital`
- `location`, `address`, `specializations[]`, `totalBeds`, `availableBeds`
- `medicineStock[]`, `diagnosticServices[]`, `parentFacility`, `staffUserId`

### Referral
- `patientId`, `fromFacilityId`, `toFacilityId`
- `severity`, `requiredSpecialization`, `referralType`
- **Status Lifecycle:** `initiated` → `in-transit` → `received` → `completed`
- `linkedIncident`, `timeline[]`, `isEmergencyFlagged`

### Incident *(Emergency Response)*
- `patientDescription`, `severity`, `requiredSpecialization`, `aiReasoning`
- **Status Lifecycle:** `pending` → `matched` → `dispatched` → `completed`
- `assignedHospitalId`, `ambulanceLocation`, `patientId`, `linkedReferral`

### FollowUpSchedule
- `patientId`, `referralId`, `condition`, `scheduleType`, `dueDate`
- **Status Options:** `scheduled` | `completed` | `missed` | `cancelled`
- `priority`, `assignedTo`

---

## 📚 API Endpoints

### Auth Routes
| Method | Endpoint | Access Level |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |

### Patient Routes
| Method | Endpoint | Access Level |
| :--- | :--- | :--- |
| `POST` | `/api/patients` | Authenticated |
| `GET` | `/api/patients/search?q=` | Authenticated |
| `GET` | `/api/patients/:id/history` | Authenticated |

### Referral Routes
| Method | Endpoint | Access Level |
| :--- | :--- | :--- |
| `POST` | `/api/referrals` | CHW, Operator |
| `PATCH` | `/api/referrals/:id/status` | Authenticated |
| `GET` | `/api/referrals/facility/:id?type=incoming` | Authenticated |
| `GET` | `/api/referrals/facility/:id/stats` | Authenticated |

### Incident Routes (Emergency)
| Method | Endpoint | Access Level |
| :--- | :--- | :--- |
| `POST` | `/api/incidents` | Operator |
| `GET` | `/api/incidents/:id` | Authenticated |
| `GET` | `/api/incidents/facility/:id` | Authenticated |
| `PATCH` | `/api/incidents/:id/dispatch` | Operator |
| `PATCH` | `/api/incidents/:id/complete` | Staff |

### Facility Routes
| Method | Endpoint | Access Level |
| :--- | :--- | :--- |
| `GET` | `/api/facilities` | Public |
| `GET` | `/api/facilities/:id/dashboard` | Authenticated |
| `PATCH` | `/api/facilities/:id/availability` | Staff |

### Follow-up Routes
| Method | Endpoint | Access Level |
| :--- | :--- | :--- |
| `GET` | `/api/followups/due` | Authenticated |
| `GET` | `/api/followups/all` | Authenticated |
| `PATCH` | `/api/followups/:id/complete` | Authenticated |

---

## 🤖 AI Triage Engine

The service in `services/aiService.js` executes structured prompts via the Groq API to obtain structured medical assessments:

```json
{
  "severity": "critical | moderate | mild",
  "requiredSpecialization": "cardiac | trauma | pediatric | general",
  "aiReasoning": "Concise single-sentence clinical reasoning."
}
```

> **Fallback System:** In the event of API downtime or quota limits, a client-side keyword-based classifier automatically activates to keep the triage operational. All AI operations are logged server-side for auditing.

---

## 📡 Real-Time Rooms (Socket.IO)

| Room Identifier | Target Audience |
| :--- | :--- |
| `hospital_<facilityId>` | Assigned hospital staff |
| `facility_<facilityId>` | Hospital staff and assigned CHWs |
| `incident_<incidentId>` | Emergency operators tracking active incidents |
| `operator_<userId>` | Specific ambulance operator session |

---

## 🧪 Testing

```bash
# Health Check Endpoint
curl http://localhost:5000/health

# Authentication Test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"delhi.staff@rapidcare.com","password":"password123"}'
```

---

## 🚢 Deployment (Render)

1. Push changes to GitHub repository.
2. Create a **New Web Service** on Render connected to your repository.
3. Configure the following parameters:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Set necessary Environment Variables (`MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`, `CORS_ORIGIN`).

---

## 📄 License

This backend module is open-sourced software licensed under the **[MIT License](LICENSE)**.