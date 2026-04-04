# I-TRAK Setup & Deployment Guide

This guide walks you through setting up and deploying the I-TRAK fitness app in your own development environment.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Database Setup](#database-setup)
3. [API Configuration](#api-configuration)
4. [Running the App](#running-the-app)
5. [Deployment Options](#deployment-options)
6. [Beta Testing](#beta-testing)
7. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** 10+ ([Installation](https://pnpm.io/installation))
- **MySQL** 8+ or **TiDB** ([Download MySQL](https://dev.mysql.com/downloads/mysql/) or [TiDB Cloud](https://tidbcloud.com/))
- **Git** ([Download](https://git-scm.com/))

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd itrak-project
```

### Step 2: Install Dependencies

```bash
pnpm install
```

This will install all required packages for both frontend and backend.

### Step 3: Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
DATABASE_URL=mysql://root:password@localhost:3306/itrak_db

# Manus OAuth (get from Manus dashboard)
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
JWT_SECRET=your_jwt_secret

# Google Gemini API (get from Google Cloud Console)
GEMINI_API_KEY=your_gemini_api_key

# AWS S3 (get from AWS IAM)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=itrak-storage

# Owner Info
OWNER_NAME=Your Name
OWNER_OPEN_ID=your_open_id
```

---

## Database Setup

### Step 1: Create the Database

Connect to your MySQL server and create the database:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE itrak_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE itrak_db;
```

### Step 2: Run Migrations

Generate and apply the database schema:

```bash
pnpm db:push
```

This will:
1. Generate SQL migrations from `drizzle/schema.ts`
2. Apply migrations to your database
3. Create all required tables

### Step 3: Seed Initial Data (Optional)

Add sample exercises to the database:

```bash
mysql -u root -p itrak_db < scripts/seed-exercises.sql
```

Or manually insert exercises:

```sql
INSERT INTO exercises (name, description, environments, muscleGroups, difficulty) VALUES
('Barbell Squat', 'Heavy compound leg exercise', JSON_ARRAY('gym'), JSON_ARRAY('legs', 'quadriceps'), 'intermediate'),
('Pushups', 'Bodyweight chest exercise', JSON_ARRAY('home', 'gym', 'outside'), JSON_ARRAY('chest', 'triceps'), 'beginner'),
('Running', 'Cardio exercise', JSON_ARRAY('gym', 'outside'), JSON_ARRAY('legs', 'cardio'), 'beginner');
```

---

## API Configuration

### Google Gemini API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the "Generative Language API"
4. Create an API key in "Credentials"
5. Add to `.env.local`:
   ```env
   GEMINI_API_KEY=your_key_here
   ```

### AWS S3

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Create an IAM user with S3 access
3. Create an S3 bucket (e.g., `itrak-storage`)
4. Add credentials to `.env.local`:
   ```env
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_S3_BUCKET=itrak-storage
   ```

### Manus OAuth

1. Go to [Manus Dashboard](https://manus.im/dashboard)
2. Create a new application
3. Set redirect URL to `http://localhost:3000/api/oauth/callback`
4. Add credentials to `.env.local`:
   ```env
   VITE_APP_ID=your_app_id
   JWT_SECRET=your_secret
   ```

---

## Running the App

### Development Mode

Start the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

### Production Build

Build for production:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

### Type Checking

Verify TypeScript types:

```bash
pnpm check
```

### Running Tests

Run the test suite:

```bash
pnpm test
```

---

## Deployment Options

### Option 1: Manus Platform (Recommended)

The easiest way to deploy I-TRAK is on Manus:

1. Ensure you have a checkpoint created
2. Click "Publish" in the Manus Management UI
3. Configure your custom domain (optional)
4. Share the link with beta testers

### Option 2: Railway

1. Connect your GitHub repository to [Railway](https://railway.app/)
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

**Procfile:**
```
web: pnpm start
release: pnpm db:push
```

### Option 3: Render

1. Create a new Web Service on [Render](https://render.com/)
2. Connect your GitHub repository
3. Set build command: `pnpm install && pnpm build`
4. Set start command: `pnpm start`
5. Add environment variables
6. Deploy

### Option 4: Vercel (Frontend Only)

For frontend-only deployment:

1. Push code to GitHub
2. Connect to [Vercel](https://vercel.com/)
3. Set build output to `dist/client`
4. Configure API routes to point to backend

---

## Beta Testing

### Adding Beta Testers

Add whitelisted emails to the database:

```sql
INSERT INTO betaTesters (email, status) VALUES
('user1@example.com', 'invited'),
('user2@example.com', 'invited'),
('user3@example.com', 'invited'),
('user4@example.com', 'invited'),
('user5@example.com', 'invited');
```

### Sharing the App

1. Get your app URL (e.g., `https://itrak.manus.space`)
2. Send to beta testers
3. Only whitelisted emails can sign up

### Collecting Feedback

1. Use the in-app feedback form (if implemented)
2. Monitor error logs in `.manus-logs/`
3. Track feature requests in GitHub Issues

---

## Troubleshooting

### Database Connection Error

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:3306`

**Solution:**
- Ensure MySQL is running: `mysql.server start` (macOS) or `sudo service mysql start` (Linux)
- Check DATABASE_URL is correct
- Verify credentials

### Gemini API Error

**Error:** `Error: Invalid API key`

**Solution:**
- Verify API key in `.env.local`
- Check API is enabled in Google Cloud Console
- Ensure billing is set up

### S3 Upload Error

**Error:** `Error: NoSuchBucket`

**Solution:**
- Verify bucket exists in AWS S3
- Check bucket name in `.env.local`
- Ensure IAM user has S3 permissions

### OAuth Error

**Error:** `Error: Invalid redirect_uri`

**Solution:**
- Check redirect URL is whitelisted in Manus dashboard
- Verify VITE_APP_ID is correct
- Clear browser cookies and retry

### Port Already in Use

**Error:** `Error: listen EADDRINUSE :::3000`

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or use a different port
PORT=3001 pnpm dev
```

### Build Fails

**Error:** `Error: TypeScript compilation failed`

**Solution:**
```bash
pnpm check  # Check for type errors
pnpm format # Format code
pnpm build  # Rebuild
```

---

## Performance Optimization

### Database

- Add indexes on frequently queried columns:
  ```sql
  CREATE INDEX idx_user_id ON workoutLogs(userId);
  CREATE INDEX idx_expires_at ON photoCaloricLogs(expiresAt);
  ```

### Caching

- Enable Redis caching for exercise library
- Cache user preferences for 24 hours
- Implement service worker for offline support

### Image Optimization

- Compress photos before S3 upload
- Use WebP format for better compression
- Implement lazy loading for images

---

## Security Checklist

- [ ] All API keys in environment variables (never commit)
- [ ] Database password is strong
- [ ] HTTPS enabled in production
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (using Drizzle ORM)
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Regular security audits

---

## Support

For issues or questions:

1. Check the [README.md](./README.md) for general information
2. Review [Troubleshooting](#troubleshooting) section
3. Submit issue on GitHub
4. Contact support at https://help.manus.im

---

**Last Updated:** March 2026
