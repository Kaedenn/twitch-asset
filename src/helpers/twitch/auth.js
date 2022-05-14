/**
 * App Access Tokens via Client Credentials grant flow
 *
 * This module handles Twitch's Client Credentials system by requesting an App
 * Access Token using the https://id.twitch.tv/oauth2/token endpoint. This uses
 * the client secret (which must be defined in the .env file) to request the
 * token.
 *
 */
const debug = require("#helpers/debug").create("helpers/twitch/auth");
const axios = require("axios");
const path = require("path");

const io = require("#helpers/io");
const strutil = require("#helpers/string");

/* Access token storage object */
const access = {
  access_token: null,
  date: null,
  expires_in: null,
  token_type: null
};

/* Local access token storage */
exports.AUTH_FILE = "token.json";

/* Authenticated API (Authorization header added below) */
exports.api = axios.create({
  baseURL: "https://api.twitch.tv",
  timeout: 1000,
  headers: {
    "Client-Id": process.env.APP_CLIENTID
  }
});

/* Get the current token's expire date as a Date object */
exports.expireDate = () => {
  if (access.expires_in) {
    const from = access.date || Date.now();
    const delta = access.expires_in * 1000;
    return new Date(from + delta);
  }
  return null;
};

/* Path to the file containing the access token */
function tokenFilePath() {
  return path.join(io.dataPath(), exports.AUTH_FILE);
}

/* Format the current token as an Authorization header */
function getHeader() {
  return `${access.token_type} ${access.access_token}`;
}

/* Get a new token and write it to the token file */
async function getNewToken(writeFile = true) {
  const resp = await axios.post("https://id.twitch.tv/oauth2/token", {
    client_id: process.env.APP_CLIENTID,
    client_secret: process.env.APP_SECRET,
    grant_type: "client_credentials"
  });
  if (resp.data && resp.data.access_token) {
    const data = resp.data;
    access.access_token = data.access_token;
    access.date = Date.now();
    access.expires_in = data.expires_in;
    access.token_type = strutil.toTitleCase(data.token_type);
    if (writeFile) {
      debug("Writing new token to %s", tokenFilePath());
      await io.writeJSON(tokenFilePath(), access);
    }
    return access;
  }
}

/* (Attempt to) read the token from the local file */
async function loadTokenFromFile() {
  await io.maybeMakeDirectory(io.dataPath());
  try {
    const data = await io.readJSON(tokenFilePath());
    if (data && data.access_token) {
      access.access_token = data.access_token;
      access.date = data.date || Date.now();
      access.expires_in = data.expires_in;
      access.token_type = strutil.toTitleCase(data.token_type);
      console.log(
        "%s token expires in %d seconds after %d (%s)",
        access.token_type,
        access.expires_in,
        access.date,
        exports.expireDate()
      );
      return access;
    }
  } catch (err) {
    if (err.code == "ENOENT") {
      debug("Token file %s does not exist", tokenFilePath());
    } else {
      console.error("Failed reading %s: %o", tokenFilePath(), err);
      console.error("Falling back to generating a new one");
    }
  }
  return null;
}

/**
 * Load the access token (or create a new one) and place it into the axios API
 * object. This function must be called before API requests can be made.
 */
exports.authenticate = async function authenticate() {
  let data = null;
  try {
    data = await loadTokenFromFile();
    if (data === null) {
      console.log("Failed reading token from file; generating a new one");
      data = await getNewToken(true);
    }
    if (data === null) {
      throw new Error("Failed to get auth token");
    }
  } catch (err) {
    console.error("Failed to authenticate(): %o", err);
    throw err;
  }
  exports.api.defaults.headers.common["Authorization"] = getHeader();
  console.log("Authenticated");
  return data;
};

/* Validate the token against Twitch */
exports.validate = async function validate() {
  try {
    const resp = await axios({
      method: "get",
      url: "https://id.twitch.tv/oauth2/validate",
      headers: {
        Authorization: getHeader()
      }
    });
    if (resp.status === 200) {
      return true;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};
