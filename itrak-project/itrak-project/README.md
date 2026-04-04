# I-TRAK: Minimalist Canadian Workout App

I-TRAK is a no-frills fitness tracking application designed for Canadian users. It features a clean workout logger, exercise library with environment-based filtering, AI-powered movement demos, and photo-based calorie tracking via Google Gemini API.

## Features

- **Minimalist Workout Logger:** Log sets, reps, and weight with lbs as default (metric available)
- **Exercise Library:** Browse exercises filtered by environment (Gym, Home, Hotel, Outside)
- **AI Movement Demos:** 3D human figure animations with gender toggle (Male, Female, Neutral)
- **Photo Calorie Tracker:** AI-powered food analysis via Gemini API (10 photos/day, 7-day retention)
- **Clear Macro Display:** Detailed nutritional information (calories, protein, carbs, fat)
- **User Preferences:** Toggle between metric/imperial, set default environment and demo figure
- **Offline PWA Support:** Works offline with service worker caching
- **Email Whitelisting:** Beta tester access control

## Tech Stack

- **Frontend:** React 19, Tailwind CSS 4, TypeScript, Wouter (routing)
- **Backend:** Express 4, tRPC 11, Node.js
- **Database:** MySQL/TiDB with Drizzle ORM
- **APIs:** Google Gemini API (food analysis), AWS S3 (image storage)
- **Authentication:** Manus OAuth
- **UI Components:** shadcn/ui, Radix UI

## Project Structure

```
itrak-project/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── WorkoutLogger.tsx
│   │   │   ├── ExerciseLibrary.tsx
│   │   │   ├── PhotoTracker.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── NotFound.tsx
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── lib/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   └── index.html
├── server/
│   ├── routers.ts
│   ├── db.ts
│   ├── storage.ts
│   ├── _core/
│   │   ├── index.ts
│   │   ├── context.ts
│   │   ├── trpc.ts
│   │   ├── llm.ts
│   │   └── ...
│   └── auth.logout.test.ts
├── drizzle/
│   └── schema.ts
├── shared/
│   └── const.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Installation

### Prerequisites

- Node.js 18+
- pnpm 10+
- MySQL 8+ or TiDB
- Google Cloud account (for Gemini API)
- AWS account (for S3 storage)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd itrak-project
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file in the root:
   ```env
   # Database
   DATABASE_URL=mysql://user:password@localhost:3306/itrak

   # OAuth
   VITE_APP_ID=your_manus_app_id
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://auth.manus.im
   JWT_SECRET=your_jwt_secret

   # Gemini API
   GEMINI_API_KEY=your_gemini_api_key

   # AWS S3
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=itrak-storage

   # Owner Info
   OWNER_NAME=Your Name
   OWNER_OPEN_ID=your_open_id
   ```

4. **Set up the database**
   ```bash
   pnpm db:push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

   The app will be available at `http://localhost:3000`

## Database Schema

### Users Table
- `id`: Primary key
- `openId`: Manus OAuth identifier
- `name`, `email`: User profile
- `unitPreference`: "lbs" or "kg"
- `environmentPreference`: "gym", "home", "hotel", or "outside"
- `genderDemoPreference`: "male", "female", or "neutral"
- `role`: "user" or "admin"

### Exercises Table
- `id`: Primary key
- `name`: Exercise name
- `description`: Exercise description
- `demoUrl`: URL to AI movement demo
- `environments`: JSON array of applicable environments
- `muscleGroups`: JSON array of targeted muscle groups
- `difficulty`: "beginner", "intermediate", or "advanced"

### WorkoutLogs Table
- `id`: Primary key
- `userId`: Foreign key to users
- `exerciseName`: Name of exercise
- `environment`: "gym", "home", "hotel", or "outside"
- `sets`, `reps`, `weight`: Workout details
- `notes`: Optional notes
- `loggedAt`: Timestamp of workout

### PhotoCaloricLogs Table
- `id`: Primary key
- `userId`: Foreign key to users
- `photoUrl`: S3 URL to food photo
- `foodDescription`: AI-generated description
- `calories`, `protein`, `carbs`, `fat`: Nutritional data
- `analysisData`: Full Gemini API response (JSON)
- `expiresAt`: 7-day retention expiration

### DailyCalorieSummary Table
- `id`: Primary key
- `userId`: Foreign key to users
- `date`: YYYY-MM-DD format
- `totalCalories`, `totalProtein`, `totalCarbs`, `totalFat`: Daily totals
- `photoCount`: Number of photos logged

### BetaTesters Table
- `id`: Primary key
- `email`: Whitelisted email
- `status`: "invited", "active", or "inactive"
- `invitedAt`, `activatedAt`: Timestamps

## API Routes (tRPC)

### Auth
- `auth.me` - Get current user
- `auth.logout` - Logout user

### User Preferences
- `user.getPreferences` - Get user preferences
- `user.updatePreferences` - Update preferences

### Exercises
- `exercises.listByEnvironment` - Get exercises for environment
- `exercises.listAll` - Get all exercises

### Workouts
- `workouts.log` - Log a workout
- `workouts.getToday` - Get today's workouts
- `workouts.getHistory` - Get workout history

### Photo Tracker
- `photoTracker.uploadAndAnalyze` - Upload and analyze food photo
- `photoTracker.getToday` - Get today's meals
- `photoTracker.getHistory` - Get meal history
- `photoTracker.getDailySummary` - Get daily nutrition summary
- `photoTracker.getRemainingPhotos` - Get remaining daily photo quota

## Gemini API Integration

The photo calorie tracker uses Google's Gemini API to analyze food images. The API returns:
- `foodDescription`: Description of the food
- `calories`: Total calories
- `protein`: Protein in grams
- `carbs`: Carbohydrates in grams
- `fat`: Fat in grams
- `confidence`: Confidence level ("high", "medium", "low")

**Cost:** ~$0.002 CAD per photo using Gemini 1.5 Flash (or free tier if available)

## Beta Testing

To add beta testers:

1. Insert emails into the `betaTesters` table:
   ```sql
   INSERT INTO betaTesters (email, status) VALUES
   ('user1@example.com', 'invited'),
   ('user2@example.com', 'invited'),
   ('user3@example.com', 'invited'),
   ('user4@example.com', 'invited'),
   ('user5@example.com', 'invited');
   ```

2. Share the app URL with the whitelisted users

3. Only whitelisted emails can access the application

## Offline Support (PWA)

The app includes service worker support for offline functionality:
- Workout logging works offline and syncs when online
- Exercise library is cached for offline access
- AI movement demos are cached locally
- Photo uploads queue when offline

## Development

### Running Tests
```bash
pnpm test
```

### Type Checking
```bash
pnpm check
```

### Building for Production
```bash
pnpm build
pnpm start
```

### Code Formatting
```bash
pnpm format
```

## Deployment

### Manus Platform
The app is optimized for deployment on Manus:
1. Create a checkpoint
2. Click "Publish" in the Management UI
3. Configure custom domain if needed

### External Hosting (Railway, Render, Vercel)
1. Build: `pnpm build`
2. Start: `pnpm start`
3. Set environment variables in hosting platform
4. Deploy the `dist` folder

## Performance Considerations

- **Image Optimization:** Photos are compressed before upload to S3
- **Database Indexing:** Add indexes on `userId`, `date`, `expiresAt`
- **Caching:** Exercise library cached for 24 hours
- **Rate Limiting:** 10 photos per day per user
- **Data Retention:** Photo logs expire after 7 days

## Security

- **Authentication:** Manus OAuth with JWT tokens
- **API Keys:** All sensitive keys stored in environment variables
- **S3 Access:** Presigned URLs for secure file access
- **Email Whitelisting:** Beta tester access control
- **HTTPS:** All production traffic encrypted

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check MySQL/TiDB is running
- Ensure user has proper permissions

### Gemini API Errors
- Verify `GEMINI_API_KEY` is valid
- Check API quota and billing
- Ensure image is valid JPEG/PNG

### S3 Upload Failures
- Verify AWS credentials
- Check bucket exists and permissions
- Ensure bucket is in correct region

### OAuth Issues
- Verify `VITE_APP_ID` and `OAUTH_SERVER_URL`
- Check redirect URLs are whitelisted
- Clear browser cookies and retry

## Contributing

1. Create a feature branch
2. Make changes and test locally
3. Submit pull request with description
4. Code review and merge

## License

MIT

## Support

For issues or questions, please submit a support request at https://help.manus.im

---

**Version:** 1.0.0  
**Last Updated:** March 2026  
**Maintainer:** Manus AI
