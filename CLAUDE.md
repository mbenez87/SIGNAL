# CLAUDE.md — Signal87 AI (SIGNAL)

This file provides context for AI assistants working on this codebase.

## Project Overview

**Signal87 AI** is a document intelligence SaaS application built on the Base44 platform. It allows users to upload, organize, and analyze documents using AI, with a conversational interface powered by an AI agent called **Aria**. The app supports workspaces, document sharing, compliance/audit logging, and subscription-based billing.

- **App ID**: `693a41be01661c1d9efc9479`
- **Stack**: Vite + React 18 + TailwindCSS + shadcn/ui + Base44 SDK

---

## Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server on port 3002
npm run build      # Production build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

The dev server runs on port **3002** with HMR over WSS.

---

## Project Structure

```
SIGNAL/
├── src/
│   ├── api/                  # Base44 SDK wrappers
│   │   ├── base44Client.js   # SDK client initialization
│   │   ├── entities.js       # Data entity exports
│   │   ├── functions.js      # Backend function exports
│   │   └── integrations.js   # Core integration exports
│   ├── components/
│   │   ├── audit/            # Audit trail logging
│   │   ├── auth/             # AuthContext provider
│   │   ├── documents/        # Document UI components
│   │   ├── intelligence/     # AI chat components
│   │   ├── landing/          # Marketing/landing page animations
│   │   ├── permissions/      # Permission guards and helpers
│   │   ├── ui/               # shadcn/ui component library
│   │   ├── workspaces/       # Workspace modals
│   │   ├── Footer.jsx
│   │   ├── UploadContext.jsx  # Upload queue/state context
│   │   ├── UserNotRegisteredError.jsx
│   │   └── WaitlistButton.jsx
│   ├── hooks/
│   │   └── use-mobile.jsx
│   ├── lib/
│   │   └── utils.js          # cn() utility (clsx + tailwind-merge)
│   ├── pages/
│   │   ├── index.jsx         # Router setup, page registry
│   │   ├── Layout.jsx        # App shell with sidebar
│   │   ├── Dashboard.jsx     # Analytics dashboard + Aria chat
│   │   ├── Documents.jsx     # Document browser
│   │   ├── DocumentViewer.jsx
│   │   ├── Intelligence.jsx  # Aria V2 chat interface
│   │   ├── Upload.jsx        # File upload page
│   │   ├── Workspaces.jsx    # Workspace management
│   │   ├── AuditLogs.jsx     # Admin: audit log viewer
│   │   ├── Compliance.jsx    # Compliance management
│   │   ├── Permissions.jsx   # Admin: permission overview
│   │   ├── Billing.jsx       # Billing page
│   │   ├── Pricing.jsx       # Public pricing page
│   │   ├── SubscriptionSettings.jsx
│   │   ├── SavedChats.jsx    # Saved Aria conversations
│   │   ├── Trash.jsx         # Soft-deleted documents
│   │   ├── Home.jsx          # Public landing page
│   │   ├── AboutUs.jsx
│   │   ├── MichaelBenezra.jsx  # Team member profile
│   │   ├── MichaelChavira.jsx  # Team member profile
│   │   ├── Terms.jsx
│   │   └── Privacy.jsx
│   ├── utils/
│   │   └── index.ts          # createPageUrl() helper
│   ├── App.jsx               # Root component
│   ├── main.jsx              # ReactDOM entry point
│   ├── index.css             # Global styles
│   └── App.css
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── jsconfig.json
├── components.json           # shadcn/ui config
└── index.html
```

---

## Key Architecture Patterns

### Routing

All routes are defined in `src/pages/index.jsx`. The `PAGES` object maps page names to components. The `_getCurrentPage()` function derives the active page from the URL path. Route paths are lowercase and match the page name (e.g., `/intelligence`, `/documents`).

**Creating a new page:**
1. Create `src/pages/MyPage.jsx`
2. Import it in `src/pages/index.jsx`
3. Add it to the `PAGES` object and `<Routes>`
4. Use `createPageUrl('MyPage')` from `@/utils` for navigation

### Navigation

Use `createPageUrl(pageName)` (from `src/utils/index.ts`) to generate route paths. This converts the page name to a lowercase URL. Never hardcode paths.

```js
import { createPageUrl } from '@/utils';
// createPageUrl('Intelligence') => '/intelligence'
```

### Path Aliases

The `@` alias resolves to `./src`. Use it for all imports:
```js
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
```

### Layout System

`src/pages/Layout.jsx` is the app shell. It conditionally renders the sidebar:
- **No sidebar**: `Home`, `Dashboard` pages, plus `SubscriptionSettings` (renders children directly)
- **No sidebar/footer**: `DocumentViewer` (full-screen)
- **With sidebar**: All other authenticated pages

The sidebar passes `selectedFolder` and `setSelectedFolder` props to children via `React.cloneElement`.

### Authentication

Authentication is handled by the Base44 SDK (`base44.auth`). The app uses two patterns:

1. **`useQuery` pattern** (preferred in most pages):
   ```js
   const { data: user } = useQuery({
     queryKey: ['currentUser'],
     queryFn: () => base44.auth.me(),
   });
   ```

2. **`AuthContext`** (used in `Home.jsx`):
   ```js
   import { useAuth } from '@/components/auth/AuthContext';
   const { user, isAuthenticated } = useAuth();
   ```

For pages that require auth, check `user` before rendering or fetching data. Use `base44.auth.isAuthenticated()` for imperative checks. Redirect to login with `base44.auth.redirectToLogin()`.

### Data Fetching

All data access goes through the Base44 SDK. Use TanStack Query for all data fetching:

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Fetching
const { data: documents = [] } = useQuery({
  queryKey: ['documents', user?.email],
  queryFn: () => base44.entities.Document.filter({ created_by: user.email }),
  enabled: !!user,
});

// Mutations
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (data) => base44.entities.Document.create(data),
  onSuccess: () => queryClient.invalidateQueries(['documents']),
});
```

### Data Entities

Exported from `src/api/entities.js`:

| Entity | Description |
|---|---|
| `Document` | Core document records |
| `Folder` | Document folders |
| `DocumentInsight` | AI-generated insights |
| `AuditLog` | Immutable audit trail records |
| `Subscription` | User subscription data |
| `UsageRecord` | Usage tracking |
| `Workspace` | Shared/personal workspaces |
| `SavedChat` | Saved Aria conversations |
| `User` | Auth SDK (`base44.auth`) |

### Backend Functions

Exported from `src/api/functions.js`. Called via `base44.functions.invoke(name, args)`:

| Function | Purpose |
|---|---|
| `aria` | Main AI chat agent |
| `ariaTools` | Tool-augmented Aria responses |
| `grokProcessing` | Grok AI processing |
| `ariadocumentsbatch` | Batch document processing |
| `generatePdfThumbnail` / `batchGenerateThumbnails` | PDF thumbnail generation |
| `generateEmbeddings` | Vector embeddings for search |
| `generateInsights` | AI document insights |
| `generateDocx` / `generatePdf` | Document export |
| `auditLogger` | Write immutable audit records |
| `checkPermission` / `ensureUserProfile` | Permission checks |
| `createCheckoutSession` / `createPortalSession` | Stripe billing |
| `handleStripeWebhook` | Stripe webhook handler |
| `checkUsageLimit` / `trackUsage` | Usage management |
| `deleteMyAccount` | Account deletion |

### Core Integrations

Exported from `src/api/integrations.js`:

- `InvokeLLM` — Direct LLM invocation with optional web search and JSON schema
- `SendEmail` — Send transactional emails
- `UploadFile` / `UploadPrivateFile` — File storage
- `CreateFileSignedUrl` — Generate signed download URLs
- `GenerateImage` — AI image generation
- `ExtractDataFromUploadedFile` — File content extraction

### AI Agent (Aria)

The `Intelligence` page uses the Base44 agents API for real-time conversational AI:

```js
// Create conversation
const conversation = await base44.agents.createConversation({
  agent_name: "aria",
  metadata: { name: "...", description: "..." }
});

// Subscribe to real-time updates
const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
  setMessages(data.messages || []);
});

// Send a message
await base44.agents.addMessage(conversation, { role: "user", content: "..." });
```

The `Dashboard` page uses a simpler function-invoke pattern for Aria (`base44.functions.invoke('aria', { query, mode: 'chat' })`).

### Audit Logging

All significant user actions must be logged. Import from `src/components/audit/AuditTracker.jsx`:

```js
import { logDocumentView, logDocumentUpload, logDocumentDelete } from '@/components/audit/AuditTracker';

// Log an action (fire-and-forget — never throws)
await logDocumentView(documentId, documentTitle);
```

Available log functions: `logDocumentView`, `logDocumentDownload`, `logDocumentDelete`, `logDocumentRestore`, `logDocumentUpload`, `logDocumentEdit`, `logDocumentShare`, `logBulkAction`, `logUserLogin`, `logUserLogout`.

### Permissions

Use `AdminGuard` from `src/components/permissions/PermissionGuard.jsx` to restrict admin-only pages/features. Admin navigation items (Audit Logs, Permissions, Compliance) only render when `user?.role === 'admin'`.

For document-level permissions, documents have a `shared_with` array: `[{ user_email, permission }]` where permission is one of `PERMISSIONS.VIEW`, `PERMISSIONS.EDIT`, `PERMISSIONS.ADMIN` (from `PermissionHelper.jsx`).

Admin service-role access uses `base44.asServiceRole.entities.*` for bypassing user-scoped queries.

### Upload Pipeline

The `UploadContext` (`src/components/UploadContext.jsx`) manages concurrent file uploads (max 3 simultaneous). It:
1. Validates workspace access before queuing
2. Uploads file via `Core.UploadFile`
3. Creates a `Document` entity record
4. Runs AI analysis in background (non-blocking)
5. Retries on server/timeout errors (3 attempts, exponential backoff starting at 1200ms)

Large files (>10MB PDFs) skip automated AI analysis and get manual-review placeholders.

---

## UI Conventions

### Component Library

This project uses **shadcn/ui** components located in `src/components/ui/`. These are Radix UI primitives styled with Tailwind. Do not modify files in `src/components/ui/` directly unless adding a new shadcn component.

Import pattern:
```js
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
```

### Styling

- **Tailwind CSS** for all styling — no separate CSS files for components
- **Dark theme**: The app shell uses `bg-neutral-950` / `bg-neutral-900` with `text-white` / `text-gray-400`
- **Light theme**: The `Home` landing page uses `bg-white text-slate-900`
- Use `cn()` from `@/lib/utils` to merge conditional class names:
  ```js
  import { cn } from '@/lib/utils';
  className={cn('base-classes', condition && 'conditional-class')}
  ```
- **Framer Motion** is used for page transitions and micro-animations, especially in the `Intelligence` page and landing components

### Notifications

Use **Sonner** for toast notifications:
```js
import { toast } from 'sonner';
toast.success('Done!');
toast.error('Something went wrong');
```

### Icons

Use **Lucide React** for icons:
```js
import { FileText, Upload, Brain } from 'lucide-react';
<FileText className="w-4 h-4" />
```

### Responsive Design

- Mobile breakpoint: `md:` (768px)
- Sidebar collapses on mobile; use `md:hidden` / `max-md:` for mobile-specific behavior
- The sidebar is fixed on mobile, relative on desktop

---

## Data Model Conventions

When creating documents, use these standard fields:
- `title`: filename or user-provided name
- `file_url`: URL from `Core.UploadFile`
- `file_type`: `'pdf'` | `'image'` | `'other'`
- `file_size`: bytes
- `category`: user-assigned category string
- `tags`: `string[]`
- `workspace_id`: null for personal, UUID for team workspace
- `is_trashed`: boolean (soft delete)
- `processing_status`: `'processing'` | `'completed'`
- `ai_summary`: AI-generated summary string
- `key_insights`: `string[]`
- `extracted_content`: raw text content
- `thumbnail_url`: URL to preview image
- `shared_with`: `[{ user_email: string, permission: string }]`

Folder filter pattern (owned):
```js
base44.entities.Folder.filter({ created_by: user.email })
```

Document filter (user-owned, not trashed):
```js
base44.entities.Document.filter(
  { created_by: user.email, is_trashed: false },
  '-created_date',
  50  // limit
)
```

---

## Role-Based Access

| Role | Access |
|---|---|
| Regular user | Own documents, folders, workspaces, saved chats |
| Admin | All above + Audit Logs, Permissions, Compliance pages; `base44.asServiceRole` access |

Check role: `user?.role === 'admin'`

---

## Pages Without Sidebar

These pages render without the app sidebar (see `Layout.jsx`):
- `Home` — Public landing page
- `Dashboard` — Has its own sidebar UI
- `DocumentViewer` — Full-screen document viewer
- `SubscriptionSettings` — Standalone subscription management
- `AboutUs`, `Terms`, `Privacy`, `MichaelBenezra`, `MichaelChavira` — Show footer

---

## Linting

ESLint is configured via `eslint.config.js` (flat config format). Rules enforce:
- React Hooks rules (`react-hooks/recommended`)
- React Refresh rules (warn on non-component exports)
- Standard JS recommended rules

Run: `npm run lint`

---

## Environment & Deployment

- No `.env` files are tracked (listed in `.gitignore`)
- The Base44 `appId` is hardcoded in `src/api/base44Client.js` — this is expected for Base44 apps
- Deploy target: Fly.io (`@flydotio/dockerfile` in devDependencies)
- Build output: `dist/` directory (git-ignored)

---

## Common Patterns to Follow

1. **Always use `createPageUrl()`** for internal navigation links — never hardcode paths
2. **Always use TanStack Query** for data fetching — no raw `useEffect` + `fetch` patterns
3. **Always gate data queries with `enabled: !!user`** to prevent unauthenticated API calls
4. **Always log audit events** for document actions (view, upload, delete, share, etc.)
5. **Use the `@` alias** for all src imports
6. **Never modify `src/components/ui/`** files unless adding new shadcn components
7. **Workspace ID handling**: personal workspace stores as `null` in the DB; map `'personal'` → `null` before saving
8. **Soft delete documents** by setting `is_trashed: true` rather than calling `.delete()`
