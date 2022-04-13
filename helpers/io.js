const fs = require("fs/promises");
const path = require("path");

async function readJSON(path, encoding="utf8") {
  const fh = await fs.open(path);
  const data = await fh.readFile({ encoding });
  await fh.close();
  console.log(`Read ${data.length} bytes from ${path}`);
  const str = data.trim();
  try {
    return JSON.parse(str);
  }
  catch (error) {
    console.error("Failed to parse JSON %o", str);
    throw error;
  }
}

async function writeJSON(path, data) {
  const fh = await fs.open(path, "w");
  await fh.writeFile(JSON.stringify(data));
  return await fh.close();
}

exports.readJSON = (path) => {
  return readJSON(path);
};

exports.writeJSON = (path, data) => {
  return writeJSON(path);
}

