// Spoiler Shield - Background Service Worker

importScripts('../ExtPay.js');
const extpay = ExtPay('spoiler-shield');
extpay.startBackground();

const TRIAL_DAYS = 14;
const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;
const UNINSTALL_URL = 'https://saranpol.github.io/spoiler-shield/uninstall.html';

chrome.runtime.setUninstallURL(UNINSTALL_URL);

// --- Tier computation ---

// Dedupe concurrent invocations: on SW wake the top-level call runs alongside
// whichever event handler woke us (onInstalled / onAlarm), and the
// expiredPageShown check-then-set below is not atomic across two invocations
let tierPromise = null;
function computeTier() {
  if (!tierPromise) {
    tierPromise = computeTierImpl().finally(() => { tierPromise = null; });
  }
  return tierPromise;
}

async function computeTierImpl() {
  // installDate stored in sync (survives uninstall if user is signed into Chrome)
  const syncData = await chrome.storage.sync.get(['installDate', 'proUnlockedAt']);
  const localData = await chrome.storage.local.get(['tier']);

  // PRO user — never expires
  if (syncData.proUnlockedAt) {
    if (localData.tier !== 'pro') await chrome.storage.local.set({ tier: 'pro' });
    return 'pro';
  }

  // No install date — first install ever
  if (!syncData.installDate) {
    await chrome.storage.sync.set({ installDate: Date.now(), proUnlockedAt: null });
    await chrome.storage.local.set({ tier: 'trial' });
    return 'trial';
  }

  const elapsed = Date.now() - syncData.installDate;

  if (elapsed < TRIAL_MS) {
    if (localData.tier !== 'trial') await chrome.storage.local.set({ tier: 'trial' });
    return 'trial';
  }

  // Trial expired — force disable protection
  const wasAlreadyFree = localData.tier === 'free';
  await chrome.storage.local.set({ tier: 'free', enabled: false });
  // Open the "trial ended" pitch page exactly once, and only on the actual
  // trial→free transition (not for users who expired before this version —
  // popping a paywall tab at browser startup would read as an ambush)
  const { expiredPageShown } = await chrome.storage.local.get(['expiredPageShown']);
  if (!expiredPageShown) {
    await chrome.storage.local.set({ expiredPageShown: true });
    if (!wasAlreadyFree) {
      chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/expired.html') });
    }
  }
  return 'free';
}

// --- Install / Update ---

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Check sync first — user may have installed before (reinstall)
    const syncData = await chrome.storage.sync.get(['installDate']);
    if (!syncData.installDate) {
      // Truly first install — start trial
      await chrome.storage.sync.set({ installDate: Date.now(), proUnlockedAt: null });
    }
    await chrome.storage.local.set({ enabled: true });
    const tier = await computeTier();
    // Onboarding page once per install, and only while a trial is running
    // (welcomeShown lives in local storage, so the top-level computeTier()
    // racing us on installDate can't suppress the page)
    const { welcomeShown } = await chrome.storage.local.get(['welcomeShown']);
    if (!welcomeShown && tier === 'trial') {
      await chrome.storage.local.set({ welcomeShown: true });
      chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/welcome.html') });
    }
  } else if (details.reason === 'update') {
    // Migrate: if installDate was in local but not sync, move it
    const syncData = await chrome.storage.sync.get(['installDate']);
    if (!syncData.installDate) {
      const localData = await chrome.storage.local.get(['installDate']);
      if (localData.installDate) {
        await chrome.storage.sync.set({ installDate: localData.installDate, proUnlockedAt: null });
      }
    }
    await computeTier();
  }
});

// --- ExtPay: listen for payment ---

// ExtPay can fire paid callbacks twice on one wake (two concurrent fetch_user
// calls) — synchronous module flag makes the thanks tab one-shot
let thanksOpened = false;
extpay.onPaid.addListener(async (user) => {
  const firstFire = !thanksOpened;
  thanksOpened = true;
  await chrome.storage.sync.set({ proUnlockedAt: Date.now() });
  // Re-enable protection immediately (it was forced off if the trial had expired)
  await chrome.storage.local.set({ tier: 'pro', enabled: true });
  updateBadge();
  if (firstFire) {
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/thanks.html') });
  }
});

// Also check ExtPay user status on every service worker wake
extpay.getUser().then(async (user) => {
  if (user.paid) {
    const syncData = await chrome.storage.sync.get(['proUnlockedAt']);
    if (!syncData.proUnlockedAt) {
      // Restored purchase (e.g. reinstall) — unlock quietly, no thanks page
      await chrome.storage.sync.set({ proUnlockedAt: Date.now() });
      await chrome.storage.local.set({ tier: 'pro', enabled: true });
    }
  }
}).catch(() => {}); // silently fail if offline

// --- Hourly alarm to check trial expiry ---

chrome.alarms.create('checkTrial', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkTrial') {
    computeTier().then(updateBadge);
  }
});

// --- Compute tier on every service worker wake ---
computeTier().then(updateBadge);

// --- Alt+S keyboard shortcut toggle ---

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-shield') return;
  const stored = await chrome.storage.local.get(['enabled', 'tier']);
  // Trial expired — shield can't be re-enabled from the shortcut
  if (stored.tier === 'free') return;
  await chrome.storage.local.set({ enabled: stored.enabled === false });
});

// --- Badge: show ON/OFF state + tier ---

async function trialDaysLeft() {
  const { installDate } = await chrome.storage.sync.get(['installDate']);
  if (!installDate) return TRIAL_DAYS;
  const elapsed = Date.now() - installDate;
  return Math.max(0, TRIAL_DAYS - Math.floor(elapsed / (24 * 60 * 60 * 1000)));
}

async function updateBadge() {
  const { enabled, tier } = await chrome.storage.local.get(['enabled', 'tier']);
  const on = enabled !== false;

  if (!on && tier !== 'free') {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#999' });
  } else if (tier === 'pro') {
    // Paid — clean, no badge needed
    chrome.action.setBadgeText({ text: '' });
  } else if (tier === 'free') {
    // Trial expired — nudge
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' });
  } else {
    // Trial — countdown badge for the last 3 days, otherwise clean
    const days = await trialDaysLeft();
    if (days <= 3) {
      chrome.action.setBadgeText({ text: days + 'd' });
      chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }
}

// Sync badge on startup
updateBadge();

// Sync badge when storage changes
chrome.storage.onChanged.addListener(() => updateBadge());
