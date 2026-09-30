# Recall — Live Demo Script (BuildX Hackathon)

---

## 1. Demo Overview & Core Message

* **Product:** Recall
* **Tagline:** *"You already have the answer. Recall finds it."*
* **Core Value Statement:** Students don't have an information shortage; they have a retrieval crisis. Recall turns scattered screenshots, syllabi, and lecture PDFs into an instant, verifiable personal memory.
* **Core Demo Question:** *"When is my DBMS assignment due?"*

---

## 2. Pre-Demo Setup Checklist
- [ ] Supabase project connected with storage bucket `user_files`.
- [ ] Test student account logged in: `demo@recall.app`.
- [ ] Demo files pre-loaded in the account (or ready on desktop to drag-and-drop):
  1. `DBMS_Course_Syllabus.pdf` (Mentions Assignment 2 due on Oct 24, 11:59 PM with a 10% daily late penalty).
  2. `BuildX_Hackathon_Schedule.png` (Screenshot showing project submission time at 3:00 PM).
  3. `College_Timetable_Fall.pdf` (Weekly class schedule).
  4. `Merit_Scholarship_Notice.png` (Screenshot showing GPA requirements).
  5. `Midterm_Exam_Schedule.txt` (Exam dates and room allocations).
- [ ] Backup local demo assets open in a browser tab in case of live network drop.

---

## 3. The 2-Minute Lightning Demo Script

| Time | Presenter Action | Spoken Script / Voiceover | Screen View |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:25** | Open Recall dashboard. Gesture to the clean, minimal Omnibar. | *"Judges, raise your hand if you've ever taken a screenshot of an important announcement or downloaded a syllabus PDF... and then completely failed to find it when the deadline hit. We don't have an information problem. We have a retrieval problem. This is Recall."* | Dashboard with Omnibar (`⌘K`) and recently added student files. |
| **0:25 - 0:50** | Click into the Omnibar. Type: `When is my DBMS assignment due?` and press `Enter`. | *"Instead of opening 5 different PDFs or searching endlessly through WhatsApp, I just ask Recall in plain English: 'When is my DBMS assignment due?'"* | Instant loading state (< 2s) transitioning into Grounded Answer Container. |
| **0:50 - 1:25** | Hover over the **Verified Direct Quotes** section and click the citation chip `[DBMS_Course_Syllabus.pdf - Page 2]`. | *"Look at what Recall does. It doesn't just guess or give a generic ChatGPT answer. First, it gives me the exact verbatim quote: 'DBMS Assignment 2 is due Thursday, October 24 at 11:59 PM'. Second, it explains the context. And third—most importantly—with one click, it opens the original syllabus PDF directly to page 2, highlighting the exact sentence."* | Split-Screen Source Inspector opens: Left side shows extracted metadata, right side shows the PDF page with highlighted text. |
| **1:25 - 1:45** | Click `+ Upload`, drag in `BuildX_Hackathon_Schedule.png`. | *"When I get a new screenshot or PDF, I just drop it in. Our server-side Gemini Vision pipeline OCRs the text and diagrams, indexes the embeddings in PostgreSQL using pgvector, and makes it instantly queryable."* | Live upload toast: `Extracting with Gemini Vision... Indexed in pgvector!` Card appears in memory feed. |
| **1:45 - 2:00** | Return to dashboard. Conclude. | *"Recall is not a generic chatbot. It is a grounded retrieval engine for the knowledge you already own. You already have the answer. Recall finds it. Thank you."* | Clean Recall landing view with live search feed. |

---

## 4. The 3-Minute Comprehensive Demo Script

* **0:00 - 0:40 (Problem & Vision):**
  - Show a messy desktop or camera roll with dozens of screenshots and unnamed PDFs.
  - Explain the student dilemma: cognitive tax of manual tagging vs. retrieval failure.
* **0:40 - 1:15 (Multi-Modal Upload):**
  - Drag and drop `DBMS_Course_Syllabus.pdf` and `BuildX_Hackathon_Schedule.png`.
  - Highlight how Supabase Storage securely stores the binary file while PostgreSQL + `pgvector` indexes the semantic chunks.
* **1:15 - 2:00 (Natural Language Retrieval & Grounding):**
  - Run Query 1: *"When is my DBMS assignment due?"*
  - Demonstrate the two-tier answer:
    1. **Direct Verbatim Quotes** (from the syllabus).
    2. **AI Synthesis** (concise explanation of late submission rules).
  - Point out the absence of hallucinations.
* **2:00 - 2:35 (Handling Missing Information):**
  - Run Query 2: *"What is the textbook for Organic Chemistry?"*
  - Recall displays: *"Not found in your uploaded materials. Recall answers strictly from your sources."*
  - Explain why this is critical for student trust (refusal to hallucinate).
* **2:35 - 3:00 (Architecture, Security & Closing):**
  - Explain the hybrid search layer (`pgvector` + Full-Text Search) and strict Row Level Security.
  - Conclude with the core tagline.

---

## 5. Fail-Safe / Backup Plan (If AI or Internet Fails)

1. **Network Drop / Supabase Disconnect:**
   - Keep a pre-recorded 60-second high-resolution demo video (`recall_backup_demo.mp4`) queued in VLC / QuickTime.
2. **Gemini API Rate Limit / Latency Spike:**
   - The UI includes a client-side fallback mode that directly renders retrieved PostgreSQL Full-Text Search snippets with exact keyword highlights even if the generative synthesis layer times out.
3. **Storage Signed URL Expiry:**
   - Re-authenticating or clicking "Refresh Preview" triggers an immediate token refresh via Supabase Auth.
