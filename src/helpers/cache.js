const debug = require("#helpers/debug").create("helpers/cache");

const fs = require("fs/promises");
const path = require("path");

const io = require("#helpers/io");

/* Path to the cache directory */
const CACHE_PATH = path.join(io.dataPath(), "cache");
exports.CACHE_PATH = CACHE_PATH;

/* Is the given path a directory? */
async function isDirectory(pathname) {
  return await fs
    .stat(pathname)
    .then((stat) => stat.isDirectory())
    .catch(() => false);
}
exports.isDirectory = isDirectory;

/**
 * Cache manager class
 *
 * This class manages cached data with the following structure:
 *    { key:String : value:any }
 * `updateFunc` facilitates refreshing the cache and must satisfy the following
 * conditions:
 *    Must be a function taking two arguments: name and rules.
 *    Must return an object.
 *    Must be asynchronous.
 * `rules` is an arbitrary value passed to the update function.
 */
class Cache {
  constructor(name, updateFunc, rules = {}) {
    this._name = name;
    this._updateFunc = updateFunc;
    this._data = {};
    this._updateRules = { ...rules };
  }

  /* Get the cache's name */
  get name() {
    return this._name;
  }

  /* Get the backing file's path */
  get path() {
    return path.join(CACHE_PATH, `${this.name}.json`);
  }

  /* Add a key and value. Raises an Error if the key is already present */
  add(key, value) {
    if (Object.prototype.hasOwnProperty.call(this._data, key)) {
      throw new Error(`Cannot add "${key}" with value "${value}"; entry exists`);
    }
    this._data[key] = value;
  }

  /* Add or overwrite the key with the given value */
  set(key, value) {
    this._data[key] = value;
  }

  /* Returns true if the cache contains the given key, false otherwise */
  has(key) {
    return Object.prototype.hasOwnProperty.call(this._data, key);
  }

  /* Get the given key's value. Raises an Error if the key isn't present */
  get(key) {
    if (this.has(key)) {
      return this._data[key];
    }
    throw new Error(`Key "${key}" not present in cache`);
  }

  /* Get the given key's value or a default value if the key isn't present */
  get_maybe(key, default_value = null) {
    if (this.has(key)) {
      return key;
    }
    return default_value;
  }

  /* Returns the cache's entries as an array of keys and values */
  entries() {
    return Object.entries(this._data);
  }

  /* Returns the cache's keys as an array */
  keys() {
    return Object.keys(this._data);
  }

  /* Return the cache's values as an array */
  values() {
    return Object.values(this._data);
  }

  /**
   * Attempt to lookup the given key's value. If that fails, then the cache is
   * refreshed (if refresh is true) and the lookup is attempted again. Returns
   * null if the key isn't found.
   */
  async getAsync(key, refresh = false) {
    if (this.has(key)) {
      return this.get(key);
    }
    if (refresh) {
      this._data = await this._updateFunc(this._name, this._updateRules);
      await this.save();
    }
    return this.get_maybe(key);
  }

  /**
   * Attempt to load the cache from disk. If that fails, then the update
   * function is called and the result saved to disk.
   */
  async init() {
    const loaded = await this.load();
    if (!loaded) {
      debug(`Failed to load cache ${this.name}; refreshing...`);
      this._data = await this._updateFunc(this._name, this._updateRules);
      await this.save();
    }
  }

  /**
   * Refresh the cache by calling the update function. Does not save the cache
   * to disk; call save() for that.
   */
  async refresh() {
    const data = await this._updateFunc(this._name, this._updateRules);
    Object.assign(this._data, data);
  }

  /**
   * Load the cache from disk. Returns true if that succeeded, false otherwise.
   * Raises an Error if the load failed for any reason other than
   * file-not-found.
   */
  async load() {
    try {
      const fh = await fs.open(this.path);
      const data = await fh.readFile({ encoding: "utf8" });
      await fh.close();
      this._data = JSON.parse(data.trim());
      return true;
    } catch (err) {
      if (err.code != "ENOENT") {
        throw err;
      }
      debug(`Cache ${this.name} at ${this.path} does not exist`);
      return false;
    }
  }

  /* Save the cache to disk */
  async save() {
    if ((await isDirectory(CACHE_PATH)) === false) {
      await fs.mkdir(CACHE_PATH);
    }
    const fh = await fs.open(this.path, "w");
    await fh.writeFile(JSON.stringify(this._data));
    await fh.close();
  }
}
exports.Cache = Cache;
