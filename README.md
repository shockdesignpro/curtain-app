# Lobar Parda — Android, iPhone va iPad uchun PWA

GitHub repozitoriy: https://github.com/shockdesignpro/pczcalc

Nashrdan keyingi manzil: https://shockdesignpro.github.io/pczcalc/
Bu manzil deploy tasdiqlanmaguncha tayyor ilova manzili hisoblanmaydi.

## GitHub Pages'ga joylashtirish

1. `Lobar-Parda-PWA-GitHub.zip` arxivini oching.
2. `pczcalc` repozitoriysida **Add file → Upload files** orqali arxiv ICHIDAGI fayl va papkalarni yuklang. `index.html` repozitoriy ildizida turishi kerak; ZIP faylning o‘zini yuklamang. Mavjud index.html yangilanadi, oldingi versiya Git tarixida qoladi.
3. **Commit changes** ni bosing.
4. **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root) → Save**.
5. Pages nashri muvaffaqiyatli tugagach, yuqoridagi HTTPS manzilni oching.

GitHub ko‘rsatmasi: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## O‘rnatish

- Android: Chrome orqali manzilni oching → menyu → Ilovani o‘rnatish / Bosh ekranga qo‘shish.
- iPhone va iPad: Safari orqali oching → Ulashish → Bosh ekranga qo‘shish. Taklif qilinsa, veb-ilova sifatida ochishni yoqing.
- Sozlamalarda “Offline ishlashga tayyor” chiqishini kuting. Keyingi ochilishlar internet bo‘lmasa ham ishlaydi.
- Apple Developer, Mac, App Store yoki 7 kunlik imzolash talab etilmaydi.
- Dastlabki PIN: 1234. Sozlamalarda almashtiring. PIN — qurilmadagi oddiy kirish qulfi, server akkaunti yoki ma’lumot shifrlashi emas.

## Saqlangan imkoniyatlar

Yashil ranglar, tungi rejim, mijoz/xizmat/hisob bosqichlari, xonalar va derazalar bo‘yicha xarajatlar, tikish/o‘rnatish hisoblari, tayyor chek dizayni, buyurtmalar, to‘lov chegaralari, hisobot filtrlari, katalog CSV import/eksport, rasm tanlash va kamera, qoralama, zaxira import/eksport, PIN sozlamalari bir xil umumiy kodga asoslangan.

Telefon va planshet kengligi, tik/yotiq ekran qo‘llanadi. Haqiqiy Safari/iPad va Android qurilmalaridagi tizim oynalari alohida qurilma sinovini talab qiladi.

## Brauzerga xos farqlar

- Chek tayyorlangach asosiy sahifaga qaytiladi va chek oynasi ochiladi. “Ulashish” tugmasi tizim oynasini foydalanuvchi bosishi bilan ochadi. iOS brauzeri bu bosishni talab qiladi. “Yuklab olish” muqobil yo‘l.
- Photos/galereyaga yashirin avtomatik yozish mumkin emas. iOS ulashish menyusidan “Rasmni saqlash”ni tanlang; Android'da saqlash joyini brauzer boshqaradi.
- Eslatmalar: Sozlamalar → Taqvimga eksport qilish. ICS faylini taqvimga import qiling. Sana o‘zgarganda eski taqvim yozuvini yangilang; qayta import qilganda dublikatlar bo‘lmasligini tekshiring. Ovoz taqvim ilovasida boshqariladi. GitHub Pages server tomonda rejalashtirilgan push yubormaydi; avtomatik push/custom ovoz native ilovadagi kabi bajarilmaydi.
- Juda uzun cheklar iOS xotira chegaralariga sig‘ishi uchun pastroq raster aniqlikda yaratilishi mumkin; bo‘limlar va summalar saqlanadi.

## Ma’lumotlar

Buyurtmalar va rasmlar shu brauzer/qurilmaning localStorage xotirasida; server yoki GitHub'ga yuborilmaydi. Qurilmalar avtomatik sinxronlashmaydi. Android ilovasidan JSON zaxira oling va PWA Sozlamalaridan tiklang. Parol va eslatma sozlamalarini yangi qurilmada qayta belgilang.

Brauzer sayti ma’lumotlarini tozalash buyurtmalarni o‘chiradi. Rasmlar ko‘payganda localStorage hajmi to‘lishi mumkin; ilova saqlash xatosini bildiradi. Zaxiralarni alohida saqlang. PWA'ni o‘rnatib, doim shu belgidan ishlating. Domen o‘zgarsa ma’lumotlar avtomatik ko‘chmaydi.

## Yangilash va ishlab chiqish

`node scripts/build-pwa.mjs` → `dist-pwa/`.
`node scripts/verify.mjs` va `node scripts/pwa-test.mjs`.
Tayyor `dist-pwa/` mazmunini GitHub ildiziga yuklang.
Kesh versiyasi fayllardan avtomatik hisoblanadi. Yangi versiya tayyor bo‘lgach ilovaning barcha oynalarini yopib qayta oching. Yangilanish qoralama yozilayotgan paytda sahifani majburan qayta yuklamaydi va buyurtma xotirasini tozalamaydi.

Mahalliy sinov: `python -m http.server 8782 --directory dist-pwa`, so‘ng `http://localhost:8782`. Telefonda oddiy HTTP LAN manzili to‘liq PWA sinovi o‘rnini bosmaydi; HTTPS Pages manzilidan foydalaning.

## Tekshiruvlar

- Umumiy biznes-mantiq: 128 tekshiruv; 77 inline handler; ranglar/chek himoya hash tekshiruvi.
- PWA: manifest, umumiy kodning aynan nusxasi, taqvim sanalari va belgilar, GitHub `/pczcalc/` yo‘lida offline index/ikonka/import rasmlari, boshqa ilovalar keshiga tegmaslik.
- Brauzer: PIN, buyurtma oqimi, xona o‘lchamlari, chek yaratish, asosiy sahifaga qaytish. Haqiqiy iOS/Android share sheet va install sinovi hali qurilmalarda bajarilmagan.
