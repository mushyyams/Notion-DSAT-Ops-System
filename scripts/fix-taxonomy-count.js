#!/usr/bin/env node
/**
 * Fixes DSAT Taxonomy Count column: removes incorrect relation, adds rollup
 * that counts related DSAT Intake rows per category.
 */

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const TAXONOMY_DB_ID = '31745fba-eacb-8149-bf96-d6ce0a3bf13b';

async function main() {
  if (!process.env.NOTION_TOKEN) {
    console.error('NOTION_TOKEN required');
    process.exit(1);
  }

  console.log('Removing incorrect Count relation property...');
  await notion.databases.update({
    database_id: TAXONOMY_DB_ID,
    properties: { Count: null },
  });
  console.log('  Done');

  console.log('Adding Count rollup (count of related DSAT Intake rows per category)...');
  await notion.databases.update({
    database_id: TAXONOMY_DB_ID,
    properties: {
      Count: {
        rollup: {
          relation_property_name: 'DSATs',
          rollup_property_name: 'DSAT ID',
          function: 'count',
        },
      },
    },
  });
  console.log('  Done');

  console.log('\n✓ Count column now shows the number of DSAT Intake rows linked to each category.\n');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
