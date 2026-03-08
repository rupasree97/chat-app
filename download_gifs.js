import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function downloadGif(url, filename) {
    console.log(`Downloading ${filename}...`);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const buffer = await res.arrayBuffer();
        fs.writeFileSync(path.join(__dirname, 'public', filename), Buffer.from(buffer));
        console.log(`Saved ${filename} successfully (${buffer.byteLength} bytes)`);
    } catch (e) {
        console.error(`Failed to download ${filename}:`, e.message);
    }
}

async function main() {
    await downloadGif('https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDMybGF2ZGV5OG5tdWZzaDA1eTV5NjN4N3lxc2VwejdyaDJxNXVvZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26AHG5KGFxSkUWw1i/giphy.gif', 'unicorn_flying.gif');
    await downloadGif('https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNTNkNDFmMWI0OTI4MWJlYTcxNzAzNjVmMGE4ZWE4ODNjNDIyZTkzOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/11a2f6jDB0XFPa/giphy.gif', 'dino_roaring.gif');
}

main();
