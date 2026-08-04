# Parda kalkulyatori

Parda/karniz buyurtmalarini hisoblash, mijoz cheki (JPG) chiqarish va buyurtmalar tarixini yuritish uchun PWA (Progressive Web App).

## Fayl tuzilishi

```
index.html          — asosiy sahifa skeleti
css/style.css        — barcha stillar
js/utils.js           — formatlash, xavfsiz localStorage, debounce
js/state.js           — global holat va saqlash funksiyalari
js/mijoz.js            — mijoz ma'lumotlari, telefon maydoni
js/mahsulotlar.js       — mahsulotlar ro'yxati, drawer, modal
js/xona.js               — xona/parda o'lchamlari
js/andoza.js              — namuna rasm yuklash (siqib saqlaydi)
js/kalkulyator.js          — hisob qatorlari, summalar
js/chek.js                  — JPG chek, taqvim eslatmasi (.ics)
js/tarix.js                  — buyurtmalar tarixi, qidiruv, to'lovlar
js/backup.js                  — zaxira nusxa export/import
js/main.js                     — navigatsiya, ilovani ishga tushirish
js/vendor/html2canvas.min.js    — JPG generatsiya kutubxonasi (lokal, offline uchun)
manifest.json                    — PWA manifest
sw.js                             — service worker (offline kesh)
icons/                             — PWA ikonalari
```

## GitHub Pages'da ishga tushirish

1. Shu papkadagi barcha fayllarni repo'ga push qiling (papka strukturasini saqlagan holda).
2. Repo Settings → Pages → Source: `main` branch, `/ (root)`.
3. Bir necha daqiqadan so'ng `https://<username>.github.io/<repo>/` manzilida ochiladi.

## Biror bo'limni o'zgartirish kerak bo'lsa

Endi butun faylni emas, faqat tegishli `js/*.js` faylini oching:
- Narxlar/mahsulotlar mantig'ini o'zgartirish → `js/mahsulotlar.js` yoki `js/kalkulyator.js`
- Chek ko'rinishini o'zgartirish → `js/chek.js`
- Tarix/qidiruv → `js/tarix.js`
- Rangларни/uslubni o'zgartirish → `css/style.css`

## Bajarilgan yaxshilanishlar

1. **Fayllarga bo'lindi** — 1700+ qatorli bitta fayl endi CSS/JS bo'yicha 10+ kichik faylga bo'lindi.
2. **Rasm siqish** — andoza rasmlari `<canvas>` orqali (max 1000px, JPEG 72%) siqilib saqlanadi, localStorage joyi tejaladi.
3. **html2canvas lokal** — endi CDN'ga bog'liq emas, offline holatda ham JPG eksport ishlaydi (`sw.js` orqali keshlangan).
4. **try/catch** — barcha localStorage o'qish/yozish amallari xavfsiz (`safeGetLS`/`safeSetLS`), xato bo'lsa foydalanuvchiga tushunarli xabar chiqadi.
5. **Debounce** — Tarix qidiruvi endi har harf bosilganda emas, 250ms tin olgandan keyin qidiradi.

## Bajarilmagan (keyingi bosqich uchun) — sabab bilan

- **Backend/bulutga sinxronlash (Firebase/Supabase)** — bu alohida xizmat hisobi (loyiha yaratish, autentifikatsiya sozlash) talab qiladi, shuning uchun sizning tasdig'ingiz va tanlovingizsiz amalga oshirilmadi.
- **Alpine.js/Vue'ga to'liq o'tish** — bu butun render mantig'ini qayta yozishni anglatadi (yuqori xavf/xato ehtimoli). Fayllarga bo'lish orqali asosiy foyda (o'qish/tahrirlash qulayligi)ning katta qismi allaqachon qo'lga kiritildi.
