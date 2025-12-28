# Docker Deployment Guide for AWS EC2

This guide outlines how to deploy the **CodeHub** application using **Docker and Docker Compose**. This is the easiest and most robust method.

## Prerequisites
1.  **AWS Account**: Launch an EC2 instance (Ubuntu 22.04/24.04).
2.  **Security Group**: Ensure ports **22 (SSH)** and **80 (HTTP)** are open.

---

## 🚀 Step 1: Install Docker on EC2
Connect to your instance via SSH:
```bash
ssh -i "path-to-key.pem" ubuntu@<your-ec2-ip>
```

Run these commands to install Docker & Docker Compose:
```bash
# Update and install Docker
sudo apt-get update
sudo apt-get install -y docker.io

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group (avoids typing 'sudo' every time)
sudo usermod -aG docker $USER
```
**LOG OUT and log back in** for the group change to take effect.

---

## 📂 Step 2: Get the Code
Clone your repository:
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd codehub
```

---

## 🔑 Step 3: Create Secret Files
Docker cannot see your local secrets. You MUST create them on the server.

### 1. Backend Secrets
```bash
nano backend/.env
```
Paste this (edit with your real keys):
```env
PORT=5000
# Docker manages the mongo connection using the hostname 'mongo':
MONGO_URI=mongodb://mongo:27017/codehub
JWT_SECRET=supersecuresecret
GEMINI_API_KEY=your_actual_gemini_key
GOOGLE_CLIENT_ID=your_google_client_id
```
*(Save: Ctrl+X, Y, Enter)*

### 2. Frontend Secrets
```bash
nano frontend/.env
```
Paste this:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
# VITE_API_URL is NOT needed here; Docker sets it to /api automatically.
```
*(Save: Ctrl+X, Y, Enter)*

---

## 🐳 Step 4: Launch the Application
Build and start all services (Frontend, Backend, Database) in the background:

```bash
docker-compose up -d --build
```
- Wait 1-2 minutes for the build to finish and containers to start.

---

## 🛠 Step 5: Initialize the Database (One-Time Setup)
Since this is a new database, you need to create the Admin user.

Run this command **while the containers are running**:
```bash
docker exec -it codehub-backend node seedAdmin.js
```
- **Login with**: `admin@codehub.com` / `admin123`

---

## ✅ Step 6: Verify
Open your browser to: `http://<YOUR_EC2_IP>`
- Frontend should load.
- Try "Sign In" to verify a connection to the backend.

---

## 🔄 Updating the App
If you push new code to GitHub, follow these steps to update your live site:

1.  **Pull changes**:
    ```bash
    git pull
    ```
2.  **Rebuild containers**:
    ```bash
    docker-compose up -d --build
    ```

---

## ❓ Troubleshooting

### Connection Refused?
- Check EC2 **Security Groups**: Is Port 80 Open?
- Check if containers are running:
    ```bash
    docker ps
    ```

### Backend Errors?
- View logs:
    ```bash
    docker logs codehub-backend
    ```

### "Login Failed" or Network Error?
- Ensure the admin user was created (Step 5).
- Open Browser DevTools (F12) > Network to see if the request to `/api/auth/login` is failing.
