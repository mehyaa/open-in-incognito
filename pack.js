const fs = require('fs');
const path = require('path');

const AdmZip = require('adm-zip');
const UglifyJS = require('uglify-js');

const zip = new AdmZip();

const manifestPath  = path.resolve(__dirname, 'src', 'manifest.json');
const backgroundPath  = path.resolve(__dirname, 'src', 'background.js');

const manifestSource = fs.readFileSync(manifestPath, 'utf8');
const backgroundSource = fs.readFileSync(backgroundPath, 'utf8');

const compressedManifest = JSON.stringify(JSON.parse(manifestSource));
const compressedBackground = UglifyJS.minify(backgroundSource, { v8: true, mangle: { toplevel: true } });

zip.addFile('manifest.json', Buffer.from(compressedManifest, 'utf8'));
zip.addFile('background.js', Buffer.from(compressedBackground.code, 'utf8'));
zip.addLocalFolder(path.resolve(__dirname, 'src', '_locales'), '_locales');
zip.addLocalFolder(path.resolve(__dirname, 'src', 'images'), 'images');

const targetPath =
    process.argv[2]
        ? path.resolve(__dirname, process.argv[2])
        : path.resolve(__dirname, 'dist', 'ext.zip');

const targetDir = path.dirname(targetPath);

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath);
}

zip.writeZip(targetPath);
