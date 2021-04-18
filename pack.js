import {
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    rmSync,
    statSync
} from 'fs';

import {
    dirname,
    extname,
    join,
    relative,
    resolve
} from 'path';

import AdmZip from 'adm-zip';
import { minify } from 'uglify-js';

function* gelAllFiles(rootPath) {
    for (let file of readdirSync(rootPath)) {
        const currentPath = join(rootPath, file);

        if (statSync(currentPath).isDirectory()) {
            for (let filePath of gelAllFiles(currentPath)) {
                yield filePath;
            }
        }
        else {
            yield currentPath;
        }
    }
}

function minifyJavaScript(source) {
    const result =
        minify(
            source,
            {
                v8: true,
                mangle: {
                    toplevel: true
                }
            });

    return result.code;
}

function minifyJson(source) {
    return JSON.stringify(JSON.parse(source));
}

const sourceDirPath = resolve(resolve(), 'src');

const targetPath =
    process.argv[2]
        ? resolve(resolve(), process.argv[2])
        : resolve(resolve(), 'dist', 'ext.zip');

const targetDirPath = dirname(targetPath);

const zip = new AdmZip();

const encoding = 'utf8';

try {
    for (let filePath of gelAllFiles(sourceDirPath)) {
        const relativePath = relative(sourceDirPath, filePath);

        switch (extname(filePath)) {
            case '.js':
                zip.addFile(relativePath, Buffer.from(minifyJavaScript(readFileSync(filePath, encoding)), encoding));
                break;

            case '.json':
                zip.addFile(relativePath, Buffer.from(minifyJson(readFileSync(filePath, encoding)), encoding));
                break;
        
            default:
                zip.addFile(relativePath, readFileSync(filePath));
                break;
        }
    }

    if (!existsSync(targetDirPath)) {
        mkdirSync(targetDirPath, { recursive: true });
    }

    if (existsSync(targetPath)) {
        rmSync(targetPath);
    }

    zip.writeZip(targetPath);
} catch (err) {
    console.error(err);
}
