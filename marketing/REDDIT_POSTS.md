# Reddit Post Drafts

## Rules of Engagement
- **Don't sell.** Share experience, mention tool casually.
- **Post timing:** Thursday/Friday night (after midweek games) or Monday morning (after weekend games). Avoid match days.
- **Engage in comments** — reply to every comment first 2 hours. Reddit boosts active threads.
- **One subreddit at a time.** Don't cross-post within 24hr — looks spammy.
- **Account age matters.** Use an account with some comment history, not brand new.

---

## Post 1 — r/soccer (2.1M subscribers) — MAIN POST

**Title options (pick one):**
1. "I got so sick of spoilers that I built a Chrome extension to hide them on every site. It's been life-changing for watching highlights."
2. "PSA for anyone watching matches on delay: you can literally make Google stop showing you scores"
3. "How I finally stopped getting spoiled by YouTube thumbnails before watching the full match"

**Body:**
```
Work in a different timezone from my team, so I watch pretty much every match on delay. The problem isn't just avoiding the match thread — it's that scores are EVERYWHERE. Google search, YouTube recommendations, Twitter, news site previews. Even the damn thumbnail of the highlight video tells you who scored.

Tried browsing with my eyes half-closed. Didn't work.

So I built a Chrome extension that just… blurs all of it. Scores get replaced with a shield icon, outcome words (beat, thrash, lose) get masked, and thumbnails near anything sports-related get blurred until I hover.

Works on every site. Alt+S to toggle on/off when you're done watching.

Called it Spoiler Shield: https://chromewebstore.google.com/detail/spoiler-shield/ndenomgckldachhdmfpgopjggoekgbgh

Free for 14 days to try it. Would love feedback from anyone who watches on delay — especially edge cases I probably missed.
```

**Engagement strategy:**
- Reply to first 10 comments within 1 hour
- If someone reports a bug, offer to fix it fast
- If someone asks "why not just use X?" respond with specific limitation of X

---

## Post 2 — r/PremierLeague (1M) — VARIATION

**Title:** "Finally watched Sunday's game without knowing the score — small extension I made"

**Body:** (shorter, PL-focused)
```
Quick PSA for anyone who watches PL on delay (US/Asia timezone crew, night-shift workers, etc.):

Built a Chrome extension that hides scores everywhere — Google, YouTube, news sites. Watched Sunday's game completely blind after 8 hours of avoiding my phone. Never going back.

Link: https://chromewebstore.google.com/detail/spoiler-shield/ndenomgckldachhdmfpgopjggoekgbgh

Free 14-day trial, $4.99 one-time if you want to keep it. No subscription nonsense.

Any PL edge cases I should cover? Match thread titles in the sidebar? Live widgets?
```

---

## Post 3 — r/MLS (smaller, 200k but super engaged)

**Title:** "Built an extension to hide MLS scores — finally watched the match without getting spoiled by Apple's notifications"

**Body:**
```
Apple TV is great but the notifications + iPhone widgets + ESPN app all conspire to spoil MLS games before I get home.

Made a Chrome extension that blurs scores and spoiler thumbnails on any website. Works on the ESPN site, Google search, YouTube highlight thumbnails — the whole deal.

Called it Spoiler Shield. Free for 14 days, $4.99 one-time if it works for you:
https://chromewebstore.google.com/detail/spoiler-shield/ndenomgckldachhdmfpgopjggoekgbgh

Not a replacement for turning off Apple TV notifications lol, but helps when you're at work or on your laptop.
```

---

## Post 4 — r/nba (comment, not post)

**Strategy:** Find threads like "how do you avoid NBA spoilers" — they come up weekly. Comment helpfully, mention tool at the end.

**Template comment:**
```
Few things that work for me:
1. Mute keywords on Twitter (setting under Notifications)
2. Unsubscribe from ESPN push notifications
3. Use a Chrome extension to blur scores on web — I made one called Spoiler Shield that works across all sites (YouTube thumbnails are the worst offender imo). Free trial: [link]
4. Watch League Pass with Hide Scores on

No single fix works 100% — you need multiple layers.
```

---

## Post 5 — r/chrome_extensions (small but targeted: 30k)

**Title:** "I built a Chrome extension that hides sports spoilers on every website — feedback welcome"

**Body:** (this is the tech-audience post, be more honest)
```
Context: I watch football on delay and got tired of getting spoiled by Google, YouTube thumbnails, news sites — everything. So I built Spoiler Shield.

Technical highlights:
- Manifest V3, runs on all URLs
- Content script with MutationObserver for SPAs (YouTube is a nightmare)
- Scans text for score patterns (3-1, 2:0, 1 vs 1) and outcome words
- Blurs images near sports-related text
- Multi-language team name matching (EN, ES, PT, JA, TH, 15+ total)
- Everything runs locally, no data collection

Stack: vanilla JS (no framework needed), ~70KB total.

Live on CWS: https://chromewebstore.google.com/detail/spoiler-shield/ndenomgckldachhdmfpgopjggoekgbgh

Would love feedback on:
- Performance with heavy pages (Reddit, Twitter)
- Languages I haven't tested
- Edge cases where scores slip through

Monetization: 14-day trial, $4.99 one-time. ExtensionPay for Stripe. Planning to write a post-mortem on conversion rates.
```

---

## Cross-post list (order, don't do all in one day)

| Day | Subreddit | Post variant | Expected reach |
|-----|-----------|--------------|----------------|
| Day 1 (Thu) | r/soccer | Post 1 | 2.1M |
| Day 3 (Sat) | r/PremierLeague | Post 2 | 1M |
| Day 5 (Mon) | r/chrome_extensions | Post 5 | 30k |
| Day 7 (Wed) | r/MLS | Post 3 | 200k |
| Ongoing | r/nba, r/nfl, r/formula1 | Post 4 (comments) | High-intent |

Also consider (lower priority): r/ChampionsLeague, r/LaLiga, r/footballhighlights, r/cricket, r/NFL (after v3.1.1 conversion proven)
