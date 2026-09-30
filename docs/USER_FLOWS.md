# Recall — User Flows & Interaction Architecture

---

## 1. The 10-Step Hackathon MVP User Journey

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ 1. Sign In  │ ──►  │ 2. Upload   │ ──►  │ 3. Supabase │ ──►  │ 4. PG Meta  │
│ (Supabase)  │      │ Supported   │      │   Storage   │      │ & Extraction│
└─────────────┘      │ File (PDF/  │      └─────────────┘      └──────┬──────┘
                     │ PNG/TXT)    │                                  │
                     └─────────────┘                                  │
┌─────────────┐      ┌─────────────┐      ┌─────────────┐             │
│ 8. Grounded │ ◄──  │ 7. Hybrid   │ ◄──  │ 6. Natural  │ ◄───────────┘
│ Gemini Ans  │      │ Retrieval   │      │ Question    │  5. Indexed
└──────┬──────┘      │ (pgvector)  │      │ (Omnibar ⌘K)│     Chunks
       │             └─────────────┘      └─────────────┘
       ▼
┌─────────────┐      ┌─────────────┐
│ 9. Citations│ ──►  │ 10. Open    │
│ & Direct    │      │ Original    │
│ Quotes      │      │ Source View │
└─────────────┘      └─────────────┘
```

---

## 2. Core User Flows in Detail

### Flow 1: First-Time User Onboarding & Sign-In
1. **Landing View:** User lands on a clean light-mode screen with brand lockup and the Omnibar prompt.
2. **Auth Gate:** User logs in with Email/Password or clicks `1-Click Guest Test Account` for instant judging.
3. **Empty State Prompt:** Dashboard shows an empty state illustration with the option to upload files or click `Load CS210 Demo Pack`.

---

### Flow 2: Multi-Modal File Ingestion Flow
1. **Trigger:** User clicks `+ Upload File` or drags a file over the browser window.
2. **Upload & Storage:**
   - Client sends file to Supabase Storage private bucket `user_files`.
   - File metadata written to `sources` and `files` tables.
3. **Processing Toast:**
   - Status updates: `Extracting text & diagrams with Gemini Vision...` → `Indexing in pgvector...` → `Ready to search!`.
4. **Feed Placement:** New memory card appears in the Dashboard feed.

---

### Flow 3: Natural Language Query & Retrieval Flow
1. **Activation:** User clicks the Omnibar or presses `⌘K` / `/`.
2. **Query Input:** User types a question, e.g.:
   > *"When is my DBMS assignment due?"*
3. **Hybrid Search Execution:**
   - Server-side Edge Function converts query into vector embeddings (`text-embedding-004`).
   - Executes `match_memories` RPC against PostgreSQL `pgvector` and `tsvector` full-text search.
   - Retrieves top 5 grounded chunks.

---

### Flow 4: Grounded Answer & Source Verification Flow
1. **Grounded Answer Container Renders:**
   - **Verified Direct Quotes:** Verbatim text (`"DBMS Assignment 2 is due Thursday, October 24 at 11:59 PM"`).
   - **AI Synthesis:** Summary from Gemini explaining submission rules.
   - **Citation Chip:** Clickable badge `[DBMS_Course_Syllabus.pdf — Page 2]`.
2. **Handling Missing Information:**
   - If the user asks a question not covered in uploaded files, Recall displays:
     > *"I could not find information regarding this question in your saved materials."*

---

### Flow 5: Split-Screen Source Inspection Flow
1. **Trigger:** User clicks a citation badge or a source card in search results.
2. **Inspector Panel Opens:**
   - **Left Panel:** Key takeaways, extracted deadlines (`Oct 24, 11:59 PM`), course code tag (`#DBMS`), and matched chunk text.
   - **Right Panel:** Interactive PDF / screenshot viewer loaded securely via a temporary Supabase Storage signed URL, automatically navigated to the referenced page.
3. **Dismissal:** User presses `Esc` or clicks `Close` to return to search results.
