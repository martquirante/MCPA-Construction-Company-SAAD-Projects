const path = require('path');
const fs = require('fs');
const sharp = require(path.resolve(__dirname, '../../../frontend/node_modules/sharp'));

async function generateContouredLogo() {
  const svgPath = path.resolve(__dirname, '../../../frontend/public/assets/mcpa-logo.svg');
  const svgRaw = fs.readFileSync(svgPath, 'utf8');

  const match = svgRaw.match(/d="([^"]+)"/);
  if (!match) throw new Error('Could not find path d in svg');
  const pathD = match[1];

  // Strong, vivid white halo + contour so it is 100% visible on any dark mode
  const strokeWidth = 12;
  const glowWidth = 24;

  const compositeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-25.0 -25.0 1050.0 358.1" width="700" height="239">
    <!-- Soft outer glow (White, 65% opacity) -->
    <path fill="none" stroke="#ffffff" stroke-width="${glowWidth}" stroke-linejoin="round" stroke-linecap="round" fill-rule="evenodd" d="${pathD}" opacity="0.65" />
    <!-- Crisp white contour line (Pure White, 100% opacity) -->
    <path fill="#ffffff" stroke="#ffffff" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" fill-rule="evenodd" d="${pathD}" opacity="1.0" />
    <!-- Deep Obsidian Black Brand Core -->
    <path fill="#080a0e" fill-rule="evenodd" d="${pathD}" />
  </svg>`;

  const pngBuffer = await sharp(Buffer.from(compositeSvg))
    .png({ compressionLevel: 9 })
    .toBuffer();

  const publicDest = path.resolve(__dirname, '../../../frontend/public/assets/email/email_logo_adaptive_v2.png');
  const backendDest = path.resolve(__dirname, '../assets/email_logo_adaptive_v2.png');
  const darkOverwritePublic = path.resolve(__dirname, '../../../frontend/public/assets/email/email_logo_dark.png');
  const darkOverwriteBackend = path.resolve(__dirname, '../assets/email_logo_dark.png');

  fs.writeFileSync(publicDest, pngBuffer);
  fs.writeFileSync(backendDest, pngBuffer);
  fs.writeFileSync(darkOverwritePublic, pngBuffer);
  fs.writeFileSync(darkOverwriteBackend, pngBuffer);

  // Test previews
  const previewDark = await sharp({
    create: { width: 500, height: 180, channels: 4, background: { r: 18, g: 18, b: 18, alpha: 1 } }
  }).composite([{ input: await sharp(pngBuffer).resize(260).toBuffer(), gravity: 'center' }]).jpeg().toFile(path.resolve(__dirname, '../assets/test_v2_dark.jpg'));

  const previewWhite = await sharp({
    create: { width: 500, height: 180, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  }).composite([{ input: await sharp(pngBuffer).resize(260).toBuffer(), gravity: 'center' }]).jpeg().toFile(path.resolve(__dirname, '../assets/test_v2_white.jpg'));

  console.log('Successfully generated v2 logo and test previews!');
}

generateContouredLogo().catch(err => {
  console.error(err);
  process.exit(1);
});
