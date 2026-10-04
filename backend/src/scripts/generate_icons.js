const path = require('path');
const sharp = require(path.resolve(__dirname, '../../../frontend/node_modules/sharp'));
const fs = require('fs');

const outDir = path.resolve(__dirname, '../assets/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const icons = {
  'user.png': `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="7" r="4" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  
  'projects.png': `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21h18M5 21V7l8-4v18M13 21V11l6 3v7" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 9v.01M9 13v.01M9 17v.01M17 15v.01M17 18v.01" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/></svg>`,
  
  'services.png': `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 18h20M12 2v4M4.5 18a7.5 7.5 0 0 1 15 0" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 18v-5a4 4 0 0 1 8 0v5" stroke="#f59e0b" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  
  'process.png': `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="5" r="2" stroke="#f59e0b" stroke-width="2"/><path d="m3 21 8.02-14.26M21 21l-8.02-14.26" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/><path d="M6.8 14h10.4" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/></svg>`,

  'phone.png': `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  'mail.png': `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="16" x="2" y="4" rx="2" stroke="#38bdf8" stroke-width="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  'location.png': `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" stroke="#f59e0b" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke="#f59e0b" stroke-width="2"/></svg>`,

  'facebook.png': `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#0866FF"/><path d="M15.14 12.315l.488-3.187h-3.058V7.062c0-.877.43-1.732 1.808-1.732h1.4V2.618S14.508 2.4 13.28 2.4c-2.563 0-4.237 1.554-4.237 4.365v2.363H6.24v3.187h2.803V20a12.06 12.06 0 003.73 0v-7.685h2.367z" fill="#FFFFFF"/></svg>`,

  'instagram.png': `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="igGrad" cx="30%" cy="107%" r="100%"><stop offset="0%" stop-color="#fdf497"/><stop offset="5%" stop-color="#fdf497"/><stop offset="45%" stop-color="#fd5949"/><stop offset="60%" stop-color="#d6249f"/><stop offset="90%" stop-color="#285AEB"/></radialGradient></defs><rect width="24" height="24" rx="6" fill="url(#igGrad)"/><path d="M12 7.02c1.622 0 1.814.006 2.455.035 1.51.069 2.222.788 2.29 2.29.03.64.036.833.036 2.455 0 1.622-.006 1.814-.035 2.455-.069 1.51-.788 2.222-2.29 2.29-.64.03-.833.036-2.455.036-1.622 0-1.814-.006-2.455-.035-1.51-.069-2.222-.788-2.29-2.29-.03-.64-.036-.833-.036-2.455 0-1.622.006-1.814.035-2.455.069-1.51.788-2.222 2.29-2.29.64-.03.833-.036 2.455-.036zm0-1.32c-1.65 0-1.857.007-2.506.037-2.217.101-3.447 1.332-3.548 3.548-.03.65-.037.856-.037 2.506s.007 1.857.037 2.506c.101 2.217 1.331 3.447 3.548 3.548.65.03.856.037 2.506.037s1.857-.007 2.506-.037c2.217-.101 3.447-1.331 3.548-3.548.03-.65.037-.856.037-2.506s-.007-1.857-.037-2.506c-.101-2.217-1.331-3.447-3.548-3.548-.65-.03-.856-.037-2.506-.037zm0 3.125a3.175 3.175 0 100 6.35 3.175 3.175 0 000-6.35zm0 5.03a1.855 1.855 0 110-3.71 1.855 1.855 0 010 3.71zm4.045-5.143a.742.742 0 100 1.485.742.742 0 000-1.485z" fill="#FFFFFF"/></svg>`,

  'tiktok.png': `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#010101"/><g transform="translate(4.5, 4) scale(0.64)"><path d="M16.5 0h-2.8v15.2c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4c.4 0 .9.1 1.3.2V8.4C10.5 8.3 10 8.2 9.7 8.2 5.5 8.2 2 11.7 2 15.9s3.5 7.7 7.7 7.7c4.2 0 7.7-3.5 7.7-7.7V6.2c1.7 1.2 3.8 1.9 6 1.9V5.3c-2.9 0-5.3-2.4-5.3-5.3H16.5z" fill="#25F4EE" transform="translate(-0.8, -0.6)"/><path d="M16.5 0h-2.8v15.2c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4c.4 0 .9.1 1.3.2V8.4C10.5 8.3 10 8.2 9.7 8.2 5.5 8.2 2 11.7 2 15.9s3.5 7.7 7.7 7.7c4.2 0 7.7-3.5 7.7-7.7V6.2c1.7 1.2 3.8 1.9 6 1.9V5.3c-2.9 0-5.3-2.4-5.3-5.3H16.5z" fill="#FE2C55" transform="translate(0.8, 0.6)"/><path d="M16.5 0h-2.8v15.2c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4c.4 0 .9.1 1.3.2V8.4C10.5 8.3 10 8.2 9.7 8.2 5.5 8.2 2 11.7 2 15.9s3.5 7.7 7.7 7.7c4.2 0 7.7-3.5 7.7-7.7V6.2c1.7 1.2 3.8 1.9 6 1.9V5.3c-2.9 0-5.3-2.4-5.3-5.3H16.5z" fill="#FFFFFF"/></g></svg>`
};

Promise.all(Object.entries(icons).map(([filename, svgStr]) => {
  return sharp(Buffer.from(svgStr))
    .png()
    .toFile(path.join(outDir, filename));
})).then(() => {
  console.log('Successfully generated all 10 PNG icons in backend/src/assets/icons!');
  process.exit(0);
}).catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
