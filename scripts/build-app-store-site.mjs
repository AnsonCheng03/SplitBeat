import { cp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = path.join(repositoryRoot, 'site');
const outputDirectory = path.join(repositoryRoot, 'site-dist');
const configPath = path.join(sourceDirectory, 'site-config.json');

async function setPublishReadiness(isReady) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) await writeFile(outputPath, `publish_ready=${isReady}\n`, { flag: 'a' });
}

function getMissingContactDetails(config) {
  const missing = [];
  if (typeof config.publisherName !== 'string' || !config.publisherName.trim()) missing.push('publisherName');
  if (typeof config.supportEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.supportEmail.trim())) missing.push('supportEmail');
  return missing;
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function personalizePage(page, config) {
  return page
    .replaceAll('__PUBLISHER_NAME__', escapeHtml(config.publisherName.trim()))
    .replaceAll('__SUPPORT_EMAIL__', escapeHtml(config.supportEmail.trim()));
}

async function buildPublicSite() {
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const missingDetails = getMissingContactDetails(config);
  if (missingDetails.length) {
    console.log(`GitHub Pages deployment skipped until these public contact fields are supplied: ${missingDetails.join(', ')}.`);
    await setPublishReadiness(false);
    return;
  }

  await rm(outputDirectory, { recursive: true, force: true });
  await cp(sourceDirectory, outputDirectory, {
    recursive: true,
    filter: (source) => path.resolve(source) !== path.resolve(configPath),
  });
  await personalizeHtmlFiles(outputDirectory, config);
  await setPublishReadiness(true);
  console.log(`Prepared GitHub Pages files in ${path.relative(repositoryRoot, outputDirectory)}.`);
}

async function personalizeHtmlFiles(directory, config) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await personalizeHtmlFiles(entryPath, config);
      continue;
    }
    if (entry.name.endsWith('.html')) {
      const html = await readFile(entryPath, 'utf8');
      await writeFile(entryPath, personalizePage(html, config));
    }
  }
}

await buildPublicSite();
