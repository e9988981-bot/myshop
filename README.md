# MyShop Monorepo

Multi-shop landing + single Admin backend on Cloudflare (Pages + Worker + D1 + Images).

- **Landing**: One Cloudflare Pages project per shop; each uses `SHOP_ID` and fetches public data from the Admin Worker.
- **Admin**: One Worker serving the Admin API and Admin UI; all shops share it.

**รันบน Cloudflare อย่างเดียว — ไม่ต้องติดตั้ง Node ที่เครื่องคุณ.** Build และ deploy ผ่าน GitHub ที่เชื่อมกับ Cloudflare.

## โครงสร้าง repo

- `apps/landing` — Astro + Tailwind, static → Cloudflare Pages
- `apps/admin` — Hono Worker (API + Admin UI จาก Vite/React), โฟลเดอร์เดียว build ได้ ไม่ต้องใช้ monorepo root
- `packages/shared` — ใช้เมื่อรัน local / tests (admin มีสำเนาใน `apps/admin/shared` สำหรับ build บน Cloudflare)

## สิ่งที่ต้องมี

- บัญชี Cloudflare (Pages, Workers, D1, Images; KV ถ้าต้องการ rate limit)
- Repo ใน GitHub สำหรับเชื่อมกับ Cloudflare

## 1. สร้างทรัพยากรใน Cloudflare Dashboard

1. **D1**  
   สร้างฐานข้อมูล (ชื่อเช่น `myshop-d1`) แล้วจด **Database ID** ไว้

2. **KV** (ไม่บังคับ ใช้จำกัดการลองล็อกอิน)  
   สร้าง namespace แล้วจด **ID** ไว้

3. **Images**  
   เปิด Cloudflare Images แล้วสร้าง variant สองตัว:
   - `avatar`: 256×256, fit **Cover** (center crop)
   - `cover`: 1280×720, fit **Cover** (center crop)  
   สร้าง API Token ที่มีสิทธิ์ **Cloudflare Images Edit** แล้วจด **Account ID** กับ token ไว้

## 2. D1: รัน migrations (ไม่ใช้ Node)

- ไปที่ **Workers & Pages → D1 → เลือกฐานข้อมูล**  
- เปิดแท็บ **Console**  
- คัดลอก SQL จากไฟล์ `apps/admin/migrations/0001_init.sql` ไปวางแล้วรัน

หรือใช้คำสั่งในไฟล์นั้นทีละบล็อก (สร้างตาราง `users` และ `shops` พร้อม index)

## 3. Deploy Admin Worker (ผ่าน GitHub)

1. ใน **Workers & Pages** กด **Create application** → **Worker** → **Connect to Git**
2. เลือก repo และ branch
3. ตั้งค่า:
   - **Root directory**: `apps/admin`
   - **Build command**: `npm install && npm run build`  
     (หรือ `pnpm install && pnpm run build` ถ้าใช้ pnpm)
   - **Build output**: ใช้ค่า default (Wrangler จะใช้ `main` + `[assets]` จาก wrangler.toml)
4. ไปที่ **Settings** ของ Worker:
   - **Variables**: ใส่ตาม `wrangler.toml`  
     - `ALLOWED_ORIGINS` = URL ของ Worker + URL ของ Landing (คั่นด้วย comma)  
     - `IMAGES_ACCOUNT_ID`, `IMAGES_ACCOUNT_HASH`, `IMAGES_VARIANT_AVATAR`, `IMAGES_VARIANT_COVER`
   - **D1**: ผูก D1 database กับ binding ชื่อ `DB`
   - **KV** (ถ้าใช้): ผูก KV กับ binding ชื่อ `RATE_LIMIT`
   - **Secrets**: ใส่ **`JWT_SECRET`** (ต้องมี ถ้าไม่มีล็อกอินจะ 500), `IMAGES_API_TOKEN`, `SEED_SECRET` (ใช้สำหรับ seed / รีเซ็ตรหัสผ่าน)

แก้ `apps/admin/wrangler.toml` ให้ใช้ **database_id** และ (ถ้าใช้ KV) **id** ของ KV ที่สร้างไว้

## 4. Seed: สร้างแอดมินคนแรก + ร้านแรก (ไม่ใช้ Node)

หลัง deploy Worker แล้ว เรียก API ครั้งเดียวจาก browser หรือเครื่องอื่นก็ได้:

```http
POST https://<your-worker-url>/api/seed
Content-Type: application/json

{
  "secret": "<ค่าที่ตั้งเป็น SEED_SECRET>",
  "email": "your@email.com",
  "password": "รหัสผ่านอย่างน้อย 8 ตัว"
}
```

- ถ้าสำเร็จจะได้ `{ "ok": true, "email": "...", "shopId": "..." }`  
  ใช้ **shopId** นี้เป็น `PUBLIC_SHOP_ID` ของ Landing
- ถ้ามี user แล้วจะได้ 409 ไม่สร้างซ้ำ  
- หลัง seed เสร็จจะลบหรือเก็บ `SEED_SECRET` ไว้ก็ได้ (ไม่เรียก seed ซ้ำ)

## 5. Deploy Landing (ผ่าน GitHub, หนึ่งโปรเจกต์ต่อหนึ่งร้าน)

1. ใน **Workers & Pages** กด **Create application** → **Pages** → **Connect to Git**
2. เลือก repo เดียวกัน และ branch
3. ตั้งค่า:
   - **Root directory**: `apps/landing`
   - **Build command**: `npm install && npm run build` (หรือ `pnpm install && pnpm run build`)
   - **Build output directory**: `dist`
4. ไปที่ **Settings → Environment variables** (Production):
   - `PUBLIC_API_BASE` = URL ของ Admin Worker (เช่น `https://myshop-admin.xxx.workers.dev`)
   - `PUBLIC_SHOP_ID` = shop ID ของร้านนี้ (จากขั้นตอน seed หรือจาก Admin หลังสร้างร้านใหม่)

แต่ละร้าน = หนึ่งโปรเจกต์ Pages (หรือหนึ่ง branch/env) ที่ใส่ `PUBLIC_SHOP_ID` คนละค่า

## สรุป API

- `POST /api/seed` — สร้างแอดมินคนแรก + ร้านแรก (ใช้ครั้งเดียว, ต้องมี `SEED_SECRET`)
- `POST /api/auth/login` — ล็อกอิน แอดมิน
- `POST /api/auth/logout` — ล็อกเอาท์
- `GET /api/me` — ดู user ปัจจุบัน
- `POST /api/shops` — สร้างร้าน (admin)
- `GET /api/shops`, `GET /api/shops/:id`, `PUT /api/shops/:id` — จัดการร้าน
- `POST /api/shops/:id/images/profile`, `.../cover` — ได้ direct upload URL
- `PUT /api/shops/:id/images/profile`, `.../cover` — เก็บ imageId หลังอัปโหลด
- `GET /public/shops/:id` — ข้อมูลร้านแบบ public (สำหรับ Landing)

## ความปลอดภัย

- รหัสผ่าน: PBKDF2-SHA256, 100k iterations, salt สุ่ม
- Session: JWT ใน httpOnly, Secure, SameSite=Strict cookie
- CORS ตาม `ALLOWED_ORIGINS`
- จำกัดการลองล็อกอินด้วย KV (ถ้าผูกแล้ว): 5 ครั้ง / 15 นาที ต่อ IP

## Tests (ถ้ามี Node ที่เครื่อง)

```bash
pnpm install
pnpm test
```

Tests อยู่ที่ `packages/shared`; ถ้ารันเฉพาะบน Cloudflare ไม่จำเป็นต้องรัน
