# DSAT Ops Build + Projection — Project Reference

**Role:** Customer Operations Associate  
**Project:** DSAT Operations system in Notion + projection

Use this doc as your single reference while building in Notion and writing the summary.

---

## 1. Objective (the one question to answer)

> **What is the projected date when our DSAT backlog will be fully categorized and we can sustain a 2-business-day DSAT categorization SLA going forward?**

You must output **two dates** (at minimum):

1. **Backlog zero date** — calendar date when the 471 + accumulated DSATs are all categorized.
2. **SLA sustainable date** — calendar date from which we can consistently meet the 2-business-day SLA for new DSATs (often same as or right after backlog zero).

---

## 2. Scenario Parameters (copy these into your model)

| Parameter | Value |
|-----------|--------|
| **Start Date** | You choose = date you begin the assignment |
| **Current backlog** | 471 DSATs (uncategorized on Start Date) |
| **Arrivals** | 18/day (Days 1–8), then **12/day** from Day 9 onward (7 days/week) |
| **Capacity** | 72 DSATs/day **weekdays only** (Mon–Fri); **0** on Sat–Sun |
| **Work** | Categorization only on business days; no work on weekends |
| **SLA** | Each DSAT must be categorized by **end of day, 2 business days** after receipt (weekends don’t count) |

### Setup (must finish before any categorization)

| Task | Duration | Notes |
|------|----------|--------|
| 1. Create DSAT taxonomy (categories + definitions) | 2 business days | Business days only |
| 2. Build Notion DSAT Intake database | 1 business day | After taxonomy |
| 3. CX Operations Manager review + approval | 2 business days | After build |
| **Total setup** | **5 business days** | Sequential; no categorization until done |

- DSATs **keep arriving** every day during setup (including weekends).
- So backlog = 471 + (arrivals during setup) when categorization starts.

---

## 3. Forecast Logic (auditable)

### Step 1: Start Date and business-day numbering

- Label **Start Date = Day 1** (can be weekend; that’s OK).
- Count **business days** from Day 1 (Mon–Fri only) to get “Setup complete” date.

### Step 2: Setup completion date

- First day of work = first business day on or after Start Date.
- Count 5 business days from that first work day → **Setup complete** = first day categorization can run.

### Step 3: Backlog when categorization starts

- For each calendar day from Day 1 through the day before “Setup complete”:
  - Add arrivals: 18 for days 1–8, 12 for day 9+.
- **Backlog at start of categorization** = 471 + (sum of those daily arrivals).

### Step 4: Backlog burn-down

- Each **business day**, the team categorizes up to **72** DSATs (oldest first or by due date; your choice, but state it).
- On **weekends**, backlog does not decrease (arrivals still add).
- Run day-by-day: each day add that day’s arrivals to backlog, then on business days subtract min(72, backlog) from backlog until backlog = 0.

### Step 5: Backlog zero date

- The **calendar date** when backlog first reaches 0 = **backlog fully categorized**.

### Step 6: SLA sustainable date

- Once backlog is 0, every new DSAT is categorized within 2 business days at 72/day capacity (12/day arrival is well under 72).
- So **SLA sustainable date** = same as backlog zero date, or the next calendar day; state it explicitly in your Notion and summary.

**Tip:** Build a simple table or spreadsheet (or Notion database with formulas) that lists each calendar day, whether it’s a business day, arrivals that day, capacity that day, and running backlog. That gives you an auditable forecast.

---

## 4. Deliverables Checklist (submit one Notion link)

### 4.1 Notion databases

- [ ] **DSAT Intake**  
  - One row per DSAT (synthetic IDs OK: DSAT-0001, DSAT-0002, …).  
  - **Minimum properties:**  
    - DSAT ID  
    - Date received  
    - Status (New, In Progress, Categorized)  
    - Root cause (relation to Taxonomy)  
    - User Type  
    - SLA due date (formula)  
    - SLA met? (formula)  
    - Notes  

- [ ] **DSAT Taxonomy**  
  - Root-cause categories + clear definitions.  
  - **At least 8 categories.**  

- [ ] **DSAT Execution Plan**  
  - Project plan with:  
    - Setup tasks (taxonomy → build → approval)  
    - Ongoing categorization work  
    - Dependencies and a way to forecast dates (e.g. dates for setup complete, backlog zero, SLA sustainable)  

### 4.2 Capacity + forecast (inside Notion)

- [ ] **Calendar date** when setup completes (first day categorization can begin)  
- [ ] **Calendar date** when backlog reaches **zero**  
- [ ] **Calendar date** when we can consistently meet the **2-business-day SLA**  
- [ ] Forecast reflects: daily arrivals (incl. weekends), no weekend work, backlog growth during setup  

### 4.3 Short written summary (max 400 words)

- [ ] Assumptions (if any)  
- [ ] Recommended operating cadence (daily/weekly)  
- [ ] **Two concrete improvements** for month 1 (e.g. taxonomy quality checks, QA alignment loop, DSAT routing, automation)  

### 4.4 Submission

- [ ] One shareable Notion page (link “anyone with the link”)  
- [ ] Optional: accompanying doc or Loom walkthrough  

---

## 5. SLA Due-Date Rule (for formulas)

- **Rule:** A DSAT received on date D must be categorized by **end of day, 2 business days after D**.  
- **Weekends:** Do not count as business days.  
- **Example:** Received Saturday → business days 1 and 2 = Monday, Tuesday → due **end of Tuesday**.

You can implement this in Notion with a formula that counts forward 2 business days from “Date received.”

---

## 6. Assumptions to consider stating (if you use them)

- **Start Date** is the date you begin the assignment (and whether you treat it as “first calendar day” for arrivals).
- **Order of work:** Backlog cleared in FIFO by “date received,” or by “SLA due date” first—state which.
- **No partial capacity:** Full 72/day on each business day until backlog is 0 (or you cap at 72 for new work only).
- **Arrivals:** Exactly 18/day for days 1–8 and 12/day from day 9; no other shocks.
- **Setup:** Exactly 5 business days; no rework or delay.

---

## 7. Taxonomy ideas (≥8 root-cause categories)

Use or adapt these so you have at least 8:

1. **Product / technical issue** — Bug, outage, or product not working as expected  
2. **Process / policy** — Unclear or frustrating process, policy, or compliance requirement  
3. **Communication** — Miscommunication, unclear instructions, or tone  
4. **Wait time / speed** — Slow response, long hold, or delayed resolution  
5. **Information / knowledge** — Wrong or missing information from agent or system  
6. **Channel / access** — Difficulty with channel (chat, phone, portal) or access  
7. **Expectation mismatch** — Expectation set incorrectly or not met  
8. **Agent behavior** — Unprofessional behavior, lack of empathy, or protocol not followed  
9. **Other** — Catch-all with definition (e.g. “None of the above” or “To be refined”)  

Define each in the Taxonomy database so they’re ready for use in the Intake.

---

## 8. Quick reference: arrival schedule

| Day range | Arrivals per calendar day |
|-----------|----------------------------|
| Day 1 – Day 8 | 18 |
| Day 9 onward | 12 |

Days are **calendar** days; work and capacity only on **business** days (Mon–Fri).

---

## 9. Suggested order of work

1. Set your **Start Date** and compute **setup completion** (5 business days).  
2. Compute **backlog at start of categorization** and run **burn-down** to get **backlog zero** and **SLA sustainable** dates.  
3. In Notion: create **Taxonomy** (8+ categories with definitions).  
4. Create **DSAT Intake** with required properties and relations; add **SLA due** and **SLA met?** formulas.  
5. Build **Execution Plan** with setup tasks, dependencies, and the three key dates.  
6. Add a **Capacity + forecast** section (table or database) that shows your assumptions and the three dates.  
7. Write the **400-word summary** (assumptions, cadence, two month-1 improvements).  
8. Set the Notion page to “share with anyone with the link” and submit that link.

---

*Use this reference while building in Notion so your structure and numbers stay consistent and auditable.*
