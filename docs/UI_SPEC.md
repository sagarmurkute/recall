# Recall — UI/UX & Design System Specification

---

## 1. Design Philosophy & Aesthetic Direction
Recall is built with **React, Vite, TypeScript, and Tailwind CSS**. It features a **light, clean, focused, and premium academic aesthetic**. It avoids visual clutter and prioritizes instantaneous query response, clear typography, and verified source grounding.

### Explicit Anti-Patterns to Avoid:
* ❌ **NO generic AI chatbot windows:** No empty chat bubbles or conversational dialogue prompts. Recall is a retrieval engine with synthesized answers, not a conversational bot.
* ❌ **NO Bento-Grid overload:** Avoid dense, disjointed, chaotic bento boxes. Recall uses an intentional, structured column layout with a clean feed and clear inspector panes.
* ❌ **NO unreadable dark-only hacker themes:** Recall uses a crisp, high-contrast, light-mode-first aesthetic with refined subtle borders and warm neutral tones.

---

## 2. Color Palette & Tailwind Tokens

| Token | Class Name / Value | Semantic Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `bg-slate-50` (`#F8FAFC`) | Main application background (soft off-white) |
| **Surface** | `bg-white` (`#FFFFFF`) | Cards, modals, omnibar background |
| **Subtle Container** | `bg-slate-100` (`#F1F5F9`) | Secondary containers, chip backgrounds |
| **Border Subtle** | `border-slate-200` (`#E2E8F0`) | Default card borders, dividers |
| **Border Active** | `border-slate-300` (`#CBD5E1`) | Focused inputs, hovered cards |
| **Text Primary** | `text-slate-900` (`#0F172A`) | Headings, primary content, high contrast |
| **Text Secondary** | `text-slate-600` (`#475569`) | Subtitles, metadata, author labels |
| **Text Muted** | `text-slate-400` (`#94A3B8`) | Timestamps, placeholder text |
| **Accent Primary** | `bg-blue-600` / `text-blue-600` (`#2563EB`) | Active search focus, primary CTA buttons |
| **Accent Light** | `bg-blue-50` (`#EFF6FF`) | Selected item highlights, active chip background |
| **Verified Badge** | `text-emerald-700` (`#047857`) | Grounded source verification badge |
| **Verified Badge BG**| `bg-emerald-50` (`#ECFDF5`) | Background for verbatim quote cards |
| **Deadline Chip** | `text-amber-700` / `bg-amber-50` | Deadline and urgent date chips |

---

## 3. Typography Hierarchy
* **Primary Font Family:** `Inter`, `SF Pro Display`, or `Outfit`, `-apple-system`, `sans-serif`.
* **Monospace Font:** `JetBrains Mono`, `Fira Code`, `ui-monospace` (for citations, formulas, course codes).

| Element | Tailwind Classes | Tracking & Line Height |
| :--- | :--- | :--- |
| **Hero Title / Question** | `text-2xl font-semibold text-slate-900` | `tracking-tight leading-snug` |
| **Section Header** | `text-base font-semibold text-slate-900` | `tracking-normal leading-normal` |
| **Body Primary** | `text-sm font-normal text-slate-700` | `leading-relaxed` |
| **Grounded Quote Text** | `text-[15px] font-medium text-slate-900` | `leading-relaxed` |
| **Metadata & Chips** | `text-xs font-medium text-slate-600` | `tracking-wide` |
| **Citation Token** | `text-[11px] font-semibold text-blue-700` | `tracking-wider uppercase` |

---

## 4. Key UI Components & Layouts

### 4.1 Global Navigation & Auth Bar
* **Left:** Wordmark `Recall` with a small glowing status pill (`● Ready`).
* **Center:** Quick search trigger pill displaying `⌘K` or `/`.
* **Right:** 
  - `+ Import File` primary CTA button.
  - Course collection filter dropdown (`All Courses`, `CS210`, `CHEM101`).
  - Supabase User Profile pill / Sign-In trigger.

---

### 4.2 The Omnibar Search Interface (`⌘K`)
* Centered search bar with a crisp border, elevation shadow (`shadow-md`), and placeholder:
  > *"Ask a question about your files, or search keywords..."*
* Dynamic mode badge: `[Natural Question]` vs. `[Exact Search]`.

---

### 4.3 Grounded Answer Container
When a question is queried, the answer box appears immediately above search results with two distinct visual sections:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🟢 VERIFIED DIRECT QUOTES                                              │
│                                                                        │
│  "Labs submitted up to 24 hours late receive a 15% deduction.          │
│   Beyond 48 hours, 0 credit is awarded."                               │
│                                                                        │
│  🏷️ CS210_Syllabus.pdf  •  Page 3  •  [Open in Viewer ↗]               │
├────────────────────────────────────────────────────────────────────────┤
│ 💡 AI SYNTHESIS & CONTEXT                                              │
│                                                                        │
│  You lose 15% if submitted within 24 hours. After 2 days, no late       │
│  submissions will be accepted by Prof. Miller.                         │
│                                                                        │
│  Why this was retrieved: Directly extracted from Section 4.2 of       │
│  your uploaded syllabus document.                                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 4.4 Source Memory Cards (Timeline / Results Feed)
Each ingested document or screenshot is represented by a clean, scannable card:
* **Header:** File Type Icon (`PDF`, `Image`, `Note`), Title, and Ingestion Date.
* **Content Excerpt:** 2-line snippet with matched search terms highlighted.
* **Extracted Chips:** `#CS210`, `📅 Due: Oct 24`, `Prof. Anderson`.
* **Actions:** Quick Preview, Pin 📌, Copy Quote.

---

### 4.5 Split-Screen Source Inspector Drawer
Clicking any source card or citation chip slides in a split-screen inspection view:
* **Left Pane (40% width):** Extracted text, structured entity list, deadline calendar links, and connected related memories.
* **Right Pane (60% width):** High-fidelity document viewer showing the original PDF page or screenshot (served securely via Supabase Storage signed URLs) with the exact citation text bounded and highlighted in a soft yellow glow.

---

### 4.6 Supabase Storage Drag-and-Drop Ingestion Zone
* Minimalist dashed-border dropzone (`border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100/50`).
* Live status tracker during upload:
  - Step 1: `Uploading to private storage...`
  - Step 2: `Gemini Vision extracting text & formulas...`
  - Step 3: `Indexing vectors in PostgreSQL (pgvector)...`
  - Step 4: `Ready to search!`

---

## 5. States (Loading, Empty, Error, Auth)

### Auth & Onboarding State
* Simple, clean Supabase Auth dialog (Email/Password or 1-Click Guest Test Account).

### Empty State (First Time User)
* Clean graphic icon of an organized document stack.
* Heading: *"Your personal memory is empty"*
* Subtitle: *"Drop your syllabi, lecture slides, or screenshots to start searching instantly."*
* Action: `+ Upload First Document` or `Load CS210 Demo Pack`.

### Loading & Streaming States
* Skeleton shimmer bars matching exact text line heights to prevent layout shifts.
* Pulse indicator on citation badges while Edge Function synthesis streams.

### Error & Not-Found State
* Clear, calm banner:
  > *"No matching facts found in your uploaded materials. Recall only provides answers grounded in your private sources."*
