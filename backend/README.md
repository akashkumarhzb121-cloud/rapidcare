# RapidCare — AI-Powered Care Continuity & Emergency Response Platform for Rural Public Healthcare

RapidCare is a full-stack platform that uses AI-driven triage to route rural patients to the correct level of care — from village sub-centres to district hospitals — tracking them across their journey, with emergency ambulance dispatch as the escalation path for critical cases.

## 🏗️ Architecture
Frontend (React) → Backend (Express) → MongoDB
↓
Groq AI Triage
↓
┌────────────┴────────────┐
↓ ↓
Referral Flow Emergency Dispatch
(Routine/Urgent) (Critical Cases)

text

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Groq API Key

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
node seedData.js  # Seed sample data
npm run dev
Frontend Setup
bash
cd frontend
npm install
cp .env.example .env.local
npm start
🎯 Demo Credentials
RoleEmailPassword
Emergency Operatoroperator@rapidcare.compassword123
Hospital Staffstaff@rapidcare.compassword123
Community Health Workerchw@rapidcare.compassword123
📚 API Documentation
Authentication
POST /api/auth/register - Register user

POST /api/auth/login - Login

Patients
POST /api/patients - Register patient (CHW/Operator)

GET /api/patients/search?q= - Search patients

GET /api/patients/:id/history - Patient history

Referrals
POST /api/referrals - Create referral with AI triage

PATCH /api/referrals/:id/status - Update referral status

GET /api/referrals/facility/:facilityId - Get facility referrals

Facilities
GET /api/facilities - List facilities

GET /api/facilities/:id/dashboard - Facility dashboard

PATCH /api/facilities/:id/availability - Update availability

Follow-ups
GET /api/followups/due - Get due follow-ups

PATCH /api/followups/:id/complete - Complete follow-up

Incidents (Existing)
POST /api/incidents - Create incident (auto from critical referral)

PATCH /api/incidents/:id/dispatch - Dispatch

PATCH /api/incidents/:id/complete - Complete

🔒 Security
JWT authentication

Role-Based Access Control (3 roles)

bcrypt password hashing

CORS configuration

📝 License
MIT License
