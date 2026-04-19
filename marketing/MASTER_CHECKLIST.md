# Master Growth Checklist

สิ่งที่คนกดได้เอง. ฉันทำให้ไม่ได้ทั้งหมด แต่ทุก copy พร้อม paste แล้ว

## 🔴 TODAY — Must do before anything else

- [ ] **Upload v3.1.1 zip** to Chrome Web Store
  - ไฟล์: `/Users/saranpol/POL/spoiler-shield/spoiler-shield.zip`
  - [Dashboard](https://chrome.google.com/webstore/devconsole) → Spoiler Shield → Package → Upload new package
  - Submit for review (1-3 days)

- [ ] **Update store listing**
  - Copy ใหม่จาก `STORE_LISTING.md`
  - เปลี่ยน Description ในหน้า Store Listing
  - เพิ่ม "What's new" note

- [ ] **ตรวจ ExtensionPay dashboard**
  - [extensionpay.com](https://extensionpay.com/extensions)
  - Check: ราคาเป็น $4.99 one-time จริงไหม, Stripe connected ไหม

## 🟡 THIS WEEK — Growth push

- [ ] **Reddit post — r/soccer** (วันพฤหัส/ศุกร์ คืน)
  - Copy จาก `marketing/REDDIT_POSTS.md` (Post 1)
  - เลือก title 1 ใน 3
  - ตอบ comments ทุกอันชั่วโมงแรก

- [ ] **Buy domain** — `spoilershield.com`
  - Namecheap หรือ Cloudflare ($12/yr)

- [ ] **Build landing page**
  - Spec ใน `marketing/LANDING_PAGE.md`
  - ถ้าไม่ว่าง → ถ้าฉันว่าจะเขียน HTML ให้ก็ได้ (แจ้งมา)
  - Deploy: Vercel drag-and-drop

- [ ] **Record demo GIF**
  - 10 วินาที: YouTube blur, Google blur, Alt+S toggle
  - Tool: Kap (free Mac), CleanShot, หรือ Loom → export GIF
  - ใช้กับ Reddit, PH, landing page

## 🟢 NEXT WEEK — Scale

- [ ] **Reddit post — r/PremierLeague** (ห่างจากโพสต์แรก 2 วัน)
- [ ] **Reddit post — r/chrome_extensions** (tech audience)
- [ ] **Product Hunt launch** — วันอังคาร, plan จาก `marketing/PRODUCT_HUNT.md`
- [ ] **Tweet thread** — "Built a Chrome extension that hides sports spoilers. Here's the tech."
- [ ] **First blog post** — on blog.spoilershield.com

## 🔵 MONTH 2 — Optimize

- [ ] **Review conversion data** — ExtensionPay dashboard
  - < 1% → ราคาสูงไป หรือ product ยังไม่ compelling
  - 1-3% → ok, keep growing
  - > 3% → winning, scale ads
- [ ] **A/B test pricing** — $4.99 vs $9.99 one-time vs $2.99/mo
- [ ] **Build "Excitement Score" feature** (ดูใน PROJECT-BRIEF.md)
- [ ] **Firefox port** — 30% ของ potential market

---

## Hard numbers — target 60 วันข้างหน้า

| Milestone | Metric |
|-----------|--------|
| Week 1 (store update + Reddit) | 100 installs, 1-3 paid |
| Week 2 (PH + landing page) | 500 installs, 10-15 paid |
| Week 4 | 1,500 installs, 30-50 paid |
| Week 8 | 5,000 installs, 150+ paid |

Revenue target 60 วัน: **$750-1,000**

---

## เอกสารพร้อมใช้

- `STORE_LISTING.md` — paste ลง CWS
- `marketing/REDDIT_POSTS.md` — 5 variations, timing plan
- `marketing/PRODUCT_HUNT.md` — full launch plan
- `marketing/LANDING_PAGE.md` — copy + spec + SEO
- `PROJECT-BRIEF.md` — original strategy (อ้างอิง)

---

## สิ่งที่ฉันทำให้ต่อได้ (แจ้งมา):

1. **เขียน landing page HTML** เต็มๆ พร้อม Tailwind — deploy ได้เลย
2. **เขียน blog posts** (5 บทความ SEO)
3. **เขียน Twitter thread** launch day
4. **Implement Excitement Score feature** (premium value add)
5. **Firefox port** (Manifest V2/V3 compat)
6. **Add more leagues/teams** (ญี่ปุ่น J.League, เกาหลี K.League, ฯลฯ)
7. **Optimize popup UI** — เพิ่ม "share" button, review prompt
