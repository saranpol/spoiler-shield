/**
 * Spoiler Shield — detection + masking tests.
 *
 * Tests the ACTUAL patterns and decision logic shipped in content/blocker.js.
 * The previous version of this file replicated a legacy pipeline built on
 * data/keywords.json, which blocker.js no longer uses — so it tested nothing
 * real. To prevent that drift from happening again, this harness extracts the
 * relevant sections of blocker.js source and evaluates them in-process:
 *
 *   1. The pattern block (SCORE_G, SCORE_X_G, SCORE_VS_G, OUTCOME_G, MATCHUP,
 *      SPORTS_FOOTBALL/SPORTS_PRO + buildSportsRegex)
 *   2. isDateLike() + hasRealScore() — the date/duration guards shared by
 *      masking and detection
 *   3. shieldTextNode() — the text masking logic (run against a fake node)
 *   4. The signal computation + isFull/isBlur decision inside shieldElement()
 *
 * If blocker.js is refactored and a marker disappears, the harness fails
 * loudly instead of silently testing stale logic.
 *
 * Not covered here (DOM-dependent, needs a browser): container discovery,
 * thumbnail blurring, the 3–2000 char length guards around shieldElement,
 * scan scheduling, and YouTube SPA handling.
 *
 * Run: node test-detection.js
 * Exit 0 = all expectations met. KNOWN-ISSUE tests document real shortcomings
 * of the shipped logic: they are expected to fail, don't affect the exit code,
 * and flip to a hard failure if they unexpectedly start passing (so the
 * markers stay honest).
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Extract the real detection code from content/blocker.js
// ---------------------------------------------------------------------------

const BLOCKER_PATH = path.join(__dirname, 'content', 'blocker.js');
const src = fs.readFileSync(BLOCKER_PATH, 'utf-8');

function mustFind(marker, from = 0) {
  const idx = src.indexOf(marker, from);
  if (idx === -1) {
    throw new Error(
      `Extraction marker not found in content/blocker.js: ${JSON.stringify(marker)}\n` +
      'blocker.js was probably refactored — update the markers in test-detection.js.'
    );
  }
  return idx;
}

// Extract `function name(...) {...}` by brace matching (regex literals in
// blocker.js only contain balanced braces like {1,2}, so counting works).
function extractFunction(name) {
  const start = mustFind('function ' + name);
  const open = src.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`Unbalanced braces while extracting function ${name} from blocker.js`);
}

// 1. Pattern definitions: SCORE_G ... let SPORTS = buildSportsRegex(tier);
const patternsStart = mustFind('// --- Patterns ---');
const patternsEndMarker = 'let SPORTS = buildSportsRegex(tier);';
const patternsEnd = mustFind(patternsEndMarker) + patternsEndMarker.length;
const patternsSrc = src.slice(patternsStart, patternsEnd);

// 2. Pure helpers
const isDateLikeSrc = extractFunction('isDateLike');
const hasRealScoreSrc = extractFunction('hasRealScore');
const shieldTextNodeSrc = extractFunction('shieldTextNode');

// 3. Signal computation + isFull/isBlur decision from inside shieldElement().
//    Starts at the score signal, ends after the isBlur declaration —
//    everything in between is pure text logic (no DOM access).
const shieldElementStart = mustFind('function shieldElement');
const decisionStart = mustFind('const hasScore', shieldElementStart);
const isBlurStart = mustFind('const isBlur', decisionStart);
const decisionEnd = mustFind(';', isBlurStart) + 1;
const decisionSrc = src.slice(decisionStart, decisionEnd);

const lib = new Function(`
  ${patternsSrc}

  ${isDateLikeSrc}

  ${hasRealScoreSrc}

  let originals = new Map();

  ${shieldTextNodeSrc}

  // shieldElement()'s signal + decision logic, lifted verbatim (DOM parts excluded)
  function analyze(fullText) {
    ${decisionSrc}
    return { hasScore, hasOutcome, hasMatchup, hasContext, signals, strongSignals, isFull, isBlur };
  }

  // shieldTextNode() against a fake text node. inSportsContainer simulates the
  // node living inside a confirmed [data-ss="1"] sports container, which
  // enables the extra masking rules (team-digit pairs, hype words, emojis...).
  function maskText(text, { inSportsContainer = false } = {}) {
    originals = new Map();
    const node = {
      nodeValue: text,
      parentElement: inSportsContainer ? { closest: () => true } : null,
    };
    shieldTextNode(node);
    return node.nodeValue;
  }

  function setTier(t) { tier = t; SPORTS = buildSportsRegex(t); }

  return { analyze, maskText, setTier, buildSportsRegex };
`)();

const { analyze, maskText, setTier, buildSportsRegex } = lib;

// ---------------------------------------------------------------------------
// Tiny test framework
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
let known = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS   ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL   ${name}`);
    console.log(`         ${e.message}`);
  }
}

// Documents a real shortcoming of the shipped logic: the assertion states the
// DESIRED behavior and is expected to fail today. If blocker.js is improved
// and the assertion starts passing, the run fails so the marker gets removed.
function knownIssue(name, why, fn) {
  try {
    fn();
    failed++;
    console.log(`  XPASS  ${name}`);
    console.log(`         Marked as a known issue but now passes — blocker.js improved?`);
    console.log(`         Convert this knownIssue() into a regular test().`);
  } catch (e) {
    known++;
    console.log(`  KNOWN  ${name}`);
    console.log(`         ${why}`);
    console.log(`         Actual: ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function debugStr(a) {
  return `score=${a.hasScore} outcome=${a.hasOutcome} matchup=${a.hasMatchup} ` +
         `context=${a.hasContext} → full=${a.isFull} blur=${a.isBlur}`;
}

function assertDetected(title, { full } = {}) {
  const a = analyze(title);
  assert(a.isFull || a.isBlur, `expected detection, got: ${debugStr(a)}`);
  if (full === true) assert(a.isFull, `expected FULL, got: ${debugStr(a)}`);
  if (full === false) assert(!a.isFull && a.isBlur, `expected BLUR only, got: ${debugStr(a)}`);
  return a;
}

function assertNotDetected(title) {
  const a = analyze(title);
  assert(!a.isFull && !a.isBlur, `expected no detection, got: ${debugStr(a)}`);
  return a;
}

// ---------------------------------------------------------------------------
// SHOULD DETECT — full masking tier
// ---------------------------------------------------------------------------

console.log('\n=== SHOULD DETECT (full: text masked + blur) ===\n');

test('Outcome word + matchup: "ANOTHER Šeško Winner! 😍 | Man Utd v Palace | Highlights"', () => {
  const title = 'ANOTHER Šeško Winner! 😍 | Man Utd v Palace | Highlights';
  assertDetected(title, { full: true });
  const masked = maskText(title);
  assert(!masked.includes('Winner'), `"Winner" not masked: "${masked}"`);
  assert(masked.includes('🛡️'), `no shield in output: "${masked}"`);
});

test('Outcome word + matchup: "Defeat Away From Home | Newcastle v Man Utd"', () => {
  const title = 'Defeat Away From Home | Newcastle v Man Utd';
  assertDetected(title, { full: true });
  const masked = maskText(title);
  assert(!masked.includes('Defeat'), `"Defeat" not masked: "${masked}"`);
});

test('Score between team names: "A Classic Counterattack! 😍 Everton 0-1 Man Utd | Extended Highlights"', () => {
  const title = 'A Classic Counterattack! 😍 Everton 0-1 Man Utd | Extended Highlights';
  const a = assertDetected(title, { full: true });
  assert(a.hasScore, `expected hasScore: ${debugStr(a)}`);
  assert(a.hasMatchup, `expected implicit matchup (Team 0-1 Team): ${debugStr(a)}`);
  const masked = maskText(title);
  assert(!masked.includes('0-1'), `score not masked: "${masked}"`);
  assert(masked.includes('🛡️-🛡️'), `expected 🛡️-🛡️: "${masked}"`);
});

test('Thai: "ไฮไลท์ฟุตบอล ... หมอนทองวิทยา พบ อบจ.ชัยนาท" (context + พบ matchup)', () => {
  const title = 'ไฮไลท์ฟุตบอล Black Hunter High School 2026 สัปดาห์ที่ 1 : หมอนทองวิทยา พบ อบจ.ชัยนาท';
  const a = assertDetected(title, { full: true });
  assert(a.hasContext, `expected Thai sports context (ไฮไลท์/ฟุตบอล): ${debugStr(a)}`);
  assert(a.hasMatchup, `expected matchup via "พบ": ${debugStr(a)}`);
});

test('Score + outcome + competition: "Liverpool beat Chelsea 3-0 in Premier League"', () => {
  const title = 'Liverpool beat Chelsea 3-0 in Premier League';
  const a = assertDetected(title, { full: true });
  assert(a.hasScore && a.hasOutcome && a.hasContext, `expected all signals: ${debugStr(a)}`);
  const masked = maskText(title);
  assert(!masked.includes('beat'), `"beat" not masked: "${masked}"`);
  assert(!masked.includes('3-0'), `score not masked: "${masked}"`);
});

test('Spanish: "Resumen: Real Madrid 2-1 Barcelona | La Liga"', () => {
  const title = 'Resumen: Real Madrid 2-1 Barcelona | La Liga';
  assertDetected(title, { full: true });
  const masked = maskText(title);
  assert(!masked.includes('2-1'), `score not masked: "${masked}"`);
});

test('Japanese: "ハイライト：レアル・マドリード 対 バルセロナ" (context + 対 matchup)', () => {
  assertDetected('ハイライト：レアル・マドリード 対 バルセロナ', { full: true });
});

test('German: "Bayern Sieg gegen Dortmund | Bundesliga" (outcome + context)', () => {
  const title = 'Bayern Sieg gegen Dortmund | Bundesliga';
  const a = assertDetected(title, { full: true });
  assert(a.hasOutcome, `expected "Sieg" as outcome: ${debugStr(a)}`);
  const masked = maskText(title);
  assert(!masked.includes('Sieg'), `"Sieg" not masked: "${masked}"`);
});

test('Pro sports (trial tier): "Lakers vs Celtics | NBA Finals Highlights"', () => {
  assertDetected('Lakers vs Celtics | NBA Finals Highlights', { full: true });
});

test('Decisive outcome verb between names: "PSG thrashed Bayern Munich" → full', () => {
  const title = 'PSG thrashed Bayern Munich';
  const a = assertDetected(title, { full: true });
  assert(a.hasMatchup, `expected implicit matchup (Name thrashed Name): ${debugStr(a)}`);
  const masked = maskText(title);
  assert(!masked.includes('thrashed'), `"thrashed" not masked: "${masked}"`);
});

test('Spelled-out vs score: "Arsenal 3 vs 1 Chelsea" → full', () => {
  const title = 'Arsenal 3 vs 1 Chelsea';
  const a = assertDetected(title, { full: true });
  assert(a.hasScore, `expected hasScore: ${debugStr(a)}`);
  const masked = maskText(title);
  assert(!masked.includes('3 vs 1'), `score not masked: "${masked}"`);
});

// ---------------------------------------------------------------------------
// SHOULD DETECT — blur-only tier
// ---------------------------------------------------------------------------

console.log('\n=== SHOULD DETECT (blur only: thumbnail hidden, text kept) ===\n');

test('Matchup alone: "Arsenal vs Chelsea" → blur, not full', () => {
  assertDetected('Arsenal vs Chelsea', { full: false });
});

test('Context alone: "Premier League action tonight" → blur, not full', () => {
  assertDetected('Premier League action tonight', { full: false });
});

test('Decisive outcome word alone: "Humiliated Again At Home" → blur, not full', () => {
  // No matchup (verb not between two names), but a word this loaded is a
  // near-certain result spoiler — over-blurring beats leaking.
  assertDetected('Humiliated Again At Home', { full: false });
});

test('Tier gating: NBA matchup is full on trial, blur-only on free (football-only patterns)', () => {
  // No "Highlights" here — that word is a football-tier context pattern.
  const title = 'Lakers vs Celtics | NBA Finals';
  try {
    setTier('free');
    const a = analyze(title);
    assert(!a.hasContext, `free tier should not match NBA context: ${debugStr(a)}`);
    assertEqual(a.isFull, false, 'isFull on free tier');
    assertEqual(a.isBlur, true, 'isBlur on free tier (matchup alone)');
  } finally {
    setTier('trial');
  }
  assertDetected(title, { full: true });
  assert(buildSportsRegex('trial').test('NBA Finals'), 'trial regex should match NBA');
  assert(!buildSportsRegex('free').test('NBA Finals'), 'free regex should not match NBA');
  assert(buildSportsRegex('free').test('Premier League'), 'free regex should match football');
});

// ---------------------------------------------------------------------------
// SHOULD NOT DETECT
// ---------------------------------------------------------------------------

console.log('\n=== SHOULD NOT DETECT ===\n');

test('Coaching video: "The Art of Body Feint by Coach Ahmadreza | 11-Year-Old Barcelona Academy Player"', () => {
  assertNotDetected('The Art of Body Feint by Coach Ahmadreza | 11-Year-Old Barcelona Academy Player');
});

test('Generic title: "Playing With Time"', () => {
  assertNotDetected('Playing With Time');
});

test('Outcome word in non-sports context: "How to win at chess"', () => {
  assertNotDetected('How to win at chess');
});

test('Bare score, no surrounding words: "10-4 good buddy"', () => {
  assertNotDetected('10-4 good buddy');
});

test('Date: "Event on 3-2-26"', () => {
  assertNotDetected('Event on 3-2-26');
});

test('Training drill: "Coach Kompany pushes squad in 2 vs 2 drills | FC Bayern Training"', () => {
  // "2 vs 2" is one token — it must not count as score AND matchup at once.
  assertNotDetected('Coach Kompany pushes squad in 2 vs 2 drills | FC Bayern Training');
});

test('Clock time: "My Morning Routine 5:30 AM"', () => {
  // The duration guard (":" + 2-digit right side) applies at detection too,
  // and "Routine" is not an outcome word.
  assertNotDetected('My Morning Routine 5:30 AM');
});

// ---------------------------------------------------------------------------
// MASKING GUARDS (shieldTextNode)
// ---------------------------------------------------------------------------

console.log('\n=== MASKING ===\n');

test('Duration guard: "5:30" and "2:11" are never masked (2-digit seconds)', () => {
  assertEqual(maskText('Wake up at 5:30 AM every day'), 'Wake up at 5:30 AM every day', 'masked');
  assertEqual(maskText('Watch until 2:11 for it'), 'Watch until 2:11 for it', 'masked');
});

test('"Routine" is not an outcome word (rout/routed only): text untouched', () => {
  assertEqual(maskText('My Morning Routine 5:30 AM'), 'My Morning Routine 5:30 AM', 'masked');
  assertEqual(maskText('PSG routed Bayern'), 'PSG 🛡️ Bayern', 'routed still masked');
});

test('Date guard: "Event on 3-2-26" untouched even inside a sports container', () => {
  assertEqual(
    maskText('Event on 3-2-26', { inSportsContainer: true }),
    'Event on 3-2-26',
    'masked'
  );
});

test('Big-number guard: "Patriots 20-13 Jets" text kept (scores >15 skipped)', () => {
  // Detection still fires (real sports title) — protection is blur, not text masking.
  assertDetected('Patriots 20-13 Jets', { full: true });
  assertEqual(maskText('Patriots 20-13 Jets'), 'Patriots 20-13 Jets', 'masked');
});

test('"x" score format: "Brasil 3 x 1 Argentina" → "🛡️ x 🛡️"', () => {
  assertDetected('Brasil 3 x 1 Argentina', { full: true });
  const masked = maskText('Brasil 3 x 1 Argentina');
  assert(masked.includes('🛡️ x 🛡️'), `expected shielded x-score: "${masked}"`);
});

test('Thai outcome + score: "ลิเวอร์พูล ชนะ เชลซี 2-0" fully masked', () => {
  const masked = maskText('ลิเวอร์พูล ชนะ เชลซี 2-0');
  assert(!masked.includes('ชนะ'), `"ชนะ" not masked: "${masked}"`);
  assert(!masked.includes('2-0'), `score not masked: "${masked}"`);
});

test('Container-only rule: "Chelsea 0 Newcastle United 1" masked inside container only', () => {
  const title = 'Chelsea 0 Newcastle United 1';
  assertEqual(maskText(title), title, 'outside container');
  assertEqual(
    maskText(title, { inSportsContainer: true }),
    'Chelsea 🛡️ Newcastle United 🛡️',
    'inside container'
  );
});

test('Container-only rule: hype words + sentiment emoji stripped inside container only', () => {
  const title = 'ANOTHER Šeško Winner! 😍';
  const outside = maskText(title);
  assert(outside.includes('ANOTHER'), `"ANOTHER" should survive outside container: "${outside}"`);
  assert(!outside.includes('Winner'), `"Winner" should always be masked: "${outside}"`);
  const inside = maskText(title, { inSportsContainer: true });
  assert(!inside.includes('ANOTHER'), `"ANOTHER" not masked in container: "${inside}"`);
  assert(!inside.includes('😍'), `emoji not stripped in container: "${inside}"`);
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n========================================');
console.log(`  TOTAL: ${passed + failed + known}  |  PASSED: ${passed}  |  FAILED: ${failed}  |  KNOWN ISSUES: ${known}`);
console.log('========================================\n');

if (failed > 0) {
  console.log('Unexpected failures — see above.\n');
  process.exit(1);
}
process.exit(0);
