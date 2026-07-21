document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('versionLabel').textContent = 'v' + chrome.runtime.getManifest().version;
  const toggle = document.getElementById('masterToggle');
  const badge = document.getElementById('statusBadge');
  const desc = document.getElementById('description');
  const tierBanner = document.getElementById('tierBanner');
  const tierIcon = document.getElementById('tierIcon');
  const tierLabel = document.getElementById('tierLabel');
  const tierDays = document.getElementById('tierDays');
  const trialProgress = document.getElementById('trialProgress');
  const trialBar = document.getElementById('trialBar');
  const paidBadge = document.getElementById('paidBadge');
  const upgradeBtn = document.getElementById('upgradeBtn');
  const keepBtn = document.getElementById('keepBtn');
  const siteRow = document.getElementById('siteRow');
  const siteHostEl = document.getElementById('siteHost');
  const siteBtn = document.getElementById('siteBtn');
  const shortcutHint = document.getElementById('shortcutHint');

  const TRIAL_DAYS = 14;

  const stored = await chrome.storage.local.get(['enabled', 'tier', 'disabledSites']);
  const syncData = await chrome.storage.sync.get(['installDate']);
  let enabled = stored.enabled !== false;
  let tier = stored.tier || 'trial';
  let disabledSites = Array.isArray(stored.disabledSites) ? stored.disabledSites : [];
  let installDate = syncData.installDate || Date.now();

  // Current tab hostname (activeTab permission is granted when the popup opens)
  let siteHost = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // Normalized to match content-script matching (www.espn.com === espn.com)
    if (tab && tab.url && /^https?:/i.test(tab.url)) siteHost = new URL(tab.url).hostname.replace(/^www\./, '');
  } catch (e) { /* no active tab access — hide the site row */ }

  function daysLeft() {
    const elapsed = Date.now() - installDate;
    return Math.max(0, TRIAL_DAYS - Math.floor(elapsed / (24 * 60 * 60 * 1000)));
  }

  function updateUI() {
    // Toggle state
    toggle.checked = enabled;
    toggle.disabled = false;
    badge.textContent = enabled ? 'Active' : 'Off';
    badge.className = 'badge ' + (enabled ? 'active' : 'inactive');

    // Tier UI — reset all
    paidBadge.style.display = 'none';
    upgradeBtn.style.display = 'none';
    keepBtn.style.display = 'none';
    tierBanner.style.display = 'none';
    trialProgress.style.display = 'none';
    keepBtn.classList.remove('urgent');
    tierDays.classList.remove('urgent');
    shortcutHint.style.display = '';

    if (tier === 'pro') {
      // Paid user — just a ✓ and clean message
      paidBadge.style.display = 'inline';
      desc.textContent = enabled
        ? 'All sports scores & spoilers are hidden across all websites.'
        : 'Protection is disabled. Spoilers may be visible.';
    } else if (tier === 'trial') {
      // Free trial — full features, countdown
      const days = daysLeft();
      tierBanner.style.display = 'block';
      tierBanner.className = 'tier-banner trial';
      tierIcon.textContent = '\u{1F6E1}\u{FE0F}';
      tierLabel.textContent = 'Free Trial';
      tierDays.textContent = days + ' day' + (days !== 1 ? 's' : '') + ' left';
      trialProgress.style.display = 'block';
      const pct = Math.max(0, Math.min(100, (days / TRIAL_DAYS) * 100));
      trialBar.style.width = pct + '%';
      // Subtle "keep it" button — can pay anytime
      keepBtn.style.display = 'block';
      // Last 3 days: turn up the urgency
      if (days <= 3) {
        tierDays.classList.add('urgent');
        keepBtn.classList.add('urgent');
      }
      desc.textContent = enabled
        ? 'All sports protected. Free for ' + days + ' more days.'
        : 'Protection is disabled. Spoilers may be visible.';
    } else {
      // Trial expired — fully disabled, must pay to use
      tierBanner.style.display = 'block';
      tierBanner.className = 'tier-banner free';
      tierIcon.textContent = '\u{1F512}';
      tierLabel.textContent = 'Trial Ended';
      tierDays.textContent = 'Upgrade to continue';
      upgradeBtn.style.display = 'block';
      // Force toggle off — but leave it clickable: the change handler
      // intercepts the click and opens the payment page (upgrade nudge)
      toggle.checked = false;
      badge.textContent = 'Off';
      badge.className = 'badge inactive';
      desc.textContent = 'Your free trial has ended. Upgrade to keep your sports spoiler-free.';
      // Alt+S is deliberately inert in this tier — don't advertise it
      shortcutHint.style.display = 'none';
    }

    // Per-site pause row — only for active tiers on regular web pages
    if (siteHost && tier !== 'free' && enabled) {
      siteRow.style.display = 'flex';
      const paused = disabledSites.includes(siteHost);
      siteHostEl.textContent = siteHost;
      siteHostEl.classList.toggle('paused', paused);
      siteBtn.textContent = paused ? 'Resume' : 'Pause here';
      siteBtn.classList.toggle('paused', paused);
    } else {
      siteRow.style.display = 'none';
    }
  }

  toggle.addEventListener('change', () => {
    // Block enabling if trial expired
    if (tier === 'free' && toggle.checked) {
      toggle.checked = false;
      const extpay = ExtPay('spoiler-shield');
      extpay.openPaymentPage();
      return;
    }
    enabled = toggle.checked;
    chrome.storage.local.set({ enabled });
    updateUI();
  });

  siteBtn.addEventListener('click', () => {
    if (!siteHost) return;
    if (disabledSites.includes(siteHost)) {
      disabledSites = disabledSites.filter(h => h !== siteHost);
    } else {
      disabledSites = [...disabledSites, siteHost];
    }
    chrome.storage.local.set({ disabledSites });
    updateUI();
  });

  upgradeBtn.addEventListener('click', () => {
    const extpay = ExtPay('spoiler-shield');
    extpay.openPaymentPage();
  });

  keepBtn.addEventListener('click', () => {
    const extpay = ExtPay('spoiler-shield');
    extpay.openPaymentPage();
  });

  updateUI();
});
