# DSAT Operations — Notion Project

DSAT (Customer Dissatisfaction) Operations system. Creates Notion databases and computes backlog burn-down forecast.

## Quick Start

### 1. Run the forecast

```powershell
npm run forecast
```

Outputs: Setup complete date, Backlog zero date, SLA sustainable date.

### 2. Create the Notion system

```powershell
# Set your Notion integration token and parent page ID
$env:NOTION_TOKEN = "ntn_your_token"
$env:NOTION_PARENT_PAGE_ID = "your-page-id"

# Optional: custom start date (defaults to today)
$env:START_DATE = "2026-03-02"

npm run setup
```

**Getting the parent page ID:**
1. Create a page in Notion (e.g. "DSAT Operations")
2. Open the page → ⋮ menu → **Connections** → Add your integration
3. Copy the page ID from the URL: `notion.so/workspace/PAGE_ID?v=...`

### 3. Add sample data (optional)

```powershell
npm run seed
```

Adds 8 sample DSAT rows to the Intake database for visualization.

### 4. Add auditable forecast table (optional)

```powershell
npm run add-forecast-table
```

Adds a day-by-day Forecast Schedule table to the Capacity + Forecast page (Date, Business day?, Arrivals, Capacity, Processed, Running backlog). If the page isn't found automatically, set `NOTION_CAPACITY_FORECAST_PAGE_ID` with the page ID from the Capacity + Forecast page URL.

## What Gets Created

| Database / Page | Description |
|-----------------|-------------|
| **DSAT Taxonomy** | 9 root-cause categories with definitions |
| **DSAT Intake** | One row per DSAT; Status, Root cause, SLA due, SLA met? |
| **DSAT Execution Plan** | Setup tasks + milestones with forecast dates |
| **Capacity + Forecast** | Key dates and assumptions |

## Portfolio Visuals

See [`docs/portfolio-visuals.md`](docs/portfolio-visuals.md) for reusable SVG
source files and PNG previews that explain the system workflow, Notion data
model, forecast burn-down, and dashboard story. See
[`docs/usage-wireframes.md`](docs/usage-wireframes.md) for wireframes and
screenshot-style mockups of how the system would be used.

## Project Structure

```
├── PROJECT_REFERENCE.md      # Assessment requirements (single source of truth)
├── docs/
│   ├── portfolio-visuals.md  # Portfolio-ready visual guide
│   ├── usage-wireframes.md   # Wireframes and screenshot-style usage mockups
│   └── visuals/              # SVG source files and PNG previews
├── NOTION_MCP_INSTRUCTIONS.md # How to use Notion MCP for manual setup
├── SUMMARY_TEMPLATE.md       # 400-word summary template
├── scripts/
│   ├── forecast.js           # Backlog burn-down calculator
│   └── notion-setup.js       # Creates Notion databases via API
└── package.json
```

## Notion MCP

The project is configured for **Notion MCP** (`.cursor/mcp.json`). See `NOTION_MCP_INSTRUCTIONS.md` for prompts to create or modify the system via MCP tools.

## Submission Checklist

- [ ] Run `npm run setup` (or create via Notion MCP)
- [ ] Share Notion page with "anyone with the link"
- [ ] Complete `SUMMARY_TEMPLATE.md` (assumptions, cadence, two improvements)
- [ ] Submit the Notion link
