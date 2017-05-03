const glob = require('glob');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { quote } = require('shell-quote');

const images = glob.sync('./screenshot/actual/**/*.png').map(img => path.basename(img));
const master = execSync(quote(['git', 'rev-parse', 'master']), { encoding: 'utf8' }).replace(/\r?\n/g, '');
const head = execSync(quote(['git', 'rev-parse', 'HEAD']), { encoding: 'utf8' }).replace(/\r?\n/g, '');

const json = JSON.stringify({
  images,
  head,
  target: `https://s3.amazonaws.com/flownes/${master}/screenshot/reg.json`,
});

fs.writeFileSync('./screenshot/reg.json', json);
