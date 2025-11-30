# GitHub Android APK Build

This project automatically builds Android APKs when you push to the `main` branch.

## Setup Complete ✅

You've already added the `EXPO_TOKEN` secret - that's all you need!

## How It Works

**Automatic:** Push code to `main` → GitHub builds an APK → Download from EAS

**Manual:** Go to Actions tab → Click "Build Android APK" → Run workflow

## Getting Your APK

After a successful build:
1. Check the workflow output for the EAS build URL
2. Go to [expo.dev/accounts](https://expo.dev/accounts) → Your Project → Builds
3. Download your APK file

The APK works on:
- Android phones/tablets
- Fire TV Stick
- Android TV devices

## Troubleshooting

**Build fails?**
- Check that `EXPO_TOKEN` is set in GitHub Secrets
- Token: Go to [expo.dev](https://expo.dev) → Account → Tokens → Create new

**Can't find APK?**
- Go to expo.dev and sign in
- Look for your project in the dashboard
- Click on the latest build to download
