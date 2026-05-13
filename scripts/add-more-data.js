#!/usr/bin/env node
/**
 * Adds 2 new taxonomy categories and 10 more DSAT Intake entries (with repeating categories)
 * Requires: NOTION_TOKEN, NOTION_PARENT_PAGE_ID
 */

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID;
const TAXONOMY_DB_ID = '31745fba-eacb-8149-bf96-d6ce0a3bf13b';
const INTAKE_DB_ID = '31745fba-eacb-81b4-887e-e0de4fcd5ba9';

const NEW_TAXONOMY_CATEGORIES = [
  { name: 'Pricing / billing', definition: 'Billing errors, pricing confusion, or unexpected charges' },
  { name: 'Escalation / handoff', definition: 'Poor handoff between agents, escalation delays, or lost context' },
];

const NEW_DSAT_ENTRIES = [
  { id: 'DSAT-0009', dateReceived: '2026-03-06', status: 'Categorized', rootCause: 'Product / technical issue', dateCategorized: '2026-03-07', userType: 'Enterprise', notes: 'Dashboard outage' },
  { id: 'DSAT-0010', dateReceived: '2026-03-06', status: 'Categorized', rootCause: 'Product / technical issue', dateCategorized: '2026-03-08', userType: 'SMB', notes: 'Login failed repeatedly' },
  { id: 'DSAT-0011', dateReceived: '2026-03-07', status: 'Categorized', rootCause: 'Wait time / speed', dateCategorized: '2026-03-08', userType: 'Enterprise', notes: '45 min hold time' },
  { id: 'DSAT-0012', dateReceived: '2026-03-07', status: 'Categorized', rootCause: 'Wait time / speed', dateCategorized: '2026-03-09', userType: 'Free tier', notes: 'Slow ticket response' },
  { id: 'DSAT-0013', dateReceived: '2026-03-08', status: 'Categorized', rootCause: 'Pricing / billing', dateCategorized: '2026-03-09', userType: 'SMB', notes: 'Incorrect invoice amount' },
  { id: 'DSAT-0014', dateReceived: '2026-03-08', status: 'In Progress', rootCause: null, dateCategorized: null, userType: 'Enterprise', notes: '' },
  { id: 'DSAT-0015', dateReceived: '2026-03-09', status: 'Categorized', rootCause: 'Escalation / handoff', dateCategorized: '2026-03-10', userType: 'Enterprise', notes: 'Had to repeat issue to 3 agents' },
  { id: 'DSAT-0016', dateReceived: '2026-03-09', status: 'Categorized', rootCause: 'Communication', dateCategorized: '2026-03-10', userType: 'SMB', notes: 'Agent misread requirements' },
  { id: 'DSAT-0017', dateReceived: '2026-03-10', status: 'Categorized', rootCause: 'Pricing / billing', dateCategorized: '2026-03-11', userType: 'Free tier', notes: 'Unexpected upgrade charge' },
  { id: 'DSAT-0018', dateReceived: '2026-03-10', status: 'New', rootCause: null, dateCategorized: null, userType: 'SMB', notes: '' },
];

async function main() {
  if (!process.env.NOTION_TOKEN || !PARENT_PAGE_ID) {
    console.error('NOTION_TOKEN and NOTION_PARENT_PAGE_ID required');
    process.exit(1);
  }

  console.log('\n=== Adding Taxonomy Categories & DSAT Intake Entries ===\n');

  // 1. Add 2 new taxonomy categories
  console.log('Adding 2 new taxonomy categories...');
  for (const cat of NEW_TAXONOMY_CATEGORIES) {
    await notion.pages.create({
      parent: { database_id: TAXONOMY_DB_ID },
      properties: {
        'Category': { title: [{ type: 'text', text: { content: cat.name } }] },
        'Definition': { rich_text: [{ type: 'text', text: { content: cat.definition } }] },
      },
    });
    console.log('  Added:', cat.name);
  }

  // 2. Get taxonomy IDs (including new ones)
  const { results: taxonomyPages } = await notion.databases.query({
    database_id: TAXONOMY_DB_ID,
    page_size: 100,
  });
  const taxonomyIds = {};
  for (const p of taxonomyPages) {
    const name = p.properties?.Category?.title?.[0]?.plain_text;
    if (name) taxonomyIds[name] = p.id;
  }

  // 3. Add 10 DSAT Intake entries
  console.log('\nAdding 10 DSAT Intake entries...');
  for (const dsat of NEW_DSAT_ENTRIES) {
    const props = {
      'DSAT ID': { title: [{ type: 'text', text: { content: dsat.id } }] },
      'Date received': { date: { start: dsat.dateReceived } },
      'Status': { select: { name: dsat.status } },
      'User Type': { rich_text: [{ type: 'text', text: { content: dsat.userType } }] },
      'Notes': { rich_text: [{ type: 'text', text: { content: dsat.notes } }] },
    };
    if (dsat.dateCategorized) {
      props['Date categorized'] = { date: { start: dsat.dateCategorized } };
    }
    if (dsat.rootCause && taxonomyIds[dsat.rootCause]) {
      props['Root cause'] = { relation: [{ id: taxonomyIds[dsat.rootCause] }] };
    }
    await notion.pages.create({
      parent: { database_id: INTAKE_DB_ID },
      properties: props,
    });
    console.log('  Added', dsat.id, dsat.rootCause ? `(${dsat.rootCause})` : '');
  }

  console.log('\n✓ Done. Run "npm run refresh-relations" to sync Taxonomy Counts.\n');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
