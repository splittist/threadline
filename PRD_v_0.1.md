# **Threadline — Product Requirements Document (PRD v0.1)**

**Working Title:** *Threadline*  
**Date:** October 2025  
**Version:** v0.1 (MVP Specification)  
**Authors:** \[Project Lead / Legal Innovation Team\]  
**Status:** Draft for stakeholder review

* * *

## **1\. Purpose and Vision**

### **Problem**

Lawyers routinely exchange Word documents containing tracked changes (“redlines”). These redlines show *what* changed but not *why* or *to what end*. In multi-document transactions (e.g., an HMA, License, and Side Letter), related changes are scattered across files. Reviewers must manually reconstruct intent and cross-reference edits, creating inefficiency, confusion, and risk.

### **Vision**

**Threadline** brings clarity to the chaos of redlines.  
It lets users view, group, and discuss tracked changes across multiple documents as coherent **threads** — thematic “change sets” similar to software pull requests. Each thread carries context, commentary, and review decisions, transforming unstructured markup into structured negotiation intelligence.

### **Tagline**

> *Threadline — clarity across redlines.*

* * *

## **2\. Objectives**

**Primary Objectives for MVP**

1.  Ingest multiple `.docx` files with tracked changes.
    
2.  Extract and normalize all atomic edits (insertions, deletions, etc.).
    
3.  Automatically group related changes by clause using heuristic and optional LLM-assisted clustering.
    
4.  Provide an intuitive **manual refinement UI** for users to review, reassign, merge, or create threads.
    
5.  Allow reviewers to annotate, approve, or reject threads.
    
6.  Export readable summaries (for human circulation) and structured data (for audit or integration).
    
7.  Operate 100% client-side for security and ease of distribution.
    

**Non-goals for MVP**

- Real-time collaboration between users.
    
- Direct modification or acceptance of tracked changes in the original Word files (will come in v1.2+).
    
- Multi-user cloud sync or comments persistence beyond local export.
    

**Success**

MVP succeeds if a lawyer can upload 5 redlined docs and export a coherent issue summary in <15 mins.

* * *

## **3\. User Personas**

| Persona | Description | Primary Goals |
| --- | --- | --- |
| **Drafter (Outbound)** | In-house counsel or associate creating outbound redlines for review. | Communicate changes by topic; provide rationale; control narrative. |
| **Reviewer (Inbound)** | Senior counsel reviewing counterpart’s redlines. | Understand opposing edits quickly; make and record accept/reject decisions by issue. |
| **Cross-functional Reviewer** | Business, finance, or operations lead. | Focus only on relevant issue threads (e.g. KPIs, fees). |
| **Innovation / IT Lead** | Evaluator of rollout feasibility. | Ensure security, performance, and zero server footprint. |

Drafter and Reviewer are primary; others are secondary.

* * *

## **4\. Core User Journeys**

| **Journey** | **Goal** | **Key Steps in Threadline** | **Output** |
| --- | --- | --- | --- |
| **Outbound Drafting (Authoring own redlines)** | Submit intelligible, issue-grouped edits. | Upload → Auto-cluster → Manual refine threads → Add rationales → Export summary. | Structured “Change Set Summary” (HTML/Markdown/Word). |
| **Inbound Review (Opposing counsel redlines)** | Deconstruct and assess counterpart’s edits. | Upload → Auto-cluster/unbundle → Manual refine → Approve/reject threads → Export feedback deck. | “Review Summary” + JSON log. |
| **Cross-functional Review** | Coordinate legal + commercial feedback. | Filter threads by topic tag; each role reviews relevant issues. | Consolidated, multi-role summary. |
| **LLM-Assisted Clustering (Optional)** | Accelerate thread creation securely. | Generate clustering packet → paste into secure LLM → paste back JSON → merge clusters. | Enhanced topic groupings. |

* * *

## **5\. Key Activity: Manual Refinement**

### **Design Principle**

Refinement must feel like triaging an inbox, not fighting a spreadsheet.

### **Interaction Model**

| Component | Description |
| --- | --- |
| **Left Panel — Thread List** | Displays all threads (10–15 typical), plus *Unassigned*. Shows change count and status per thread. Selecting one filters the view. |
| **Center Panel — Change List** | Displays all changes within the selected thread. Each shown as a card with diff snippet, doc name, clause path, checkbox. Bulk select + “Move to…” dropdown for fast reassignments. |
| **Right Panel — Thread Metadata** | Editable title, topic tag, rationale text, and review status. This becomes the “commit message” in exports. |

### **Rules**

- Every change belongs to **exactly one** thread.
    
- *Unassigned* serves as a holding bucket for noise or undecided edits.
    
- Creating new threads inline is frictionless.
    
- Bulk move operations are first-class.
    
- Multi-thread membership is not allowed in v1 (to preserve data integrity).
    
- Changes can always be reassigned or returned to *Unassigned*.
    

### **User Flow**

Changes are automatically grouped by clause path and document into unnamed buckets in the Unassigned panel. Users create threads by assigning changes and defining the topic.

1.  Review suggested threads one by one.
    
2.  Within each, bulk-select misclassified edits and move them.
    
3.  Optionally create new threads for nuanced issues.
    
4.  Add rationale text per thread.
    
5.  Mark thread as *Ready for Review*, *Approved*, or *Escalate*.
    

### **Topic Management**

**Principle:** Users define the narrative. Automation assists, never assumes.

| Behavior | Description |
|--------|-----------|
| **User Topics** | Required. Free-text. Set when creating a thread. |
| **Suggested Topics** | Optional. From heuristic or LLM. Shown in UI as chips or hover tooltips. |
| **Starter Templates** | Opt-in packs (e.g., "SaaS Deal", "M&A") importable on first use. |
| **No Auto-Naming** | AI never creates a thread with a topic the user didn’t type or approve. |

* * *

## **6\. Functional Requirements**

| **Category** | **Requirement** |
| --- | --- |
| **File Handling** | Upload multiple `.docx` files (tracked changes enabled). Parse tracked changes across documents. |
| **Change Extraction** | Identify `<w:ins>`, `<w:del>`, `<w:moveFrom>`, `<w:moveTo>` in XML; extract author, timestamp, heading path, and surrounding text. |
| **Heuristic Clustering** | Group changes by clause path and document. Optionally generate topic suggestions (not thread names) using keywords. |
| **LLM-Assisted Clustering** | Export “clustering packet” with JSON schema and sample; LLM returns a JSON packet with changeId, suggestedTopic, and confidence. These are not applied until user confirms. |
| **Manual Refinement UI** | Three-panel layout: Threads / Changes / Thread Details. Bulk move, create new thread, rename, edit rationale, mark status. |
| **Review and Commenting** | Approve/Reject threads; add per-thread and per-change notes. |
| **Export** | 1\. Human-readable summary (HTML for cutting and pasting into email / Word). 2. Machine-readable JSON (changes, threads, decisions). |
| **Storage** | Local-only; use IndexedDB or local file save. |
| **Security** | No server calls, no data uploads. |
| **Performance** | Target: 5-10 documents, ~100–200 tracked changes handled smoothly. |

* * *

## **7\. Non-Functional Requirements**

| **Aspect** | **Requirement** |
| --- | --- |
| **Security** | 100% client-side; no network activity after load. |
| **Portability** | Single-page web app (HTML/JS bundle). |
| **Usability** | Usable by non-technical legal professionals. |
| **Responsiveness** |  For 10 medium-length docs: initial parse complete within 8 seconds; UI responsive within 3 seconds. |
| **Stability** | Never modifies source `.docx`; all operations are read-only. |
| **Compliance** | No storage of confidential data outside user’s machine. |

* * *

## **8\. Data Model Summary (Simplified)**

```json
{
  "docs": [
    {"docId": "doc_001", "name": "HMA.docx", "hash": "..."}
  ],
  "changes": [
    {
      "changeId": "chg_0147",
      "docId": "doc_001",
      "type": "insert",
      "author": "Jane Smith",
      "timestamp": "2025-10-21T09:41:00Z",
      "clausePath": ["8", "Termination", "8.2 Force Majeure"],
      "textBefore": "...",
      "changedText": "Force Majeure Event ",
      "textAfter": "...",
      "suggestedThread": "Force Majeure alignment",
      "userThread": null
    }
  ],
  "threads": [
    {
      "threadId": "th_001",
      "title": "Force Majeure alignment",
      "userTopic": "Force Majeure", // required
	  "suggestedTopic": "Force Majeure", // optional
      "rationale": "Align FM definition and carve-outs across HMA + License.",
      "changeIds": ["chg_0147"],
      "status": "proposed",
      "notes": []
    }
  ]
}
```

* * *

## **9\. Architecture Overview**

**Data Flow:**

```
Upload DOCXs
   ↓
Parse → Change[]
   ↓
Heuristic: Group by clausePath → Buckets
   ↓
[Optional] LLM: Suggest topics per bucket
   ↓
UI: Show buckets in "Unassigned"
   ↓
User: Create thread → Enter topic → Assign changes
   ↓
Export: Use userTopic only
```

### **9.1 Technical Stack (MVP Implementation Plan)**

**Core Framework**

- **Vite + TypeScript + React + Tailwind**
    
    - Vite for fast local dev and static bundle output.
        
    - TypeScript for safety in parsing/normalizing tracked changes.
        
    - React for declarative UI (thread list / change list / detail panel).
        
    - Tailwind for consistent, easily themed styling.
        

**UI & State**

- **Zustand** for application state (`docs[]`, `changes[]`, `threads[]`, selection model).
    
- **Headless UI** components (menus, dialogs) styled with Tailwind.
    
- **Heroicons** for consistent visual language (thread status, approve/reject marks).
    

**DOCX / File Handling**

- **JSZip** to read `.docx` archives locally (no upload).
    
- **Custom OOXML parser** in a Web Worker to extract tracked changes (`<w:ins>`, `<w:del>`, `<w:moveFrom>`, `<w:moveTo>`) plus context and clause headings.
    
- **docx-preview** to render human-readable previews/snippets for reviewer comfort (not the source of truth).
    
- **FileSaver.js** and, where available, the **File System Access API** to export summaries (`.html`, `.docx` later) and JSON review logs directly to disk without a server.
    

**Local Persistence**

- **idb** (IndexedDB wrapper) to autosave the current workspace so users don’t lose classifications or rationales, and to reopen a negotiation set later.

**Testing & Quality**

- **Vitest** + **React Testing Library** for unit and UI interaction tests (e.g. bulk move to new thread).
    
- **ESLint** (with security rules) + **Prettier** to enforce safe patterns and readable code.
    

**Security & Integrity**

- **DOMPurify** on any rendered clause text originating from uploaded documents to prevent malicious markup execution.
    
- Strong **Content Security Policy (CSP)** embedded in the shipped `threadline.html`, disallowing external network calls, inline scripts where possible, and remote script injection.
    
- **Subresource Integrity (SRI)** and ideally fully bundled assets to satisfy internal IT review.
    
- No outbound network requests during normal operation.
    

**Performance / UX**

- **Web Workers** for DOCX parsing, hashing, heuristic clustering so the UI never locks even on 1–2k changes.
    
- **react-window** (or similar virtualization) to efficiently render long change lists in the refinement view.
    

**Deployment / Distribution**

- Output is a static bundle: `threadline.html` + `assets/`.
    
- Can be emailed, dropped in SharePoint, or served from a simple internal static host.
    
- Optional: **Vite PWA plugin** so Threadline can be “installed” locally and run offline after first open. Cache is limited to app assets (not user documents) for compliance reasons.
    

**LLM Assist Model**

- Threadline never sends data to any remote model.
    
- Instead, it can generate a “clustering packet” (JSON + instructions).
    
- User may paste that into an approved LLM environment and paste the resulting classification JSON back.
    
- We validate IDs and schema before applying those clusters.
    

## **10\. MVP Scope vs. Deferred Features**

| **Included in MVP** | **Deferred (Future Versions)** |
| --- | --- |
| Multi-document ingest | Collaborative multi-user mode |
| Heuristic + LLM-assisted clustering | Direct acceptance/rejection into Word files |
| Manual refinement interface | Automated re-anchoring across rounds |
| Exports (HTML, JSON) | Integration with deal dashboards / issue trackers |
| Local data storage | Plugin for MS Word round-trip comments |
| Thread rationale & status | Analytics and topic frequency reports |

* * *

## **11\. Risks and Open Questions**

| **Risk / Issue** | **Mitigation / Next Step** |
| --- | --- |
| **Anchor drift** between versions | Use hash of context window; later add fuzzy reattachment. |
| **AI overconfidence in topic labeling** | Never auto-name threads. Show suggestions only on hover or in optional panel. |
| **Heuristic accuracy low** | Design refinement UI for rapid correction (bulk move). |
| **User overwhelm on first load** | Pre-group threads to reduce initial chaos. |
| **Token limits for LLM clustering** | Split data into batches (≤500 changes per packet). |
| **Resistance from users tied to Word** | Offer exports in familiar Word/HTML form. |
| **Multi-thread relevance** | Prohibited in MVP; handled by rationale text only. |

* * *

## **12\. Success Metrics**

| **Metric** | **Target / Indicator** |
| --- | --- |
| **Time to review redlines** | Considerably faster than manual Word review. (There is no baseliene to measure quantitative improvement.) |
| **User comprehension** | Users report “clearer view of issues” in pilot feedback. |
| **Security acceptance** | Passes IT privacy/security review (no data upload). |
| **Adoption** | At least 3 internal or pilot users continue post-demo. |

* * *

## **13\. Future Roadmap (Outline)**

| **Version** | **Focus** |
| --- | --- |
| **v0.1 (MVP)** | Multi-doc ingest, manual refinement, exports. |
| **v0.2** | Enhanced auto-clustering; thread filtering; comment threading. |
| **v1.0** | Round-trip with Word comments; persistent review states. |
| **v1.2** | Apply/reject changes directly in DOCX; anchor drift handling. |
| **v2.0** | Multi-user collaboration; integration with legal deal dashboards. |

* * *

## **14\. Branding & Presentation**

**Name:** Threadline  
**Tagline:** “Clarity across redlines.”  
**Tone:** Professional, technical, but elegant.  
**Visual cues:** Subtle textile/weaving motif (threads), balanced typography, red–gray–white color palette to evoke “redline refinement.”

* * *

**End of PRD v0.1**
