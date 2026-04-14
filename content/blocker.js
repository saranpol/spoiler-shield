/**
 * Spoiler Shield
 * Runs at document_start → hides page → scans as DOM appears → reveals
 * Toggle on/off takes effect instantly on the current page
 */
(async () => {
  // --- State ---
  let enabled = true;
  let processed = new WeakSet();
  let originals = new Map(); // TextNode → original nodeValue

  // --- Patterns ---

  // Scores: "3-1", "2:0", "1–1"
  const SCORE_G = /\b(\d{1,2})\s*([-–—:])\s*(\d{1,2})\b/g;
  // Scores: "3 x 1"
  const SCORE_X_G = /\b(\d{1,2})\s*(x)\s*(\d{1,2})\b/gi;
  // Scores: "1 vs 1", "2 v 0"
  const SCORE_VS_G = /\b(\d{1,2})\s*(vs?\.?)\s*(\d{1,2})\b/gi;

  // Outcome words (multi-language)
  const OUTCOME_G = new RegExp([
    // EN
    '\\b(?:winners?|wins?|won|victor(?:y|ious))\\b',
    '\\b(?:beats?|beaten)\\b',
    '\\b(?:loses?|lost|loss|loser)\\b',
    '\\b(?:draws?|drew|ties?|tied)\\b',
    '\\b(?:defeats?|defeated)\\b',
    '\\b(?:thrash\\w*|destroy\\w*|demolish\\w*|crush\\w*|humiliat\\w*)\\b',
    '\\b(?:rout\\w*|hammer\\w*|smash\\w*|wallop\\w*)\\b',
    '\\b(?:stun(?:ned|s|ning)?|upsets?|comeback)\\b',
    '\\b(?:dominat\\w*|outclass\\w*|outplay\\w*)\\b',
    '\\b(?:knock(?:ed)?\\s*out|eliminat\\w*|relegat\\w*)\\b',
    '\\b(?:clean\\s*sheet|shutout|hat[- ]?trick|brace|assists?)\\b',
    '\\b\\d+\\s*(?:goals?|assists?)\\b',
    '\\b(?:(?:all\\s+)?three\\s+\\w*\\s*points|one\\s+\\w*\\s*point|a\\s+point|no\\s+\\w*\\s*points?|full\\s+\\w*\\s*points)\\b',
    '\\b(?:[0-3]\\s+\\w*\\s*points?)\\b',
    // ES
    '\\b(?:victoria|ganar|gan[oó]|perder|perdi[oó]|empate|goleada|derrota|remontada)\\b',
    // PT
    '\\b(?:vit[oó]ria|vencer|venceu|perder|perdeu|empate|goleada|virada|derrota)\\b',
    // FR
    '\\b(?:victoire|gagner|perdre|d[eé]faite|nul|racl[eé]e|[eé]craser)\\b',
    // DE
    '\\b(?:Sieg|gewinnen|gewonnen|verlieren|verloren|Niederlage|Unentschieden|Kantersieg)\\b',
    // IT
    '\\b(?:vittoria|vincere|perdere|sconfitta|pareggio)\\b',
    // NL
    '\\b(?:winst|winnen|verliezen|verlies|nederlaag|gelijkspel)\\b',
    // TR
    '\\b(?:galibiyet|kazan\\w*|kaybetmek|ma[gğ]lubiyet|beraberlik)\\b',
    // ID
    '\\b(?:menang|kemenangan|kalah|kekalahan|seri|imbang)\\b',
    // AR
    'فوز', 'هزيمة', 'خسارة', 'تعادل', 'سحق',
    // JA
    '勝利', '敗北', '引き分け', '大勝', '大敗', '完勝', '圧勝', '逆転',
    // KO
    '승리', '패배', '무승부', '대승', '대패', '역전승',
    // ZH
    '胜', '负', '赢', '输', '平局', '大胜', '大败', '逆転',
    // TH
    'ชนะ', 'เอาชนะ', 'แพ้', 'พ่าย', 'พ่ายแพ้', 'เสมอ', 'เจ๊า',
    'ถล่ม', 'ถลุง', 'บุกอัด',
    'พลิก', 'พลิกแซง', 'พลิกล็อค', 'พลิกล็อก', 'ตกรอบ', 'ลิ่ว', 'ซิว',
    'สามแต้ม', 'แต้มเต็ม', 'หนึ่งแต้ม', 'ไม่ได้แต้ม', 'ไร้แต้ม',
    'เข้ารอบ',
    'โค่น', 'บดขยี้', 'ไล่เจ๊า', 'กู้หน้า',
    'ปิดเกม', 'พลิกเกม',
    'แอสซิสต์', 'แอสซิส', 'ฟอร์มแรง', 'ฟอร์มดี', 'ฟอร์มห่วย', 'ฟอร์มโหด',
    'ติดลมบน',
    'ยึดอันดับ', 'รั้งอันดับ', 'ขยับอันดับ', 'หล่นอันดับ', 'อันดับ\\s*\\d+',
    'ยึดที่', 'รั้งที่', 'ขยับที่', 'หล่นที่', 'ที่\\s*\\d+',
    'ต้องมาแล้ว',
    '\\d+\\s*แอสซิสต์', '\\d+\\s*ประตู', '\\d+\\s*ลูก',
    '\\d+แต้ม'
  ].join('|'), 'gi');

  // Matchup: "TeamA vs TeamB" — words on both sides of a versus-like connector
  // Matches: "Barcelona VS Real Madrid", "Liverpool v Arsenal", "แมนยู พบ ลิเวอร์พูล"
  const MATCHUP = new RegExp(
    '[A-Za-z\\u0E00-\\u0E7F\\u0600-\\u06FF\\u3000-\\u9FFF\\uAC00-\\uD7AF]\\S*' +
    '.*?' +
    '(?:\\bvs?\\.?\\b|\\bversus\\b|พบ|ดวล|เยือน|แข่ง|\\bcontra\\b|ضد|対|대)' +
    '.*?' +
    '[A-Za-z\\u0E00-\\u0E7F\\u0600-\\u06FF\\u3000-\\u9FFF\\uAC00-\\uD7AF]\\S*',
    'i'
  );

  // Sports context — split into FREE (football) and PRO (all other sports)
  const SPORTS_FOOTBALL = [
    // Generic match terms
    '\\bagainst\\b',
    '\\bhighlights?\\b', '\\bgoals?\\b', '\\bmatch\\b', '\\bderby\\b',
    '\\bscore[sd]?\\b', '\\bresults?\\b',
    '\\bfull[- ]?time\\b', '\\bhalf[- ]?time\\b', '\\bFT\\b', '\\bHT\\b',
    '\\bfootball\\b', '\\bsoccer\\b', '\\bpenalt(?:y|ies)\\b',
    '\\bcontra\\b', '\\bcontre\\b', '\\bgegen\\b',
    'ضد', '対', '대', 'เปิดบ้าน',
    // ES/PT/FR/DE/IT/NL/TR football terms
    '\\bresumen\\b', '\\bgoles?\\b', '\\bpartido\\b', '\\bf[uú]tbol\\b',
    '\\bgols?\\b', '\\bfutebol\\b', '\\br[eé]sum[eé]\\b', '\\bbuts?\\b',
    '\\bTore?\\b', '\\bSpiel\\b', '\\bFu[sß]ball\\b',
    '\\bpartita\\b', '\\bcalcio\\b', '\\bwedstrijd\\b', '\\bvoetbal\\b',
    '\\bma[cç]\\b', '\\bfutbol\\b',
    // AR/JA/KO/ZH
    'ملخص', 'مباراة', 'كرة\\s*القدم',
    'ハイライト', '試合', 'サッカー',
    '하이라이트', '경기', '축구',
    '集锦', '比赛', '足球',
    // TH
    'ไฮไลท์', 'ไฮไลต์', 'ผลบอล', 'สกอร์', 'ฟุตบอล', 'บอล', 'ประตู',
    'นัดชิง', 'ดาร์บี้', 'แต้ม', 'แข่งขัน',
    'สถิติ', 'วิเคราะห์', 'พรีวิว', 'ก่อนเกม', 'หลังเกม', 'สรุปผล',
    'รอบแบ่งกลุ่ม', 'รอบ\\s*\\d+', 'เลก', 'นัดที่',
    // Football leagues & competitions
    'Premier\\s*League', 'Champions\\s*League',
    'La\\s*Liga', 'Bundesliga', 'Serie\\s*A', 'Ligue\\s*1',
    'Eredivisie', 'FA\\s*Cup', 'World\\s*Cup', 'Europa\\s*League',
    'Copa', 'DFB', 'Coppa', 'Coupe',
    '\\b(?:Pro|Super|First|Second|Third|National)\\s+League\\b',
    '\\bConference\\s*League\\b', '\\bLeague\\s*Cup\\b',
    'الدوري', 'دوري', 'كأس',
    '\\bEPL\\b', '\\bUCL\\b', '\\bUEL\\b', '\\bUEFA\\b', '\\bFIFA\\b',
    '\\bACL\\b', '\\bAFC\\b', '\\bAFF\\b',
    // TH football leagues
    'พรีเมียร์ลีก', 'แชมเปี้ยนส์ลีก', 'แชมเปี้ยนส์\\s*ลีก',
    'ลาลีกา', 'บุนเดสลีกา', 'กัลโช่', 'ลีกเอิง', 'ไทยลีก'
  ];

  const SPORTS_PRO = [
    // Basketball
    '\\bNBA\\b', '\\bWNBA\\b', 'EuroLeague', 'March\\s*Madness', '\\bNCAAB?\\b',
    // American Football
    '\\bNFL\\b', 'Super\\s*Bowl',
    // Baseball
    '\\bMLB\\b', 'World\\s*Series',
    // Hockey
    '\\bNHL\\b', 'Stanley\\s*Cup',
    // Tennis
    '\\bATP\\b', '\\bWTA\\b', '\\bWimbledon\\b', 'Grand\\s*Slam',
    'Australian\\s*Open', 'French\\s*Open', 'Roland\\s*Garros', 'US\\s*Open',
    // Motorsport
    '\\bF1\\b', 'Formula\\s*[1O]', 'Grand\\s*Prix', '\\bMotoGP\\b',
    '\\bNASCAR\\b', '\\bIndyCar\\b', '\\bWRC\\b',
    // Combat sports
    '\\bUFC\\b', '\\bBoxing\\b', '\\bBellator\\b', '\\bPFL\\b',
    'ONE\\s*Championship', '\\bWBA\\b', '\\bWBC\\b', '\\bWBO\\b', '\\bIBF\\b',
    // Cricket
    '\\bIPL\\b', '\\bCricket\\b', '\\bT20\\b', '\\bODI\\b', 'The\\s*Ashes',
    // Rugby
    '\\bRugby\\b', 'Six\\s*Nations', 'Super\\s*Rugby',
    // Golf
    '\\bPGA\\b', 'Ryder\\s*Cup', 'The\\s*Masters', 'LIV\\s*Golf',
    // MLS & other football
    '\\bMLS\\b',
    // Esports
    '\\bLoL\\b', 'League\\s*of\\s*Legends', 'Dota\\s*2', '\\bCS2\\b',
    'Counter[- ]?Strike', '\\bValorant\\b', '\\bVCT\\b',
    // TH other sports
    'บาสเกตบอล', 'เทนนิส', 'กอล์ฟ', 'มวย', 'อีสปอร์ต'
  ];

  // Build SPORTS regex based on tier
  let tier = 'trial'; // default, will be set from storage

  function buildSportsRegex(currentTier) {
    const patterns = (currentTier === 'trial' || currentTier === 'pro')
      ? [...SPORTS_FOOTBALL, ...SPORTS_PRO]
      : SPORTS_FOOTBALL;
    return new RegExp(patterns.join('|'), 'i');
  }

  let SPORTS = buildSportsRegex(tier);

  // --- Init ---

  function reveal() {
    document.documentElement.setAttribute('data-ss-ready', '1');
  }

  // Safety: always reveal after 1.5s even if something fails
  setTimeout(reveal, 1500);

  const stored = await chrome.storage.local.get(['enabled', 'tier']);
  enabled = stored.enabled !== false;
  tier = stored.tier || 'trial';
  SPORTS = buildSportsRegex(tier);

  // Trial expired → force disabled, extension does nothing
  if (tier === 'free') enabled = false;

  // Toggle listener MUST be registered BEFORE the early return
  // so toggling ON works even if the script started disabled
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.tier) {
      tier = changes.tier.newValue;
      SPORTS = buildSportsRegex(tier);
      // Trial expired → force disabled
      if (tier === 'free') {
        enabled = false;
        unshieldAll();
        reveal();
        return;
      }
    }
    if (changes.enabled) {
      // Block enabling if trial expired
      if (tier === 'free') return;
      enabled = changes.enabled.newValue;
      if (!enabled) {
        unshieldAll();
        reveal();
      } else {
        processed = new WeakSet();
        originals.clear();
        scan();
        reveal();
      }
    }
    if (changes.tier && tier !== 'free') {
      // Re-scan with new patterns (e.g. upgraded to pro)
      processed = new WeakSet();
      originals.clear();
      document.querySelectorAll('[data-ss]').forEach(el => el.removeAttribute('data-ss'));
      document.querySelectorAll('.spoiler-shield-blurred').forEach(el =>
        el.classList.remove('spoiler-shield-blurred'));
      document.querySelectorAll('.spoiler-shield-badge').forEach(el => el.remove());
      if (enabled) scan();
    }
  });

  if (!enabled) { reveal(); return; }

  // --- Replace scores/outcomes in a text node ---

  // Check if a score match at position `idx` in string `str` is part of a date (X-Y-Z)
  function isDateLike(str, matchStr, idx) {
    // Look ahead: is the match followed by [-/.]digits? e.g., "3-2-69"
    const after = str.slice(idx + matchStr.length);
    if (/^\s*[-–—:/\.]\s*\d{2,4}/.test(after)) return true;
    // Look behind: is it preceded by digits[-/.]? e.g., "2025-03-02"
    const before = str.slice(0, idx);
    if (/\d{2,4}\s*[-–—:/\.]\s*$/.test(before)) return true;
    return false;
  }

  function shieldTextNode(textNode) {
    const orig = textNode.nodeValue;
    if (!orig || orig.trim().length < 2) return false;

    let text = orig;
    let changed = false;

    text = text.replace(SCORE_G, (m, a, sep, b, offset, fullStr) => {
      if (parseInt(a) > 15 || parseInt(b) > 15) return m;
      if (isDateLike(fullStr, m, offset)) return m;
      // "2:11" = duration (seconds are 2 digits), "2:0" / "3:1" = score (1 digit)
      if (sep === ':' && b.length >= 2) return m;
      changed = true;
      return '🛡️' + sep + '🛡️';
    });

    text = text.replace(SCORE_X_G, (m, a, sep, b, offset, fullStr) => {
      if (parseInt(a) > 15 || parseInt(b) > 15) return m;
      if (isDateLike(fullStr, m, offset)) return m;
      changed = true;
      return '🛡️ ' + sep + ' 🛡️';
    });

    text = text.replace(SCORE_VS_G, (m, a, sep, b, offset, fullStr) => {
      if (parseInt(a) > 15 || parseInt(b) > 15) return m;
      if (isDateLike(fullStr, m, offset)) return m;
      changed = true;
      return '🛡️ ' + sep + ' 🛡️';
    });

    text = text.replace(OUTCOME_G, () => { changed = true; return '🛡️'; });

    // Inside confirmed sports containers: extra masking (safe since context is confirmed)
    if (textNode.parentElement && textNode.parentElement.closest('[data-ss="1"]')) {
      // "Chelsea 0 Newcastle United 1" — Team[s] digit Team[s] digit pattern only
      text = text.replace(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+)(\d{1,2})(\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+)(\d{1,2})\b/g, (m, t1, s1, t2, s2) => {
        if (parseInt(s1) > 15 || parseInt(s2) > 15) return m;
        changed = true;
        return t1 + '🛡️' + t2 + '🛡️';
      });
      // Thai action/result words — too ambiguous globally but safe inside sports containers
      text = text.replace(/(?:อัด|ทุบ|คว่ำ|(?<!อ)สังหาร|ปะทะ|เจอ|ไล่บี้|เร่งเครื่อง|เฉือน|เชือด|ต้อน|เหยียบ|ขยี้|(?<!แม่น)ยำ|บุก|ไล่ถล่ม|ไล่อัด|ไล่ทุบ|ดับ|สอย|จัดหนัก|ฟาด|หยุดไม่อยู่|โหดจัด|สุดโหด|จัดเต็ม)/g, () => { changed = true; return '🛡️'; });
      // English hype/sentiment words that reveal outcome
      text = text.replace(/\b(?:HUGE|ANOTHER|MASSIVE|INCREDIBLE|BRILLIANT|STUNNING|PERFECT|DOMINANT|CLINICAL|MASTERCLASS|HEROIC|SUPERB|UNSTOPPABLE|SENSATIONAL)\b/gi, () => { changed = true; return '🛡️'; });
      // Sentiment emojis that reveal outcome (positive/negative)
      text = text.replace(/[🔥😍😭💪🎉🏆👏🙌😤🤩🥳😢💔😱😡🤣😂🥲✨💥]/gu, () => { changed = true; return ''; });
      // Color-team spoilers: "is RED", "is BLUE" etc.
      text = text.replace(/\b(?:is|are|go(?:es)?)\s+(?:RED|BLUE|WHITE|GREEN|YELLOW)\b/gi, () => { changed = true; return '🛡️'; });
      // Flag emojis (regional indicators)
      text = text.replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, () => { changed = true; return '🛡️'; });
    }

    if (changed) {
      originals.set(textNode, orig);
      textNode.nodeValue = text;
    }
    return changed;
  }

  // --- Force-mask all text inside a confirmed sports container ---
  function forceMaskContainer(container) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (originals.has(n)) continue; // already masked
      shieldTextNode(n);
    }
  }

  // --- Detect sports content and optionally mask text ---
  // Returns: 'full' (text masked + blur), 'blur' (sports detected, blur only), false (not sports)

  function shieldElement(el) {
    if (processed.has(el)) return false;

    const fullText = el.textContent || '';
    if (fullText.length < 3 || fullText.length > 2000) return false;

    // Signals: score, outcome, matchup ("A vs B"), sports context
    SCORE_G.lastIndex = 0;
    SCORE_X_G.lastIndex = 0;
    SCORE_VS_G.lastIndex = 0;
    const hasScore = SCORE_G.test(fullText) || SCORE_X_G.test(fullText) || SCORE_VS_G.test(fullText);
    SCORE_G.lastIndex = 0;
    SCORE_X_G.lastIndex = 0;
    SCORE_VS_G.lastIndex = 0;
    OUTCOME_G.lastIndex = 0;
    const hasOutcome = OUTCOME_G.test(fullText);
    OUTCOME_G.lastIndex = 0;
    let hasMatchup = MATCHUP.test(fullText);
    const hasContext = SPORTS.test(fullText);

    // "Team1 4-2 Team2" → score between words = implicit matchup
    if (hasScore && !hasMatchup) {
      hasMatchup = /[A-Za-z\u0E00-\u0E7F]\S*\s+\d{1,2}\s*[-–—:x]\s*\d{1,2}\s+\S*[A-Za-z\u0E00-\u0E7F]/i.test(fullText);
    }

    const signals = (hasScore ? 1 : 0) + (hasOutcome ? 1 : 0) + (hasMatchup ? 1 : 0) + (hasContext ? 1 : 0);
    // Strong signals = score/outcome/matchup (directly indicate sports content)
    const strongSignals = (hasScore ? 1 : 0) + (hasOutcome ? 1 : 0) + (hasMatchup ? 1 : 0);

    // Decision:
    // - 2+ strong signals (e.g., "Defeat" + "Newcastle v Man Utd") → FULL (no context needed)
    // - hasContext + any other signal → FULL
    // - hasMatchup alone → BLUR (matchup like "TeamA vs TeamB" is strong sports indicator)
    // - hasContext alone → BLUR (thumbnail only, score might be in image)
    // - 1 non-matchup strong signal, no context (e.g., random "2-1") → SKIP
    const isFull = (strongSignals >= 2) || (hasContext && signals >= 2);
    const isBlur = (hasContext && signals === 1) || (hasMatchup && signals === 1);

    if (!isFull && !isBlur) return false;

    processed.add(el);

    if (isFull) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes = [];
      let n;
      while ((n = walker.nextNode())) nodes.push(n);
      for (const tn of nodes) shieldTextNode(tn);
      el.setAttribute('data-ss', '1');
      return 'full';
    }

    // blur only
    el.setAttribute('data-ss', '1');
    return 'blur';
  }

  // --- Find container for image blurring ---

  function findContainer(el) {
    let node = el.parentElement;
    let bestCustom = null;
    for (let i = 0; i < 12 && node; i++) {
      const tag = node.tagName;
      if (tag === 'ARTICLE' || tag === 'LI' || tag === 'TR') return node;
      if (node.getAttribute('role') === 'article') return node;
      const cls = (node.className || '').toString();
      if (/\b(post|card|item|entry|story|tweet|fixture|match|result)\b/i.test(cls)) return node;
      // Custom elements: prefer renderer/item level, skip broad containers
      if (tag.includes('-')) {
        if (/renderer|item|card/i.test(tag) && !/shelf|section|grid|list|content|menu|button|badge/i.test(tag)) {
          // Only accept if it has a reasonable number of images (not a whole section)
          const imgCount = node.querySelectorAll('img').length;
          if (imgCount <= 3) return node;
        }
        // Fallback: first custom element with exactly 1 thumbnail
        if (!bestCustom && node.querySelector('img') && node.querySelectorAll('img').length === 1) {
          bestCustom = node;
        }
      }
      node = node.parentElement;
    }
    return bestCustom || el.parentElement;
  }

  // --- Blur thumbnails in a container ---

  function blurThumbnails(container) {
    if (!container) return;
    const inPlayer = container.closest('#movie_player, #player, ytd-player, #player-container');
    if (inPlayer && !container.closest('.ytp-endscreen-content, .ytp-ce-element, .ytp-autonav-endscreen-upnext-container, .ytp-autonav-endscreen')) return;

    // Find actual <img> elements (NOT wrappers — wrappers can be way bigger than the image)
    container.querySelectorAll('img').forEach(img => {
      if (processed.has(img)) return;
      if (img.width > 0 && img.width < 50) return;
      const imgInPlayer = img.closest('#movie_player, #player, ytd-player');
      if (img.closest('#avatar, #channel-thumbnail, #author-thumbnail') || (imgInPlayer && !img.closest('.ytp-ce-element, .ytp-autonav-endscreen-upnext-container, .ytp-autonav-endscreen'))) return;
      processed.add(img);

      // Blur the image
      img.classList.add('spoiler-shield-blurred');

      // Badge as sibling of img (not child — avoids inheriting blur filter)
      const wrapper = img.parentElement;
      if (!wrapper || wrapper.querySelector('.spoiler-shield-badge')) return;
      if (getComputedStyle(wrapper).position === 'static') wrapper.style.position = 'relative';

      const badge = document.createElement('span');
      badge.className = 'spoiler-shield-badge';
      badge.textContent = '🛡️ Spoiler Shield';

      // Position badge at center of the IMAGE (not wrapper)
      // Use img dimensions to calculate exact center
      const imgRect = img.getBoundingClientRect();
      const wrapRect = wrapper.getBoundingClientRect();
      const topOffset = imgRect.top - wrapRect.top + imgRect.height / 2;
      const leftOffset = imgRect.left - wrapRect.left + imgRect.width / 2;
      badge.style.cssText = `position:absolute;top:${topOffset}px;left:${leftOffset}px;transform:translate(-50%,-50%);`;

      const tw = img.offsetWidth || img.clientWidth || 0;
      if (tw > 0 && tw < 200) badge.setAttribute('data-ss-size', 'sm');
      else if (tw >= 400) badge.setAttribute('data-ss-size', 'lg');

      wrapper.appendChild(badge);
    });
  }

  // --- Main scan ---

  function scan() {
    if (!enabled || !document.body) return;

    // 1. Google score widgets — blur entirely
    document.querySelectorAll(
      '[data-attrid*="score"], .imso_mh, [data-sports-game-id]'
    ).forEach(w => {
      if (w.hasAttribute('data-ss')) return;
      w.setAttribute('data-ss', '1');
      w.classList.add('spoiler-shield-blurred');
      w.style.cursor = 'pointer';
      w.addEventListener('click', () => w.classList.remove('spoiler-shield-blurred'), { once: true });
    });

    // 2. YouTube end screen cards — blur individually
    document.querySelectorAll('.ytp-ce-element').forEach(card => {
      if (card.hasAttribute('data-ss')) return;
      const title = (card.textContent || '').trim();
      if (!title || title.length < 3) return;
      const result = shieldElement(card);
      if (result) {
        card.setAttribute('data-ss', '1');
        card.querySelectorAll('img, .ytp-ce-covering-image').forEach(img => {
          if (processed.has(img)) return;
          processed.add(img);
          img.classList.add('spoiler-shield-blurred');
        });
      }
    });

    // 2b. YouTube "Up Next" autoplay endscreen
    document.querySelectorAll('.ytp-autonav-endscreen-upnext-container, .ytp-autonav-endscreen').forEach(container => {
      if (container.hasAttribute('data-ss')) return;
      const title = (container.textContent || '').trim();
      if (!title || title.length < 3) return;
      const result = shieldElement(container);
      if (result) {
        container.setAttribute('data-ss', '1');
        container.querySelectorAll('img, .ytp-autonav-endscreen-upnext-thumbnail').forEach(img => {
          if (processed.has(img)) return;
          processed.add(img);
          img.classList.add('spoiler-shield-blurred');
        });
      }
    });

    // 3. Scan ALL text elements
    document.querySelectorAll(
      'h1, h2, h3, h4, h5, h6, a, p, span, td, li, ' +
      'yt-formatted-string, [id*="title"], [class*="title"], [class*="text"]'
    ).forEach(el => {
      if (el.hasAttribute('data-ss')) return;
      if (el.children.length > 5) return;
      // Never touch elements inside the video player — EXCEPT end screen cards
      const inPlayer = el.closest('#movie_player, #player, ytd-player, #player-container');
      if (inPlayer && !el.closest('.ytp-endscreen-content, .ytp-ce-element, .ytp-autonav-endscreen-upnext-container, .ytp-autonav-endscreen')) return;

      const text = (el.textContent || '').trim();
      if (!text || text.length < 3 || text.length > 1000) return;

      const result = shieldElement(el);

      if (result) {
        // Both 'full' and 'blur' → blur the thumbnail
        const container = findContainer(el);
        if (container) {
          container.setAttribute('data-ss', '1');
          blurThumbnails(container);
          // Force-mask ALL text inside confirmed sports container
          // (catches description, metadata, etc. that might contain scores/outcomes)
          if (result === 'full') forceMaskContainer(container);
        }
      } else {
        el.setAttribute('data-ss', '0');
      }
    });
  }

  // --- Undo (instant) ---

  function unshieldAll() {
    // Restore original text node values (non-destructive, preserves DOM)
    originals.forEach((origValue, textNode) => {
      if (textNode.parentNode) textNode.nodeValue = origValue;
    });
    originals.clear();
    // Remove blur, overlays + badges
    document.querySelectorAll('.spoiler-shield-blurred').forEach(el =>
      el.classList.remove('spoiler-shield-blurred'));
    document.querySelectorAll('.spoiler-shield-badge').forEach(el => el.remove());
    document.querySelectorAll('[data-ss]').forEach(el => el.removeAttribute('data-ss'));
    processed = new WeakSet();
  }

  // --- Start observing + scanning ---

  // Observe documentElement (never replaced) instead of body
  let scanTimer = null;
  const mainObserver = new MutationObserver(() => {
    if (!enabled) return;
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 150);
  });

  function startObserving() {
    mainObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  // At document_start, body may not exist yet
  if (document.body) {
    scan();
    reveal();
  }
  // Always start observing documentElement (available at document_start)
  startObserving();

  // Rescan a few times to catch late-loading content
  setTimeout(() => { scan(); reveal(); }, 100);
  setTimeout(scan, 500);
  setTimeout(scan, 1000);
  setTimeout(scan, 2000);
  setTimeout(scan, 4000);

  // --- Kill YouTube hover video preview on shielded cards ONLY ---

  let overShielded = false; // true while mouse is over a shielded card
  let killTimers = [];

  function killPreview() {
    const preview = document.querySelector('ytd-video-preview');
    if (preview) {
      preview.setAttribute('hidden', '');
      preview.setAttribute('data-ss-hidden', '');
      preview.style.display = 'none';
    }
  }

  function restorePreview() {
    const preview = document.querySelector('ytd-video-preview');
    if (preview && preview.hasAttribute('data-ss-hidden')) {
      preview.removeAttribute('hidden');
      preview.removeAttribute('data-ss-hidden');
      preview.style.display = '';
    }
  }

  function killInlineVideos(container) {
    if (!container) return;
    container.querySelectorAll('ytd-thumbnail video, a#thumbnail video, yt-thumbnail-view-model video').forEach(v => {
      v.pause();
      v.removeAttribute('src');
      v.style.display = 'none';
    });
  }

  document.addEventListener('mouseover', (e) => {
    if (!enabled || !e.target || !e.target.closest) return;
    const shielded = e.target.closest('[data-ss="1"]');

    if (shielded) {
      // Entering a shielded card → kill preview
      overShielded = true;
      killTimers.forEach(t => clearTimeout(t));
      killTimers = [];
      killPreview();
      killInlineVideos(shielded);
      [30, 80, 150, 300, 600, 1000].forEach(ms => {
        killTimers.push(setTimeout(() => {
          if (overShielded) {
            killPreview();
            killInlineVideos(shielded);
          }
        }, ms));
      });
    } else if (overShielded) {
      // Left a shielded card → restore preview for normal cards
      overShielded = false;
      killTimers.forEach(t => clearTimeout(t));
      killTimers = [];
      restorePreview();
    }
  }, true);

  // --- YouTube SPA navigation ---

  function ytReset() {
    // Remove ready flag to briefly hide page during re-scan
    document.documentElement.removeAttribute('data-ss-ready');
    processed = new WeakSet();
    originals.clear();
    // Remove blur/badges from old page
    document.querySelectorAll('.spoiler-shield-blurred').forEach(el =>
      el.classList.remove('spoiler-shield-blurred'));
    document.querySelectorAll('.spoiler-shield-badge').forEach(el => el.remove());
    document.querySelectorAll('[data-ss]').forEach(el => el.removeAttribute('data-ss'));
  }

  let ytScanTimers = [];

  function ytScheduleScans() {
    // Cancel any previous scheduled scans
    ytScanTimers.forEach(t => clearTimeout(t));
    ytScanTimers = [];
    // Aggressive scan schedule: YouTube content loads lazily
    const delays = [50, 150, 300, 500, 800, 1200, 2000, 3000, 5000];
    delays.forEach(ms => {
      ytScanTimers.push(setTimeout(() => {
        scan();
        if (ms === 150) reveal(); // reveal early but keep scanning
      }, ms));
    });
  }

  // Primary: fires after YouTube SPA navigation completes
  document.addEventListener('yt-navigate-finish', () => {
    ytReset();
    ytScheduleScans();
  });

  // Secondary: fires when YouTube page data is updated (sometimes after yt-navigate-finish)
  document.addEventListener('yt-page-data-updated', () => {
    if (!enabled) return;
    ytScheduleScans();
  });

  // Tertiary: catch YouTube re-renders (e.g., scrolling loads more items)
  document.addEventListener('yt-visibility-refresh', () => {
    if (!enabled) return;
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 100);
  });

  // YouTube also uses popstate for back/forward
  window.addEventListener('popstate', () => {
    if (!location.hostname.includes('youtube.com')) return;
    ytReset();
    ytScheduleScans();
  });
})();
