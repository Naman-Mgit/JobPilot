<p align="center">
  <img src="./public/JobPilot%20logo%20with%20friendly%20robot.png" alt="JobPilot Logo" width="150"/>
</p>

# 🚀 JobPilot

**JobPilot** is a modern, premium AI-Assisted Job Application Tracker. Designed for speed, utility, and elegance, it allows you to visualize your entire job pipeline natively via an interactive drag-and-drop Kanban board while leveraging powerful Google Gemini AI features to drastically speed up your application workflow.

---

## ✨ Features

- **Kanban Board Pipeline:** A clean, optimized drag-and-drop interface mapping directly to 5 application states: *Applied, Phone Screen, Interview, Offer, Rejected*.
- **Optimistic UI Data Syncing:** Actions sync silently to MongoDB in the backend. When you drag a card, it stays there instantly—no loading latency or frozen borders.
- **AI Job Description Parser:** Paste raw job descriptions natively via the `AI Parser` button. The Gemini model handles strict metadata extraction straight into your 'Add Application' form.
- **AI Resume Suggestions:** Utilize the built-in generative workflow to formulate specific, highly impactful resume bullet points tailored explicitly to the job requirements, completely decoupled from MongoDB memory (ephemeral).
- **Global Dark Mode:** Dynamic Tailwind CSS integration providing buttery smooth visual transitions between sleek Light and native Dark environments through `next-themes`.

---

## 🛠️ Tech Stack Architecture

- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind CSS (v4)
- **UI Toolkit:** Shadcn UI + Lucide-React (Icons)
- **Drag & Drop Logic:** `@hello-pangea/dnd`
- **Backend Mechanics:** Next.js Server Actions (Bypass REST Endpoints)
- **Database:** MongoDB (Native Next.js Pooling Driver)
- **Authentication:** Better-Auth Native Adapter
- **AI Brain:** Vercel AI SDK mapping to Google's `@ai-sdk/google` (`gemini-2.5-flash`)

---

## 💻 Getting Started locally

### 1. Requirements
Ensure you have Node.js (v20+) installed alongside a valid Google Gemini API account.

### 2. Environment Variables
Create a root level `.env` file to mount the keys required natively to boot the project. Open the pre-installed `.env` (or `.env.local`) and configure:
```ini
# Core Auth Token for session states
BETTER_AUTH_SECRET
BETTER_AUTH_URL

# Direct MongoDB Connect URI String
NEXT_PUBLIC_MONGODB_URI

# Google Gemini Key for the AI SDK Models
GOOGLE_GENERATIVE_AI_API_KEY
```

### 3. Installation
Navigate into the repository and trigger install sequences:
```bash
npm install
```

### 4. Running the Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to experience JobPilot instantly.

---

## 🕹️ How to Use the Application

1. **Adding a Regular Job**: Click the main "Add New Application" button and manually write out the payload (salary, link, title). Save and watch it populate in your pipeline natively.
2. **Using AI Parser**: Click the sparkly `AI Parser` module button at the top header. Dump the raw block of text from LinkedIn/Indeed into the box and execute. The AI will spin up, map out your requirements, and intelligently fill out the Form modal automatically.
3. **Drafting Bullet Points**: Click `AI Resume Suggestions`. This acts identically to the Parser but instructs the Intelligence Engine to write 3 to 5 customized resume bullet blocks to help you modify your resume prior to application dropping. Use the native `Copy` command to instantly rip them to your clipboard!
4. **Mutating state**: Hover any job card—it holds complex metadata dynamically. Drag it across your board column boundaries to mutate the `status`. Click the `Edit` button natively overlapping the detailed view card to quickly augment "Notes" or forcefully Delete the job if it's discarded.
