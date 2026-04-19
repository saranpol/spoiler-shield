# Landing Page Copy + Spec

## Why a landing page?
- **SEO moat**: "hide football scores" / "avoid spoilers premier league" have ~1k/mo searches and near-zero competition
- **Conversion**: Chrome Web Store has its own page, but yours ranks separately in Google
- **Trust**: "by saran.pol" looks more legit with a real website behind it
- **Referrals**: Reddit/PH traffic can go here first, then to the store

## Domain
Buy: `spoilershield.com` (~$12/yr on Namecheap). Blog already uses `blog.spoilershield.com`, so main is probably free.

Alt if taken: `spoilershield.app` or `getspoilershield.com`

## Stack
- **Simplest:** Single HTML file, deploy to Vercel/Netlify/Cloudflare Pages (free)
- **Tools:** Plain HTML + Tailwind CDN, or use existing `docs/` folder
- **No JS framework needed**

---

## Page structure

```
┌─────────────────────────────────────────┐
│ HERO                                    │
│ 🛡️ Logo + "Spoiler Shield"              │
│                                         │
│ Watch the game on YOUR time             │
│ Hide sports scores on every website     │
│                                         │
│ [Add to Chrome — free 14 day trial]     │
│                                         │
│ (Hero image/GIF: before/after)          │
├─────────────────────────────────────────┤
│ SOCIAL PROOF                            │
│ "⭐⭐⭐⭐⭐ Saved my Champions League"    │
│ — Redditor u/someone                    │
├─────────────────────────────────────────┤
│ PROBLEM                                 │
│ Spoilers are everywhere                 │
│ [YouTube] [Google] [Twitter] [News]     │
├─────────────────────────────────────────┤
│ HOW IT WORKS                            │
│ 3 columns: Detect → Hide → Reveal       │
├─────────────────────────────────────────┤
│ FEATURES                                │
│ ✓ Every website                         │
│ ✓ 15+ languages                         │
│ ✓ Any sport                             │
│ ✓ Runs locally — no data collected      │
├─────────────────────────────────────────┤
│ PRICING                                 │
│ 14 days free. Then $4.99 one-time.      │
│ No subscription. Ever.                  │
│                                         │
│ [Install Free →]                        │
├─────────────────────────────────────────┤
│ FAQ                                     │
├─────────────────────────────────────────┤
│ FOOTER                                  │
│ Privacy / Blog / GitHub / Contact       │
└─────────────────────────────────────────┘
```

---

## Copy — ready to paste into HTML

### Hero

**Headline:**
> Watch the game on your own time. Spoiler-free.

**Subhead:**
> Spoiler Shield hides sports scores, results, and spoiler thumbnails across every website — YouTube, Google, Reddit, news sites, everywhere. For people who watch on delay.

**Primary CTA:** `Add to Chrome — 14-day Free Trial →`
**Secondary CTA:** `See how it works ↓`

---

### Problem section

**Headline:** "Scores are everywhere. Even when you're trying to avoid them."

**Body:**
> You wake up. You haven't watched last night's match yet. But before you've had coffee, you've already seen:
>
> • Google showing the final score in the search bar
> • A YouTube thumbnail with "3-1 INCREDIBLE COMEBACK"
> • A news alert with the headline
> • A friend's comment in your feed
>
> Sports media is optimized for people who already know the result. You're not one of them.

---

### How it works

**3 steps with icons:**

**1. Install in 10 seconds**
Add Spoiler Shield from the Chrome Web Store. Free 14-day trial, no credit card.

**2. We blur the spoilers**
As pages load, we detect score patterns (3-1, 2:0), outcome words (beat, thrash), and spoiler thumbnails — and blur them automatically.

**3. Reveal when you're ready**
Watched the match? Press Alt+S to toggle off. Or click any blurred element to reveal it instantly.

---

### Features grid

- 🌍 **Works on every site** — YouTube, Google, Reddit, Twitter, ESPN, BBC, everywhere
- ⚽ **Every major sport** — Football, NBA, NFL, MLB, F1, tennis, boxing, esports
- 🗣️ **15+ languages** — team names recognized in English, Spanish, Portuguese, Japanese, Thai, Arabic, and more
- ⚡ **Fast & lightweight** — Under 70KB, runs on page load
- 🔒 **Zero data collection** — everything happens locally in your browser
- ⌨️ **Keyboard shortcut** — Alt+S to toggle off instantly when you're done

---

### Pricing section

**Headline:** "Fair pricing. No subscription nonsense."

**Free Trial** (box 1)
- All features unlocked
- 14 days
- No credit card

**Keep It Forever** (box 2, highlighted)
- One-time payment of **$4.99**
- All future updates included
- No subscription, ever
- Works on all your devices (Chrome sync)

**CTA:** `Start Free Trial →`

---

### FAQ

**Q: Does this really work on every website?**
A: It runs on every URL you visit and scans the page text + images for score patterns and sports keywords. Tested on YouTube, Google, Reddit, Twitter, ESPN, BBC, and more. If you find a site where it doesn't work, [email me](mailto:dev@sala-daeng.com) and I'll fix it.

**Q: What languages are supported?**
A: Team names are recognized in English, Spanish, Portuguese, French, German, Italian, Japanese, Korean, Chinese, Thai, Arabic, and more — 15+ languages total.

**Q: Do you collect any data?**
A: No. Nothing. All detection runs locally in your browser. No analytics, no tracking, no data sent anywhere. See our [privacy policy](/privacy).

**Q: Why does it need "access to all websites"?**
A: Because spoilers come from everywhere — YouTube, news sites, social media. The extension needs to scan pages to blur content. But it only runs detection locally — it never sends your browsing data anywhere.

**Q: Is it really one-time payment or will you add a subscription later?**
A: One-time. Forever. If I ever launch a subscription tier for advanced features, existing one-time users keep everything they paid for.

**Q: What happens after the 14-day trial?**
A: Protection turns off. You can upgrade anytime for $4.99 to keep it running, or just uninstall — no questions asked.

**Q: Does it work on mobile?**
A: Not yet. Chrome Mobile doesn't support extensions. Firefox Android support is planned — [subscribe to the blog](https://blog.spoilershield.com) for updates.

---

### Footer

Left:
- Spoiler Shield
- by [saran.pol](https://github.com/saranpol)
- © 2026

Center:
- [Blog](https://blog.spoilershield.com)
- [GitHub](https://github.com/saranpol/spoiler-shield)
- [Privacy Policy](/privacy)

Right:
- [Contact](mailto:dev@sala-daeng.com)
- [Twitter/X](#)
- [Changelog](#)

---

## SEO plan

### Primary keywords (in order of priority)
1. "hide football scores" (~500/mo, low competition)
2. "avoid spoilers premier league" (~200/mo, low)
3. "chrome extension block sports scores" (~150/mo, low)
4. "how to avoid football spoilers" (~400/mo, medium)
5. "spoiler blocker extension" (~300/mo, medium — NoSpoilerSports.app ranks here)

### On-page SEO
- Title tag: "Spoiler Shield — Hide Sports Scores on Every Website | Chrome Extension"
- Meta description: Same as hero subhead (155 chars)
- H1: "Watch the game on your own time. Spoiler-free."
- Schema.org: SoftwareApplication markup with aggregateRating

### Content marketing (blog.spoilershield.com)
Write one post per week for SEO:
1. "How to avoid football spoilers in 2026 (complete guide)"
2. "Best Chrome extensions for sports fans who watch on delay"
3. "Why YouTube thumbnails keep spoiling your matches (and how to fix it)"
4. "The psychology of sports spoilers: why they ruin the experience"
5. "10 places sports scores ambush you online"

Each post → links back to extension with affiliate-style CTA.

---

## Launch sequence for landing page

1. Buy domain (5 min)
2. Write single-page HTML with Tailwind CDN (2-3 hr)
3. Deploy to Vercel/Netlify (10 min)
4. Submit to Google Search Console + Bing Webmaster (15 min)
5. Update Chrome Web Store listing to include landing page URL (5 min)
6. Use landing page URL as Reddit / PH referral target instead of direct CWS link
