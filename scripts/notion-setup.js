#!/usr/bin/env node
/**
 * DSAT Operations Notion Setup
 * Creates: DSAT Taxonomy, DSAT Intake, DSAT Execution Plan
 * Requires: NOTION_TOKEN, NOTION_PARENT_PAGE_ID environment variables
 */

import { Client } from '@notionhq/client';
import { runForecast } from './forecast.js';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID;

if (!process.env.NOTION_TOKEN) {
  console.error('Error: NOTION_TOKEN environment variable is required.');
  console.error('Get your token from https://www.notion.so/profile/integrations');
  process.exit(1);
}

if (!PARENT_PAGE_ID) {
  console.error('Error: NOTION_PARENT_PAGE_ID environment variable is required.');
  console.error('Create a page in Notion, connect it to your integration, then use its page ID.');
  console.error('Page ID is in the URL: notion.so/workspace/PAGE_ID?v=...');
  process.exit(1);
}

// Taxonomy categories (≥8 per PROJECT_REFERENCE.md)
const TAXONOMY_CATEGORIES = [
  { name: 'Product / technical issue', definition: 'Bug, outage, or product not working as expected' },
  { name: 'Process / policy', definition: 'Unclear or frustrating process, policy, or compliance requirement' },
  { name: 'Communication', definition: 'Miscommunication, unclear instructions, or tone' },
  { name: 'Wait time / speed', definition: 'Slow response, long hold, or delayed resolution' },
  { name: 'Information / knowledge', definition: 'Wrong or missing information from agent or system' },
  { name: 'Channel / access', definition: 'Difficulty with channel (chat, phone, portal) or access' },
  { name: 'Expectation mismatch', definition: 'Expectation set incorrectly or not met' },
  { name: 'Agent behavior', definition: 'Unprofessional behavior, lack of empathy, or protocol not followed' },
  { name: 'Other', definition: 'None of the above or to be refined' },
];

async function createTaxonomyDatabase() {
  console.log('Creating DSAT Taxonomy database...');
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
    title: [{ type: 'text', text: { content: 'DSAT Taxonomy' } }],
    description: [{ type: 'text', text: { content: 'Root-cause categories for DSAT categorization' } }],
    properties: {
      'Category': { title: {} },
      'Definition': { rich_text: {} },
    },
  });
  console.log('  Created:', db.id);
  return db;
}

async function createIntakeDatabase(taxonomyDbId) {
  console.log('Creating DSAT Intake database...');
  // Create database without formulas first (avoids type/parse errors during creation)
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
    title: [{ type: 'text', text: { content: 'DSAT Intake' } }],
    description: [{ type: 'text', text: { content: 'One row per DSAT - intake and categorization tracking' } }],
    properties: {
      'DSAT ID': { title: {} },
      'Date received': { date: {} },
      'Status': {
        select: {
          options: [
            { name: 'New', color: 'blue' },
            { name: 'In Progress', color: 'yellow' },
            { name: 'Categorized', color: 'green' },
          ],
        },
      },
      'Root cause': {
        relation: {
          database_id: taxonomyDbId,
          single_property: {},
        },
      },
      'User Type': { rich_text: {} },
      'Date categorized': { date: {} },
      'SLA due date': { rich_text: {} },
      'SLA met?': { rich_text: {} },
      'Notes': { rich_text: {} },
    },
  });
  console.log('  Created:', db.id);

  // Update: replace placeholder properties with formula properties
  // SLA due: 2 business days after Date received (Sat→+2, Sun→+1, else +2)
  const slaDueFormula = 'if(day(dateAdd(prop("Date received"), 2, "days")) == 6, dateAdd(dateAdd(prop("Date received"), 2, "days"), 2, "days"), if(day(dateAdd(prop("Date received"), 2, "days")) == 7, dateAdd(dateAdd(prop("Date received"), 2, "days"), 1, "days"), dateAdd(prop("Date received"), 2, "days")))';
  const slaMetFormula = 'if(prop("Status") == "Categorized", if(empty(prop("Date categorized")), "-", if(dateBetween(prop("SLA due date"), prop("Date categorized"), "days") >= 0, "Yes", "No")), "-")';

  try {
    await notion.databases.update({
      database_id: db.id,
      properties: {
        'SLA due date': {
          formula: { expression: slaDueFormula },
        },
        'SLA met?': {
          formula: { expression: slaMetFormula },
        },
      },
    });
    console.log('  Added SLA due date and SLA met formulas');
  } catch (err) {
    console.warn('  Could not add formulas via API. Add them manually in Notion:');
    console.warn('  SLA due date: 2 business days after Date received');
    console.warn('  SLA met?: Yes/No when Status=Categorized and Date categorized <= SLA due date');
  }
  return db;
}

async function createExecutionPlanDatabase(forecast) {
  console.log('Creating DSAT Execution Plan database...');
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
    title: [{ type: 'text', text: { content: 'DSAT Execution Plan' } }],
    description: [{ type: 'text', text: { content: 'Project plan with setup tasks and key forecast dates' } }],
    properties: {
      'Task': { title: {} },
      'Type': {
        select: {
          options: [
            { name: 'Setup', color: 'orange' },
            { name: 'Milestone', color: 'purple' },
            { name: 'Ongoing', color: 'blue' },
          ],
        },
      },
      'Duration': { rich_text: {} },
      'Start': { date: {} },
      'End': { date: {} },
      'Depends on': { rich_text: {} },
      'Status': {
        select: {
          options: [
            { name: 'Not started', color: 'gray' },
            { name: 'In progress', color: 'yellow' },
            { name: 'Complete', color: 'green' },
          ],
        },
      },
      'Notes': { rich_text: {} },
    },
  });

  // Add setup tasks and milestones
  const tasks = [
    { task: 'Create DSAT taxonomy (categories + definitions)', type: 'Setup', duration: '2 business days', dependsOn: '—', notes: 'Business days only' },
    { task: 'Build Notion DSAT Intake database', type: 'Setup', duration: '1 business day', dependsOn: 'Taxonomy', notes: 'After taxonomy' },
    { task: 'CX Operations Manager review + approval', type: 'Setup', duration: '2 business days', dependsOn: 'Build', notes: 'After build' },
    { task: 'Setup complete — first day categorization can begin', type: 'Milestone', duration: '—', dependsOn: 'All setup', notes: forecast.setupCompleteDate },
    { task: 'Backlog zero — all DSATs categorized', type: 'Milestone', duration: '—', dependsOn: 'Categorization', notes: forecast.backlogZeroDate },
    { task: 'SLA sustainable — 2-business-day SLA met consistently', type: 'Milestone', duration: '—', dependsOn: 'Backlog zero', notes: forecast.slaSustainableDate },
    { task: 'Ongoing categorization (72/day capacity)', type: 'Ongoing', duration: 'Ongoing', dependsOn: '—', notes: 'Mon–Fri only' },
  ];

  for (const t of tasks) {
    await notion.pages.create({
      parent: { database_id: db.id },
      properties: {
        'Task': { title: [{ type: 'text', text: { content: t.task } }] },
        'Type': { select: { name: t.type } },
        'Duration': { rich_text: [{ type: 'text', text: { content: t.duration } }] },
        'Depends on': { rich_text: [{ type: 'text', text: { content: t.dependsOn } }] },
        'Notes': { rich_text: [{ type: 'text', text: { content: t.notes } }] },
        'Status': { select: { name: 'Not started' } },
      },
    });
  }
  console.log('  Created with', tasks.length, 'tasks');
  return db;
}

async function populateTaxonomy(taxonomyDbId) {
  console.log('Populating Taxonomy with categories...');
  for (const cat of TAXONOMY_CATEGORIES) {
    await notion.pages.create({
      parent: { database_id: taxonomyDbId },
      properties: {
        'Category': { title: [{ type: 'text', text: { content: cat.name } }] },
        'Definition': { rich_text: [{ type: 'text', text: { content: cat.definition } }] },
      },
    });
  }
  console.log('  Added', TAXONOMY_CATEGORIES.length, 'categories');
}

async function createCapacityForecastBlock(parentPageId, forecast) {
  // Create a child page for Capacity + Forecast
  const page = await notion.pages.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: 'Capacity + Forecast' } }],
    children: [
      {
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: 'Key Dates' } }] },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: 'Setup complete (first day categorization can begin): ' + forecast.setupCompleteDate } }],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: 'Backlog zero: ' + forecast.backlogZeroDate } }],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: 'SLA sustainable: ' + forecast.slaSustainableDate } }],
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
          rich_text: [{ type: 'text', text: { content: 'Start date: ' + forecast.startDate } }],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: 'Initial backlog: 471 DSATs' } }],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: 'Arrivals: 18/day (Days 1–8), 12/day from Day 9 onward' } }],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: 'Capacity: 72 DSATs/day, weekdays only' } }],
        },
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: 'Backlog at start of categorization: ' + forecast.backlogAtStartOfCategorization } }],
        },
      },
    ],
  });
  console.log('  Created Capacity + Forecast page');
  return page;
}

async function main() {
  console.log('\n=== DSAT Operations Notion Setup ===\n');
  console.log('Parent page:', PARENT_PAGE_ID);

  const forecast = runForecast();
  console.log('\nForecast (used for Execution Plan):');
  console.log('  Setup complete:', forecast.setupCompleteDate);
  console.log('  Backlog zero:', forecast.backlogZeroDate);
  console.log('  SLA sustainable:', forecast.slaSustainableDate);
  console.log('');

  const taxonomy = await createTaxonomyDatabase();
  await populateTaxonomy(taxonomy.id);

  const intake = await createIntakeDatabase(taxonomy.id);
  await createExecutionPlanDatabase(forecast);
  await createCapacityForecastBlock(PARENT_PAGE_ID, forecast);

  console.log('\n✓ Setup complete. Share your Notion page with "anyone with the link" to submit.\n');
}

main().catch((err) => {
  console.error('Error:', err.message);
  if (err.code === 'object_not_found') {
    console.error('Ensure NOTION_PARENT_PAGE_ID is correct and the page is connected to your integration.');
  }
  process.exit(1);
});
