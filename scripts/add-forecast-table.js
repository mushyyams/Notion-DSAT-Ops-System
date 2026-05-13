#!/usr/bin/env node
/**
 * Adds auditable day-by-day Forecast Schedule table to Capacity + Forecast page
 * Requires: NOTION_TOKEN, NOTION_PARENT_PAGE_ID
 */

import { Client } from '@notionhq/client';
import { runForecast } from './forecast.js';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID;
const CAPACITY_FORECAST_PAGE_ID = process.env.NOTION_CAPACITY_FORECAST_PAGE_ID;

if (!process.env.NOTION_TOKEN || !PARENT_PAGE_ID) {
  console.error('Error: NOTION_TOKEN and NOTION_PARENT_PAGE_ID are required.');
  process.exit(1);
}

function isValidNotionId(id) {
  if (!id || typeof id !== 'string') return false;
  const cleaned = id.replace(/-/g, '');
  return /^[a-f0-9]{32}$/i.test(cleaned);
}

async function findCapacityForecastPage() {
  if (CAPACITY_FORECAST_PAGE_ID && isValidNotionId(CAPACITY_FORECAST_PAGE_ID)) {
    return CAPACITY_FORECAST_PAGE_ID;
  }

  // Get child blocks of the parent (child_page blocks = subpages)
  let allResults = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    const { results, next_cursor } = await notion.blocks.children.list({
      block_id: PARENT_PAGE_ID,
      page_size: 100,
      start_cursor: startCursor,
    });
    allResults = allResults.concat(results);
    hasMore = !!next_cursor;
    startCursor = next_cursor;
  }

  const childPages = allResults.filter((b) => b.type === 'child_page');
  for (const block of childPages) {
    const title = ((block.child_page && block.child_page.title) || '').toLowerCase();
    if (title.includes('capacity') && title.includes('forecast')) {
      return block.id;
    }
  }
  // Fallback: if only one child page, it's likely Capacity + Forecast (title may be empty)
  if (childPages.length === 1) {
    return childPages[0].id;
  }

  // Fallback: search all pages
  let searchCursor = undefined;
  do {
    const searchResponse = await notion.search({
      filter: { property: 'object', value: 'page' },
      query: 'Capacity Forecast',
      page_size: 50,
      start_cursor: searchCursor,
    });

    for (const page of searchResponse.results) {
      const title = (page.properties?.title?.title?.[0]?.plain_text || '').toLowerCase();
      if ((title.includes('capacity') && title.includes('forecast')) || title === 'capacity + forecast') {
        return page.id;
      }
    }
    searchCursor = searchResponse.next_cursor;
  } while (searchCursor);

  // Last resort: search with empty query
  const { results: allPages } = await notion.search({
    filter: { property: 'object', value: 'page' },
    page_size: 100,
  });

  for (const page of allPages) {
    const title = (page.properties?.title?.title?.[0]?.plain_text || '').toLowerCase();
    if (title.includes('capacity') && title.includes('forecast')) {
      return page.id;
    }
  }

  console.error('Could not find Capacity + Forecast page.');
  console.error('Tip: Set NOTION_CAPACITY_FORECAST_PAGE_ID with the page ID from the URL.');
  process.exit(1);
}

async function addForecastTable() {
  console.log('\n=== Adding Forecast Schedule Table ===\n');

  const capacityForecastPageId = await findCapacityForecastPage();
  console.log('Found Capacity + Forecast page');

  const forecast = runForecast();
  const { dailySchedule } = forecast;

  // Create Forecast Schedule database
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: capacityForecastPageId },
    title: [{ type: 'text', text: { content: 'Forecast Schedule (Auditable)' } }],
    description: [{ type: 'text', text: { content: 'Day-by-day: arrivals, capacity, processed, running backlog' } }],
    properties: {
      'Date': { title: {} },
      'Day': { number: { format: 'number' } },
      'Business day?': { checkbox: {} },
      'Arrivals': { number: { format: 'number' } },
      'Capacity': { number: { format: 'number' } },
      'Processed': { number: { format: 'number' } },
      'Running backlog': { number: { format: 'number' } },
    },
  });
  console.log('Created Forecast Schedule database');

  // Add rows
  for (const row of dailySchedule) {
    await notion.pages.create({
      parent: { database_id: db.id },
      properties: {
        'Date': { title: [{ type: 'text', text: { content: row.date } }] },
        'Day': { number: row.dayNumber },
        'Business day?': { checkbox: row.businessDay },
        'Arrivals': { number: row.arrivals },
        'Capacity': { number: row.capacity },
        'Processed': { number: row.processed },
        'Running backlog': { number: row.runningBacklog },
      },
    });
  }
  console.log('Added', dailySchedule.length, 'rows');
  console.log('\n✓ Forecast Schedule table added to Capacity + Forecast page.\n');
}

addForecastTable().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
