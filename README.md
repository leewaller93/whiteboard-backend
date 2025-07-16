# HAS Status Backend Deployment (Render)

## Deploying to Render.com

1. **Login to [Render](https://render.com/)** (create a free account if you don't have one).
2. **Click 'New Web Service'** and connect your GitHub repository.
3. **Select the `has-status-backend` folder** as the root for the backend service.
4. **Set the following settings:**
   - **Environment:** Node
   - **Build Command:** (leave blank)
   - **Start Command:** `npm start`
   - **Root Directory:** `has-status-backend`
5. **Add Environment Variables:**
   - `EMAIL_USER` (your Gmail address for nodemailer)
   - `EMAIL_PASS` (your Gmail app password)
6. **Persistent SQLite:**
   - By default, SQLite data will reset on redeploy. For persistent data, use a cloud database (optional for demo/testing).
7. **Click 'Create Web Service'.**
8. **Wait for deployment.**
   - After deployment, Render will provide a public backend URL (e.g., `https://your-backend.onrender.com`).

## Update Frontend to Use Backend

1. In your frontend code, update API URLs to use the Render backend URL instead of `localhost:5000`.
2. Redeploy the frontend if needed.

---

# Local Development & Testing (The "Lee Rule")

To run and test the project locally (without deployment):

1. **Start the Backend**
   - Open a terminal and navigate to the backend folder:
     ```sh
     cd has-status-backend
     npm install
     npm start
     ```
   - The backend will run on `http://localhost:5000` by default.

2. **Seed Sample Data**
   - In a new terminal, from the backend folder, run:
     ```sh
     node seed-demo-data.js
     ```
   - This will populate the local database with demo data for testing.

3. **Start the Frontend**
   - Open another terminal and go to the project root (where `src/` is):
     ```sh
     cd .. # if you're still in has-status-backend
     npm install
     npm start
     ```
   - The frontend will open in your browser, usually at `http://localhost:3000`.

4. **Test the App**
   - The frontend will communicate with the backend at `http://localhost:5000`.
   - You can now fully test all features and see the seeded sample data.

## The "Lee Rule" for Future Deployments

- Always ensure you can run both backend and frontend locally before deploying.
- Use a seed script to load demo/sample data for testing.
- Document the local run process in your README for every project.
- Only move to deployment (e.g., Render, Vercel, etc.) after local testing is successful.
- Share your local URLs for internal testing; use deployed URLs for public/external sharing.

---

# The "Lee Rule" – One Command to Demo Everything

**If you want to update anything (backend, frontend, demo data, or both) and make sure all demo data is live for everyone:**

1. **Commit and push your backend changes (including demo data) in `has-status-backend`.**
2. **Update the submodule reference in the main repo and push.**
3. **The backend will be automatically redeployed on Render via Deploy Hook.**
4. **If you changed the frontend, run `npm run deploy` in the main project directory.**
5. **Verify the backend endpoint and public frontend.**

**Any developer can do this—no guesswork, no missed steps.**

---

## All-in-One Shell Script Example (run from project root)

```sh
# Lee Rule: Deploy everything for a public demo
bash deploy-lee-rule.sh
```

- **Note:** You must be logged in to git and have push access. The backend deploy is now fully automated—no need to visit the Render dashboard.
- **After running this script,** your demo data and code will be live for everyone.

### Windows Users: PowerShell Alternative
If you are on Windows and do not have bash, copy and paste these commands into PowerShell:

```powershell
cd has-status-backend
git add .
git commit -m "Update backend and demo data for public demo"
git push
cd ..
git add has-status-backend
git commit -m "Update backend submodule ref for redeploy"
git push
curl.exe -fsSL "https://api.render.com/deploy/srv-d1rbgqm3jp1c73bm52i0?key=f1_fTd-OeYk"
# If you changed the frontend:
npm run deploy
```

---

## Full Step-by-Step (for reference)

1. Update demo data in `server.js` (or any backend/frontend code).
2. Commit and push backend changes in `has-status-backend`.
3. Update and push submodule reference in main repo.
4. Backend is automatically redeployed on Render (no manual step needed).
5. (If frontend changed) run `npm run deploy`.
6. Verify backend endpoint and public frontend.

---

**If anything fails, check the Render backend logs and the `/api/phases` endpoint, then repeat the steps as needed.**

---

For more details, see: https://render.com/docs/deploy-node-express-app 

---

# Developer Guide: Features, Files, and the Lee Rule

## Key Frontend Features

### ExpandingCell Component (Pop-Out Editor)
- **What:** Allows users to click on a table cell and edit its content in a pop-out box.
- **Where:** Implemented in `src/App.js` as the `ExpandingCell` function.
- **How it works:** Uses React state to manage editing, and `ReactDOM.createPortal` to render the pop-out above other content. Look for `function ExpandingCell` in `App.js`.
- **To customize:** Edit the `ExpandingCell` function or reuse it in other components.

## Adding New Features or Data
- **Frontend:** Add new components or features in `src/` (e.g., `src/ExpandingCell.js` if you want to split it out).
- **Backend:** Add or update demo data in `has-status-backend/server.js`.
- **Document:** Add a short note in this README about any new feature/component for future devs.

## Files to Create/Edit for New Features
- Frontend: `src/YourComponent.js`, update `src/App.js` or other relevant files.
- Backend: `has-status-backend/server.js` (for demo data or new endpoints).
- README: Add a section for any new major feature.

## Shell Commands for Updating Data & Deploying (Lee Rule)
- See the "Lee Rule" section above for the all-in-one script.
- Always commit and push backend changes, update the submodule, and redeploy on Render.
- If frontend changes, run `npm run deploy`.

## Shell Script Template for New Files & Render Prep
```sh
# Create a new frontend component
cd src
cat > MyNewComponent.js <<EOF
import React from 'react';
export default function MyNewComponent() {
  return <div>My New Feature</div>;
}
EOF
cd ..

# Create a new backend endpoint (example)
cd has-status-backend
cat >> server.js <<EOF
// Example new endpoint
app.get('/api/new-feature', (req, res) => {
  res.json({ message: 'New feature works!' });
});
EOF
cd ..

# Follow the Lee Rule to commit, push, and deploy
```

## How to Make a Change and Deploy (One Command)
- Use the all-in-one shell script in the Lee Rule section.
- This will:
  - Commit and push backend/frontend changes
  - Update the submodule
  - Redeploy backend on Render (now fully automated)
  - Deploy frontend if needed

---

**This README is your one-stop reference for building, updating, and deploying this project or any future project based on this template.**

--- 

You now have a shell script, `deploy-lee-rule.sh`, in your project root that automates the entire Lee Rule process:

- Commits and pushes backend changes (including demo data).
- Updates and pushes the submodule reference in the main repo.
- **Automatically triggers a backend deploy on Render via Deploy Hook.**
- Optionally runs `npm run deploy` for frontend changes.
- Gives clear prompts and status messages for each step.

**How to use:**
1. Make your changes (backend, frontend, or demo data).
2. Run:
   ```sh
   bash deploy-lee-rule.sh
   ```
3. Follow the prompts (enter commit messages, confirm frontend deploy, etc.).
4. The backend will be redeployed automatically—no manual Render step needed.

This script, along with the updated README, makes your workflow nearly one-command and foolproof for any developer!

If you want even more automation (like Render CLI integration for fully hands-off deploys), just let me know! 