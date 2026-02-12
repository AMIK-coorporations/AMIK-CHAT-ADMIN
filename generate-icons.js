import sharp from 'sharp';
import fs from 'fs';

async function processIcons() {
    const green = '#119d3c';
    const size = 512;
    const paddingConfig = 0.65; // Logo will be 65% of the total size

    try {
        console.log('Starting icon processing...');

        // 1. Resize transparent logo to be smaller (the "content" of the icon)
        const logoSize = Math.round(size * paddingConfig);
        const resizedLogoBuffer = await sharp('public/logo-transparent.png')
            .resize(logoSize, logoSize, { fit: 'contain' })
            .toBuffer();

        // 2. Create the base canvas with green background and composite the logo
        console.log(`Creating ${size}x${size} base icon with padding...`);
        await sharp({
            create: {
                width: size,
                height: size,
                channels: 4,
                background: green
            }
        })
            .composite([{ input: resizedLogoBuffer, gravity: 'center' }])
            .png()
            .toFile('public/logo-original.png');

        console.log('Created public/logo-original.png (512x512)');

        // 3. Generate other sizes from this new padded master
        console.log('Generating other sizes...');

        // 192x192 for PWA
        await sharp('public/logo-original.png')
            .resize(192, 192)
            .toFile('public/logo-192.png');
        console.log('Created public/logo-192.png');

        // 180x180 for Apple Touch Icon
        await sharp('public/logo-original.png')
            .resize(180, 180)
            .toFile('public/apple-touch-icon.png');
        console.log('Created public/apple-touch-icon.png');

        console.log('All icons updated successfully!');

    } catch (error) {
        console.error('Error generating icons:', error);
        process.exit(1);
    }
}

processIcons();
