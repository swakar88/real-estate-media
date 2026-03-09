# Production Deployment Guide

This guide walks you through deploying your decoupled **Next.js (Frontend)** and **Django (Backend)** application.

## Prerequisites
1. A **GitHub** account.
2. A **Render** account (for Django backend).
3. A **Vercel** account (for Next.js frontend).
4. Git installed on your local machine.

---

## Step 1: Push Code to GitHub

First, you need to get your code into a Git repository.

1. Open your terminal in the root folder (`C:\Dev\Krishna\real-estate-media`).
2. Run the following commands:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Real Estate Media Website"
   ```
3. Go to [GitHub](https://github.com/) and create a new repository (e.g., `real-estate-media`).
4. Follow the instructions to push your code:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/real-estate-media.git
   git push -u origin main
   ```

---

## Step 2: Deploy Backend to Render

Render will host your Django API and a managed PostgreSQL database.

### 1. Create the PostgreSQL Database
1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **PostgreSQL**.
3. Name it (e.g., `real-estate-db`), select a region, and choose the Free tier.
4. Click **Create Database**.
5. Once created, copy the **Internal Database URL** (we'll need it later).

### 2. Create the Web Service (Django)
1. Click **New +** and select **Web Service**.
2. Connect your GitHub account and select your `real-estate-media` repository.
3. Fill in the following settings:
   - **Name**: `real-estate-api`
   - **Root Directory**: `backend` *(⚠️ Extremely Important!)*
   - **Environment**: `Python 3`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn config.wsgi:application`
   - **Instance Type**: Free tier

### 3. Add Environment Variables
Before clicking "Create", scroll down to **Environment Variables** and add the following:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | *Paste your Internal Database URL here* | Connects Django to PostgreSQL. |
| `SECRET_KEY` | `generate-a-long-random-string-here` | Any long, random sequence of characters. |
| `DEBUG` | `False` | Turns off debug mode for safety. |
| `ALLOWED_HOSTS` | `your-render-app-url.onrender.com` | You will get this URL after the app creates. Use `*` only temporarily if needed. |
| `CORS_ALLOWED_ORIGINS`| `https://your-vercel-frontend-url.vercel.app` | You will update this later once Vercel is set up. |

4. Click **Create Web Service**. Wait 3-5 minutes for Render to run the build script and launch the Django API.

---

## Step 3: Deploy Frontend to Vercel

Vercel will host your Next.js application.

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Connect your GitHub account and Import your `real-estate-media` repository.
4. Fill in the following settings:
   - **Framework Preset**: Next.js (usually auto-detected)
   - **Root Directory**: Click the `Edit` button and select `frontend`. *(⚠️ Extremely Important!)*

### Add Environment Variables in Vercel
Expand the **Environment Variables** section and add:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://your-render-app-url.onrender.com` | *(This is the URL from Step 2 you got from Render. Omit the trailing slash).* |

5. Click **Deploy**. Vercel will build and deploy your site in about 1-2 minutes.

---

## Step 4: Final Connection Sync

Now that both are live, you need to ensure they can talk to each other securely.

1. Go back to **Render** -> your Web Service -> **Environment**.
2. Update the `CORS_ALLOWED_ORIGINS` variable to be your exact new Vercel URL.
   - Example: `https://real-estate-media-frontend.vercel.app`
3. Click "Save Changes". Render will quickly restart the server using the new allowed origin.

**You're done!** Your Next.js frontend is now communicating dynamically with your cloud-hosted PostgreSQL database via the Django API.
