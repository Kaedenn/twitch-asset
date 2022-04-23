const path = require("path");
const createDebug = require("debug");
exports.createDebug = createDebug;

function create(name = "") {
  const obj = createDebug(name);
  obj.enabled = enabled();
  return obj;
}
exports.create = create;

function enabled() {
  return process.env.APP_DEBUG === "on";
}
exports.enabled = enabled;

const FRAME_PATTERNS = (() => {
  const fpat_func = "(?<func>.*)";
  const fpat_path = "(?<path>(?<dir>.*)\\/(?<file>.*))";
  const fpat_line = "(?<line>[1-9][0-9]*)";
  const fpat_column = "(?<column>[1-9][0-9]*)";
  return [
    /* With a function name */
    `^[\t ]*at ${fpat_func} \\(${fpat_path}:${fpat_line}:${fpat_column}\\)`,
    /* Without a function name */
    `^[\t ]*at ${fpat_path}:${fpat_line}:${fpat_column}`
  ];
})();

/* True if the given frame belongs to debug.log */
function isDebugLogFrame(fdata) {
  if (!fdata) return false;
  if (!fdata.func) return false;
  if (!fdata.func.match(/\.log$/)) return false;
  if (!fdata.dir.endsWith("helpers")) return false;
  if (fdata.file !== "debug.js") return false;
  return true;
}

function parseStackFrame(frame) {
  /* fields: func, path, dir, file, line, column */
  for (const pat of FRAME_PATTERNS) {
    const match = frame.match(pat);
    if (match) {
      const data = {};
      if (!match.func) {
        data.func = "<anonymous>";
      }
      Object.assign(data, match.groups);
      return data;
    }
  }
  return null;
}
exports.parseStackFrame = parseStackFrame;

function getCaller(offset = 1) {
  const error = (() => {
    try {
      throw new Error("stack");
    } catch (err) {
      return err;
    }
  })();
  if (!error.stack) {
    return {};
  }
  const lines = error.stack.split(/\n/).slice(1);
  const frames = lines.map((line) => parseStackFrame(line));
  for (let i = 0; i < frames.length; ++i) {
    if (isDebugLogFrame(frames[i])) {
      if (i + offset < frames.length) {
        return frames[i + offset];
      } else {
        console.error(
          "Invalid frame %d (%d+offset %d); max=%d",
          i + offset,
          i,
          offset,
          frames.length
        );
      }
    }
  }
}
exports.getCaller = getCaller;

/* Get the parsed stack frame for debug.log caller */
function getDebugLogCaller(offset) {
  const error = (() => {
    try {
      throw new Error("stack");
    } catch (err) {
      return err;
    }
  })();
  const frame_lines = error.stack.split(/\n/).slice(1);
  const frames = frame_lines.map((f) => exports.parseStackFrame(f));
  for (let i = 0; i < frames.length; ++i) {
    if (isDebugLogFrame(frames[i])) {
      if (i + offset < frames.length) {
        return frames[i + offset];
      } else {
        console.error("%d past the end of array", i + offset);
      }
    }
  }
}

exports.log = (message, ...args) => {
  if (process.env.APP_DEBUG === "on") {
    const caller = getDebugLogCaller(1);
    const prefix = `DEBUG ${caller.file}:${caller.line}:`;
    console.log(`${prefix} ${message}`, ...args);
  }
};

exports.info = () => ({
  name: process.env.npm_package_name,
  version: process.env.npm_package_version,
  debug: enabled()
});
