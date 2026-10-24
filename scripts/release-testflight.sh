#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "TestFlight iOS releases require macOS and Xcode." >&2
  exit 1
fi

for command_name in node npx xcodebuild pod; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name" >&2
    exit 1
  fi
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$script_dir")"

auth_key_id="${ASC_API_KEY_ID:-}"
auth_issuer_id="${ASC_API_ISSUER_ID:-}"
auth_key_path="${ASC_API_KEY_PATH:-}"
if [[ -n "$auth_key_id$auth_issuer_id$auth_key_path" ]]; then
  if [[ -z "$auth_key_id" || -z "$auth_issuer_id" ]]; then
    echo "Set both ASC_API_KEY_ID and ASC_API_ISSUER_ID to use App Store Connect API-key signing." >&2
    exit 1
  fi
  if [[ -z "$auth_key_path" ]]; then
    auth_key_path="$HOME/.appstoreconnect/private_keys/AuthKey_${auth_key_id}.p8"
  fi
  if [[ ! -r "$auth_key_path" ]]; then
    echo "App Store Connect API key is missing or unreadable: $auth_key_path" >&2
    exit 1
  fi
fi

app_version="$(node -p "require('./app.json').expo.version")"
build_number="$(node -p "require('./app.json').expo.ios.buildNumber")"
team_id="$(node -p "require('./app.json').expo.ios.appleTeamId")"
bundle_id="$(node -p "require('./app.json').expo.ios.bundleIdentifier")"
archive_path="${SPLITBEAT_ARCHIVE_PATH:-/private/tmp/SplitBeat-TestFlight-${app_version}-${build_number}.xcarchive}"
release_dir="$(mktemp -d /private/tmp/splitbeat-testflight-upload.XXXXXX)"
export_path="$release_dir/export"
export_options_path="$release_dir/ExportOptions.plist"
derived_data_path=""
owns_derived_data_path=0
cleanup_release_files() {
  rm -rf "$release_dir"
  if (( owns_derived_data_path == 1 )); then
    rm -rf "$derived_data_path"
  fi
}
trap cleanup_release_files EXIT

if [[ ! -e "$archive_path" ]]; then
  available_kb="$(df -Pk /private/tmp | awk 'NR == 2 { print $4 }')"
  if [[ ! "$available_kb" =~ ^[0-9]+$ ]] || (( available_kb < 20971520 )); then
    echo "At least 20 GiB of free space is required for a local iOS Release archive." >&2
    echo "Current free space on /private/tmp: ${available_kb:-unknown} KiB." >&2
    exit 1
  fi

  echo "Regenerating the iOS project from Expo config..."
  npx expo prebuild --platform ios --no-install
  pod install --project-directory=ios
  node scripts/ensure-hermes-minimum-os.mjs

  workspace_path="$(find ios -maxdepth 1 -type d -name '*.xcworkspace' -print -quit)"
  if [[ -z "$workspace_path" ]]; then
    echo "Expo prebuild and CocoaPods did not generate an iOS workspace." >&2
    exit 1
  fi
  scheme="$(basename "$workspace_path" .xcworkspace)"

  if [[ -n "${SPLITBEAT_DERIVED_DATA_PATH:-}" ]]; then
    derived_data_path="$SPLITBEAT_DERIVED_DATA_PATH"
    if [[ -e "$derived_data_path" ]]; then
      echo "Derived data path already exists: $derived_data_path" >&2
      echo "Choose a new SPLITBEAT_DERIVED_DATA_PATH or leave it unset." >&2
      exit 1
    fi
    mkdir -p "$derived_data_path"
  else
    derived_data_path="$(mktemp -d /private/tmp/splitbeat-testflight-derived.XXXXXX)"
    owns_derived_data_path=1
  fi

  mkdir -p "$(dirname "$archive_path")"

  xcodebuild_args=(
    -workspace "$workspace_path"
    -scheme "$scheme"
    -configuration Release
    -destination 'generic/platform=iOS'
    -archivePath "$archive_path"
    -derivedDataPath "$derived_data_path"
    -allowProvisioningUpdates
  )
  if [[ -n "$auth_key_id" ]]; then
    xcodebuild_args+=(
      -authenticationKeyPath "$auth_key_path"
      -authenticationKeyID "$auth_key_id"
      -authenticationKeyIssuerID "$auth_issuer_id"
    )
  fi
  xcodebuild_args+=(
    CODE_SIGN_STYLE=Automatic
    DEVELOPMENT_TEAM="$team_id"
    MARKETING_VERSION="$app_version"
    CURRENT_PROJECT_VERSION="$build_number"
  )

  echo "Archiving Beep Beep Beat - Rhythm Coach $app_version ($build_number) with local Xcode..."
  xcodebuild "${xcodebuild_args[@]}" archive
else
  echo "Reusing existing archive at $archive_path."
fi

archived_app="$(find "$archive_path/Products/Applications" -maxdepth 1 -name '*.app' -print -quit)"
if [[ -z "$archived_app" ]]; then
  echo "Xcode archive did not contain an app bundle." >&2
  exit 1
fi

archived_version="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$archived_app/Info.plist")"
archived_build="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$archived_app/Info.plist")"
archived_bundle="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$archived_app/Info.plist")"
archived_encryption="$(/usr/libexec/PlistBuddy -c 'Print :ITSAppUsesNonExemptEncryption' "$archived_app/Info.plist")"
if /usr/libexec/PlistBuddy -c 'Print :NSMicrophoneUsageDescription' "$archived_app/Info.plist" >/dev/null 2>&1; then
  echo "The archive unexpectedly contains an NSMicrophoneUsageDescription; refusing to upload." >&2
  exit 1
fi
if [[ "$archived_version" != "$app_version" || "$archived_build" != "$build_number" || "$archived_bundle" != "$bundle_id" || "$archived_encryption" != "false" ]]; then
  echo "The archived app metadata does not match the release settings; refusing to upload." >&2
  exit 1
fi
echo "Archive verified: $archived_bundle $archived_version ($archived_build), encryption exempted."
hermes_info_plist="$archived_app/Frameworks/hermesvm.framework/Info.plist"
if [[ ! -f "$hermes_info_plist" ]]; then
  echo "The archive is missing the Hermes framework Info.plist; refusing to upload." >&2
  exit 1
fi
hermes_minimum_os="$(/usr/libexec/PlistBuddy -c 'Print :MinimumOSVersion' "$hermes_info_plist" 2>/dev/null || true)"
if [[ -z "$hermes_minimum_os" ]]; then
  echo "The archived Hermes framework has no MinimumOSVersion; refusing to upload." >&2
  exit 1
fi
echo "Hermes framework MinimumOSVersion verified: $hermes_minimum_os."
echo "Archive path: $archive_path"

if [[ "${SPLITBEAT_ARCHIVE_ONLY:-0}" == "1" ]]; then
  echo "Archive-only mode: skipping App Store Connect upload."
  exit 0
fi

cat > "$export_options_path" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>destination</key><string>upload</string>
  <key>manageAppVersionAndBuildNumber</key><false/>
  <key>method</key><string>app-store-connect</string>
  <key>signingStyle</key><string>automatic</string>
  <key>teamID</key><string>${team_id}</string>
  <key>uploadSymbols</key><true/>
</dict>
</plist>
PLIST

echo "Uploading build $build_number to App Store Connect with Xcode..."
export_args=(
  -archivePath "$archive_path"
  -exportPath "$export_path"
  -exportOptionsPlist "$export_options_path"
  -allowProvisioningUpdates
)
if [[ -n "$auth_key_id" ]]; then
  export_args+=(
    -authenticationKeyPath "$auth_key_path"
    -authenticationKeyID "$auth_key_id"
    -authenticationKeyIssuerID "$auth_issuer_id"
  )
fi
if ! xcodebuild -exportArchive "${export_args[@]}"; then
  echo "Xcode could not upload the archive. It is retained at $archive_path." >&2
  exit 1
fi

echo "App Store Connect accepted the upload. Build $build_number will appear in TestFlight after Apple finishes processing it."
