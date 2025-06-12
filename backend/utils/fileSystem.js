const fs = require('fs-extra');
const path = require('path');

const ensureDir = async (dirPath) => {
  await fs.ensureDir(dirPath);
};

const writeFile = async (filePath, content) => {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content);
};

const readDir = async (dirPath) => {
  try {
    return await fs.readdir(dirPath);
  } catch {
    return [];
  }
};

const pathExists = async (filePath) => {
  return await fs.pathExists(filePath);
};

module.exports = {
  ensureDir,
  writeFile,
  readDir,
  pathExists
};