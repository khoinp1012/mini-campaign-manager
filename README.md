# Mini Campaign Manager 🚀

A MVP high-performance, full-stack email campaign management platform built for speed, reliability, and premium user experience.
<video src="https://github.com/user-attachments/assets/9e4d804c-ecab-4b57-b59d-e6ba449717b1" controls="controls" style="max-width: 100%; height: auto;"></video>
## ✨ Features

- All features in project description implemented with few extras:

  1. GUI came from Google Stitch (/gui)
  2. 40+ test coverage, including full Playwright E2E suite
  3. Full GitHub Actions CI pipeline included (Automated Lint/Build/Test)
- If this project go production, I will:
  1. Implement full features
  2. Integrated with OpenClaw so user can control and query data with natural language via AI skills.
## 🛠 Tech Stack

- **Monorepo**: Yarn Workspaces.
- **Frontend**:
  - React 19 + Vite + TypeScript.
  - Styling: Tailwind CSS v4 (Vanilla Modern CSS).
  - State Management: Zustand (Auth) & TanStack Query (Data Fetching).
  - Icons: Lucide React.
  - Charts: Recharts.
- **Backend**:
  - Node.js + Express 5.2.1 (Native Async Support).
  - ORM: Sequelize 6.37.
  - Database: PostgreSQL (Dockerized).
  - Validation: Zod.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- Yarn or NPM

### 2. Quick Start (Smart Setup)
The project is configured to handle its own setup. Most developers only need one command:

```bash
yarn run dev
```

This will automatically check for missing environment variables/dependencies, boot the Docker infrastructure, and launch the development servers.

### 3. Manual Setup (Troubleshooting)
If the combined command fails or you need a hard reset:

```bash
# Full reset and re-seed
./setup.sh

# Then start normally
yarn run dev
```

### 4. Start Development Servers
Once setup is complete, you can start both the frontend and backend simultaneously from the root:

```bash
yarn run dev
```

Alternatively, start them separately using workspaces:
```bash
# Start backend
yarn workspace @mini-campaign-manager/backend dev

# Start frontend
yarn workspace @mini-campaign-manager/frontend dev
```

**Demo Credentials**:
- **Email**: `demo@example.com`
- **Password**: `password123`

---

## 🤖 How I Used AI Coding Assistant
This project was built by AI under human supervision. I used Antigravity, Open Code with multiple model to build it.
Plugin used: superpower, planning-with-files

### 1. Workflow: The AI workflow is continuous loop between AI and Human. AI generate code, human review and fix.

**First phase: AI generated code**

1. Let AI generate code by reading project description.
2. Tell it to generate via planning with subagent for implementation
3. Human review plan. If plan isn't good, force AI to regenerate plan.
4. Tell AI generate code and tell it to generate as much as test possible. All test must pass

**Second phase: Human review and fix**

1. Make sure all features correct with project description.
2. Read flow of data / logic to make sure no security, logic error.
3. Repeat both phase.

### 2. Where AI Code was wrong (and how I fixed it)
- AI hallucinate about features implemented. Many times, it told features implemented, but they are not, e.g: "Action buttons: Schedule, Send, Delete (conditionally shown based on status)" We need to double-check and tell it to re-implement.

### 3. What I would NOT let AI Code do (and Why)
- Generally, it heavily depend on project. If the project need more reliability (production system), it will need more human review / control. But generally, I think AI assistant is unavoidable.
- In production system, we will need to create AI-assistant branch and mock database to make sure: AI hallucination will not destroy the system. AI will only generate code for AI-assistant branch. Then human will review and merge to main branch.
- In complex project, I will do plan. AI implement, human direct and control. But for this simple CRUD project, I let AI plan.
