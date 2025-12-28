# CodeHub Setup & Usage Guide

## Prerequisites
- Node.js (v18+)
- MongoDB (Running locally on default port 27017)

## Installation

### 1. Backend Setup
```bash
cd backend
npm install
# Ensure .env is set up or use defaults (Mongo: 27017, Port: 5000)
npm run dev
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
- **Admin**: Create a user (e.g. `admin`) and manually update their role to `admin` in MongoDB (`db.users.updateOne({username: "admin"}, {$set: {role: "admin"}})`).

### 2. Repositories
- **Create**: Click "New Repository" on Dashboard. Select Public/Private and Language.
- **View Code**: File Tree Navigation + Monaco Editor for viewing files.
- **CLI Simulation**: Use the "Quick Setup" commands shown in empty repos to push code using the `codehub-cli` (simulated).

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
- **Merging**: The owner of the target repository can Merge the PR (simulated git merge).

### 6. Admin Panel
- Access via `/admin` (Must have `admin` role).
- **Dashboard**: Overview statistics.
- **Moderation**: View and Force Close Pull Requests.
- **User Management**: Ban/Unban users.

## CLI Usage (Simulated)
The CLI logic is implemented in `backend/cli` (if applicable) or conceptually via API endpoints.
The frontend displays example commands to use.
To actually push code without a real CLI tool, you can use API clients (Postman) or trust the simulated flow in the UI (Future enhancement: Web Upload).

### Branch Commands
- `codehub branch <name>`: Create a new branch.
- `codehub checkout <branch>`: Switch to a branch.
- `codehub push origin <branch>`: Push commits to a specific branch.

## Project Structure
- `backend/`: Node.js Express API
    - `models/`: Mongoose Schemas (User, Repository, PullRequest, Commit)
    - `controllers/`: Business Logic
    - `routes/`: API Endpoints
- `frontend/`: React + Vite + Tailwind
    - `pages/`: Route Pages (Dashboard, RepoDetail, Search, Admin)
    - `components/`: Reusable UI Components

## Troubleshooting
- **Mongo Connection**: Ensure `mongod` is running.
- **Forking/Merging**: These operations perform file system copies in `backend/storage`. Ensure write permissions exist.
