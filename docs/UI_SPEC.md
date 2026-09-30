# Recall — UI/UX & Design System Specification

---

## 1. Design Philosophy & Aesthetic Direction
Recall is built with **React, Vite, TypeScript, and Tailwind CSS**. It is designed as a **premium, fast, light-mode-first information retrieval tool**. The interface prioritizes typography, clarity, and instant verification over decorative clutter.

### Explicit Anti-Patterns:
* ❌ **NO generic ChatGPT conversation interface:** No conversational dialogue bubbles, back-and-forth prompt chatter, or full-screen chat views. Recall is a retrieval engine with grounded answers.
* ❌ **NO Bento-Grid layouts:** Avoid disjointed, cluttered bento boxes. Recall utilizes structured single-column feeds and focused split-screen panels.
* ❌ **NO dark-only neon themes:** Uses a clean, crisp, high-contrast light-mode palette.
* ❌ **NO excessive cards, gradients, or animations:** Minimal, fast micro-interactions only.

---

## 2. The 7 Core Hackathon MVP Screens

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Landing / Sign-In       │  Clean auth gate with guest/demo 1-click login │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 2. Dashboard               │  Overview of recent memories, collections, stats│
├────────────────────────────┼────────────────────────────────────────────────┤
│ 3. Upload Modal / Dropzone │  Drag-and-drop zone for PDF, PNG, JPG, TXT      │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 4. Search Interface (⌘K)   │  High-focus Omnibar with natural query input   │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 5. Search Results View     │  Grounded answer box + verified quote cards    │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 6. Source / Detail View    │  Split-screen inspector (facts + signed viewer)│
├────────────────────────────┼────────────────────────────────────────────────┤
│ 7. Settings / Profile      │  Basic user profile & storage quota overview   │
└────────────────────────────┴────────────────────────────────────────────────┘
```

---

## 3. Screen-by-Screen Specifications

### Screen 1: Landing & Authentication
* Simple, clean brand lockup: `Recall` + tagline *"You already have the answer. Recall finds it."*
* Authentication box: Email/Password login or `1-Click Guest Test Account` for instant hackathon judging.

### Screen 2: Dashboard
* Clean, focused view displaying:
  - Global Search trigger bar (`⌘K` prompt).
  - Quick action: `+ Upload New File`.
  - Filterable Memory Feed (sorted by recent upload, with course collection pills: `#CS210`, `#DBMS`).

### Screen 3: Upload Modal / Dropzone
* Clean dashed border (`border-dashed border-slate-300 bg-slate-50`).
* Live progress indicator: `Uploading to Supabase Storage...` → `Gemini Vision Extracting...` → `Indexed!`.
* Supported file badges: `PDF (up to 25MB)`, `PNG/JPG Screenshots`, `TXT Notes`.

### Screen 4 & 5: Search Interface & Results View
* The central product experience. When a query (e.g. *"When is my DBMS assignment due?"*) is submitted:
  - **Top Container (Verified Direct Quotes):** Highlighted verbatim text from the source in a soft green container (`bg-emerald-50 border-emerald-200`).
  - **Middle Container (AI Synthesis):** 2-3 sentence grounded summary from Gemini explaining the context.
  - **Citations:** Clickable pill `[DBMS_Course_Syllabus.pdf — Page 2]`.
  - **Bottom Feed (Relevant Source Chunks):** List of matching cards with keyword snippets.

### Screen 6: Source Detail & Split-Screen Inspector
* Triggered by clicking any source card or citation pill:
  - **Left Panel (40% width):** Extracted facts, structured deadlines (`Oct 24, 11:59 PM`), summary, and raw text chunk.
  - **Right Panel (60% width):** High-resolution PDF/image viewer loaded securely via a 60-minute Supabase Storage signed URL, jumping directly to the referenced page.

### Screen 7: Settings & Basic Profile
* Displays authenticated user email, Supabase Storage usage meter (e.g. `14.2 MB / 1000 MB`), and sign-out button.

---

## 4. Color Palette & Tailwind Tokens

| Token | Class Name / Hex | Semantic Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `bg-slate-50` (`#F8FAFC`) | Main application background (soft off-white) |
| **Surface** | `bg-white` (`#FFFFFF`) | Cards, modals, omnibar background |
| **Border Subtle** | `border-slate-200` (`#E2E8F0`) | Default card borders, dividers |
| **Text Primary** | `text-slate-900` (`#0F172A`) | Headings, primary content |
| **Text Secondary** | `text-slate-600` (`#475569`) | Subtitles, metadata, author labels |
| **Accent Primary** | `bg-blue-600` (`#2563EB`) | Primary CTA buttons and active focus |
| **Verified Badge BG**| `bg-emerald-50` (`#ECFDF5`) | Background for verbatim quote cards |
| **Verified Badge Text**| `text-emerald-700` (`#047857`) | Verbatim quote labels and borders |
| **Deadline Chip** | `text-amber-700 bg-amber-50` | Extracted deadline badges |

---

## 5. UI States (Loading, Empty, Error)

* **Empty State:** Clean document graphic, text: *"Your memory is empty"*, with a prominent `+ Upload First Document` CTA.
* **Loading State:** Subtle skeleton shimmer matching text line heights.
* **Not-Found State:** Clear notice: *"I could not find information regarding this question in your saved materials. (Recall answers strictly from your uploaded sources)."*
