#!/usr/bin/env node
/**
 * Adds a progress bar to the Capacity + Forecast page showing progress
 * toward reaching a running backlog of 12.
 * Requires: NOTION_TOKEN, NOTION_PARENT_PAGE_ID
 */

import { Client } from '@notionhq/client';
import { runForecast } from './forecast.js';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID;
const CAPACITY_FORECAST_PAGE_ID = '31745fba-eacb-8169-926f-e7c71b143395';
const TARGET_BACKLOG = 12;

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

function makeProgressBar(percent, width = 20) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

async function main() {
  if (!process.env.NOTION_TOKEN || !PARENT_PAGE_ID) {
    console.error('NOTION_TOKEN and NOTION_PARENT_PAGE_ID required');
    process.exit(1);
  }

  const forecast = runForecast();
  const startBacklog = forecast.backlogAtStartOfCategorization;
  const todayStr = formatDate(new Date());

  // Find today's row (or nearest) in the schedule
  let todayRow = forecast.dailySchedule.find((r) => r.date === todayStr);
  if (!todayRow) {
    const past = forecast.dailySchedule.filter((r) => r.date <= todayStr);
    todayRow = past.length > 0 ? past[past.length - 1] : forecast.dailySchedule[0];
  }

  const currentBacklog = todayRow.runningBacklog;
  const range = startBacklog - TARGET_BACKLOG;
  const progress = range > 0
    ? Math.min(100, Math.max(0, ((startBacklog - currentBacklog) / range) * 100))
    : 100;
  const bar = makeProgressBar(progress);

  const progressPct = Math.round(progress);

  console.log('\n=== Adding Progress Bar ===\n');
  console.log('Today:', todayStr);
  console.log('Start backlog:', startBacklog);
  console.log('Current backlog (forecast):', currentBacklog);
  console.log('Target backlog:', TARGET_BACKLOG);
  console.log('Progress:', progressPct + '%');
  console.log('');

  // Insert after Key Dates heading (block id from get-block-children)
  const keyDatesBlockId = '31745fba-eacb-8134-8b59-f59a277ca7b8';

  await notion.blocks.children.append({
    block_id: CAPACITY_FORECAST_PAGE_ID,
    after: keyDatesBlockId,
    children: [
      {
        object: 'block',
        type: 'callout',
        callout: {
          icon: { emoji: '📊' },
          rich_text: [
            {
              type: 'text',
              text: {
                content: `Progress to running backlog of ${TARGET_BACKLOG}\n\n`,
              },
            },
            {
              type: 'text',
              text: {
                content: `${progressPct}% ${bar}\n\n`,
              },
            },
            {
              type: 'text',
              text: {
                content: `Current backlog: ${currentBacklog} → Target: ${TARGET_BACKLOG} (as of ${todayStr})`,
              },
            },
          ],
          color: 'gray_background',
        },
      },
    ],
  });

  console.log('✓ Progress bar added to Capacity + Forecast page.\n');
  console.log('Re-run this script to refresh the progress bar as time advances.');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
