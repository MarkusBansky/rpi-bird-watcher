const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const shell = require('shelljs');

const IMG_WIDTH = 640;
const IMAGES_PATH = './public/images';
const THUMBNAIL_SUFFIX = '-thumb';
const IMAGE_EXTENTION = '.jpg';

function getImgPath(str) {
    return path.join(__dirname, IMAGES_PATH, str);
}

function getThumbPath(str) {
    return path.join(__dirname, IMAGES_PATH, getThumbName(str));
}

function getThumbName(str) {
    return str.replace(IMAGE_EXTENTION, '') + `${THUMBNAIL_SUFFIX}.jpg`;
}

function createFolderIfNotExists() {
    if (!fs.existsSync(IMAGES_PATH)) {
        fs.mkdirSync(IMAGES_PATH);
    }
}

function getImages() {
    const files = fs.readdirSync(IMAGES_PATH);
    return files.filter(f => !f.includes(THUMBNAIL_SUFFIX)).map(img => {
        const stats = fs.statSync(getImgPath(img));
        return {
            img,
            thumbnail: getThumbName(img),
            birthtime: new Date(stats.birthtime).toLocaleString('en-GB'),
            size: humanFileSize(stats.size, true, 2),
            hasThumbnail: files.find(f => f.includes(getThumbName(img)) && f.includes(IMAGE_EXTENTION))
        };
    });
}

function generateThumbnails() {
    const files = getImages();

    files.forEach(bird => {
        if (!bird.hasThumbnail) {
            sharp(getImgPath(bird.img))
                .resize({ width: IMG_WIDTH })
                .toFile(getThumbPath(bird.img));
        }
    });
}

function deleteImageAndThumbnail(filename) {
    fs.unlinkSync(getImgPath(filename));
    fs.unlinkSync(getThumbPath(filename));
}

function humanFileSize(bytes, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


    return bytes.toFixed(dp) + ' ' + units[u];
}

function makeSnapshot() {
    shell.exec('libcamera-jpeg -o ./public/images/snapshot-%Y%m%d%H%M%S).jpg')
}

module.exports = {
    createFolderIfNotExists,
    deleteImageAndThumbnail,
    getImages,
    generateThumbnails,
    humanFileSize,
    makeSnapshot
}