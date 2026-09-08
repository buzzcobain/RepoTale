import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SAMPLE_STORIES } from '../src/services/sampleStories.ts';
import { generateStandaloneHtml } from '../src/services/exportService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');

// Ensure docs directory exists
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// 1. Generate standalone HTML for RepoTale
const repotaleStory = SAMPLE_STORIES['repotale'];
if (!repotaleStory) {
  console.error('Error: "repotale" sample story not found in sampleStories.ts');
  process.exit(1);
}

console.log('Generating standalone interactive docs for buzzcobain/RepoTale...');
const html = generateStandaloneHtml(repotaleStory);
const outputPath = path.join(docsDir, 'index.html');
fs.writeFileSync(outputPath, html, 'utf-8');
console.log(`Successfully generated: ${outputPath} (${(html.length / 1024).toFixed(1)} KB)`);

// 2. Ensure CNAME file exists for repotale.com
const cnamePath = path.join(docsDir, 'CNAME');
fs.writeFileSync(cnamePath, 'repotale.com\n', 'utf-8');
console.log(`Verified CNAME: ${cnamePath} (repotale.com)`);

// 3. Ensure robots.txt exists for SEO indexing
const robotsPath = path.join(docsDir, 'robots.txt');
const robotsContent = `User-agent: *
Allow: /

Sitemap: https://repotale.com/sitemap.xml
`;
fs.writeFileSync(robotsPath, robotsContent, 'utf-8');
console.log(`Generated robots.txt: ${robotsPath}`);

// 4. Ensure sitemap.xml exists for search engines
const sitemapPath = path.join(docsDir, 'sitemap.xml');
const today = new Date().toISOString().split('T')[0];
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://repotale.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
fs.writeFileSync(sitemapPath, sitemapContent, 'utf-8');
console.log(`Generated sitemap.xml: ${sitemapPath}`);

