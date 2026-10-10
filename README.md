# ConnectDesk — Customer Relationship Workspace

A modern, high-performance Customer Relationship Workspace built with React, Vite, Node.js, and Express.

---

## 🏗️ Phase 1 Infrastructure

Phase 1 establishes the foundational workspace architecture:
- **`client/`**: React + Vite frontend with live API connectivity status monitor.
- **`server/`**: Node.js + Express backend configured with JSON middleware, CORS, error handling, and health check route (`GET /api/health`).

---

## 📁 Project Structure

```
ConnectDesk/
├── client/                 # Frontend React Application
│   ├── src/
│   │   ├── App.css         # Styling for Connection Dashboard
│   │   ├── App.jsx         # Connection Status UI & Health Endpoint Fetcher
│   │   ├── index.css       # Core Design System & Tokens
│   │   └── main.jsx        # React DOM Root Entry Point
│   ├── .env.example        # Client Environment Template
│   ├── index.html          # HTML Shell
│   ├── package.json        # Frontend Dependencies & Vite Scripts
│   └── vite.config.js      # Vite Configuration with API Proxy (/api -> http://localhost:5000)
├── server/                 # Backend Express Application
│   ├── .env.example        # Server Environment Template
│   ├── .env                # Local Environment Variables
│   ├── index.js            # Express Server Entry Point & /api/health Route
│   └── package.json        # Backend Dependencies & Nodemon Dev Script
├── .env.example            # Root Environment Template
├── .gitignore              # Ignored Files (node_modules, .env, build outputs)
├── package.json            # Root Scripts for Concurrent Client & Server Startup
└── README.md               # Project Setup & Verification Manual
```

---

## 🚀 Getting Started

### 1. Install Dependencies

You can install dependencies for root, server, and client:

```bash
# Install root workspace dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

---

### 2. Running Development Servers

You can run both backend and frontend concurrently from the root directory:

```bash
npm run dev
```

Alternatively, you can run them individually:

```bash
# Run backend server only (starts on http://localhost:5000)
npm run dev:server

# Run frontend client only (starts on http://localhost:5173)
npm run dev:client
```

---

## 🧪 Verification & Health Check

1. **Backend Health API**:
   - Open [http://localhost:5000/api/health](http://localhost:5000/api/health)
   - Expected JSON Response:
     ```json
     {
       "status": "ok",
       "message": "ConnectDesk API is running smoothly",
       "timestamp": "2026-10-09T...",
       "uptime": "12s",
       "environment": "development"
     }
     ```

2. **Frontend UI Dashboard**:
   - Open [http://localhost:5173](http://localhost:5173)
   - Verify that the connection badge reports **Backend Connected & Healthy (200 OK)**.

---

## 🗺️ Project Roadmap

- [x] **Phase 1: Foundation Setup** (Express API + Vite React + Health Check)
- [ ] **Phase 2: Authentication & Core Dashboard** (User Auth, Session/JWT, Layout)
- [ ] **Phase 3: Database & CRM Models** (MongoDB Atlas + Mongoose ODM, Customers, Tasks)
