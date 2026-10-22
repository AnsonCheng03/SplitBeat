const fs = require('node:fs/promises');
const path = require('node:path');
const { withDangerousMod } = require('@expo/config-plugins');

const BACKGROUND_COLOR = '#0B0F14';
const IOS_STORYBOARD_COLOR = '<color key="backgroundColor" red="0.043137" green="0.058824" blue="0.078431" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>';
const ANDROID_DENSITIES = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];

async function findIosApplicationDirectory(iosProjectRoot) {
  const entries = await fs.readdir(iosProjectRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || ['Pods', 'build'].includes(entry.name)) continue;

    const appDirectory = path.join(iosProjectRoot, entry.name);
    const storyboardPath = path.join(appDirectory, 'SplashScreen.storyboard');
    const assetCatalogPath = path.join(appDirectory, 'Images.xcassets');

    try {
      await Promise.all([fs.access(storyboardPath), fs.access(assetCatalogPath)]);
      return appDirectory;
    } catch {
      // Keep looking; the native project can have other source folders.
    }
  }

  throw new Error('Could not find the iOS app folder with its splash storyboard and asset catalog.');
}

function withIosSplash(config) {
  return withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const appDirectory = await findIosApplicationDirectory(modConfig.modRequest.platformProjectRoot);
      const splashAssetDirectory = path.join(appDirectory, 'Images.xcassets', 'SplashScreen.imageset');
      const splashImage = path.join(splashAssetDirectory, 'split-beat-splash.png');
      const splashSource = path.join(modConfig.modRequest.projectRoot, 'assets', 'splash.png');
      const contents = {
        images: [{ filename: 'split-beat-splash.png', idiom: 'universal', scale: '3x' }],
        info: { author: 'xcode', version: 1 },
      };

      await fs.mkdir(splashAssetDirectory, { recursive: true });
      await fs.copyFile(splashSource, splashImage);
      await fs.writeFile(path.join(splashAssetDirectory, 'Contents.json'), `${JSON.stringify(contents, null, 2)}\n`);

      const storyboardPath = path.join(appDirectory, 'SplashScreen.storyboard');
      const storyboard = await fs.readFile(storyboardPath, 'utf8');
      const backgroundPattern = /<color key="backgroundColor" systemColor="systemBackgroundColor"\s*\/>|<color key="backgroundColor" systemColor="systemBackgroundColor">[\s\S]*?<\/color>/;
      const updatedStoryboard = storyboard.includes(IOS_STORYBOARD_COLOR)
        ? storyboard
        : storyboard.replace(backgroundPattern, IOS_STORYBOARD_COLOR);

      if (updatedStoryboard === storyboard && !storyboard.includes(IOS_STORYBOARD_COLOR)) {
        throw new Error('Could not find the iOS splash background color in SplashScreen.storyboard.');
      }

      await fs.writeFile(storyboardPath, updatedStoryboard);
      return modConfig;
    },
  ]);
}

function withAndroidSplash(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const resourceRoot = path.join(modConfig.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res');

      for (const density of ANDROID_DENSITIES) {
        const drawableDirectory = path.join(resourceRoot, `drawable-${density}`);
        const source = path.join(projectRoot, 'assets', 'brand', `splash-${density}.png`);
        await fs.mkdir(drawableDirectory, { recursive: true });
        await fs.copyFile(source, path.join(drawableDirectory, 'splashscreen_logo.png'));
      }

      const valuesDirectory = path.join(resourceRoot, 'values');
      const colorsPath = path.join(valuesDirectory, 'colors.xml');
      await fs.mkdir(valuesDirectory, { recursive: true });

      let colorsXml;
      try {
        colorsXml = await fs.readFile(colorsPath, 'utf8');
      } catch {
        colorsXml = '<resources>\n  <color name="splashscreen_background">#FFFFFF</color>\n</resources>\n';
      }

      const splashColor = new RegExp(`<color name="splashscreen_background">[\\s\\S]*?<\\/color>`);
      if (splashColor.test(colorsXml)) {
        colorsXml = colorsXml.replace(splashColor, `<color name="splashscreen_background">${BACKGROUND_COLOR}</color>`);
      } else {
        colorsXml = colorsXml.replace('</resources>', `  <color name="splashscreen_background">${BACKGROUND_COLOR}</color>\n</resources>`);
      }
      await fs.writeFile(colorsPath, colorsXml);

      return modConfig;
    },
  ]);
}

module.exports = function withSplitBeatBranding(config) {
  return withAndroidSplash(withIosSplash(config));
};
