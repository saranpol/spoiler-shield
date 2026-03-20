// Spoiler Shield - Background Service Worker

importScripts('../ExtPay.js');
const extpay = ExtPay('spoiler-shield');
extpay.startBackground();

const TRIAL_DAYS = 14;
const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

// --- Tier computation ---

async function computeTier() {
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

  // Trial expired
  if (localData.tier !== 'free') await chrome.storage.local.set({ tier: 'free' });
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
    await computeTier();
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

extpay.onPaid.addListener(async (user) => {
  await chrome.storage.sync.set({ proUnlockedAt: Date.now() });
  await chrome.storage.local.set({ tier: 'pro' });
  updateBadge();
});

// Also check ExtPay user status on every service worker wake
extpay.getUser().then(async (user) => {
  if (user.paid) {
    const syncData = await chrome.storage.sync.get(['proUnlockedAt']);
    if (!syncData.proUnlockedAt) {
      await chrome.storage.sync.set({ proUnlockedAt: Date.now() });
      await chrome.storage.local.set({ tier: 'pro' });
    }
  }
}).catch(() => {}); // silently fail if offline

// --- Hourly alarm to check trial expiry ---

chrome.alarms.create('checkTrial', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkTrial') computeTier();
});

// --- Compute tier on every service worker wake ---
computeTier();

// --- Alt+S keyboard shortcut toggle ---

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-shield') {
    const stored = await chrome.storage.local.get(['enabled']);
    const newValue = stored.enabled === false;
    await chrome.storage.local.set({ enabled: newValue });
  }
});

// --- Badge: show ON/OFF state + tier ---

async function updateBadge() {
  const { enabled, tier } = await chrome.storage.local.get(['enabled', 'tier']);
  const on = enabled !== false;

  if (!on) {
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
    // Trial — clean badge
    chrome.action.setBadgeText({ text: '' });
  }
}

// Sync badge on startup
updateBadge();

// Sync badge when storage changes
chrome.storage.onChanged.addListener(() => updateBadge());
