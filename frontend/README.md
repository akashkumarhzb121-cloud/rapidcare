# RapidCare Frontend

> React + Vite + Tailwind CSS client application for the RapidCare care continuity and emergency response platform.

---

## 🛠️ Tech Stack

- ⚛️ **React 18** — Component-driven framework
- ⚡ **Vite 5** — Next-generation frontend tooling & build pipeline
- 🎨 **Tailwind CSS 3** — Utility-first styling engine
- 🎬 **Framer Motion** — Production-ready motion and animation library
- 🎯 **Lucide React** — Flexible and accessible icon set
- 🔌 **Socket.IO Client** — Real-time bidirectional event-driven communication
- 🌐 **React Router 6** — Dynamic client-side routing

---

## 📁 Project Structure

```text
frontend/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
├── .env.development
├── .env.production
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── context/
    │   ├── AuthContext.jsx
    │   └── SocketContext.jsx
    ├── pages/
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── LandingPage.jsx
    │   ├── OperatorDashboard.jsx
    │   ├── HospitalDashboard.jsx
    │   └── CHWDashboard.jsx
    ├── components/
    │   └── PrivateRoute.jsx
    └── services/
        └── api.js
```

---

## 🔧 Environment Variables

> **Note:** Vite requires environment variables to use the `VITE_` prefix and be accessed via `import.meta.env` (instead of `process.env`).

### Configuration Files

**`.env.development`**
```env
VITE_API_BASE_URL=http://localhost:5000
```

**`.env.production`**
```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

**`.env.example`**
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 🚀 Setup & Execution

```bash
# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env.local

# Run development server (runs on http://localhost:3000)
npm run dev

# Generate production build (outputs to dist/)
npm run build

# Locally preview production build
npm run preview
```

---

## 💻 Dashboards & Application Views

### 🔐 Login (`/login`)
- Email & password authentication.
- Quick single-click demo login presets (*Operator*, *Staff*, *CHW*).
- Custom animated gradient background.

### 🏠 Landing Page (`/`)
- Dynamic access cards highlighting roles: *Emergency Operator*, *Community Health Worker*, and *Hospital Staff*.
- Real-time role authorization indicator.
- Interactive demo credentials panel.

### 🚑 Operator Dashboard (`/operator`)
- Interactive emergency reporting form (symptoms + geolocation).
- Real-time AI triage assessment card (*Severity*, *Required Specialization*, *Reasoning*).
- Distance & travel-time ranked hospital matching list:
  - Estimated travel duration and distance matrix.
  - Live available bed tracker.
  - Highlights optimal hospital recommendations.
- One-click dispatch triggering automated bed allocation.

### 👩‍⚕️ CHW Dashboard (`/chw`)
Contains 4 dedicated workflows:
1. **Register Patient:** Comprehensive intake form supporting chronic conditions & high-risk flag tagging.
2. **Symptom Triage:** Patient lookup, symptom assessment, and target facility selection.
3. **🚨 Emergency Override:** Toggle switch to instantly escalate high-risk cases.
4. **My Referrals & Follow-ups:** Tracks outgoing referral statuses alongside assigned follow-up worklists.

### 🏥 Hospital Dashboard (`/hospital`)
- Regional data isolation (e.g., Delhi staff only views Delhi facility metrics).
- Live metrics bar: *Available Beds*, *Pending Referrals*, *Active Emergencies*, and *Completed Today*.
- Real-time bed availability inventory management.
- Emergency incident stream with one-click completion.
- Incoming referral management with *Accept* and *Complete* actions.

---

## 📡 Real-Time Socket.IO Synchronization

The client automatically subscribes to websocket channels based on user authorization:

| Role | Subscribed Rooms |
| :--- | :--- |
| **Hospital Staff** | `hospital_<facilityId>` and `facility_<facilityId>` |
| **Emergency Operator** | `operator_<userId>` and `incident_<incidentId>` |

### Zero-Refresh Live Updates
- Bed capacity updates instantaneously system-wide.
- Dispatched emergency incidents appear exclusively in assigned hospital feeds.
- Referral status shifts reflect in real time across origin and destination facilities.
- Patient follow-up tasks are auto-generated and dispatched to field CHWs.

---

## 🎨 Styling & Design System

### Design Tokens (`tailwind.config.js`)
- Custom UI animations: `fade-in`, `slide-up`, `float`, `glow`, and `shimmer`.
- Modern color scheme leveraging `sky-500` through `indigo-600` primary gradients.

### Utility Classes (`src/index.css`)
- `.glass-card` — Modern frosted glass effect container.
- `.btn-gradient-primary` / `.btn-gradient-danger` / `.btn-gradient-success` / `.btn-gradient-purple` — Standardized gradient buttons.
- `.input-modern` — Customized inputs with interactive focus rings.
- `.badge-critical` / `.badge-moderate` / `.badge-mild` — Triage severity status tags.
- `.mesh-bg` — Animated background mesh layer.

---

## 🚢 Deployment (Vercel)

1. Push source code to GitHub.
2. Navigate to **Vercel** → **Import Project**.
3. Configure the application:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Define Environment Variable:
   - `VITE_API_BASE_URL` = `<Your Backend API URL>`
5. Click **Deploy**.

> **Single Page Application (SPA) Routing:** `vercel.json` is configured to rewrite all wildcard requests to `/index.html`:
> ```json
> {
>   "rewrites": [
>     { "source": "/(.*)", "destination": "/index.html" }
>   ]
> }
> ```

---

## ❓ Troubleshooting & Common Issues

| Issue | Solution / Root Cause |
| :--- | :--- |
| **`process is not defined` error** | Vite does not use Create React App's `process.env`. Replace references with `import.meta.env.VITE_*`. |
| **Blank / White screen on deployment** | Ensure `vercel.json` is present in your project root with the proper SPA rewrite configuration. |
| **API calls defaulting to `localhost` in production** | Set the `VITE_API_BASE_URL` variable inside your deployment platform's environment settings. |
| **Tailwind styles missing** | Verify that `tailwind.config.js` content paths include `./src/**/*.{js,jsx}`, `postcss.config.js` is present, and `index.css` imports `@tailwind` directives. |

---

## 📄 License

This repository is distributed under the **[MIT License](LICENSE)**.