# Mess Bill Dashboard

An ultra-minimalist, AMOLED-black styled weekly mess billing dashboard built with Tailwind CSS, HTML, and vanilla Javascript.

It integrates with a Google Sheet backend using a Google Apps Script web app URL (configured as `SCRIPT_URL` in Vercel environment variables).

## Features
- **AMOLED Dark Mode**: Clean black background with neon-cyan accents.
- **Batch Editing**: Tap multiple roommate cards to edit their meals simultaneously.
- **Day Selector & Custom Cost Override**: Quick buttons to select days and toggles to select meals or override default costs.
- **Dynamic Summaries**: Real-time breakdown by day or roommate.
- **Persistent Server Integration**: Synchronizes data to a cloud backend or local database.

---

## Local Development (Mock Server)

A mock server is provided using Python's standard library to enable local testing without needing access to the live Google Apps Script endpoint. It automatically reads and writes logs to a local `mock_db.json` database.

### How to Run:
1. Execute the mock server script:
   ```bash
   python3 dev_server.py
   ```
2. Open your browser and navigate to:
   [http://localhost:8000](http://localhost:8000)

### Mock Database
Data saved via the UI will be stored locally in [`mock_db.json`](file:///home/prithvi/.gemini/antigravity/scratch/mess_bill/mock_db.json) in the project directory, mimicking the server responses.

---

## Production Deployment (Public Access)

To make the dashboard public so your friends can log their own meals, you will deploy the app on Vercel and hook it up to a Google Sheet using Google Apps Script as the backend database.

### Step 1: Set up the Google Sheet Backend
1. Create a new Google Sheet.
2. Click on **Extensions** -> **Apps Script** in the top menu.
3. Delete any default code in `Code.gs` and paste the contents of [`google_apps_script.js`](file:///home/prithvi/.gemini/antigravity/scratch/mess_bill/google_apps_script.js).
4. Click the **Save** (floppy disk) icon.
5. Click **Deploy** (top right) -> **New Deployment**.
6. Click the gear icon next to "Select type" and choose **Web app**.
7. Configure the settings:
   - **Description**: `Mess Bill Sync API`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` (This is required so Vercel can talk to it).
8. Click **Deploy**.
9. Review Permissions and authorize the script using your Google account (click "Advanced" and "Go to Untitled project (unsafe)" if prompted).
10. **Copy the Web app URL** (it will end in `/exec`).

### Step 2: Deploy to Vercel
The project is structured to deploy directly as a serverless static site on Vercel:
- **Vercel Configuration**: [`vercel.json`](file:///home/prithvi/.gemini/antigravity/scratch/mess_bill/vercel.json) configures routing.
- **API Proxy**: [`api/load.js`](file:///home/prithvi/.gemini/antigravity/scratch/mess_bill/api/load.js) and [`api/save.js`](file:///home/prithvi/.gemini/antigravity/scratch/mess_bill/api/save.js) serve as serverless proxies to prevent CORS issues when communicating with your Google Apps Script URL.

1. Go to [Vercel](https://vercel.com) and sign in.
2. Click **Add New** -> **Project** and import your GitHub repository (`PRiTHVi907/mess_bill`).
3. Under the **Environment Variables** section, add:
   - **Key**: `SCRIPT_URL`
   - **Value**: The Web App URL you copied from Step 1.
4. Click **Deploy**.
5. Once deployed, Vercel will give you a public `.vercel.app` link. Share this link with your friends so they can input their details!

