# Builds a release APK without writing anything to C:.
# Usage (from the remainder-app folder):  powershell -ExecutionPolicy Bypass -File scripts\build-apk.ps1
# Output: ..\Remainder.apk   Log: X:\Project-Buildings\_toolchain\build-apk.log

$ErrorActionPreference = 'Stop'
$tool = 'X:\Project-Buildings\_toolchain'
$sdk = "$tool\android-sdk"
$app = Split-Path -Parent $PSScriptRoot

# First run: seed the X: SDK by copying what C: already has (C: is only read).
# Gradle downloads anything still missing (build-tools 36, NDK, CMake) into this folder.
if (-not (Test-Path "$sdk\platforms\android-36")) {
    $old = "$env:LOCALAPPDATA\Android\Sdk"
    New-Item -ItemType Directory -Force "$sdk\platforms" | Out-Null
    Copy-Item -Recurse -Force "$old\licenses" "$sdk\licenses"
    Copy-Item -Recurse -Force "$old\platforms\android-36" "$sdk\platforms\android-36"
    if (Test-Path "$old\platform-tools") { Copy-Item -Recurse -Force "$old\platform-tools" "$sdk\platform-tools" }
}

New-Item -ItemType Directory -Force "$tool\gradle-home", "$tool\tmp" | Out-Null

# Reuse the Gradle distribution already unpacked on C: so the wrapper does not download it again.
$dist = 'wrapper\dists\gradle-8.14.3-bin\cv11ve7ro1n3o1j4so8xd9n66'
if (-not (Test-Path "$tool\gradle-home\$dist\gradle-8.14.3-bin.zip.ok") -and (Test-Path "$env:USERPROFILE\.gradle\$dist\gradle-8.14.3")) {
    Remove-Item -Recurse -Force "$tool\gradle-home\$dist" -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force "$tool\gradle-home\$dist" | Out-Null
    Copy-Item -Recurse -Force "$env:USERPROFILE\.gradle\$dist\gradle-8.14.3" "$tool\gradle-home\$dist\gradle-8.14.3"
    Copy-Item -Force "$env:USERPROFILE\.gradle\$dist\gradle-8.14.3-bin.zip.ok" "$tool\gradle-home\$dist\"
}

# Everything the build writes goes under X:.
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:GRADLE_USER_HOME = "$tool\gradle-home"
$env:TEMP = "$tool\tmp"
$env:TMP = "$tool\tmp"
$env:JAVA_TOOL_OPTIONS = "-Djava.io.tmpdir=$tool\tmp"
# Reuse the libraries already downloaded on C: (read-only) instead of downloading them again.
if (Test-Path "$env:USERPROFILE\.gradle\caches\modules-2") { $env:GRADLE_RO_DEP_CACHE = "$env:USERPROFILE\.gradle\caches" }

Set-Location "$app\android"
# arm64-v8a covers practically every Android phone from the last 7 years and halves the build.
$p = Start-Process -FilePath "$app\android\gradlew.bat" -WorkingDirectory "$app\android" -NoNewWindow -Wait -PassThru `
    -ArgumentList 'assembleRelease', '-PreactNativeArchitectures=arm64-v8a', '--console=plain', '--no-daemon' `
    -RedirectStandardOutput "$tool\build-apk.log" -RedirectStandardError "$tool\build-apk.err.log"
if ($p.ExitCode -ne 0) { Write-Host "Build failed. See $tool\build-apk.log and build-apk.err.log"; exit $p.ExitCode }

Copy-Item -Force "$app\android\app\build\outputs\apk\release\app-release.apk" "$app\..\Remainder.apk"
Write-Host "APK ready: $((Resolve-Path "$app\..\Remainder.apk").Path)"
