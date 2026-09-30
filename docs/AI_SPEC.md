# Recall — AI System & Multi-Dimensional Reasoning Specification

---

## 1. Google Gemini Reasoning Across Unified Memory

In the expanded Recall architecture, **Google Gemini synthesizes answers across both Explicit Memory and Contextual Memory**:

```
[User Query: "Where did I see that React animation library yesterday?"]
                               │
                               ▼
            [Unified Hybrid Retrieval (PostgreSQL)]
                               │
            ├──────────────────┴──────────────────┐
            ▼                                     ▼
 [Top Explicit Document Chunks]         [Top Activity Context Events]
 (e.g. Slide on UI animations)          (e.g. Chrome visit to framer.com/motion)
            │                                     │
            └──────────────────┬──────────────────┘
                               ▼
                 [Assembled Grounding Context]
                               │
                               ▼
                 [Google Gemini Flash Reasoning]
                               │
                               ▼
[Grounded Answer: "You visited framer.com/motion in Chrome yesterday at 4:15 PM."]
```

---

## 2. Grounded Truth Categories

* **Category A (Direct Grounded Evidence):** Verbatim document quotes, exact URLs visited, exact application window titles, and verified timestamps.
* **Category B (Contextual Synthesis):** Inferences connecting when and where an encounter took place (e.g. *"You were reviewing this in VS Code while researching on Chrome"*).
* **Category C (Not Found):** Explicit statement when no matching memory or activity event exists.
