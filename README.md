# Kaya Avatar Agent frontend

A lightweight React/Vite frontend that embeds a published Kaya Avatar Agent
workflow. Kaya manages the Tavus conversation, Daily video room, tool calls,
heartbeat, transcript flow, and session cleanup inside the embedded page.

## Prerequisites

- A published Kaya iFlow containing an Avatar Agent node
- A configured Tavus Avatar Model and ready replica
- The frontend hostname added to the Avatar Agent's Site Whitelisting setting
- Kaya admin frontend, admin backend, and workflow engine running

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

The checked-in defaults use:

```text
Kaya frontend: http://localhost:3000
Workspace:     c69c3a07-7977-4335-a27a-35dc8ba3d9bc
Workflow:      a3bb457b-dc72-4160-8074-fbb186860ff6
```

To use another environment, copy `.env.example` to `.env.local` and update:

```env
VITE_KAYA_URL=https://your-kaya-frontend.example.com
VITE_KAYA_WORKSPACE_ID=your-workspace-id
VITE_KAYA_WORKFLOW_ID=your-workflow-id
```

Vite environment values are public browser configuration. Never put Tavus,
Kaya, or workspace API keys in them.

## Build

```bash
npm run build
npm run preview
```

Production deployments must use HTTPS for microphone access. The deployed
frontend hostname (for example, `avatar.example.com`) must be present in the
published Avatar Agent's Site Whitelisting setting.