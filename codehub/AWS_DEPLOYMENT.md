# AWS EC2 Deployment Guide for CodeHub

This guide will walk you through deploying the fully Dockerized CodeHub application (Frontend + Backend + PostgreSQL) to an AWS EC2 instance.

## Prerequisites
- An AWS Account
- A domain name (optional, but recommended for SSL)
- SSH Client (Git Bash, Terminal, or PuTTY)

## Step 1: Launch an EC2 Instance
1.  **Go to AWS Console** -> **EC2** -> **Launch Instance**.
2.  **Name**: `CodeHub-Server`
3.  **AMI**: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type.
4.  **Instance Type**: `t3.small` or `t3.medium` (Recommended: t3.medium for build performance).
5.  **Key Pair**: Create a new key pair or select an existing one. **Download the .pem file** and keep it safe.
6.  **Network Settings**:
    *   Allow SSH traffic from Anywhere (0.0.0.0/0) or My IP.
    *   Allow HTTP traffic from the internet (0.0.0.0/0).
    *   Allow HTTPS traffic from the internet (0.0.0.0/0).
7.  **Storage**: 30GB gp3 (Default is 8GB, which is often too small for Docker images + logs).
8.  **Launch Instance**.

## Step 2: Connect to your Instance
Open your terminal (in the folder where your `.pem` key is):

```bash
# Set permissions for your key (Linux/Mac only, skip on Windows CMD)
chmod 400 your-key-pair.pem

# SSH into the server (replace ip-address)
ssh -i "your-key-pair.pem" ubuntu@<your-ec2-public-ip>
```

## Step 3: Install Docker & Git
Run the following commands on your EC2 server:

```bash
# Update packages
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add ubuntu user to docker group (avoids sudo)
sudo usermod -aG docker $USER
newgrp docker
```

## Step 4: Clone the Project
You can clone your project from GitHub (if you pushed it) or transfer files using SCP/SFTP. Assuming you use git:

```bash
git clone https://github.com/yourusername/codehub.git
cd codehub
```

*(If you don't have a git repo, you can upload the project folder using FileZilla or `scp`).*

## Step 5: Configure Environment Variables
Create the `.env` file for the backend on the server:

```bash
cd backend
nano .env
```

Paste your `.env` content (update secrets for production!):

```env
PORT=5000
# NOTE: In Docker, the host is the service name 'postgres', not localhost
DATABASE_URL=postgres://postgres:password@postgres:5432/codehub
JWT_SECRET=complex_production_secret_key_here
# Add any Google Auth keys here if needed
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

Go back to root:
```bash
cd ..
```

## Step 6: Deploy with Docker Compose
This single command builds the images and starts the database, backend, and frontend containers.

```bash
docker compose up -d --build
```

Wait a few minutes for the build to complete.

## Step 7: Access the Application
1.  Find your EC2 **Public IP** in the AWS Console.
2.  Open your browser and visit: `http://<your-ec2-public-ip>`

You should see the CodeHub frontend!

## Troubleshooting
- **View Logs**:
  `docker compose logs -f` (View all logs)
  `docker compose logs -f backend` (View backend logs)
- **Restart Services**:
  `docker compose down` then `docker compose up -d`
- **Database Access**:
  To access the DB shell: `docker exec -it codehub-postgres psql -U postgres -d codehub`
