const https = require('https');
const fs = require('fs');
const path = require('path');

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', err => {
            fs.unlink(dest);
            reject(err);
        });
    });
};

const textures = {
    'asteroid_diffuse.jpg': 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg'
};

const downloadTextures = async () => {
    const textureDir = path.join(process.cwd(), 'public', 'textures', 'asteroids');
    
    // Clear existing files
    if (fs.existsSync(textureDir)) {
        fs.readdirSync(textureDir).forEach(file => {
            fs.unlinkSync(path.join(textureDir, file));
        });
    } else {
        fs.mkdirSync(textureDir, { recursive: true });
    }
    
    for (const [filename, url] of Object.entries(textures)) {
        const dest = path.join(textureDir, filename);
        console.log(`Downloading ${filename}...`);
        await downloadFile(url, dest);
        console.log(`Downloaded ${filename}`);
    }
};

downloadTextures().catch(console.error);
