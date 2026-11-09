# Vibely – React + Vite Social Media App

## Requirements
- Node.js 18 or newer
- npm

## Run locally
1. Extract the project ZIP.
2. Open the `vibely-react` folder in VS Code.
3. Open Terminal in that folder.
4. Run:

```bash
npm install
npm run dev
```

5. Open the local URL printed by Vite (usually http://localhost:5173).

## Demo Admin account
- Username: `admin`
- Password: `admin123`

Create regular User accounts through the Sign Up tab.

## Modules
- **Admin:** dashboard statistics, view users and posts, delete users and posts.
- **User:** signup/login, profile editing, text/image/video posts, likes, comments, follow/unfollow, search, notifications and local demo messaging.

## Local Storage
This academic demo stores users, posts, notifications, messages and the current session in the browser's Local Storage. Data is browser/device-specific. Clearing browser storage removes the demo data.

**Important:** Local Storage authentication is for classroom demonstration only. Passwords are not securely protected, and client-side admin roles are not production security. A real public social network needs a backend, hashed passwords, server-side authorization and secure media storage.

## Deploy to Vercel
1. Push this project to a GitHub repository.
2. Sign in to Vercel and choose **Add New → Project**.
3. Import the GitHub repository.
4. Vercel should detect Vite automatically.
5. Use:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
6. Click **Deploy**.
7. Test signup, login and the Admin demo account on the deployed URL.

The included `vercel.json` supports client-side page routing.
