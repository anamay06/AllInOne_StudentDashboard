# AIM — Academic & Internship Monitor Dashboard

AIM is a modern, high-performance, neobrutalist developer dashboard designed for digital heroes to track their academic performance, budget limits, daily habits, tasks, code battleground contests, and schedules in one unified workspace.

---

## 🚀 Tech Stack
* **Frontend**: React, Vite, Tailwind CSS / Vanilla CSS, Lucide icons, Framer Motion
* **Backend**: Node.js, Express, Axios, Cheerio (for web scraping internships)
* **Database**: Supabase (PostgreSQL with Row Level Security isolation)
* **APIs**: Google Calendar API & Google Tasks API (OAuth integration)

---

## 🛠️ Prerequisites
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [npm](https://www.npmjs.com/) (Node Package Manager)
* A [Supabase](https://supabase.com/) account and project

---

## ⚙️ Project Architecture & Setup

### 1. Database Configuration (Supabase)
To establish database connectivity, you must update the environment configuration files in both frontend and backend directories.

#### Step A: Configure Frontend Environment
Create or edit `frontend/.env`:
```env
VITE_SUPABASE_URL=https://<your-supabase-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

#### Step B: Configure Backend Environment
Create or edit `backend/.env`:
```env
SUPABASE_URL=https://<your-supabase-ref>.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Google Calendar OAuth Integration Credentials (optional)
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<your-google-oauth-client-secret>
```

#### Step C: Import Schema in Supabase
AIM requires tables to be provisioned in your database. 
1. Open your project dashboard in the **Supabase Console**.
2. Navigate to the **SQL Editor** tab.
3. Click **New Query**, copy the entire contents of the `supabase_schema.sql` file located in the root of this project, and paste it into the editor.
4. Click **Run** to provision the tables (`user_settings`, `habits`, `todos`, `transactions`, `calendar_events`, etc.) and establish Row Level Security (RLS) policies.

---

## 🏃 Running the Application

### 1. Start the Backend Server (Express API)
Open a terminal in the root workspace and run:
```bash
# Navigate to the backend directory
cd backend

# Install dependencies (only required on first run)
npm install

# Launch the server
npm start
```
The server will boot up and listen for requests on: **`http://localhost:5001/`**.

### 2. Start the Frontend Development Server (Vite)
Open a secondary terminal in the root workspace and run:
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies (only required on first run)
npm install

# Launch the development server
npm run dev
```
Vite will start the client interface at: **`http://localhost:5173/`**.

---

## 💡 Key Features Guide

### 🛠️ Widget Layout Customization
You can customize the layout of your home page dynamically. 
* Click the **"Customize Widgets"** gear button at the top right of the dashboard.
* Toggle the checkboxes to instantly show/hide elements (e.g. CGPA, Habit Tracker, ToDo List, Calendar, Budget).
* Changes are automatically written and saved to the Supabase database and persist across logins.

### 📅 Local & Google Calendar Integration
* **Local Mode**: Click any cell in the calendar grid to create local events (title and time). These are saved in Supabase and can be deleted via the trash icon.
* **Google Sync Mode**: If you link your Google Account in Settings, events created via the input form are pushed directly to your Google Calendar. You can also view Google Tasks and delete remote events/tasks in real-time.

### 🏆 Battlegrounds (Contests Tracker)
Retrieves live contest schedules on platforms like Codeforces, LeetCode, and CodeChef directly from the proxy backend. Click "View Upcoming Contests" to open the contest viewer modal.