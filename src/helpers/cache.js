const fs = require("fs/promises");
const path = require("path");
const debug = require("../helpers/debug").create("cache");

const io = require("../helpers/io");

const CACHE_PATH = path.join(io.dataPath(), "cache");
exports.CACHE_PATH = CACHE_PATH;

/* Ensure the cache path exists */
async function createPath(name) {
  await fs.stat(CACHE_PATH)
    .catch((err) => fs.mkdir(CACHE_PATH));
}

/**
 * Cache manager class
 *
 * This class manages cached data with the following structure:
 *    { key:String : value:any }
 * `updateFunc` facilitates refreshing the cache and must satisfy the
 * following conditions:
 *    Must return an object.
 *    Must be asynchronous.
 */
class Cache {
  constructor(name, updateFunc, rules = {}) {
    this._name = name;
    this._updateFunc = updateFunc;
    this._data = {};
    this._updateRules = { ...rules };
    createPath();
  }

  get name() { return this._name; }
  get path() { return path.join(CACHE_PATH, `${this.name}.json`); }

  has(key) {
    return this._data.hasOwnProperty(key);
  }

  get(key) {
    if (this.has(key)) {
      return this._data[key];
    }
    throw new Error(`Key "${key}" not present in cache`);
  }

  async getAsync(key) {
    if (this.has(key)) {
      return this.get(key);
    }
    /* TODO: Refresh the cache if required */
  }

  async init() {
    const loaded = await this.load();
    if (!loaded) {
      debug(`Failed to load cache ${this.name}; refreshing...`);
      this._data = await (this._updateFunc)(this._name, this._updateRules);
      await this.save();
    }
  }

  async refresh() {
    /* TODO: Determine if the refresh is allowed to occur by the rules */
    const data = await (this._updateFunc)(this._name, this._updateRules);
    Object.assign(this._data, data);
  }

  async load() {
    try {
      const fh = await fs.open(this.path);
      const data = await fh.readFile({ encoding: 'utf8' });
      await fh.close();
      this._data = JSON.parse(data.trim());
      return true;
    }
    catch (err) {
      if (err.code != 'ENOENT') {
        throw err;
      }
      debug(`Cache ${this.name} at ${this.path} does not exist`);
      return false;
    }
  }

  async save() {
    await createPath(this.name);
    const fh = await fs.open(this.path, "w");
    await fh.writeFile(JSON.stringify(this._data));
    await fh.close();
  }
}
exports.Cache = Cache;

