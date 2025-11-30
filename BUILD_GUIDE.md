# APK Build Guide

This project is configured to build Android APKs using GitHub Actions and EAS Build.

## Prerequisites

1. **Expo Account**: Create an account at [expo.dev](https://expo.dev)
2. **EAS CLI**: Installed via `npm install -g eas-cli`
3. **GitHub Token**: Create a Personal Access Token on GitHub

## Setup

### 1. Create EAS Token

```bash
eas login
eas token create
```

This generates an `EAS_TOKEN` that you'll need for GitHub Actions.

### 2. Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `EXPO_TOKEN`
5. Value: Paste your EAS token
6. Click **Add secret**

### 3. Configure Android Keystore (for production builds)

For production/store releases, you'll need to set up signing credentials:

```bash
eas credentials
```

Follow the prompts to configure Android signing. Store credentials are automatically managed by EAS.

## Building

### Automatic Builds

**Push Trigger**: Every push to `main` branch will trigger a build via the `Build APK` workflow.

### Manual Builds

1. Go to **Actions** tab in GitHub
2. Select **Build APK Release**
3. Click **Run workflow**
4. Choose build type:
   - `preview`: For internal testing (APK)
   - `production`: For Play Store release (AAB)

## Build Profiles

Configured in `eas.json`:

- **development**: Internal distribution for testing
- **preview**: Internal distribution (default for GitHub Actions)
- **production**: Play Store distribution

## Workflow Files

### `.github/workflows/build-apk.yml`
- Triggers on every push to `main`
- Builds APK automatically
- Stores artifacts for 30 days

### `.github/workflows/build-apk-release.yml`
- Manual trigger workflow
- Allows choice of build profile
- Useful for releases

## Downloading Builds

### From GitHub Actions
1. Go to the completed workflow run
2. Click **Artifacts** section
3. Download the APK

### From EAS Dashboard
1. Go to [cloud.expo.dev](https://cloud.expo.dev)
2. Select your project
3. View build history and download APKs

## Troubleshooting

### Build Fails with "Unauthorized"
- Check that `EXPO_TOKEN` secret is properly set in GitHub
- Verify token hasn't expired: run `eas token create` again

### Build Fails with Gradle Error
- Ensure Android configuration in `app.json` is valid
- Check bundle identifier: `com.streamplayer.app`
- Run locally: `eas build --platform android --local`

### "No credentials found"
- Configure credentials: `eas credentials`
- For production builds, ensure Play Store signing key is set up

## Local Building

To build locally without GitHub Actions:

```bash
# Development build
eas build --platform android --profile development

# Preview build
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

## Environment Variables

GitHub Actions automatically uses:
- `EXPO_TOKEN`: EAS authentication token

No additional secrets are required for basic builds.

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo GitHub Actions](https://github.com/expo/expo-github-action)
- [Android App Distribution](https://docs.expo.dev/build-reference/android-builds/)
