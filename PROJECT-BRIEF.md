# Spoiler Shield — Chrome Extension Project Brief

## One-liner
Chrome extension ที่ซ่อนสกอร์ฟุตบอล/กีฬาจากทุกเว็บ ให้ดู highlight โดยไม่โดนสปอย

---

## ปัญหา (Problem)

คนดูบอลที่ดูย้อนหลัง/highlight โดนสปอยจากทุกที่:
- YouTube: title บอกสกอร์ + thumbnail สปอย
- Google: search ขึ้น score widget
- Twitter/X: คนโพสต์ผลบอล
- Facebook: เพื่อนแชร์ผลบอล
- News sites: พาดหัวข่าวบอกผล

**ผลกระทบ:** รู้ผลก่อนดู → หมดอารมณ์ → ไม่สนุก

---

## Solution

Chrome extension ที่:
1. ตรวจจับ content ที่มีสกอร์/ผลบอล บนทุกเว็บ
2. ซ่อน/blur ส่วนที่สปอย (title, thumbnail, text, score widget)
3. ให้ user เลือกว่าจะซ่อนทีมไหน/ลีกไหน
4. กดเปิดดูได้เมื่อพร้อม

---

## Target Users

- คนดูบอลที่อยู่ timezone ต่าง (ดูย้อนหลัง)
- คนที่ทำงาน ยังดูไม่ได้ แต่เปิดมือถือเจอสปอย
- คนดู highlight ใน YouTube ไม่อยากรู้ผลก่อน
- ครอบคลุมทุกกีฬา: ฟุตบอล, NBA, NFL, F1, มวย, etc.

**ตลาด:** คนดูกีฬาทั่วโลก หลายร้อยล้านคน

---

## คู่แข่ง (Competitors)

| ชื่อ | ทำอะไร | จุดอ่อน |
|------|--------|---------|
| DTMTS (dtmts.com) | ซ่อนสกอร์ แสดงลิงก์ highlight | UX ห่วย, แค่ลิงก์ไป YouTube แล้วเจอ recommended สปอย |
| NoSpoilerSports.app | ดู highlight ไม่เห็นสกอร์ | เน้น US sports, ฟุตบอลแค่ PL, ไม่มีลีกอื่น |
| Scores Hidden (extension) | ซ่อนสกอร์บาง sites | ไม่ครอบคลุม, outdated |

**ช่องว่าง:** ยังไม่มีใครทำ extension ที่ซ่อนสปอยจาก "ทุกเว็บ" พร้อมกัน (YouTube + Twitter + Google + Facebook + News)

---

## Features

### MVP (v1.0) — สร้างใน 1-2 สัปดาห์

**Core:**
- ซ่อน/blur YouTube video titles & thumbnails ที่มีชื่อทีมที่ user เลือก
- ซ่อน Google score widget (สกอร์ที่ขึ้นตอน search)
- Popup UI: เลือกทีม/ลีกที่ต้องการซ่อน
- Toggle on/off ง่ายๆ
- Whitelist บางเว็บที่ไม่ต้องซ่อน

**Supported Sites (MVP):**
- YouTube (title, thumbnail, description, comments)
- Google Search (score widget, news results)

### v1.5 — เพิ่มหลัง MVP

- Twitter/X support (ซ่อน tweets ที่มีสกอร์)
- Facebook support (ซ่อน posts ที่มีสกอร์)
- Reddit support (ซ่อน post titles)

### v2.0 — Premium Features

- **Excitement Score:** AI วิเคราะห์ว่าแมตช์ไหนสนุก (⭐1-5) โดยไม่สปอยผล
- ครอบคลุมทุกกีฬา (NBA, NFL, F1, Tennis, Boxing, etc.)
- Custom keywords ที่จะซ่อน
- "Safe Mode" ซ่อนทุกอย่างที่เกี่ยวกับกีฬาจนกว่าจะกดเปิด
- Sync settings ข้าม devices
- Mobile browser support (Firefox Android)

---

## Technical Architecture

### Tech Stack
```
- Manifest V3 (Chrome Extension)
- JavaScript/TypeScript
- Content Scripts (inject into web pages)
- Chrome Storage API (save settings)
- No backend needed for MVP
- Optional: Football API (football-data.org) for team/league data
```

### How It Works
```
1. User ติดตั้ง extension → เลือกทีม/ลีกที่ต้องการซ่อน
2. Extension inject content script เข้าทุกหน้าเว็บ
3. Content script scan หา:
   - ชื่อทีมที่ user เลือก
   - Pattern สกอร์ (เช่น "3-1", "3:1")
   - Keywords (เช่น "GOALS", "HIGHLIGHTS", "RESULT")
4. ถ้าเจอ → blur/hide element นั้น
5. User กด "reveal" เมื่อพร้อมจะดู
```

### File Structure
```
spoiler-shield/
├── manifest.json           # Extension config (Manifest V3)
├── popup/
│   ├── popup.html          # Settings UI
│   ├── popup.css
│   └── popup.js            # Settings logic
├── content/
│   ├── blocker.js          # Main content script - detect & hide spoilers
│   ├── youtube.js          # YouTube-specific logic
│   ├── google.js           # Google Search-specific logic
│   ├── twitter.js          # Twitter-specific logic (v1.5)
│   └── facebook.js         # Facebook-specific logic (v1.5)
├── background/
│   └── service-worker.js   # Background tasks, toggle state
├── data/
│   ├── teams.json          # Team names (multiple languages)
│   ├── leagues.json        # League names & team mappings
│   └── keywords.json       # Spoiler keywords (GOAL, SCORE, RESULT, etc.)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── styles/
    └── blocker.css         # Blur/hide styles injected into pages
```

### Key Technical Challenges
```
1. YouTube Dynamic Loading: YouTube uses SPA, content loads dynamically
   → Use MutationObserver to watch for new elements

2. Multi-language: "Manchester United" vs "แมนยู" vs "マンチェスター"
   → teams.json with aliases in multiple languages

3. False Positives: "Arsenal of democracy" ไม่ใช่ฟุตบอล
   → Context-aware detection (check surrounding content)

4. Performance: Scanning ทุก element อาจช้า
   → Debounce, only scan visible viewport, cache results
```

---

## Monetization

### Revenue Model: Freemium + Affiliate

**Free Tier:**
- ซ่อนสกอร์ 1 ลีก
- YouTube + Google เท่านั้น
- ไม่จำกัด

**Pro Tier ($2.99/เดือน หรือ $24.99/ปี):**
- ซ่อนทุกลีก ทุกกีฬา ทั่วโลก
- ทุกเว็บ (YouTube + Google + Twitter + Facebook + Reddit + News)
- Excitement Score (AI rated)
- Custom keywords
- Sync settings ข้าม devices
- Priority support

**Payment:** ใช้ ExtensionPay (extensionpay.com) — ง่ายสุด, ฟรี, รองรับ Stripe

### Revenue Projections

| Timeline | Users | Paying (5%) | Revenue/mo |
|----------|-------|-------------|------------|
| เดือน 3 | 1,000 | 50 | $150 |
| เดือน 6 | 5,000 | 250 | $750 |
| เดือน 12 | 20,000 | 1,000 | $3,000 |
| ปีที่ 2 | 50,000 | 2,500 | $7,500 |
| ปีที่ 3 | 100,000+ | 5,000+ | $15,000+ |

### Additional Revenue Streams
- **Streaming Affiliate:** แนะนำ DAZN/Peacock/Viaplay ดู full match → $5-20/signup
- **Merchandise Affiliate:** เสื้อบอล/ของที่ระลึก → 5-15% commission
- **Exit:** ขาย extension ให้ sports media company → 3-5x annual revenue

---

## Costs

| รายการ | ต้นทุน |
|--------|--------|
| Chrome Web Store fee | $5 (ครั้งเดียว) |
| Hosting | $0 (extension runs on user's browser) |
| Football data API | $0 (football-data.org free tier) |
| ExtensionPay | $0 (free, Stripe fees only) |
| AI API (Excitement Score, v2) | ~$5-20/เดือน |
| **Total MVP** | **$5** |
| **Total monthly (after v2)** | **$5-20** |

---

## Go-to-Market Strategy

### Launch (Week 1-2)
1. สร้าง MVP — YouTube + Google blocker
2. ลง Chrome Web Store
3. โพสต์ Reddit: r/soccer, r/PremierLeague, r/football, r/sports
4. โพสต์ Product Hunt

### Growth (Month 1-3)
5. SEO: สร้าง landing page "watch football highlights without spoilers"
6. โพสต์ในฟอรั่มฟุตบอล (SoccerWay, FourFourTwo forums, etc.)
7. หา football bloggers/YouTubers ให้ review
8. ทำ content: "How to avoid football spoilers" blog posts

### Scale (Month 3-12)
9. เพิ่ม Twitter/Facebook/Reddit support
10. เพิ่มกีฬาอื่น (NBA, NFL, F1)
11. เพิ่ม Excitement Score (premium feature)
12. Firefox version
13. Localization (Thai, Spanish, Portuguese, Japanese)

---

## Competitive Moat (ทำไมมาก่อนได้เปรียบ)

1. **Review Moat:** Chrome Store reviews สะสมเรื่อยๆ คนใหม่เห็น 500 reviews เชื่อมากกว่า extension ใหม่ 0 reviews
2. **Data Moat:** ยิ่งมี user เยอะ ยิ่งรู้ว่า pattern สปอยแบบไหนที่ต้อง block → accuracy ดีขึ้น
3. **Keyword Moat:** สะสม team names, aliases, nicknames ทุกภาษา → คู่แข่งใหม่ต้องสร้างจากศูนย์
4. **Brand Moat:** "Spoiler Shield" เป็นชื่อที่จำง่าย ถ้า establish ก่อน คนจะ search หาชื่อนี้

---

## Success Metrics

| Metric | Target (ปีแรก) |
|--------|----------------|
| Total installs | 20,000+ |
| Active users | 10,000+ |
| Chrome Store rating | 4.5+ ⭐ |
| Paying subscribers | 1,000+ |
| Monthly revenue | $3,000+ |
| Churn rate | < 5%/month |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| YouTube เปลี่ยน DOM structure | Extension พัง | MutationObserver + selector fallback + quick updates |
| Chrome Manifest V3 restrictions | บาง feature ทำไม่ได้ | Design around V3 from start |
| คู่แข่งใหญ่ทำ (YouTube เพิ่ม feature) | หมด market | Pivot ไปกีฬาอื่น / multi-platform |
| Low conversion rate | รายได้น้อย | เพิ่ม premium features ที่ compelling |
| Copyright issues กับ team names | Legal risk | Team names เป็น factual data ไม่ใช่ copyrighted |

---

## Development Phases for Claude Code

### Phase 1: MVP Chrome Extension (Priority)
```
Task 1: สร้าง manifest.json (Manifest V3)
Task 2: สร้าง popup UI — เลือกทีม/ลีก, toggle on/off
Task 3: สร้าง content script — YouTube title/thumbnail blocker
Task 4: สร้าง content script — Google score widget blocker
Task 5: สร้าง teams.json + leagues.json (Top 5 leagues)
Task 6: สร้าง spoiler detection logic (team names + score patterns)
Task 7: สร้าง blur/reveal UI (click to reveal)
Task 8: Test + debug
Task 9: Package + upload to Chrome Web Store
```

### Phase 2: Expand Coverage
```
Task 10: Twitter/X blocker
Task 11: Facebook blocker
Task 12: Reddit blocker
Task 13: News sites blocker (ESPN, BBC Sport, etc.)
Task 14: เพิ่มทีม/ลีก ให้ครอบคลุมมากขึ้น
```

### Phase 3: Premium Features
```
Task 15: Integrate ExtensionPay for subscription
Task 16: Excitement Score (AI-powered)
Task 17: Settings sync across devices
Task 18: Firefox port
Task 19: Landing page + website
```

---

## Key Design Principles

1. **ซ่อนก่อน ถามทีหลัง** — ถ้าไม่แน่ใจว่าสปอยไหม ให้ซ่อนไว้ก่อน ดีกว่าปล่อยให้สปอย
2. **Zero config to start** — ติดตั้งปุ๊บ ใช้ได้เลย เลือกทีมที่ชอบแค่นั้น
3. **ไม่ทำให้เว็บพัง** — ซ่อนแค่ส่วนที่สปอย ที่เหลือปกติ
4. **เร็ว** — ไม่ทำให้เว็บโหลดช้า
5. **เคารพ privacy** — ไม่เก็บ browsing data ทุกอย่างทำ local

---

## Context: ที่มาของไอเดียนี้

ไอเดียนี้มาจากการ brainstorm หลายชั่วโมง โดยเริ่มจาก "AI agent หาเงินอัตโนมัติ" 
→ พบว่าตลาด AI agent (x402) ยังเล็กเกินไป 
→ วิเคราะห์ว่า "เงินต้นน้ำ" มาจากไหน 
→ พบว่าต้อง "แก้ปัญหาจริงของมนุษย์จริง" 
→ ถาม founder ว่า "มีปัญหาอะไรในชีวิต?" 
→ ได้ "ดู highlight บอลโดนสปอย"
→ วิเคราะห์แล้วพบว่าเป็น micro-SaaS ที่ดีมาก:
   - ต้นทุน $5
   - ตลาดใหญ่ (คนดูบอลทั่วโลก)
   - มีคู่แข่งแต่ทำห่วย (demand พิสูจน์แล้ว)
   - AI ช่วยสร้างได้
   - Moat จาก reviews + data + brand
