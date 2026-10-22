import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dependencyPath = resolve(projectRoot, 'node_modules/react-native-audio-api');
const dependencyPackage = JSON.parse(
  await readFile(resolve(dependencyPath, 'package.json'), 'utf8'),
);

if (dependencyPackage.version !== '0.13.6') {
  throw new Error(
    `The iOS audio privacy patch targets react-native-audio-api 0.13.6; found ${dependencyPackage.version}. Review the dependency before updating this patch.`,
  );
}

const managerPath = resolve(
  dependencyPath,
  'ios/audioapi/ios/system/AudioSessionManager.mm',
);
const managerSource = await readFile(managerPath, 'utf8');
const permissionHelperDeclarations = `- (id)microphoneUsageDescriptionValue;
- (bool)usesAudioApplicationRecordPermissionAPI;
- (void)requestSystemRecordPermission:(void (^)(BOOL granted))completion;
- (NSInteger)currentRecordPermissionStatus;
- (NSString *)recordPermissionStatusString:(NSInteger)status;
`;
const startMarker = '- (id)microphoneUsageDescriptionValue\n';
const endMarker = '- (void)getDevicesInfo:';
const start = managerSource.indexOf(startMarker);
const end = managerSource.indexOf(endMarker, start);

if (start === -1 && !managerSource.includes('requestRecordPermission')) {
  process.exit(0);
}

if (start === -1 || end === -1) {
  throw new Error(
    'Could not locate the expected microphone permission methods in the iOS audio dependency.',
  );
}

const disabledPermissionMethods = `- (void)requestRecordingPermissions:(RCTPromiseResolveBlock)resolve
                             reject:(RCTPromiseRejectBlock)reject
{
  resolve(@"Denied");
}

- (NSString *)requestRecordingPermissions
{
  return @"Denied";
}

- (void)checkRecordingPermissions:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject
{
  resolve(@"Denied");
}

- (NSString *)checkRecordingPermissions
{
  return @"Denied";
}

`;
const patchedSource = (
  managerSource.slice(0, start) + disabledPermissionMethods + managerSource.slice(end)
).replace(permissionHelperDeclarations, '');

if (
  patchedSource.includes('requestRecordPermissionWithCompletionHandler') ||
  patchedSource.includes('[self.audioSession requestRecordPermission:') ||
  patchedSource.includes('NSMicrophoneUsageDescription')
) {
  throw new Error('The iOS audio patch left a microphone permission API reference in place.');
}

await writeFile(managerPath, patchedSource);
