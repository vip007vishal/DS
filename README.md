<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/18c9b7e0-8b3d-4f29-9815-dbe5f8e32ee5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

## Deploy FRONTEND to GitHub Pages (Backend stays local)

### What this supports
- Frontend is hosted on GitHub Pages (static).
- Your API/backend (server.ts) runs locally on your machine.
- The deployed frontend will call your local backend via: `http://localhost:3000/api`.

> This works only on **your own machine**. For other people, `localhost` refers to their computer.

### 1) Set your repo name in `.env.production`
Edit:
- `VITE_BASE_PATH=/REPO_NAME/`  → replace `REPO_NAME` with your GitHub repo name.
Example:
- repo: `docshield-main` → `VITE_BASE_PATH=/docshield-main/`

### 2) Install dependencies
```bash
npm install
```

### 3) Deploy to Pages
```bash
npm run deploy:pages
```

### 4) Enable Pages
GitHub → Settings → Pages → Branch = `gh-pages` → Save.

### Local backend env
Copy `.env.local.example` → `.env.local` and fill Gemini/SMTP/JWT secrets.
Then run locally:
```bash
npm run dev
```
Backend + local API runs on `http://localhost:3000`.
