# استوديو المحتوى

برنامج سطح مكتب (Electron) لإدارة حسابات التواصل، الأفكار، البثوث، واستخراج اللقطات من الفيديوهات.

- `app/` كود البرنامج.
- `updates/` ملفات التحديث التلقائي اللي يقراها البرنامج من:
  `https://raw.githubusercontent.com/onzqa7/conent-porject/main/updates/`

## نشر تحديث للواجهة
```
node tools/publish-ui.js 2.0.1 "وش تغير"
git add -A && git commit -m "UI 2.0.1" && git push
```
البرنامج يشيك كل 6 ساعات وعند التشغيل، ويطلب من المستخدم إعادة التحميل.

## بناء نسخة ويندوز
```
cd app && npm i --omit=dev && cd ..
npx @electron/packager app "Content Studio" --platform=win32 --arch=x64 --electron-version=44.6.0 --icon=app/icon.ico --asar --extra-resource=res/bin
```
`res/bin/ffmpeg.exe` من حزمة `ffmpeg-static` (بـ `npm_config_platform=win32`).

## نشر تحديث للمحرك (main.js / preload.js)
البرنامج يقدر يحدّث `resources/app.asar` لحاله بدون تحميل نسخة كاملة:
1. ارفع الرقم في `app/package.json` وشغّل `node tools/publish-ui.js <نفس الرقم> "وش تغير" <نفس الرقم>`.
2. ابنِ نسخة ويندوز (الأمر فوق)، وحط `resources/app.asar` داخل مجلد `content-studio-<ver>/resources/` واضغطه إلى `updates/shell/content-studio-<ver>.zip`.
3. حدّث `shell` في `updates/manifest.json` (version و url و sha256) وادفع.
