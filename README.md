# ويب نايل

تطبيق عربي لتعلّم HTML وCSS وJavaScript. الواجهة في ملف واحد `src/index.html`،
وتُحوَّل إلى Android بواسطة Capacitor، ويتم البناء على GitHub Actions.

- `bash webnile-setup.sh update`  ← يرفع النسخة الجديدة ويبني APK تجريبياً
- `bash webnile-setup.sh apk`     ← ينزّل آخر APK إلى مجلد Download
- `bash webnile-setup.sh release 1.0.1` ← إصدار موقّع (APK + AAB) لـ Google Play

### ويب نايل برو (اشتراك Google Play)
الدورة الأساسية مجانية بالكامل. الاشتراك الاختياري في `src/premium.js` ومشاريعه في `src/pro-course.js`.
خطوات إعداد المنتجات والاختبار في Play Console: [docs/PLAY_BILLING_SETUP.md](docs/PLAY_BILLING_SETUP.md)
