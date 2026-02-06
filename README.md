# Goals Tracker (Next.js + Firebase Firestore)

This app stores goals directly in Firestore from the browser (no custom backend, no auth UI).  
Data is shared for one-user usage across all devices.

## Firestore data model (shared path)

- Shared document path: `shared/goals-app` (override with `NEXT_PUBLIC_FIREBASE_SHARED_PATH`)
- Goals collection: `shared/goals-app/goals/{goalId}`
- Shared title field: `shared/goals-app.title`

## 1) Firebase setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
2. Add a Web app in that project and copy the Firebase config values.
3. Create Firestore Database (Native mode).
4. Set Firestore Security Rules to this no-auth shared model:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shared/{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 2) Local environment variables

Create `.env.local` (do not commit it):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Optional
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
NEXT_PUBLIC_FIREBASE_SHARED_PATH=shared/goals-app
NEXT_PUBLIC_FIREBASE_FORCE_LONG_POLLING=false
```

Notes:
- Required by app: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.
- Set `NEXT_PUBLIC_FIREBASE_FORCE_LONG_POLLING=true` for restrictive networks/proxies where default transport is unstable.

## 3) Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 4) Validation commands

```bash
npm run lint
npm run build
```

## 5) Curl smoke test (write + read Firestore)

Script: `scripts/firebase-smoke.sh`

It writes a temporary goal to `shared/goals-app/goals/{id}`, reads it back, verifies content, and deletes it.

Run with env loaded (either FIREBASE_* or NEXT_PUBLIC_FIREBASE_* vars are accepted):

```bash
source .env.local
./scripts/firebase-smoke.sh
```

## 6) Deploy on Vercel

1. Import repo into Vercel.
2. Add all required `NEXT_PUBLIC_FIREBASE_*` env vars in Vercel Project Settings.
3. Deploy.  
   The app remains fully static/client-driven with Firestore as the only data layer.
