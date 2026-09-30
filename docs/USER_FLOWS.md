# Recall — User Flows & Interaction Architecture

---

## 1. Flow Overview Map

```
                  ┌───────────────────────────────┐
                  │      1. First-Time Landing    │
                  │   (Empty state with dropzone) │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │    2. Import Information      │
                  │ (Drag-drop PDF, Image, Note)  │
                  └──────────────┬────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
     ┌────────────────────────┐      ┌────────────────────────┐
     │  3. Search & Inquire   │      │   4. Browse Memories   │
     │  (Omnibar Natural Q)   │      │  (Timeline & Filter)   │
     └───────────┬────────────┘      └───────────┬────────────┘
                 │                               │
                 ▼                               ▼
     ┌────────────────────────┐      ┌────────────────────────┐
     │ 5. View AI & Results   │      │  7. Discover Related   │
     │ (Grounded Answer + Src)│◄─────┤   (Semantic Clusters)  │
     └───────────┬────────────┘      └────────────────────────┘
                 │
                 ▼
     ┌────────────────────────┐
     │ 6. Inspect Source      │
     │(Side-by-side Page View)│
     └───────────┬────────────┘
                 │
                 ▼
     ┌────────────────────────┐
     │ 8. Save / Pin / Export │
     │  (Favorites & Tagging) │
     └────────────────────────┘
```

---

## 2. Detailed User Flows

### Flow 1: First-Time User Experience (FTUX)
* **Goal:** Zero-friction orientation; get the user to import their first document within 15 seconds.
1. **Landing:** User opens Recall and sees a clean, focused, light-mode interface with a prominent Omnibar: *"Ask anything or drop files to remember..."*.
2. **Onboarding Hint:** A lightweight interactive drop card suggests: *"Try dropping your course syllabus, a lecture slide, or a screenshot here."*
3. **One-Click Sample Ingestion:** An optional button *"Load Sample Course Material"* lets users test the system instantly without needing immediate files.
4. **Immediate Feedback:** As soon as a file is dropped, an ingestion indicator shows extraction progress:
   - `Reading text & diagrams...` → `Extracting key dates...` → `Ready to search!`

---

### Flow 2: Multi-Modal Ingestion Flow
* **Goal:** Ingest PDFs, screenshots, photos, notes, and text snippets reliably.
1. **Trigger:** User drags files over the window, clicks the `+ Import` button, or pastes an image/text from the clipboard (`Ctrl+V` / `⌘V`).
2. **File Processing Modal/Drawer:**
   - Visual preview thumbnail appears.
   - Status badge: `Processing with Gemini Vision OCR...`
   - Background pipeline splits multi-page PDFs into indexed chunks.
3. **Auto-Enrichment:**
   - Title generated automatically from header/content.
   - Type tag assigned (`PDF Document`, `Whiteboard Screenshot`, `Code Snippet`, `Course Syllabus`).
   - Extracted metadata chips (e.g., `#CS210`, `Due: Oct 24`, `Prof. Anderson`).
4. **Completion:** Memory card smoothly animates into the memory feed.

---

### Flow 3: Search & Natural Language Query Flow
* **Goal:** Locate specific facts, answers, and context within milliseconds.
1. **Activation:** User clicks the search bar or presses `⌘K` / `Ctrl+K`.
2. **Query Input:** User types naturally, for example:
   - *"What is the penalty for turning in the biology lab 1 day late?"*
   - *"Dijkstra algorithm edge cases discussed in class"*
   - *"Formula for portfolio variance"*
3. **Instant Hybrid Retrieval:**
   - **Lexical Layer:** Matches exact words ("biology lab", "late penalty").
   - **Semantic Layer:** Matches conceptually related chunks even if exact wording differs.
4. **Real-Time View Update:** Search results populate with confidence scores and source previews.

---

### Flow 4: Grounded AI Answer & Synthesis Flow
* **Goal:** Present an authoritative, verified answer with clear distinction between direct facts and AI explanation.
1. **Answer Container Renders:**
   - **Top Section (Verified Direct Quotes):** Verbatim excerpts from the source document highlighted with yellow tint and quotation markers.
   - **Middle Section (Gemini Synthesized Answer):** Clear, concise synthesis explaining the context in plain English.
   - **Citations:** Clickable inline badge tokens like `[Syllabus.pdf — Page 3]` or `[Lecture4_Screenshot.png]`.
2. **Relevance Explanation:** A subtle accordion: *"Why this result was retrieved"* (explaining semantic match).
3. **"Not Found" Handling:** If the user asks something not present in their files, Recall explicitly states:
   > *"No matching information found in your saved materials. (Recall answers strictly from your uploaded sources)."*

---

### Flow 5: Source Card Inspection Flow
* **Goal:** Allow the student to verify original context in full fidelity.
1. **Trigger:** User clicks on any citation chip or source card in search results.
2. **Inspection Drawer / Modal:**
   - **Left Column:** Synthesized key takeaways, extracted entities (dates, names, formulas).
   - **Right Column (Document Viewer):** High-resolution PDF page viewer or image zoom view.
   - **Auto-Scroll & Highlight:** The exact matched text block is highlighted with a pulse animation.
3. **Action Toolbar:** User can copy quote, download original file, or view related memories.

---

### Flow 6: Discovering Related Information
* **Goal:** Connect disparate pieces of study material automatically.
1. **Trigger:** While viewing any memory or search result, user navigates to the `Connected Knowledge` section.
2. **Dynamic Semantic Links:**
   - Example: Viewing `HW3_Assignment.pdf` reveals:
     - `Lecture_7_Graphs.pdf` (92% semantic overlap)
     - `Screenshot_TA_Office_Hours.png` (88% semantic overlap)
3. **Navigation:** User clicks any connected node to pivot search context seamlessly.

---

### Flow 7: Organize & Pin Flow
* **Goal:** Save critical items with zero friction.
1. **Quick Pin:** Hover over any source card and click the Pin icon `📌` to pin to the Top Shelf.
2. **Tag Filter:** Click any auto-extracted tag (e.g., `#MidtermPrep`, `#CHEM101`) to filter the workspace.
3. **Export Summary:** Click `Export Brief` to generate a clean markdown summary of all retrieved sources for a topic.
