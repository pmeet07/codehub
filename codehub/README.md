# CodeHub Setup & Usage Guide

## Prerequisites
- Node.js (v18+)
- PostgreSQL (Ensure it is running and you have a database created, e.g., `codehub`)

## Installation

### 1. Backend Setup
```bash
cd backend
npm install
# Configure .env or environment variables:
# DATABASE_URL=postgres://username:password@localhost:5432/codehub
npm run dev
# The server will automatically sync and create tables on startup.
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

## Features & Usage

### 1. Authentication
- **Sign Up**: Register a new account.
- **Login**: Access your dashboard.
- **Admin**: Create a user (e.g. `admin`) and manually update their role to `admin` in PostgreSQL:
  ```sql
  UPDATE users SET role = 'admin' WHERE username = 'admin';
  ```

### 2. Repositories
- **Create**: Click "New Repository" on Dashboard. Select Public/Private and Language.
- **View Code**: File Tree Navigation + Monaco Editor for viewing files.
- **CLI Simulation**: Use the "Quick Setup" commands shown in empty repos.

### 3. Search & Explore
- **Global Search**: Click "Explore" in Navbar.
- **Filters**: Search by query or filter by language tag.

### 4. Forking
- Go to any public repository owned by another user.
- Click the **"Fork"** button in the header.
- A copy of the repo is created in your account.

### 5. Pull Requests
- Go to a repository (preferably a fork).
- Click **"Pull Requests"** tab.
- Click **"New Pull Request"**.
- Select Source Branch and Target Branch.
- Submit PR.
- **Merging**: The owner of the target repository can Merge the PR.

### 6. Admin Panel
- Access via `/admin` (Must have `admin` role).
- **Dashboard**: Overview statistics.
- **Moderation**: View and Force Close Pull Requests.
- **User Management**: Ban/Unban users.

## Project Structure
- `backend/`: Node.js Express API
    - `models/`: Sequelize Models (User, Repository, PullRequest, Commit, Branch)
    - `controllers/`: Business Logic
    - `routes/`: API Endpoints
    - `config/`: Database Configuration
- `frontend/`: React + Vite + Tailwind
    - `pages/`: Route Pages (Dashboard, RepoDetail, Search, Admin)
    - `components/`: Reusable UI Components

## Troubleshooting
- **Database Connection**: Ensure PostgreSQL is running and `DATABASE_URL` is correct.
- **Forking/Merging**: These operations perform file system copies in `backend/storage`. Ensure write permissions exist.
