# Android App Release Build Guide

This guide explains how to build and sign a new release of the Veerexa School Android app for Google Play Store.

## Prerequisites

1. **Keystore File**: `veerexa-school-release.keystore` (must be present in `android_app/` directory)
2. **Keystore Properties**: `keystore.properties` file with signing credentials
3. **Gradle**: Android Gradle Plugin (configured in `build.gradle.kts`)
4. **JDK**: Java 17 or higher

## Current App Information

- **Package Name**: `com.veerexa.school`
- **Application ID**: `com.veerexa.school`
- **Min SDK**: 28 (Android 9.0 Pie)
- **Target SDK**: 34
- **Keystore Alias**: `veerexa-school`

## Keystore Configuration

The `keystore.properties` file should contain:

```properties
storePassword=VeerexaSchool2025!
keyPassword=VeerexaSchool2025!
keyAlias=veerexa-school
storeFile=../veerexa-school-release.keystore
```

**⚠️ Important**: Keep this file secure and never commit it to version control!

## Step-by-Step Release Build Process

### 1. Update Version Number

Before building a new release, update the version in `app/build.gradle.kts`:

```kotlin
defaultConfig {
    applicationId = "com.veerexa.school"
    minSdk = 28
    targetSdk = 34
    versionCode = 5          // Increment this by 1 for each release
    versionName = "1.0.4"    // Update version name (e.g., 1.0.4, 1.0.5, 1.1.0)
    // ...
}
```

**Version Guidelines:**
- **versionCode**: Always increment by 1 for each release (required by Google Play)
- **versionName**: Human-readable version (can be 1.0.4, 1.0.5, 1.1.0, 2.0.0, etc.)

### 2. Verify Signing Configuration

Ensure `app/build.gradle.kts` has the signing configuration:

```kotlin
import java.util.Properties
import java.io.FileInputStream

// Load keystore properties
val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    FileInputStream(keystorePropertiesFile).use {
        keystoreProperties.load(it)
    }
}

android {
    // ... other config ...
    
    signingConfigs {
        create("release") {
            if (keystorePropertiesFile.exists()) {
                keyAlias = keystoreProperties["keyAlias"] as String?
                keyPassword = keystoreProperties["keyPassword"] as String?
                storeFile = file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String?
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")  // This is important!
        }
    }
}
```

### 3. Clean Previous Builds

```bash
cd android_app
./gradlew clean
```

### 4. Build Release Bundle (AAB) for Google Play

**For Google Play Store upload (recommended):**

```bash
cd android_app
./gradlew bundleRelease
```

The signed AAB file will be generated at:
```
app/build/outputs/bundle/release/app-release.aab
```

### 5. Build Release APK (Alternative)

**If you need an APK instead of AAB:**

```bash
cd android_app
./gradlew assembleRelease
```

The signed APK file will be generated at:
```
app/build/outputs/apk/release/app-release.apk
```

**Note**: Google Play prefers AAB format, but APK can be used for direct distribution or testing.

### 6. Verify the Signed Bundle/APK

**Verify AAB signature:**
```bash
cd android_app
jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release.aab
```

**Verify APK signature:**
```bash
cd android_app
jarsigner -verify -verbose -certs app/build/outputs/apk/release/app-release.apk
```

You should see output showing:
- ✅ Signer certificate information
- ✅ "sm" (signed manifest) entries for all files
- ⚠️ "Invalid certificate chain" warning is normal for self-signed certificates and won't affect Google Play upload

**Check version info:**
```bash
cd android_app
# For AAB (requires bundletool or extract manifest)
unzip -p app/build/outputs/bundle/release/app-release.aab base/manifest/AndroidManifest.xml | strings | grep -E "versionCode|versionName"

# For APK
aapt dump badging app/build/outputs/apk/release/app-release.apk | grep -E "package|versionCode|versionName"
```

## Complete Build Command (One-Liner)

**For AAB (recommended for Google Play):**
```bash
cd android_app && ./gradlew clean bundleRelease
```

**For APK:**
```bash
cd android_app && ./gradlew clean assembleRelease
```

## Troubleshooting

### Error: "All uploaded bundles must be signed"

**Solution**: Ensure the signing configuration is properly set in `app/build.gradle.kts` and the `keystore.properties` file exists with correct credentials.

### Error: "Keystore file not found"

**Solution**: 
1. Verify `veerexa-school-release.keystore` exists in `android_app/` directory
2. Check `keystore.properties` has correct path: `storeFile=../veerexa-school-release.keystore`

### Error: "Invalid keystore password"

**Solution**: Verify the passwords in `keystore.properties` match the actual keystore passwords.

### Build fails with signing errors

**Solution**:
1. Clean the build: `./gradlew clean`
2. Verify keystore file permissions
3. Check `keystore.properties` file syntax
4. Ensure all signing config properties are set correctly

## File Locations Summary

| File Type | Location |
|-----------|----------|
| **Release AAB** | `app/build/outputs/bundle/release/app-release.aab` |
| **Release APK** | `app/build/outputs/apk/release/app-release.apk` |
| **Keystore** | `android_app/veerexa-school-release.keystore` |
| **Keystore Config** | `android_app/keystore.properties` |
| **Build Config** | `android_app/app/build.gradle.kts` |

## Quick Reference

### Update Version and Build New Release

1. **Update version in `app/build.gradle.kts`:**
   ```kotlin
   versionCode = 6        // Increment
   versionName = "1.0.5"  // Update
   ```

2. **Build and sign:**
   ```bash
   cd android_app
   ./gradlew clean bundleRelease
   ```

3. **Find the signed AAB:**
   ```
   app/build/outputs/bundle/release/app-release.aab
   ```

4. **Upload to Google Play Console**

## Version History

| Version | Version Code | Release Date | Notes |
|---------|--------------|--------------|-------|
| 1.0.4 | 5 | Dec 31, 2025 | Initial signed release build |
| 1.0.3 | 4 | Nov 8, 2025 | Previous version (from existing AAB) |

## Important Notes

1. **Always increment versionCode** - Google Play requires each release to have a higher versionCode
2. **Keep keystore secure** - Losing the keystore means you cannot update the app on Google Play
3. **Backup keystore** - Store a secure backup of `veerexa-school-release.keystore`
4. **Never commit keystore** - Ensure `.gitignore` excludes `*.keystore` and `keystore.properties`
5. **AAB is preferred** - Google Play Store prefers AAB format over APK

## Additional Resources

- [Android App Bundle Documentation](https://developer.android.com/guide/app-bundle)
- [Sign Your App - Android Developer Guide](https://developer.android.com/studio/publish/app-signing)
- [Version Your App - Android Developer Guide](https://developer.android.com/studio/publish/versioning)

---

**Last Updated**: December 31, 2025  
**Current Version**: 1.0.4 (versionCode: 5)

