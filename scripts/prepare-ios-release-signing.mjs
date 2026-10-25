import { readFile, writeFile } from 'node:fs/promises';

const projectPath = process.argv[2];

if (!projectPath) {
  console.error('Usage: node scripts/prepare-ios-release-signing.mjs <project.pbxproj>');
  process.exit(1);
}

const project = await readFile(projectPath, 'utf8');
const legacyDevelopmentIdentity = /^\s*"CODE_SIGN_IDENTITY\[sdk=iphoneos\*\]" = "iPhone Developer";\r?\n/gm;
const matches = [...project.matchAll(legacyDevelopmentIdentity)];

if (matches.length !== 2) {
  console.error(`Expected two legacy iPhone Developer identity settings in ${projectPath}; found ${matches.length}.`);
  process.exit(1);
}

const preparedProject = project.replace(legacyDevelopmentIdentity, '');
await writeFile(projectPath, preparedProject);
console.log('Removed Expo’s legacy iPhone Developer identity overrides so the Release archive can use automatic distribution signing.');
