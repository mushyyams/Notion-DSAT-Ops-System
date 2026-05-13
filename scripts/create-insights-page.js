#!/usr/bin/env node
/**
 * Creates DSAT Insights page with Taxonomy rollup for category breakdown
 * Requires: NOTION_TOKEN, NOTION_PARENT_PAGE_ID
 */

import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID;

if (!process.env.NOTION_TOKEN || !PARENT_PAGE_ID) {
  console.error('Error: NOTION_TOKEN and NOTION_PARENT_PAGE_ID are required.');
  process.exit(1);
}

const TAXONOMY_DB_ID = '31745fba-eacb-8149-bf96-d6ce0a3bf13b';
const INTAKE_DB_ID = '31745fba-eacb-81b4-887e-e0de4fcd5ba9';

async function enableDualRelationAndRollup() {
  console.log('Updating Root cause relation to dual_property...');
  try {
    await notion.databases.update({
      database_id: INTAKE_DB_ID,
      properties: {
        'Root cause': {
          relation: {
            database_id: TAXONOMY_DB_ID,
            dual_property: {
              synced_property_name: 'DSATs',
            },
          },
        },
      },
    });
    console.log('  Dual relation enabled (Taxonomy now has "DSATs" property)');
  } catch (err) {
    if (err.message?.includes('dual_property') || err.code === 'validation_error') {
      console.warn('  Could not update relation. Taxonomy may already have rollup.');
    } else {
      throw err;
    }
  }

  console.log('Adding Count rollup to Taxonomy...');
  try {
    await notion.databases.update({
      database_id: TAXONOMY_DB_ID,
      properties: {
        'Count': {
          rollup: {
            relation_property_name: 'DSATs',
            rollup_property_name: 'DSAT ID',
            function: 'count',
          },
        },
      },
    });
    console.log('  Count rollup added');
  } catch (err) {
    if (err.message?.includes('DSATs') || err.code === 'validation_error') {
      console.warn('  Rollup may already exist or relation not ready. Add manually in Notion.');
    } else {
      throw err;
    }
  }

  console.log('  (Add "% of total" manually in Notion if needed: round(prop("Count") / total * 100, 1) + "%")');
}

async function createInsightsPage() {
  console.log('Creating Insights page...');

  const page = await notion.pages.create({
    parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
    properties: {
      title: {
        title: [{ type: 'text', text: { content: 'DSAT Insights' } }],
      },
    },
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: {
              content: 'This page surfaces key metrics from your DSAT databases. Add linked database views below for dynamic insights.',
            },
          }],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: '1. Taxonomy Distribution' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: {
              content: 'Type /linked and select "DSAT Taxonomy" to embed it here. The Count and % columns show how many DSATs fall into each root-cause category. Sort by Count to see top drivers.',
            },
          }],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: '2. SLA Performance' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: {
              content: 'Type /linked and select "DSAT Intake". Group by "SLA met?" to see Yes vs No vs —. Filter Status = Categorized to see only completed items.',
            },
          }],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: '3. Status Snapshot' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: {
              content: 'Type /linked and select "DSAT Intake". Group by "Status" (New, In Progress, Categorized) for a quick pipeline view.',
            },
          }],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: '4. User Type Mix' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: {
              content: 'Type /linked and select "DSAT Intake". Group by "User Type" to see Enterprise vs SMB vs Free tier distribution.',
            },
          }],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: '5. At-Risk (Past SLA Due)' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: {
              content: 'Type /linked and select "DSAT Intake". Add filter: Status is not Categorized, and Date received is on or before 5 days ago. These are overdue or at risk.',
            },
          }],
        },
      },
    ],
  });

  console.log('  Created:', page.id);
  return page;
}

async function main() {
  console.log('\n=== Creating DSAT Insights ===\n');

  await enableDualRelationAndRollup();
  await createInsightsPage();

  console.log('\n✓ Insights page created. Add linked database views using the instructions on the page.\n');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
