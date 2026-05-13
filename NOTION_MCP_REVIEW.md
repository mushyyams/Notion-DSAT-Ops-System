# Notion MCP Review — DSAT Operations Project

## Overview

This document summarizes how the **Notion API MCP** (Model Context Protocol) integrates with the DSAT Operations project and what it can/cannot do.

## MCP Server

- **Identifier:** `notionApi`
- **Configured in:** `.cursor/mcp.json`

## Available MCP Tools

| Tool | Purpose |
|------|---------|
| `API-post-search` | Search pages and databases by title |
| `API-get-block-children` | List blocks (databases, pages) under a page |
| `API-retrieve-a-page` | Get page details |
| `API-patch-page` | Update page properties (e.g. title) |
| `API-post-page` | Create pages (including database rows) |
| `API-create-a-data-source` | Add data source to **existing** database (not create new DB) |
| `API-query-data-source` | Query database rows |
| `API-retrieve-a-database` | Get database metadata |
| `API-retrieve-a-data-source` | Get data source schema |
| `API-patch-block-children` | Append blocks to a page |
| `API-retrieve-a-block` | Get block details |
| `API-move-page` | Move page to different parent |

## What the MCP Can Do for This Project

1. **Search** – Find DSAT Intake, Taxonomy, Execution Plan, Capacity + Forecast
2. **Update pages** – Fix titles, add content
3. **Add database rows** – Create DSAT entries, forecast rows (via `API-post-page` with `parent.database_id`)
4. **Query** – Read existing data from databases
5. **Append blocks** – Add headings, lists, etc. to pages

## Limitations

- **Create new databases** – `API-create-a-data-source` only adds data sources to *existing* databases. Creating a brand‑new database (e.g. Forecast Schedule) requires the **Node.js script** (`npm run add-forecast-table`) or the older Notion REST API (`POST /v1/databases`).
- **Formula properties** – Creating databases with formula properties via MCP may hit validation issues; the Node script handles this with a two-step approach.

## Fix Applied via MCP

The **Capacity + Forecast** page had an empty title. It was updated via:

```
API-patch-page
  page_id: 31745fba-eacb-8169-926f-e7c71b143395
  properties: { title: "Capacity + Forecast" }
```

## Recommended Workflow

| Task | Use |
|------|-----|
| Create databases (Taxonomy, Intake, Execution Plan) | `npm run setup` |
| Add sample DSAT data | `npm run seed` |
| Add Forecast Schedule table | `npm run add-forecast-table` |
| Search, query, update existing content | Notion MCP tools |
| Add rows to existing databases | MCP `API-post-page` or `npm run seed` |

## Key Page/Database IDs (from your workspace)

| Item | ID |
|------|-----|
| DSAT Ops System (parent) | `31745fbaeacb8021a057e99beeb39af8` |
| Capacity + Forecast page | `31745fba-eacb-8169-926f-e7c71b143395` |
| DSAT Taxonomy database | `31745fba-eacb-8149-bf96-d6ce0a3bf13b` |
| DSAT Intake database | `31745fba-eacb-81b4-887e-e0de4fcd5ba9` |
| DSAT Execution Plan database | `31745fba-eacb-819f-b935-f0d25d0bf304` |
