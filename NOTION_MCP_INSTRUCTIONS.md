# Notion MCP Instructions for DSAT Operations System

Use these instructions when working with the **Notion MCP** (configured in `.cursor/mcp.json`) to create or modify the DSAT Operations system. The MCP provides tools like `create-a-data-source`, `query-data-source`, and `create-a-page`.

## Prerequisites

1. **Notion MCP** is configured and running (see `.cursor/mcp.json`)
2. Create a **parent page** in Notion for the DSAT system
3. **Connect the page** to your integration: Page → ⋮ → Connections → Add your integration
4. Ensure your integration has **full access** to the parent page and any child content

---

## Option A: Use the Automated Setup Script (Recommended)

The project includes a Node.js script that creates everything via the Notion API:

```powershell
# 1. Install dependencies
npm install

# 2. Set environment variables (use your values)
$env:NOTION_TOKEN = "ntn_your_integration_token"
$env:NOTION_PARENT_PAGE_ID = "your-parent-page-id"   # From the page URL
$env:START_DATE = "2025-03-02"   # Optional; defaults to today

# 3. Run forecast only (to see key dates)
npm run forecast

# 4. Run full Notion setup
npm run setup
```

The script creates:
- **DSAT Taxonomy** (9 categories with definitions)
- **DSAT Intake** (with all required properties + relation to Taxonomy)
- **DSAT Execution Plan** (setup tasks + milestones with forecast dates)
- **Capacity + Forecast** page (key dates and assumptions)

---

## Option B: Use Notion MCP Tools Directly

If you prefer to use the Notion MCP in a Cursor chat, you can give instructions like:

### 1. Create the parent page (if needed)

> "Create a new page in my Notion workspace titled 'DSAT Operations' and use its ID as the parent for the following databases."

### 2. Create DSAT Taxonomy

> "Create a data source (database) in Notion with parent page [PAGE_ID] titled 'DSAT Taxonomy' with properties: Category (title), Definition (rich_text). Add these 9 rows: Product/technical issue, Process/policy, Communication, Wait time/speed, Information/knowledge, Channel/access, Expectation mismatch, Agent behavior, Other - each with their definition from PROJECT_REFERENCE.md."

### 3. Create DSAT Intake

> "Create a data source titled 'DSAT Intake' as a child of [PAGE_ID] with: DSAT ID (title), Date received (date), Status (select: New, In Progress, Categorized), Root cause (relation to DSAT Taxonomy), User Type (rich_text), Date categorized (date), SLA due date (formula: 2 business days after Date received), SLA met? (formula), Notes (rich_text)."

### 4. Create DSAT Execution Plan

> "Create a data source titled 'DSAT Execution Plan' with Task, Type (Setup/Milestone/Ongoing), Duration, Start, End, Depends on, Status, Notes. Add rows for: Create taxonomy (2 b.d.), Build Intake (1 b.d.), CX approval (2 b.d.), Setup complete, Backlog zero, SLA sustainable, Ongoing categorization."

### 5. Add Capacity + Forecast

> "Create a child page of [PAGE_ID] titled 'Capacity + Forecast' with the key dates: Setup complete, Backlog zero, SLA sustainable. Use the forecast from scripts/forecast.js."

---

## SLA Formula Reference

**SLA due date** (2 business days after Date received):
```
dateAdd(prop("Date received"), if(day(prop("Date received"))==1,2,if(day(prop("Date received"))==2,2,if(day(prop("Date received"))==3,2,if(day(prop("Date received"))==4,4,if(day(prop("Date received"))==5,4,if(day(prop("Date received"))==6,3,2))))), "days")
```
- Mon–Wed: +2 days
- Thu–Fri: +4 days
- Sat: +3 days
- Sun: +2 days

**SLA met?** (when Status = Categorized and Date categorized is set):
```
if(prop("Status")=="Categorized", if(dateBetween(prop("SLA due date"), prop("Date categorized"), "days")>=0, "Yes", "No"), "—")
```

---

## Taxonomy Categories (from PROJECT_REFERENCE.md)

| Category | Definition |
|----------|------------|
| Product / technical issue | Bug, outage, or product not working as expected |
| Process / policy | Unclear or frustrating process, policy, or compliance requirement |
| Communication | Miscommunication, unclear instructions, or tone |
| Wait time / speed | Slow response, long hold, or delayed resolution |
| Information / knowledge | Wrong or missing information from agent or system |
| Channel / access | Difficulty with channel (chat, phone, portal) or access |
| Expectation mismatch | Expectation set incorrectly or not met |
| Agent behavior | Unprofessional behavior, lack of empathy, or protocol not followed |
| Other | None of the above or to be refined |

---

## Submission Checklist

- [ ] All three databases created (Taxonomy, Intake, Execution Plan)
- [ ] Capacity + Forecast page with three key dates
- [ ] Page shared with "anyone with the link"
- [ ] 400-word written summary (assumptions, cadence, two month-1 improvements)
