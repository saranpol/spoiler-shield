/**
 * Comprehensive test for Spoiler Shield detection + masking pipeline.
 * Run: node test-detection.js
 */

const fs = require('fs');

// Load keywords
const keywords = JSON.parse(fs.readFileSync('./data/keywords.json', 'utf-8'));

// --- Replicate compileRegexes() from blocker.js ---
const scoreRegexes = keywords.scorePatterns.map(p => new RegExp(p, 'gi'));

const matchIndicatorRegex = new RegExp(
  keywords.matchIndicators.join('|'), 'i'
);

const spoilerWordRegex = new RegExp(
  '(?:^|[\\s|,.:!?()\\[\\]–—-])(' +
  keywords.spoilerWords.join('|') +
  ')(?=$|[\\s|,.:!?()\\[\\]–—-])', 'gi'
);

const vsConnectorRegex = new RegExp(
  keywords.vsConnectors.join('|'), 'i'
);

const competitionRegex = new RegExp(
  keywords.competitions.join('|'), 'i'
);

// --- Structural patterns from blocker.js ---
const VS_MATCH_FORMAT = /[A-Za-z\u0E00-\u0E7F]{2,}.*\b(?:vs?\.?|versus)\b.*[A-Za-z\u0E00-\u0E7F]{2,}/i;
const ALLCAPS_PIPE = /^[A-Z][A-Z\s!]{3,}\s*\|/;
const COMMA_SCORE = /[A-Z\u0E00-\u0E7F][A-Za-z\u0E00-\u0E7F]+\s+\d{1,3}\s*[,\-–—]\s*[A-Z\u0E00-\u0E7F][A-Za-z\u0E00-\u0E7F]+\s+\d{1,3}/;
const BRACKET_MATCH = /\[\s*(?:post[- ]?match|match|pre[- ]?match|goal|score)\s*(?:thread|report|result|day)?\s*\]/i;
const DATE_PATTERN = /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b|\b\d{4}[\/-]\d{1,2}[\/-]\d{1,2}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{2,4}\b/gi;

// --- Replicate analyze() ---
function analyze(text) {
  if (!text) return { isSports: false, hasScore: false, hasSpoilerWord: false };

  const textForScore = text.replace(DATE_PATTERN, ' ');
  DATE_PATTERN.lastIndex = 0;
  const hasScore = scoreRegexes.some(r => { r.lastIndex = 0; return r.test(textForScore); });

  matchIndicatorRegex.lastIndex = 0;
  const hasMatchIndicator = matchIndicatorRegex.test(text);

  spoilerWordRegex.lastIndex = 0;
  const hasSpoilerWord = spoilerWordRegex.test(text);
  spoilerWordRegex.lastIndex = 0;

  vsConnectorRegex.lastIndex = 0;
  const hasVsConnector = vsConnectorRegex.test(text);

  competitionRegex.lastIndex = 0;
  const hasCompetition = competitionRegex.test(text);

  const hasVsMatchFormat = VS_MATCH_FORMAT.test(text);
  const hasAllCapsPipe = ALLCAPS_PIPE.test(text);
  const hasCommaScore = COMMA_SCORE.test(text);
  const hasBracketMatch = BRACKET_MATCH.test(text);

  let isSports = false;

  if (hasScore && (hasMatchIndicator || hasCompetition || hasSpoilerWord || hasVsConnector)) isSports = true;
  if (hasCompetition && (hasVsConnector || hasMatchIndicator || hasSpoilerWord)) isSports = true;
  if (hasMatchIndicator && (hasVsConnector || hasSpoilerWord)) isSports = true;
  if (hasVsConnector && hasSpoilerWord) isSports = true;

  if (hasVsMatchFormat && (hasScore || hasSpoilerWord || hasMatchIndicator || hasCompetition)) isSports = true;
  if (hasVsConnector && hasCompetition) isSports = true;
  if (hasAllCapsPipe && (hasScore || hasVsConnector || hasCompetition || hasSpoilerWord)) isSports = true;
  if (hasCommaScore && (hasMatchIndicator || hasCompetition || hasSpoilerWord || hasVsConnector || hasScore)) isSports = true;
  if (hasBracketMatch) isSports = true;

  return {
    isSports, hasScore, hasSpoilerWord,
    _debug: { hasMatchIndicator, hasVsConnector, hasCompetition, hasVsMatchFormat, hasAllCapsPipe, hasCommaScore, hasBracketMatch }
  };
}

// --- Replicate maskScores() ---
function maskScores(text) {
  let masked = text;
  for (const regex of scoreRegexes) {
    regex.lastIndex = 0;
    masked = masked.replace(regex, (match) => match.replace(/\d+/g, '\u{1F6E1}\uFE0F'));
  }
  return masked;
}

// --- Replicate maskSpoilerWords() ---
function maskSpoilerWords(text) {
  spoilerWordRegex.lastIndex = 0;
  return text.replace(spoilerWordRegex, (match, word) => {
    const prefix = match.substring(0, match.indexOf(word));
    return prefix + '\u{1F6E1}\uFE0F';
  });
}

// --- Full pipeline: analyze → conditionally mask ---
function fullPipeline(text) {
  const analysis = analyze(text);
  let masked = text;
  if (analysis.isSports) {
    if (analysis.hasScore) masked = maskScores(masked);
    if (analysis.hasSpoilerWord) masked = maskSpoilerWords(masked);
  }
  return { analysis, masked };
}

// ============================
// TEST CASES
// ============================

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${e.message}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

console.log('');
console.log('=== SHOULD DETECT AS SPORTS ===');
console.log('');

// Test 1
test('Man Utd v Palace - Winner detected', () => {
  const title = 'ANOTHER \u0160e\u0161ko Winner! \uD83D\uDE0D | Man Utd v Palace | Highlights';
  const { analysis, masked } = fullPipeline(title);
  assertEqual(analysis.isSports, true, 'isSports');
  assertEqual(analysis.hasSpoilerWord, true, 'hasSpoilerWord');
  // "Winner" should become shield
  if (!masked.includes('\u{1F6E1}\uFE0F')) throw new Error(`No shield in masked output: "${masked}"`);
  if (masked.includes('Winner')) throw new Error(`"Winner" was NOT masked: "${masked}"`);
  console.log(`        Masked: "${masked}"`);
});

// Test 2
test('Newcastle v Man Utd - Defeat detected', () => {
  const title = 'Defeat Away From Home | Newcastle v Man Utd';
  const { analysis, masked } = fullPipeline(title);
  assertEqual(analysis.isSports, true, 'isSports');
  assertEqual(analysis.hasSpoilerWord, true, 'hasSpoilerWord');
  if (masked.includes('Defeat')) throw new Error(`"Defeat" was NOT masked: "${masked}"`);
  console.log(`        Masked: "${masked}"`);
});

// Test 3
test('Everton 0-1 Man Utd - score masked', () => {
  const title = 'A Classic Counterattack! \uD83D\uDE0D Everton 0-1 Man Utd | Extended Highlights';
  const { analysis, masked } = fullPipeline(title);
  assertEqual(analysis.isSports, true, 'isSports');
  assertEqual(analysis.hasScore, true, 'hasScore');
  // "0-1" should become "🛡️-🛡️"
  if (masked.includes('0-1')) throw new Error(`Score "0-1" was NOT masked: "${masked}"`);
  if (!masked.includes('\u{1F6E1}\uFE0F-\u{1F6E1}\uFE0F')) throw new Error(`Expected shield-shield pattern not found: "${masked}"`);
  console.log(`        Masked: "${masked}"`);
});

// Test 4
test('Thai football highlights detected', () => {
  const title = '\u0E44\u0E2E\u0E44\u0E25\u0E17\u0E4C\u0E1F\u0E38\u0E15\u0E1A\u0E2D\u0E25 Black Hunter High School 2026 \u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C\u0E17\u0E35\u0E48 1 : \u0E2B\u0E21\u0E2D\u0E19\u0E17\u0E2D\u0E07\u0E27\u0E34\u0E17\u0E22\u0E32 \u0E1E\u0E1A \u0E2D\u0E1A\u0E08.\u0E0A\u0E31\u0E22\u0E19\u0E32\u0E17';
  const { analysis } = fullPipeline(title);
  assertEqual(analysis.isSports, true, 'isSports');
  console.log(`        Debug: ${JSON.stringify(analysis._debug)}`);
});

// Test 5
test('Liverpool beat Chelsea 3-0 - spoiler word + score masked', () => {
  const title = 'Liverpool beat Chelsea 3-0 in Premier League';
  const { analysis, masked } = fullPipeline(title);
  assertEqual(analysis.isSports, true, 'isSports');
  assertEqual(analysis.hasScore, true, 'hasScore');
  assertEqual(analysis.hasSpoilerWord, true, 'hasSpoilerWord');
  if (masked.includes('beat')) throw new Error(`"beat" was NOT masked: "${masked}"`);
  if (masked.includes('3-0')) throw new Error(`Score "3-0" was NOT masked: "${masked}"`);
  console.log(`        Masked: "${masked}"`);
});

// Test 6
test('PSG thrashed Bayern Munich - spoiler word masked', () => {
  const title = 'PSG thrashed Bayern Munich';
  const { analysis, masked } = fullPipeline(title);
  assertEqual(analysis.isSports, true, 'isSports');
  assertEqual(analysis.hasSpoilerWord, true, 'hasSpoilerWord');
  if (masked.includes('thrashed')) throw new Error(`"thrashed" was NOT masked: "${masked}"`);
  console.log(`        Masked: "${masked}"`);
});

console.log('');
console.log('=== SHOULD NOT DETECT AS SPORTS ===');
console.log('');

// Test 7
test('Coach training drill with 2 vs 2 - NOT sports result', () => {
  const title = 'Coach Kompany pushes squad in 2 vs 2 drills | FC Bayern Training';
  const { analysis } = fullPipeline(title);
  assertEqual(analysis.isSports, false, 'isSports');
  console.log(`        Debug: ${JSON.stringify(analysis._debug)}`);
});

// Test 8
test('Barcelona Academy coaching video - NOT sports result', () => {
  const title = 'The Art of Body Feint by Coach Ahmadreza | 11-Year-Old Barcelona Academy Player';
  const { analysis } = fullPipeline(title);
  assertEqual(analysis.isSports, false, 'isSports');
  console.log(`        Debug: ${JSON.stringify(analysis._debug)}`);
});

// Test 9
test('Playing With Time - NOT sports', () => {
  const title = 'Playing With Time';
  const { analysis } = fullPipeline(title);
  assertEqual(analysis.isSports, false, 'isSports');
});

// Test 10
test('My Morning Routine 5:30 AM - NOT sports', () => {
  const title = 'My Morning Routine 5:30 AM';
  const { analysis } = fullPipeline(title);
  assertEqual(analysis.isSports, false, 'isSports');
  console.log(`        Debug: ${JSON.stringify(analysis._debug)}`);
});

// Test 11
test('Event on 3-2-26 (date) - NOT sports', () => {
  const title = 'Event on 3-2-26';
  const { analysis } = fullPipeline(title);
  assertEqual(analysis.isSports, false, 'isSports');
  console.log(`        Debug: ${JSON.stringify(analysis._debug)}`);
});

// ============================
// SUMMARY
// ============================
console.log('');
console.log('========================================');
console.log(`  TOTAL: ${passed + failed}  |  PASSED: ${passed}  |  FAILED: ${failed}`);
console.log('========================================');
console.log('');

process.exit(failed > 0 ? 1 : 0);
