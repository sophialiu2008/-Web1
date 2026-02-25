const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const tokenArg = args.find((a) => a.startsWith('--token='));
const fileArg = args.find((a) => a.startsWith('--file='));
if (!tokenArg || !fileArg) {
  console.error('missing --token or --file');
  process.exit(1);
}
const token = tokenArg.slice('--token='.length);
const filePath = fileArg.slice('--file='.length);
const absPath = path.resolve(process.cwd(), filePath);
const file = fs.readFileSync(absPath);

const http = require('http');
const boundary = `----NodeFormBoundary${Date.now()}`;
const fields = [
  ['name', '小橘'],
  ['category', '猫咪'],
  ['breed', '中华田园猫'],
  ['age_years', '2'],
  ['gender', '公'],
  ['province', '北京'],
  ['city', '北京市'],
  ['district', '朝阳区'],
  ['description', '活泼亲人，已驱虫和体检，找有爱的新家'],
  ['is_vaccinated', 'true'],
  ['is_neutered', 'false'],
  ['personality_tags', '["活泼","亲人","可爱"]'],
  ['personality_traits', '["好奇","独立"]'],
  ['suitable_for', '["公寓居住","上班族"]']
];

const parts = [];
for (const [key, value] of fields) {
  parts.push(Buffer.from(`--${boundary}\r\n`));
  parts.push(Buffer.from(`Content-Disposition: form-data; name="${key}"\r\n\r\n`));
  parts.push(Buffer.from(String(value)));
  parts.push(Buffer.from('\r\n'));
}

parts.push(Buffer.from(`--${boundary}\r\n`));
parts.push(Buffer.from('Content-Disposition: form-data; name="images"; filename="cat-orange.jpg"\r\n'));
parts.push(Buffer.from('Content-Type: image/jpeg\r\n\r\n'));
parts.push(file);
parts.push(Buffer.from('\r\n'));
parts.push(Buffer.from(`--${boundary}--\r\n`));

const body = Buffer.concat(parts);
const req = http.request(
  {
    method: 'POST',
    hostname: 'localhost',
    port: 8789,
    path: '/api/pets',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length
    }
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      console.log(data);
      if (res.statusCode && res.statusCode >= 400) process.exit(1);
    });
  }
);

req.on('error', (err) => {
  console.error(err);
  process.exit(1);
});

req.write(body);
req.end();
