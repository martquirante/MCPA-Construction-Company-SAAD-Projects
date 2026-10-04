const path = require('path');
const sharp = require(path.resolve(__dirname, '../../../frontend/node_modules/sharp'));
const fs = require('fs');

async function optimizeImages() {
  const projectsDir = path.resolve(__dirname, '../assets/projects');
  const assetsDir = path.resolve(__dirname, '../assets');

  // 1. Hero Luxury Villa
  await sharp(path.join(projectsDir, 'mcpa_project_villa_luxury.jpg'))
    .resize(800, 440, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 84, progressive: true })
    .toFile(path.join(projectsDir, 'email_hero_villa.jpg'));
  console.log('Optimized email_hero_villa.jpg');

  // 2. Card 1 - Selected Projects (Residence)
  await sharp(path.join(projectsDir, 'mcpa_project_residence_1.jpg'))
    .resize(500, 300, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 82, progressive: true })
    .toFile(path.join(projectsDir, 'email_card_projects.jpg'));
  console.log('Optimized email_card_projects.jpg');

  // 3. Card 2 - Design & Build Services (Commercial Build)
  await sharp(path.join(projectsDir, 'mcpa_project_commercial_flickertech.png'))
    .resize(500, 300, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 82, progressive: true })
    .toFile(path.join(projectsDir, 'email_card_services.jpg'));
  console.log('Optimized email_card_services.jpg');

  // 4. Card 3 - 4-Step Process (Apartment Development)
  await sharp(path.join(projectsDir, 'mcpa_project_apartment_1.jpg'))
    .resize(500, 300, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 82, progressive: true })
    .toFile(path.join(projectsDir, 'email_card_process.jpg'));
  console.log('Optimized email_card_process.jpg');

  // 5. Logo optimized for email (clear on both light & dark)
  // Let's create an adaptive logo with subtle white/gold halo or use clean white logo
  if (fs.existsSync(path.join(assetsDir, 'mcpa-logo-white.png'))) {
    await sharp(path.join(assetsDir, 'mcpa-logo-white.png'))
      .resize(360, null, { fit: 'inside' })
      .png({ compressionLevel: 9 })
      .toFile(path.join(assetsDir, 'email_logo_white.png'));
    console.log('Optimized email_logo_white.png');
  }

  if (fs.existsSync(path.join(assetsDir, 'mcpa-logo.png'))) {
    await sharp(path.join(assetsDir, 'mcpa-logo.png'))
      .resize(360, null, { fit: 'inside' })
      .png({ compressionLevel: 9 })
      .toFile(path.join(assetsDir, 'email_logo_dark.png'));
    console.log('Optimized email_logo_dark.png');
  }

  console.log('ALL EMAIL ASSETS OPTIMIZED SUCCESSFULLY!');
}

optimizeImages().catch(err => {
  console.error('Error optimizing images:', err);
  process.exit(1);
});
