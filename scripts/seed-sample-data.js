#!/usr/bin/env node
/**
 * Seed sample DSAT data into the Intake database
 * Requires: NOTION_TOKEN, NOTION_PARENT_PAGE_ID
 * Finds DSAT Intake and DSAT Taxonomy databases under the parent page
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

async function findDatabases() {
  // Try search API (finds all databases the integration can access)
  const { results } = await notion.search({
    filter: { property: 'object', value: 'database' },
    page_size: 100,
  });

  let intakeId = null;
  let taxonomyId = null;

  for (const db of results) {
    const title = db.title?.[0]?.plain_text || '';
    if (title.includes('DSAT Intake')) intakeId = db.id;
    if (title.includes('DSAT Taxonomy')) taxonomyId = db.id;
  }

  if (!intakeId || !taxonomyId) {
    console.error('Could not find DSAT Intake and/or DSAT Taxonomy.');
    console.error('Ensure both databases exist and are connected to your integration.');
    process.exit(1);
  }
  return { intakeId, taxonomyId };
}

async function getTaxonomyPageIds(taxonomyDbId) {
  const { results } = await notion.databases.query({
    database_id: taxonomyDbId,
    page_size: 100,
  });

  const map = {};
  for (const page of results) {
    const name = page.properties?.Category?.title?.[0]?.plain_text;
    if (name) map[name] = page.id;
  }
  return map;
}

async function seedSampleData() {
  console.log('\n=== Seeding Sample DSAT Data ===\n');

  const { intakeId, taxonomyId } = await findDatabases();
  console.log('Found DSAT Intake:', intakeId);
  console.log('Found DSAT Taxonomy:', taxonomyId);

  const taxonomyIds = await getTaxonomyPageIds(taxonomyId);

  const sampleDSATs = [
    { id: 'DSAT-0001', dateReceived: '2026-03-01', status: 'Categorized', rootCause: 'Product / technical issue', dateCategorized: '2026-03-03', userType: 'Enterprise', notes: 'API timeout during peak' },
    { id: 'DSAT-0002', dateReceived: '2026-03-02', status: 'Categorized', rootCause: 'Wait time / speed', dateCategorized: '2026-03-04', userType: 'SMB', notes: 'Slow response time' },
    { id: 'DSAT-0003', dateReceived: '2026-03-03', status: 'In Progress', rootCause: null, dateCategorized: null, userType: 'Free tier', notes: '' },
    { id: 'DSAT-0004', dateReceived: '2026-03-04', status: 'New', rootCause: null, dateCategorized: null, userType: 'Enterprise', notes: '' },
    { id: 'DSAT-0005', dateReceived: '2026-03-02', status: 'Categorized', rootCause: 'Communication', dateCategorized: '2026-03-05', userType: 'SMB', notes: 'Unclear instructions' },
    { id: 'DSAT-0006', dateReceived: '2026-02-28', status: 'Categorized', rootCause: 'Process / policy', dateCategorized: '2026-03-04', userType: 'Enterprise', notes: 'Policy confusion' },
    { id: 'DSAT-0007', dateReceived: '2026-03-05', status: 'New', rootCause: null, dateCategorized: null, userType: 'SMB', notes: '' },
    { id: 'DSAT-0008', dateReceived: '2026-03-01', status: 'Categorized', rootCause: 'Expectation mismatch', dateCategorized: '2026-03-06', userType: 'Free tier', notes: 'SLA miss - late categorization' },
  ];

  for (const dsat of sampleDSATs) {
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
      parent: { database_id: intakeId },
      properties: props,
    });
    console.log('  Added', dsat.id);
  }

  console.log('\n✓ Added', sampleDSATs.length, 'sample DSATs.\n');
}

seedSampleData().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
