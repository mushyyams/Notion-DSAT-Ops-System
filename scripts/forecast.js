#!/usr/bin/env node
/**
 * DSAT Backlog Forecast Calculator
 * Computes: Setup complete date, Backlog zero date, SLA sustainable date
 * Per PROJECT_REFERENCE.md
 */

const START_DATE = process.env.START_DATE 
  ? new Date(process.env.START_DATE) 
  : new Date(); // Today

const INITIAL_BACKLOG = 471;
const ARRIVALS_DAYS_1_8 = 18;
const ARRIVALS_DAY_9_PLUS = 12;
const CAPACITY_PER_DAY = 72;
const SETUP_BUSINESS_DAYS = 5;

function isBusinessDay(date) {
  const day = date.getDay(); // 0=Sun, 6=Sat
  return day >= 1 && day <= 5;
}

function addBusinessDays(fromDate, count) {
  const result = new Date(fromDate);
  let added = 0;
  while (added < count) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) added++;
  }
  return result;
}

function getFirstBusinessDayOnOrAfter(date) {
  const result = new Date(date);
  while (!isBusinessDay(result)) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

function getArrivalsForDay(dayNumber) {
  return dayNumber <= 8 ? ARRIVALS_DAYS_1_8 : ARRIVALS_DAY_9_PLUS;
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

function runForecast() {
  const startDate = new Date(START_DATE);
  startDate.setHours(0, 0, 0, 0);

  // Step 1: First business day and setup completion
  const firstWorkDay = getFirstBusinessDayOnOrAfter(startDate);
  const setupCompleteDate = addBusinessDays(firstWorkDay, SETUP_BUSINESS_DAYS);

  // Step 2: Backlog when categorization starts
  let backlogAtStart = INITIAL_BACKLOG;
  const dayOne = new Date(startDate);
  let current = new Date(dayOne);

  while (current < setupCompleteDate) {
    const dayNum = Math.floor((current - dayOne) / (24 * 60 * 60 * 1000)) + 1;
    backlogAtStart += getArrivalsForDay(dayNum);
    current.setDate(current.getDate() + 1);
  }

  // Step 3: Burn-down simulation
  let backlog = backlogAtStart;
  let currentDate = new Date(setupCompleteDate);
  let backlogZeroDate = null;

  while (backlog > 0) {
    const dayNum = Math.floor((currentDate - dayOne) / (24 * 60 * 60 * 1000)) + 1;
    const arrivals = getArrivalsForDay(dayNum);
    backlog += arrivals;

    if (isBusinessDay(currentDate)) {
      const processed = Math.min(CAPACITY_PER_DAY, backlog);
      backlog -= processed;
      if (backlog <= 0) {
        backlogZeroDate = new Date(currentDate);
        break;
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Step 4: SLA sustainable = same as or day after backlog zero
  const slaSustainableDate = backlogZeroDate
    ? new Date(backlogZeroDate)
    : null;

  // Step 5: Build auditable day-by-day schedule (Day 1 through backlog zero + 2 days)
  const dailySchedule = [];
  const endDate = new Date(backlogZeroDate || setupCompleteDate);
  endDate.setDate(endDate.getDate() + 2);

  let runningBacklog = INITIAL_BACKLOG;
  let dayNum = 0;
  let scheduleDate = new Date(dayOne);

  while (scheduleDate <= endDate) {
    dayNum++;
    const arrivals = getArrivalsForDay(dayNum);
    const businessDay = isBusinessDay(scheduleDate);
    const capacity = businessDay && scheduleDate >= setupCompleteDate ? CAPACITY_PER_DAY : 0;
    const processed = capacity > 0 ? Math.min(capacity, runningBacklog) : 0;

    runningBacklog += arrivals;
    if (processed > 0) runningBacklog -= processed;

    dailySchedule.push({
      date: formatDate(scheduleDate),
      dayNumber: dayNum,
      businessDay,
      arrivals,
      capacity,
      processed,
      runningBacklog,
    });

    scheduleDate.setDate(scheduleDate.getDate() + 1);
  }

  return {
    startDate: formatDate(startDate),
    firstWorkDay: formatDate(firstWorkDay),
    setupCompleteDate: formatDate(setupCompleteDate),
    backlogAtStartOfCategorization: backlogAtStart,
    backlogZeroDate: backlogZeroDate ? formatDate(backlogZeroDate) : null,
    slaSustainableDate: slaSustainableDate ? formatDate(slaSustainableDate) : null,
    dailySchedule,
  };
}

// Run and output
const result = runForecast();
console.log('\n=== DSAT Forecast Results ===\n');
console.log('Start Date:                    ', result.startDate);
console.log('First Business Day:            ', result.firstWorkDay);
console.log('Setup Complete (categorization can begin):', result.setupCompleteDate);
console.log('Backlog at Start of Categorization:', result.backlogAtStartOfCategorization);
console.log('Backlog Zero Date:             ', result.backlogZeroDate);
console.log('SLA Sustainable Date:          ', result.slaSustainableDate);
console.log('\n');

// Export for use by notion-setup
export { runForecast, formatDate };
