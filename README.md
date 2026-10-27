# Synapse Hackathon 2026 – TaskFlow

> **An all-in-one Hackathon Portal, Team Workspace, and Agile Sprint Kanban Manager.**

Built with **Node.js, Express, MongoDB, and Vanilla JavaScript/CSS** with cyber-dark glassmorphic aesthetics.

---

## 🌟 Key Features

- **🏆 Hackathon Hub & Opening Portal**:
  - Live 48-hour submission countdown timer (Hours : Minutes : Seconds).
  - Live announcement ticker with real-time deadline calculation.
  - Track spotlights ($50,000 total prize pool across AI, Web3, HealthTech, CleanTech, and DevTools).
  - Interactive 48-Hour Schedule with milestone status badges.
- **🔐 Authentication & Security**:
  - Secure JWT authentication with HttpOnly cookies.
  - Salted and hashed passwords with `bcrypt`.
- **📁 Multi-Project Management**:
  - Create and manage distinct hackathon project entries and prototypes.
  - One-click sprint launcher and project deletion controls.
- **⚡ Interactive Sprint Kanban Board**:
  - Columns: **To-Do**, **In Progress**, and **Done** with real-time task count chips.
  - Priority badges (`High 🔥`, `Medium ⚡`, `Low 🛡️`).
  - **1-Click Progression**: Advance tasks from `To-Do` ➔ `In Progress` ➔ `Done` or reopen them with a single click.
  - Full CRUD: Add, edit details, move across lists, and delete tasks.
- **🎨 Modern Design & Icons**:
  - Dark glassmorphism (`backdrop-filter: blur(16px)`), ambient radial glows, and responsive design.
  - Unified **Lucide Icons** and typography powered by **Outfit** and **Plus Jakarta Sans**.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (via Mongoose ODM)
- **Authentication**: JSON Web Tokens (JWT), Cookie-Parser, Bcrypt
- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Modern Vanilla CSS
- **Icons**: Lucide Icons
- **Fonts**: Google Fonts (`Outfit`, `Plus Jakarta Sans`)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster URI)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <your-repo-url>
cd taskflow
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5002
MONGO_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your_super_secret_jwt_key_here
```

### 4. Run the Application
Start the backend development server:
```bash
npm run dev
```

Serve the client interface:
```bash
npx serve -s client
```

Open your browser at **`http://localhost:3000`** (or access via backend at **`http://localhost:5002`**).

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health check | Public |
| `POST` | `/api/auth/register` | Register new team account | Public |
| `POST` | `/api/auth/login` | Log in and receive JWT cookie | Public |
| `POST` | `/api/auth/logout` | Clear auth cookie session | Public |
| `GET` | `/api/auth/me` | Get currently authenticated user | Private |
| `GET` | `/api/projects` | Get all projects for logged-in user | Private |
| `POST` | `/api/projects` | Create a new project | Private |
| `DELETE`| `/api/projects/:id` | Delete a project and associated data | Private |
| `GET` | `/api/tasks/project/:projectId` | Get all sprint tasks for a project | Private |
| `POST` | `/api/tasks` | Create a new sprint task | Private |
| `PUT` | `/api/tasks/:id` | Update task title, description, status, priority | Private |
| `DELETE`| `/api/tasks/:id` | Delete a task | Private |

---

## 📄 License
MIT License. Created for the Synapse 2026 Hackathon.
