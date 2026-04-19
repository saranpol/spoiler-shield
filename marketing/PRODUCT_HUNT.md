# Product Hunt Launch Plan

## Launch day
**Target:** Tuesday, 12:01 AM PST (best day for tech + global audience)
**Avoid:** Monday (too quiet), Friday (bad reach)

## Checklist before launch

- [ ] v3.1.1 live on Chrome Web Store
- [ ] Landing page live (spoilershield.com or subdomain)
- [ ] Product Hunt account with 50+ upvotes history (or hunter with karma)
- [ ] 10-15 friends/supporters notified for first-hour upvotes (CRITICAL)
- [ ] GIF demo recorded (see below)
- [ ] Twitter/X account active — will announce at launch
- [ ] Reply-ready: prepared responses to common questions

---

## Tagline (60 chars max)

**Primary:**
"Hide sports scores and spoilers on every website"

**Alternatives:**
- "Watch the highlights without knowing the score"
- "Sports spoiler blocker for the whole internet"
- "Your browser, but spoiler-free"

---

## Description (260 chars)

Spoiler Shield automatically blurs sports scores, results, and spoiler thumbnails across every website — YouTube, Google, Reddit, Twitter, news sites. Works in 15+ languages. One-time $4.99, no subscription. Built for people who watch on delay.

---

## First Comment (maker's first comment — pin this)

```
Hey PH 👋

I built Spoiler Shield because I kept getting spoiled when watching football on delay. The worst was YouTube — I'd search "[team] highlights" and the thumbnail would literally show the final score. Same with Google search, Reddit sidebars, news previews. My eyes couldn't help but read them.

Existing extensions either only worked on ESPN, or only hid a few sites. I wanted something that worked EVERYWHERE.

So v1 just blurred score patterns ("3-1", "2:0") on every page. Then I added outcome words (beat, thrash, lose). Then image blurring near sports content. Then multi-language team matching (15+ languages). Now it catches most spoilers before I even see them.

🛠️ Built with: Vanilla JS (no framework), Manifest V3, runs entirely local — no data leaves your browser.

💰 Pricing: 14-day full trial, then one-time $4.99 (no subscriptions, ever). Payments via ExtensionPay/Stripe.

Happy to answer any questions about:
- How the detection works (regex + heuristics + team name matching)
- Why Manifest V3 made this harder
- Conversion experiments I'm planning
- What sports/languages to add next

What leagues or websites should I prioritize for v3.2? 👇
```

---

## Topics/Tags
- Chrome Extensions
- Productivity
- Sports
- Browser Extensions

---

## Media assets needed

1. **Main image (1270×760)**: Before/after split — messy spoiler-filled YouTube page vs clean blurred version. Add text "Before Spoiler Shield" / "After"

2. **GIF demo (< 3MB)**:
   - Scene 1: Scroll YouTube homepage, thumbnails blurred
   - Scene 2: Google "premier league results" — widget blurred
   - Scene 3: Click blurred thumbnail → reveal
   - Scene 4: Alt+S toggle off/on
   - Loop

3. **Icon (240×240)**: Use existing 128px icon scaled up

4. **Gallery images (3-5)**:
   - YouTube before/after
   - Google Search before/after
   - Reddit/Twitter examples
   - Popup UI screenshot showing trial countdown
   - Settings screenshot showing languages

---

## Hunter strategy

**Option A: Self-hunt**
If your account has 100+ upvotes history → just post yourself, add comment first

**Option B: Find a hunter**
Top hunters: Chris Messina, Kevin William David, Emmanuel Straschnov
DM via Twitter with the pitch + ask 3-5 days before launch

**Risk:** Top hunters add no real value now — community drives rankings. Skip unless you already know one.

---

## Day-of launch schedule (PST)

| Time | Action |
|------|--------|
| 12:01 AM | Post goes live — immediately share in Slack/Discord/Telegram groups |
| 12:15 AM | Send DMs to 10-15 people asking for upvotes + comments (not just upvotes — comments matter more) |
| 1-3 AM | Reply to every comment within 15 min |
| 6 AM | Tweet: "We're live on Product Hunt today 🛡️ [link]" |
| 6-9 AM | Reply to Asian/European morning wave |
| 9 AM PST | Monitor ranking — if top 5, push harder to friends. If top 10, sustain |
| All day | Reply within 10 min to every comment |
| 11:30 PM | Final push — "last hour!" tweet if close to winning category |

---

## Follow-up content (write in advance)

Schedule these to auto-post next day:

1. **Twitter thread** — "I launched on Product Hunt yesterday. Here's what happened + numbers."
2. **Blog post** — Technical deep-dive on how detection works (good for SEO later)
3. **Dev.to post** — "Building a Chrome extension with Manifest V3 in 2026"

---

## Success metrics

| Outcome | Installs expected | Revenue if 3% conv |
|---------|-------------------|---------------------|
| Not featured | 50-200 | $7-30 |
| Top 10 of day | 500-2,000 | $75-300 |
| #1 Product of Day | 3,000-10,000 | $450-1,500 |
| Product of Week | 10,000+ | $1,500+ |

**Realistic target:** Top 10, ~1,000 installs, ~$150 revenue from PH alone. Bigger win = discovery by press/bloggers for later.
