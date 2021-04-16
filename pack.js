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

const destinationPath = path.resolve(__dirname, 'dist');

if (fs.existsSync(destinationPath)) {
    fs.rmdirSync(destinationPath, { recursive: true });
}

fs.mkdirSync(destinationPath);

zip.writeZip(path.join(destinationPath, 'ext.zip'));
