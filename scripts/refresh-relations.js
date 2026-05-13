#!/usr/bin/env node
/**
 * Refreshes Root cause relations on Intake rows to fix dual-relation sync.
 * Clears and re-sets each relation to trigger Taxonomy.DSATs to populate.
 */

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const INTAKE_DB_ID = '31745fba-eacb-81b4-887e-e0de4fcd5ba9';

async function main() {
  if (!process.env.NOTION_TOKEN) {
    console.error('NOTION_TOKEN required');
    process.exit(1);
  }

  const { results } = await notion.databases.query({
    database_id: INTAKE_DB_ID,
    page_size: 100,
  });

  const toRefresh = results.filter(
    (p) => p.properties?.['Root cause']?.relation?.length > 0
  );

  console.log(`Refreshing ${toRefresh.length} Intake rows with Root cause...`);

  for (const page of toRefresh) {
    const rel = page.properties['Root cause'].relation[0];
    const taxonomyId = rel.id;

    // Clear then re-set to trigger dual sync
    await notion.pages.update({
      page_id: page.id,
      properties: { 'Root cause': { relation: [] } },
    });
    await notion.pages.update({
      page_id: page.id,
      properties: { 'Root cause': { relation: [{ id: taxonomyId }] } },
    });
    console.log('  Refreshed', page.properties?.['DSAT ID']?.title?.[0]?.plain_text || page.id);
  }

  console.log('\n✓ Done. Check Taxonomy Count column in Notion.\n');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
