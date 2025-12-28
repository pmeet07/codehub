# Deployment Guide to AWS EC2

This guide outlines the steps to deploy the **CodeHub** application (Node.js Backend + React Frontend) to an AWS EC2 instance (Ubuntu).

## Prerequisites
- An AWS Account.
- Verify you have SSH access to your EC2 instance.

---

## Step 1: Launch and Configure EC2
1.  **Launch Instance**: Go to AWS Console -> EC2 -> Launch Instance.
    -   **OS**: Ubuntu Server 22.04 LTS (or 24.04).
    -   **Instance Type**: t2.micro (Free Tier) or larger.
    -   **Key Pair**: Create or select an existing `.pem` key.
2.  **Security Group**: Allow the following ports:
    -   SSH (22) - My IP (for security)
    -   HTTP (80) - Anywhere
    -   HTTPS (443) - Anywhere

## Step 2: Connect to Server
Open your terminal and SSH into the instance:
```bash
ssh -i /path/to/your-key.pem ubuntu@<your-ec2-public-ip>
```

## Step 3: Install Dependencies
Update the system and install Node.js, Nginx, and Git.

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2 (Process Manager) globally
sudo npm install -g pm2
```

## Step 4: Clone the Repository
Clone your project into `/var/www/codehub`.

```bash
# Create directory
sudo mkdir -p /var/www/codehub
sudo chown -R ubuntu:ubuntu /var/www/codehub

# Clone (Replace with your actual repo URL)
git clone <YOUR_GITHUB_REPO_URL> /var/www/codehub
# OR if you are copying files manually, use SCP/SFTP
```

## Step 5: Setup Backend
1.  Navigate to the backend folder:
    ```bash
    cd /var/www/codehub/backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Environment Variables**: Create a `.env` file.
    ```bash
    nano .env
    ```
    Paste your variables:
    ```
    PORT=5000
    MONGO_URI=<your_production_mongo_connection_string>
    JWT_SECRET=<your_secret>
    GEMINI_API_KEY=<your_key>
    ```
    *(Note: For MongoDB, ensure your Atlas cluster allows the EC2 IP address)*

4.  Start Backend with PM2:
    ```bash
    cd /var/www/codehub
    pm2 start deployment/ecosystem.config.js
    pm2 save
    pm2 startup
    # (Run the command output by pm2 startup to configure auto-start)
    ```

## Step 6: Setup Frontend
1.  Navigate to the frontend folder:
    ```bash
    cd /var/www/codehub/frontend
    ```
2.  **Environment Variables**: Create a `.env` file for build time.
    ```bash
    nano .env
    ```
    Add local API path (since Nginx will proxy it):
    ```
    VITE_API_URL=/api
    ```
3.  Install and Build:
    ```bash
    npm install
    npm run build
    ```
    This creates a `dist` folder.

## Step 7: Configure Nginx
1.  Copy the configuration file provided in `deployment/nginx.conf`:
    ```bash
    sudo cp /var/www/codehub/deployment/nginx.conf /etc/nginx/sites-available/codehub
    ```
2.  Enable the site:
    ```bash
    sudo ln -s /etc/nginx/sites-available/codehub /etc/nginx/sites-enabled/
    sudo rm /etc/nginx/sites-enabled/default  # Remove default welcome page
    ```
3.  Test and Restart Nginx:
    ```bash
    sudo nginx -t
    sudo systemctl restart nginx
    ```

## Step 8: Verify
- Open your browser and visit `http://<your-ec2-public-ip>`.
- The frontend should load.
- API calls should work via `http://<your-ec2-public-ip>/api/...`.

---
**Troubleshooting**:
- If API fails, check backend logs: `pm2 logs`
- If 502 Bad Gateway, backend might not be running on port 5000.
