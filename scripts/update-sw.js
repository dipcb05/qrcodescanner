const fs = require('fs');
const path = require('path');

const swPath = path.join(process.cwd(), 'public', 'sw.js');
const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);

let swContent = fs.readFileSync(swPath, 'utf8');

const versionMatch = swContent.match(/Version: (.*)/);
const cacheNameMatch = swContent.match(/CACHE_NAME = '(.*)'/);

if (versionMatch) {
  swContent = swContent.replace(versionMatch[0], `Version: ${timestamp}`);
}
if (cacheNameMatch) {
  const prefix = cacheNameMatch[1].split('-').slice(0, -1).join('-');
  swContent = swContent.replace(cacheNameMatch[0], `CACHE_NAME = '${prefix}-${timestamp}'`);
}

fs.writeFileSync(swPath, swContent);