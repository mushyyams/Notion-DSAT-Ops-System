#!/usr/bin/env node
/**
 * Creates the DSAT Operations Summary page (max 400 words)
 * Requires: NOTION_TOKEN, NOTION_PARENT_PAGE_ID
 */

import { Client } from '@notionhq/client';
import { runForecast } from './forecast.js';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID;

async function main() {
  if (!process.env.NOTION_TOKEN || !PARENT_PAGE_ID) {
    console.error('NOTION_TOKEN and NOTION_PARENT_PAGE_ID required');
    process.exit(1);
  }

  const forecast = runForecast();

  const page = await notion.pages.create({
    parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
    properties: {
      title: { title: [{ type: 'text', text: { content: 'DSAT Operations Summary' } }] },
    },
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: {
              content: 'This summary outlines the assumptions, operating cadence, and proposed improvements for the DSAT Operations system.',
            },
          }],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: 'DSAT Insights' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: {
              content: 'The DSAT Insights page is a dashboard that surfaces key metrics from the DSAT Intake and Taxonomy databases. It includes linked views for taxonomy distribution (count per root cause), SLA performance (met vs missed), status snapshot (New, In Progress, Categorized), user type mix, and at-risk items. This gives ops a single place to monitor pipeline health without opening each database separately.',
            },
          }],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: 'Assumptions' } }] },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{
            type: 'text',
            text: {
              content: 'Start date: ' + forecast.startDate + ' (first calendar day for arrivals). DSATs arrive every day including weekends.',
            },
          }],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{
            type: 'text',
            text: {
              content: 'Order of work: Backlog cleared FIFO by Date received. When SLA is at risk, prioritize by SLA due date.',
            },
          }],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{
            type: 'text',
            text: {
              content: 'Capacity: Full 72 DSATs/day on each business day (Mon–Fri) until backlog is zero. No partial capacity.',
            },
          }],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{
            type: 'text',
            text: {
              content: 'Arrivals: 18/day for days 1–8, then 12/day from day 9 onward. No shocks or variability.',
            },
          }],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{
            type: 'text',
            text: {
              content: 'Setup: Exactly 5 business days (taxonomy + build + approval). No rework or delay. No categorization during setup.',
            },
          }],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: 'Recommended Operating Cadence' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: {
              content: 'Daily: Triage new DSATs each morning. Assign and categorize within 2 business days. Use the DSAT Insights page to monitor taxonomy distribution, SLA performance, status snapshot, and at-risk items.',
            },
          }],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: {
              content: 'Weekly: Use the DSAT Insights page to run a taxonomy quality check—review root-cause distribution and spot mislabeled or overused categories. Update the forecast if arrivals or capacity change. Share a brief SLA summary (met vs missed) with CX leadership.',
            },
          }],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: 'Two Improvements for Month 1' } }] },
      },
      {
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: [{
            type: 'text',
            text: {
              content: 'Taxonomy QA alignment loop: Hold weekly sessions where ops and QA review tricky DSATs together. Write down how to handle edge cases so everyone stays consistent.',
            },
          }],
        },
      },
      {
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: [{
            type: 'text',
            text: {
              content: 'Automated DSAT routing by User Type: Send Enterprise DSATs to senior agents and SMB/Free tier to a triage pool. Use filters or integrations to auto-assign by User Type.',
            },
          }],
        },
      },
    ],
  });

  console.log('\n✓ Summary page created:', page.id);
  console.log('  https://notion.so/' + page.id.replace(/-/g, ''));
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
