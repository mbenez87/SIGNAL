# CLAUDE.md — Signal87 AI (SIGNAL)

This file gives AI assistants a complete map of the codebase so they can work
efficiently without needing to re-explore from scratch on every session.

---

## Project Overview

**Signal87 AI** (internally called SIGNAL) is a document intelligence SaaS
platform. Users upload documents (PDFs, DOCX, images, etc.), organize them into
folders and workspaces, and interact with them through an AI chat interface
called **ARIA**. The platform also provides audit logs, permission/sharing
controls, and subscription billing.

The frontend is a Vite + React SPA backed by the **Base44** platform, which
handles the database, authentication, cloud functions, file storage, and AI
agent execution.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Build tool | Vite 6 |
| Framework | React 18 |
| Routing | react-router-dom v7 |
| Styling | Tailwind CSS 3 + tailwindcss-animate |
| UI components | shadcn/ui (Radix UI primitives) |
| Data fetching | TanStack Query (React Query) v5 |
| Animation | Framer Motion |
| Markdown rendering | react-markdown |
| Charts | Recharts |
| Notifications | Sonner toasts |
| Forms | react-hook-form + Zod |
| Backend / BaaS | Base44 SDK (`@base44/sdk`) |
| Linter | ESLint 9 (flat config) |

---

## Directory Structure

```
/
├── index.html                  # Vite entry point
├── vite.config.js              # Vite config (port 3002, HMR over WSS)
├── tailwind.config.js          # Tailwind theme extensions + dark mode
├── eslint.config.js            # ESLint flat config (React + hooks)
├── jsconfig.json               # Path alias: @/ → ./src/
├── components.json             # shadcn/ui registry config
├── package.json
└── src/
    ├── main.jsx                # ReactDOM.createRoot entry, wraps App
    ├── App.jsx                 # Root component: <Pages /> + <Toaster />
    ├── App.css / index.css     # Global styles
    ├── api/
    │   ├── base44Client.js     # Base44 client singleton (appId, requiresAuth)
    │   ├── entities.js         # Entity model exports (Document, Folder, …)
    │   ├── functions.js        # Cloud function exports (aria, grokProcessing, …)
    │   └── integrations.js     # Integration exports (UploadFile, InvokeLLM, …)
    ├── components/
    │   ├── ui/                 # shadcn/ui components (accordion, button, …)
    │   ├── auth/
    │   │   └── AuthContext.jsx # AuthProvider + useAuth hook
    │   ├── audit/
    │   │   └── AuditTracker.jsx# Client-side audit logging helpers
    │   ├── documents/          # Document-related sub-components
    │   │   ├── DocumentGrid.jsx
    │   │   ├── DocumentList.jsx
    │   │   ├── FilterPanel.jsx
    │   │   ├── FolderList.jsx
    │   │   ├── CreateFolderModal.jsx
    │   │   ├── AIBatchOrganizer.jsx
    │   │   └── ThumbnailGenerator.jsx
    │   ├── intelligence/
    │   │   └── DocumentSelectorModal.jsx
    │   ├── landing/            # Marketing / home page animations
    │   │   ├── AnimatedDemo.jsx
    │   │   ├── HeroAnimation.jsx
    │   │   ├── IntelligenceLayer.jsx
    │   │   └── ReportGenerationDemo.jsx
    │   ├── permissions/
    │   │   ├── PermissionGuard.jsx
    │   │   ├── PermissionHelper.jsx
    │   │   └── ShareDocumentModal.jsx
    │   ├── workspaces/
    │   │   ├── AddDocumentsModal.jsx
    │   │   ├── RenameWorkspaceModal.jsx
    │   │   └── ShareWorkspaceModal.jsx
    │   ├── Footer.jsx
    │   ├── UploadContext.jsx
    │   ├── UserNotRegisteredError.jsx
    │   └── WaitlistButton.jsx
    ├── hooks/
    │   └── use-mobile.jsx      # useIsMobile breakpoint hook
    ├── lib/
    │   └── utils.js            # cn() helper (clsx + tailwind-merge)
    ├── utils/
    │   └── index.ts            # createPageUrl(pageName) helper
    └── pages/
        ├── index.jsx           # BrowserRouter + route table
        ├── Layout.jsx          # App shell (sidebar, nav, folder list)
        ├── Home.jsx            # Landing / marketing page
        ├── Dashboard.jsx
        ├── Documents.jsx       # Document library with search/filter
        ├── DocumentViewer.jsx  # Full-screen document viewer
        ├── Upload.jsx          # Drag-and-drop upload flow
        ├── Intelligence.jsx    # ARIA V2 AI chat interface
        ├── SavedChats.jsx
        ├── Workspaces.jsx
        ├── Trash.jsx
        ├── Permissions.jsx     # Admin: per-document sharing
        ├── AuditLogs.jsx       # Admin: immutable audit trail viewer
        ├── Compliance.jsx      # Admin: compliance dashboard
        ├── Billing.jsx
        ├── Pricing.jsx
        ├── SubscriptionSettings.jsx
        ├── AboutUs.jsx
        ├── MichaelBenezra.jsx  # Team profile page
        ├── MichaelChavira.jsx  # Team profile page
        ├── Privacy.jsx
        └── Terms.jsx
```

---

## Routing

Routes are defined in `src/pages/index.jsx` using react-router-dom v7
`<BrowserRouter>`. Every page is mounted inside `<Layout>`, which renders the
sidebar and applies per-page layout rules:

- **Home** / **Dashboard** — no sidebar, children rendered directly.
- **DocumentViewer** — no sidebar, no footer (full-screen).
- **SubscriptionSettings** — no sidebar, no footer.
- All other pages — sidebar + optional footer.

The default route (`/`) renders `<AboutUs />`.

URL generation uses the `createPageUrl(pageName)` helper
(`src/utils/index.ts`) which lowercases the page name (e.g., `"Documents"` →
`"/documents"`).

---

## Data Layer — Base44 SDK

All backend interaction goes through a single client instance:

```js
// src/api/base44Client.js
import { createClient } from '@base44/sdk';
export const base44 = createClient({
  appId: "693a41be01661c1d9efc9479",
  requiresAuth: true
});
```

### Entities (ORM-style)

Exported from `src/api/entities.js`. All use `base44.entities.<Name>`:

| Export | Purpose |
|---|---|
| `Document` | Core document records |
| `Folder` | Folder organization |
| `DocumentInsight` | AI-generated insights per document |
| `AuditLog` | Immutable audit records |
| `Subscription` | User subscription state |
| `UsageRecord` | Per-user usage tracking |
| `Workspace` | Collaborative workspaces |
| `SavedChat` | Persisted ARIA conversation snapshots |
| `User` | Auth object (`base44.auth`) |

Common entity methods: `.filter(query, orderBy?)`, `.create(data)`,
`.update(id, data)`, `.get(id)`.

### Cloud Functions

Exported from `src/api/functions.js` via `base44.functions.<name>`. Key
functions:

| Export | Purpose |
|---|---|
| `aria` | Main ARIA AI agent function |
| `ariaTools` | ARIA tool-use capabilities |
| `ariadocumentsbatch` | Batch document analysis |
| `grokProcessing` | Background AI processing after upload |
| `generatePdfThumbnail` | Single PDF → thumbnail |
| `batchGenerateThumbnails` | Bulk thumbnail generation |
| `generateEmbeddings` | Semantic embedding generation |
| `generateInsights` | Per-document AI insights |
| `generateDocx` / `generatePdf` | Export conversation as file |
| `auditLogger` | Write immutable audit records |
| `checkPermission` | Verify user has permission on resource |
| `createCheckoutSession` / `createPortalSession` | Stripe billing |
| `handleStripeWebhook` | Stripe webhook handler |
| `checkUsageLimit` / `trackUsage` | Usage metering |
| `ensureUserProfile` | On-login profile bootstrap |
| `deleteMyAccount` | Account deletion |
| `testOpenAI` | OpenAI connectivity test |

Invoke pattern: `base44.functions.invoke('functionName', { ...args })`.
Shorthand: `base44.functions.<name>({ ...args })`.

### Integrations

Exported from `src/api/integrations.js` via `base44.integrations.Core`:

| Export | Purpose |
|---|---|
| `UploadFile` | Upload a file, returns `{ file_url }` |
| `UploadPrivateFile` | Upload with private access |
| `CreateFileSignedUrl` | Generate a signed URL for a private file |
| `ExtractDataFromUploadedFile` | AI data extraction from file |
| `InvokeLLM` | Direct LLM call |
| `SendEmail` | Transactional email |
| `GenerateImage` | AI image generation |

### AI Agents (ARIA)

The Intelligence page uses `base44.agents`:

```js
// Create a conversation session
const conversation = await base44.agents.createConversation({
  agent_name: "aria",
  metadata: { name: "...", description: "..." }
});

// Add a user message
await base44.agents.addMessage(conversation, { role: "user", content: "..." });

// Subscribe to streaming updates
const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
  setMessages(data.messages || []);
});
```

---

## Authentication

Authentication is managed by Base44:

- `base44.auth.me()` — returns the current user or throws.
- `base44.auth.isAuthenticated()` — boolean check.
- `base44.auth.redirectToLogin(returnPath)` — redirect to login.
- `base44.auth.logout()` — log out.

The `AuthContext` (`src/components/auth/AuthContext.jsx`) wraps these calls and
exposes `{ user, isAuthenticated }` via the `useAuth()` hook. However, most
pages also call `base44.auth.me()` directly through a React Query `useQuery`
with key `['currentUser']` for cache consistency.

User roles: `user.role === 'admin'` unlocks the Admin nav section (Audit Logs,
Permissions, Compliance).

---

## Data Fetching Pattern

All server state uses **TanStack Query**:

```jsx
const queryClient = useQueryClient();

// Read
const { data: documents = [], isLoading } = useQuery({
  queryKey: ['documents', selectedFolder, searchQuery, filters, user?.email],
  queryFn: async () => { /* base44 calls */ },
  enabled: !!user,
});

// Write with optimistic update
const deleteMutation = useMutation({
  mutationFn: (id) => base44.entities.Document.update(id, { is_trashed: true }),
  onMutate: async (id) => { /* optimistic update */ },
  onError: (err, id, context) => { /* rollback */ },
});

// Invalidate after mutations
queryClient.invalidateQueries(['documents']);
```

---

## Audit Logging

Every meaningful user action must be logged through the helpers in
`src/components/audit/AuditTracker.jsx`:

```js
import { logDocumentView, logDocumentUpload, logDocumentDelete } from
  "@/components/audit/AuditTracker";

// Usage
await logDocumentUpload(doc.id, doc.title, fileType, fileSize);
await logDocumentDelete(doc.id, doc.title, /* permanent= */ false);
```

Audit failures are swallowed (logged to console only) — they must never block
user actions. Records are written to the immutable `AuditLog` entity via the
`auditLogger` cloud function.

Available audit helpers: `logDocumentView`, `logDocumentDownload`,
`logDocumentDelete`, `logDocumentRestore`, `logDocumentUpload`,
`logDocumentEdit`, `logDocumentShare`, `logFolderCreate`, `logFolderDelete`,
`logFolderUpdate`, `logAIQuery`, `logAIReportGeneration`, `logBulkAction`,
`logUserLogin`, `logUserLogout`, `logPermissionChange`, `logSettingsChange`,
`logDataExport`.

---

## UI Component Conventions

### shadcn/ui

All primitive UI components live in `src/components/ui/`. They are generated
from shadcn/ui and should not be hand-edited unless intentionally extending
them. Import them with the `@/` alias:

```js
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from
  "@/components/ui/dialog";
```

### Utility: `cn()`

Use `cn()` from `src/lib/utils.js` for conditional class merging:

```js
import { cn } from "@/lib/utils";
<div className={cn("base-class", condition && "conditional-class")} />
```

### Color Palette (dark theme)

Most app pages use a dark neutral palette:
- Backgrounds: `bg-neutral-950`, `bg-neutral-900`, `bg-neutral-800`
- Borders: `border-neutral-800`, `border-neutral-700`
- Text: `text-white`, `text-gray-400`, `text-gray-500`
- Accent: `text-cyan-500`, `bg-cyan-500` (primary CTA), `bg-blue-600`

The Home/About/public pages use a light theme (`bg-white`, `text-slate-900`).

### Icons

All icons come from `lucide-react`. Import only the icons needed per file.

### Animations

Use `framer-motion` for page-level and component-level animations. Standard
pattern:

```jsx
import { motion, AnimatePresence } from "framer-motion";
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}>
```

---

## Document Upload Flow

1. User selects files on `/Upload` (drag-and-drop or file picker).
2. `base44.integrations.Core.UploadFile({ file })` → returns `{ file_url }`.
3. For PDFs, `generatePdfThumbnail({ pdf_url })` is called to get
   `thumbnail_url`. Images use the file URL directly as thumbnail.
4. `base44.entities.Document.create({ ... })` creates the DB record with
   `processing_status: 'pending'`.
5. `grokProcessing({ document_id, file_url, file_type })` is fired in the
   background (non-blocking) to run AI extraction/summarization.
6. `logDocumentUpload(...)` writes an audit record.
7. A 2-second delay is inserted between consecutive file uploads to avoid rate
   limiting.

---

## Intelligence / ARIA Page

The `Intelligence.jsx` page is the core AI interface:

- **Workflow modes**: `report`, `insights`, `trends`, `research`, `documents`.
- Messages sent to the `aria` agent include a mode prefix:
  `[Mode: report] <user query>`.
- Document context is appended as:
  `Focus on these documents: doc://<id> (<title>), …`.
- Conversations can be saved as `SavedChat` entities and reloaded via
  `?chatId=<id>` URL param.
- Export options: CSV (client-side Blob) and DOCX (via `generateDocx` cloud
  function).

---

## Development Workflow

### Running the app

```bash
npm install
npm run dev        # starts on http://localhost:3002
```

The dev server is configured with:
- `host: true` (bind to all interfaces)
- `strictPort: true` (fail if 3002 is taken)
- HMR over WSS on port 443 at path `/vite-hmr`
- `allowedHosts: ["chat-preview"]`

### Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

### Lint

```bash
npm run lint       # ESLint with React + hooks rules
```

No test suite is configured at this time.

---

## Path Aliases

The `@/` alias maps to `src/`:

```js
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { createPageUrl } from "@/utils";   // src/utils/index.ts
```

In page files you will also see relative imports like `../utils` and
`../components/audit/AuditTracker` — both resolve correctly.

---

## Key Conventions for AI Assistants

1. **Never import from Base44 SDK directly** — always use the re-exports in
   `src/api/` (`base44Client`, `entities`, `functions`, `integrations`).

2. **Always add audit logging** when implementing document, folder, workspace,
   or permission mutations. Use the helpers from `AuditTracker.jsx`.

3. **Use TanStack Query** for all async server state. Don't use `useState` +
   `useEffect` for data fetching. Prefer optimistic updates for mutations.

4. **Add new pages** by:
   - Creating `src/pages/MyPage.jsx`.
   - Importing and adding to the `PAGES` map in `src/pages/index.jsx`.
   - Adding a `<Route path="/MyPage" element={<MyPage />} />` in the route
     list.
   - Adding navigation items to `Layout.jsx` if the page should appear in the
     sidebar.

5. **Add new entities** by declaring them in `src/api/entities.js`:
   ```js
   export const MyEntity = base44.entities.MyEntity;
   ```

6. **Add new cloud functions** by declaring them in `src/api/functions.js`:
   ```js
   export const myFunction = base44.functions.myFunction;
   ```

7. **shadcn/ui components** should be used for all generic UI elements. Do not
   create custom button/input/dialog components from scratch.

8. **Routing**: use `createPageUrl('PageName')` from `@/utils` (not hardcoded
   strings) whenever building internal links.

9. **Dark theme first** for authenticated app pages; light theme for public
   marketing pages (Home, AboutUs, Pricing, etc.).

10. **No test files exist** — if adding tests, create a `src/__tests__/`
    directory and configure Vitest (not yet set up).

---

## Entity Data Shape Reference

### Document
```
id, title, file_url, thumbnail_url, file_type, file_size, mime_type,
owner, created_by, processing_status ('pending'|'processing'|'done'|'error'),
category, tags[], ai_summary, is_trashed, trashed_date, is_favorited,
access_count, version, folder_id, shared_with[{ user_email, permission }]
```

### Folder
```
id, name, color ('blue'|'green'|'purple'|'orange'|'red'|'yellow'|'pink'|'gray'),
created_by
```

### SavedChat
```
id, title, conversation_id, messages[], mode, document_ids[], preview
```

### AuditLog
```
id, action_type, resource_type, resource_id, resource_title,
details{}, status ('success'|'error'), error_message, created_date
```
