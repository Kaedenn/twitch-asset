const fs = require("fs/promises");
const path = require("path");

function dataPath() {
  let path = process.env.APP_DATA_PATH;
  if (!path) path = process.env.npm_config_local_prefix;
  if (!path) path = process.cwd();
  if (!path) {
    throw new Error("Failed to determine data path");
  }
  return path;
}
exports.dataPath = dataPath;

async function readJSON(path, encoding = "utf8") {
  const fh = await fs.open(path);
  const data = await fh.readFile({ encoding });
  await fh.close();
  return JSON.parse(data.trim());
}

async function writeJSON(path, data) {
  const fh = await fs.open(path, "w");
  await fh.writeFile(JSON.stringify(data));
  await fh.close();
}

exports.readJSON = (path) => {
  return readJSON(path);
};

exports.writeJSON = (path, data) => {
  return writeJSON(path);
};
