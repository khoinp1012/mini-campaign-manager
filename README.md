# Mini Campaign Manager 🚀

A high-performance, full-stack email campaign management platform built for speed, reliability, and premium user experience.

## ✨ Features

- **Auth System**: Secure JWT-based authentication with protected routes.
- **Recipient Management**: Centralized recipient database with easy creation.
- **Campaign Workflow**:
  - Create campaigns with rich text support.
  - Schedule campaigns for future delivery.
  - Enforced business logic (Drafts are editable, Sent campaigns are locked).
- **Dashboard Analytics**: 
  - Real-time stats aggregation.
  - Interactive donut charts for delivery status and open rates.
- **Async Sending Simulator**: Reliable background process simulating email dispatch with randomized success/failure rates.

## 🛠 Tech Stack

- **Monorepo**: Yarn Workspaces / NPM Workspaces.
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
npm run dev
```

This will automatically check for missing environment variables/dependencies, boot the Docker infrastructure, and launch the development servers.

### 3. Manual Setup (Troubleshooting)
If the combined command fails or you need a hard reset:

```bash
# Full reset and re-seed
./setup.sh

# Then start normally
npm run dev
```

### 4. Start Development Servers
Once setup is complete, you can start both the frontend and backend simultaneously from the root:

```bash
npm run dev
```

Alternatively, start them separately using workspaces:
```bash
# Start backend
npm run dev -w @mini-campaign-manager/backend

# Start frontend
npm run dev -w @mini-campaign-manager/frontend
```

**Demo Credentials**:
- **Email**: `demo@example.com`
- **Password**: `password123`

---

## 🤖 How I Used AI Coding Assistant
This project was build by AI under human supervision. I use Antigravity, Open Code with multiple model to build it.
Plugin used: superpower, planning-with-files
### 1. Workflow: The AI workflow is continous loop between AI and Human. AI generate code, human review and fix.
First phase: AI generated code
1- Let AI generated code by reading project description.
2- Tell it to generated via planning with subagent for implementation
3- Human review plan. If not good, ask AI to regenerate plan.
4- Tell AI generated code and tell it generated as much as test posible. All test must pass
Second phase: Human review and fix
1- Make sure all features correct with project description.
2- Read flow of data / logic to make sure no security, logic error.
3- Fix bug and repeat both phase.

### 2. Where AI Code was wrong (and how I fixed it)
- AI hallucinate about features implemented. Many times, it tell features implement, but they are not. e.g: "Action buttons: Schedule, Send, Delete (conditionally shown based on status)" I need to tell it to re-implement.

### 3. What I would NOT let AI Code do (and Why)
- Generally, it heavily depend on project. If the project need more reliability (production system), it will need more human review / control. But generally, I think AI assistant is unavoidable.
- In production system, we will need to create AI-assistant branch and mock database to make sure: AI hallucination will not destroy the system. AI will only generate code for AI-assistant branch. Then human will review and merge to main branch.
