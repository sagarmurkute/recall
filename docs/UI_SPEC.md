# Recall — UI/UX & Design System Specification

---

## 1. Design Philosophy & Aesthetic Direction
Recall features a **light, clean, focused, and premium academic aesthetic**. It avoids clutter and prioritizes readability, speed, and immediate source grounding.

### Explicit Anti-Patterns to Avoid:
* ❌ **NO generic AI chatbot windows:** No empty chat bubbles or conversational dialogue prompts. Recall is a retrieval engine with synthesized answers, not a conversational bot.
* ❌ **NO Bento-Grid overload:** Avoid dense, disjointed, chaotic bento boxes. Recall uses an intentional, structured column layout with a clean feed and clear inspector panes.
* ❌ **NO unreadable dark-only hacker themes:** Recall uses a crisp, high-contrast, light-mode-first aesthetic with refined subtle borders and warm neutral tones.

---

## 2. Color Palette & Visual Tokens

| Token | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| `--bg-canvas` | `#F8FAFC` | Main application background (soft off-white) |
| `--bg-surface` | `#FFFFFF` | Cards, modals, omnibar background |
| `--bg-subtle` | `#F1F5F9` | Secondary containers, chip backgrounds |
| `--border-subtle` | `#E2E8F0` | Default card borders, dividers |
| `--border-active` | `#CBD5E1` | Focused inputs, hovered cards |
| `--text-primary` | `#0F172A` | Headings, primary content, high contrast (Slate-900) |
| `--text-secondary` | `#475569` | Subtitles, metadata, author labels (Slate-600) |
| `--text-muted` | `#94A3B8` | Timestamps, placeholder text (Slate-400) |
| `--accent-primary` | `#2563EB` | Active search focus, primary CTA buttons (Indigo/Royal) |
| `--accent-light` | `#EFF6FF` | Selected item highlights, active chip background |
| `--badge-verified` | `#16A34A` | Grounded source verification badge (Forest Green) |
| `--badge-verified-bg`| `#F0FDF4` | Background for verbatim quote cards |
| `--badge-deadline` | `#EA580C` | Deadline and urgent date chips (Warm Amber) |
| `--badge-deadline-bg`| `#FFF7ED` | Background for deadline notices |

---

## 3. Typography Hierarchy
* **Primary Font Family:** `Inter`, `SF Pro Display`, or `Outfit`, `-apple-system`, `sans-serif`.
* **Monospace Font:** `JetBrains Mono`, `Fira Code`, `ui-monospace` (for citations, formulas, course codes).

| Element | Size | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title / Question** | `24px (1.5rem)` | 600 (SemiBold) | 1.3 | -0.02em |
| **Section Header** | `16px (1.0rem)` | 600 (SemiBold) | 1.4 | -0.01em |
| **Body Primary** | `14px (0.875rem)` | 400 (Regular) | 1.6 | 0.0em |
| **Grounded Quote Text** | `15px (0.9375rem)` | 500 (Medium) | 1.6 | 0.0em |
| **Metadata & Chips** | `12px (0.75rem)` | 500 (Medium) | 1.4 | +0.02em |
| **Citation Token** | `11px (0.6875rem)` | 600 (SemiBold) | 1.2 | +0.03em |

---

## 4. Key UI Components & Layouts

### 4.1 Global Navigation Header
* **Left:** Minimal Wordmark `Recall` with a small glowing status pill (`● Ready`).
* **Center:** Omnibar trigger button showing search icon + keyboard shortcut `⌘K`.
* **Right:** `+ Import Document` button (Primary CTA) and Course Filter dropdown.

---

### 4.2 The Omnibar Search Interface (`⌘K`)
* Centered search bar with a crisp border, elevation shadow (`0 8px 30px rgba(0,0,0,0.06)`), and placeholder:
  > *"Ask a question about your files, or search keywords..."*
* Shows dynamic query mode pill: `[Natural Question]` vs. `[Exact Search]`.

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
* **Right Pane (60% width):** High-fidelity document viewer showing the original PDF page or screenshot with the exact citation text bounded and highlighted in a soft yellow glow.

---

### 4.6 Universal Drag-and-Drop Ingestion Zone
* Minimalist dashed-border dropzone when dragging files over the window.
* Ingestion Drawer shows live progress:
  - Step 1: `Uploading file...`
  - Step 2: `Gemini Vision extracting text & formulas...`
  - Step 3: `Indexing chunks for instant search...`
  - Step 4: `Ready!`

---

## 5. States (Loading, Empty, Error)

### Empty State (First Time User)
* Clean graphic icon of an organized stack of papers.
* Heading: *"Your personal memory is empty"*
* Subtitle: *"Drop your syllabi, lecture slides, or screenshots to start searching instantly."*
* Primary CTA: `Import Files` or `Try Sample Dataset (CS Course)`.

### Loading & Streaming States
* Skeleton shimmer bars matching exact text line heights to prevent layout shifts.
* Pulse indicator on citation badges while Gemini synthesis streams.

### Error & Not-Found State
* Clear, calm banner:
  > *"No matching facts found in your uploaded materials. Recall only provides answers grounded in your private sources."*
* Action: Suggests adding more files or refining search terms.

---

## 6. Micro-Interactions & Keyboard Accessibility
* `⌘K` or `/` : Focus Omnibar immediately.
* `Esc` : Close modal or clear search.
* `↑` / `↓` : Navigate search results list.
* `Enter` : Open selected source card in inspector.
* Subtle hover elevations on cards (`translateY(-1px)` with smooth cubic-bezier easing).
