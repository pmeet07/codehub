# Production Deployment Guide with CI/CD

This document explains how to set up a fully automated CI/CD pipeline for **CodeHub** using GitHub Actions, Docker Hub, and AWS EC2.

## 1. System Architecture

-   **Source Control**: GitHub (Main branch).
-   **CI/CD**: GitHub Actions.
-   **Container Registry**: Docker Hub.
-   **Infrastructure**: AWS EC2 (Ubuntu).
-   **Storage**: AWS S3.
-   **Database**: PostgreSQL (Containerized).

## 2. Infrastructure Setup (AWS)

Follow the standard **AWS_DEPLOYMENT.md** guide to:
1.  Launch EC2.
2.  Install Docker & Git.
3.  Clone the repository.

## 3. GitHub Repository Secrets

Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.

Add the following secrets:

| Secret Name | Value |
| :--- | :--- |
| `DOCKERHUB_USERNAME` | Your Docker Hub Username. |
| `DOCKERHUB_TOKEN` | Your Docker Hub Access Token (Settings -> Security). |
| `EC2_HOST` | The Public IP of your EC2 instance. |
| `EC2_SSH_KEY` | The content of your `.pem` private key. |

## 4. Server Configuration

SSH into your EC2 server and perform these one-time setups:

### A. Environment Variables
Ensure your `.env` file in `backend/` and/or root is set up correctly as per the deployment guide, but specifically add:
`DOCKER_USERNAME=your_dockerhub_username` to the `.env` (or export it in `.bashrc`) so `docker-compose.prod.yml` can read it.

```bash
# Example: Add to /etc/environment or .env
echo "DOCKER_USERNAME=yourusername" >> .env
```

### B. Initial Run
Manually test the production composition once:

```bash
docker compose -f docker-compose.prod.yml up -d
```
(This might fail if images aren't pushed yet, which is fine. The first CI run will fix it).

## 5. Deployment Workflow

1.  **Push Code**: Commit and push changes to the `main` branch.
2.  **Build**: GitHub Actions automatically builds Backend & Frontend Docker images.
3.  **Push**: Images are pushed to Docker Hub with `latest` tag.
4.  **Deploy**: Action logs into EC2 via SSH, pulls the new images, and restarts containers.

## 6. Nginx & SSL (Production Polish)

The provided `nginx.conf` is optimized for production (Gzip, Security Headers). To enable HTTPS/SSL:

1.  **Install Certbot** on EC2 (or use a separate Nginx container).
    It is often easier to run Nginx *outside* Docker for easier Let's Encrypt management, OR use a sidecar container.
    
    **Simple External Nginx Proxy Method:**
    1. Install Nginx on host: `sudo apt install nginx`
    2. Proxy pass port 80 to `localhost:80` (where Docker Frontend is listening).
    3. Run `sudo certbot --nginx -d codehub.yourdomain.com`.

## 7. Troubleshooting

-   **Pipeline Fails**: Check "Actions" tab in GitHub.
-   **Server Fails**: SSH in and run `docker compose -f docker-compose.prod.yml logs -f`.
