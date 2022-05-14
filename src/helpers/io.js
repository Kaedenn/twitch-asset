const fs = require("fs/promises");

/* True if the object is a directory, false for any other reason */
exports.isDirectory = async function isDirectory(pathname) {
  return await fs
    .stat(pathname)
    .then((stat) => stat.isDirectory())
    .catch(() => false);
};

/* If the path isn't a directory, try creating it */
exports.maybeMakeDirectory = async function maybeMakeDirectory(pathname) {
  if ((await exports.isDirectory(pathname)) === false) {
    return await fs.mkdir(pathname);
  }
  return true;
};

/* Determine the path to the cache directory */
exports.cachePath = function cachePath() {
  let dpath = process.env.APP_CACHE_PATH;
  if (!dpath) dpath = process.env.npm_config_local_prefix;
  if (!dpath) dpath = process.cwd();
  return dpath;
};

/* Determine the path to the data directory */
exports.dataPath = function dataPath() {
  let dpath = process.env.APP_DATA_PATH;
  if (!dpath) dpath = process.env.npm_config_local_prefix;
  if (!dpath) dpath = process.cwd();
  return dpath;
};

/* Read a JSON file */
exports.readJSON = async function readJSON(fpath, encoding = "utf8") {
  const fh = await fs.open(fpath);
  const data = await fh.readFile({ encoding });
  await fh.close();
  return JSON.parse(data.trim());
};

/* Write a JSON file */
exports.writeJSON = async function writeJSON(fpath, data) {
  const fh = await fs.open(fpath, "w");
  await fh.writeFile(JSON.stringify(data));
  await fh.close();
};
