import { readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const xcode = require('xcode');
const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const iosRoot = resolve(projectRoot, 'ios');
const phaseName = '[Split Beat] Set Hermes MinimumOSVersion';

const entries = await readdir(iosRoot, { withFileTypes: true });
const projectDirectory = entries.find(
  (entry) => entry.isDirectory() && entry.name.endsWith('.xcodeproj'),
);

if (!projectDirectory) {
  throw new Error('Could not find the generated iOS Xcode project.');
}

const projectPath = resolve(iosRoot, projectDirectory.name, 'project.pbxproj');
const project = xcode.project(projectPath);
project.parseSync();

const target = project.getFirstTarget();
const targetObject = project.hash.project.objects.PBXNativeTarget[target.uuid];

if (!targetObject || targetObject.productType !== '"com.apple.product-type.application"') {
  throw new Error('Could not identify the generated iOS application target.');
}

const shellScript = [
  'set -eu',
  'framework="${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}/hermesvm.framework"',
  'plist="${framework}/Info.plist"',
  'if [ ! -f "$plist" ]; then',
  '  echo "error: Hermes framework Info.plist was not embedded at $plist" >&2',
  '  exit 1',
  'fi',
  'minimum_os="${IPHONEOS_DEPLOYMENT_TARGET:-}"',
  'if [ -z "$minimum_os" ]; then',
  '  echo "error: iOS deployment target is empty; cannot set Hermes MinimumOSVersion" >&2',
  '  exit 1',
  'fi',
  'if /usr/libexec/PlistBuddy -c "Print :MinimumOSVersion" "$plist" >/dev/null 2>&1; then',
  '  /usr/libexec/PlistBuddy -c "Set :MinimumOSVersion $minimum_os" "$plist"',
  'else',
  '  /usr/libexec/PlistBuddy -c "Add :MinimumOSVersion string $minimum_os" "$plist"',
  'fi',
  'actual_minimum_os=$(/usr/libexec/PlistBuddy -c "Print :MinimumOSVersion" "$plist")',
  'if [ -z "$actual_minimum_os" ] || [ "$actual_minimum_os" != "$minimum_os" ]; then',
  '  echo "error: Hermes MinimumOSVersion is invalid: $actual_minimum_os" >&2',
  '  exit 1',
  'fi',
  'echo "Hermes MinimumOSVersion set to $actual_minimum_os"',
].join('\n');

const phaseSection = project.hash.project.objects.PBXShellScriptBuildPhase ?? {};
let phaseEntry = Object.entries(phaseSection).find(
  ([key, phase]) => !key.endsWith('_comment') && phase.name?.replaceAll('"', '') === phaseName,
);

if (phaseEntry) {
  const [phaseUuid, phase] = phaseEntry;
  phase.shellPath = '/bin/sh';
  phase.shellScript = `"${shellScript.replaceAll('"', '\\"')}"`;
  phase.alwaysOutOfDate = 1;
  phase.inputPaths = [];
  phase.outputPaths = [];
  phaseEntry = [phaseUuid, phase];
} else {
  phaseEntry = project.addBuildPhase(
    [],
    'PBXShellScriptBuildPhase',
    phaseName,
    target.uuid,
    { shellPath: '/bin/sh', shellScript, alwaysOutOfDate: true },
  );
}

const phaseUuid = phaseEntry.uuid ?? phaseEntry[0];
const phase = phaseEntry.buildPhase ?? phaseEntry[1];
phase.name = `"${phaseName}"`;

const phaseReference = targetObject.buildPhases.find((item) => item.value === phaseUuid);
if (!phaseReference) {
  throw new Error(`Could not attach the ${phaseName} build phase to the app target.`);
}

targetObject.buildPhases = targetObject.buildPhases.filter((item) => item.value !== phaseUuid);
targetObject.buildPhases.push(phaseReference);
await writeFile(projectPath, project.writeSync());

console.log(`Configured ${phaseName} after the embedded CocoaPods frameworks.`);
