# Skrawl — Deploy & Update Guide

## Prerequisites

- Node 20+ (`nvm use 20`)
- Xcode installed with your Apple ID signed in
- EAS CLI logged in (`eas login`)

---

## Push OTA Updates (no rebuild needed)

For JS-only changes (components, logic, styles, stores):

```bash
cd ~/Workspace/skrawl/skrawl-app
nvm use 20
npx eas-cli update --branch production --message "Fix: description of change"
```

Users get the update automatically on next app launch.

**What qualifies as OTA:** Any change to `.ts`, `.tsx`, `.js` files, or JS-loaded assets.

**What requires a full rebuild:** New native modules, `app.json` changes, iOS config changes.

---

## Full Rebuild & Install on Your iPhone

When you add native modules or change `app.json`:

```bash
cd ~/Workspace/skrawl/skrawl-app
nvm use 20

# Build release for your device
xcodebuild -workspace ios/skrawlapp.xcworkspace \
  -scheme skrawlapp \
  -configuration Release \
  -destination "platform=iOS,id=00008140-001C38C422C3801C" \
  -allowProvisioningUpdates build

# Install on phone (keep it plugged in + unlocked)
xcrun devicectl device install app \
  --device 94FF8C98-6031-57EC-AE3B-39011F227776 \
  ~/Library/Developer/Xcode/DerivedData/skrawlapp-*/Build/Products/Release-iphoneos/skrawlapp.app
```

Or just open Xcode, select your iPhone, and press **Cmd+R**.

---

## Free Signing — 7 Day Expiry

You're using a **free Apple Developer account** (personal team). This means:

- Apps expire after **7 days** and won't open
- To re-sign: plug your iPhone into your Mac and rebuild (Cmd+R in Xcode or the xcodebuild command above)
- **Developer Mode** must stay enabled on your iPhone (Settings → Privacy & Security → Developer Mode)
- You can have up to **3 apps** sideloaded at once on the free tier

### To avoid the 7-day limit:
- **Option A:** Pay $99/year for Apple Developer Program — apps never expire
- **Option B:** Re-sign weekly by plugging in and rebuilding (~2 min)

---

## Sharing with Friends

### Same WiFi (easiest)
```bash
nvm use 20
npx expo start
```
Friends install **Expo Go** (free), scan the QR code.

### Any network (via published update)
Friends install Expo Go and open:
```
exp://u.expo.dev/688d4039-5596-48d5-af4f-06342bc69804?channel-name=production
```

---

## Device IDs (your iPhone)

| ID Type | Value |
|---------|-------|
| UDID | `00008140-001C38C422C3801C` |
| CoreDevice ID | `94FF8C98-6031-57EC-AE3B-39011F227776` |
| Bundle ID | `com.avinash.skrawl` |
| EAS Project ID | `688d4039-5596-48d5-af4f-06342bc69804` |
| Signing Team | `HNMHFHWYD4` |

---

## Typical Workflow

1. Make code changes
2. Test on simulator: `npx expo run:ios --device "iPhone 16e"`
3. If JS-only: push OTA update
4. If native change: rebuild + install on phone
5. Commit to GitHub: `git add . && git commit -m "message" && git push`
