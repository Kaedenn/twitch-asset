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
const fs = require("fs");
const path = require("path");
const axios = require("axios");

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
const prefix = io.dataPath();
exports.AUTH_FILE = "token.json";
exports.AUTH_FILE_PATH = path.join(prefix, exports.AUTH_FILE);

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
  if (resp.data) {
    const data = resp.data;
    access.access_token = data.token;
    access.date = Date.now();
    access.expires_in = data.expires_in;
    access.token_type = strutil.toTitleCase(data.token_type);
    if (writeFile) {
      await io.writeJSON(exports.AUTH_FILE_PATH, access);
    }
  }
}

/* (Attempt to) read the token from the local file */
async function loadTokenFromFile() {
  return io
    .readJSON(exports.AUTH_FILE_PATH)
    .then((data) => {
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
    })
    .catch((error) => {
      if (error.code != "ENOENT") {
        console.error("Failed reading %s: %o", exports.AUTH_FILE_PATH, error);
      } else {
        debug("Auth file %s does not exist", exports.AUTH_FILE_PATH);
      }
      throw error;
    });
}

/**
 * Load the access token (or create a new one) and place it into the axios API
 * object. This function must be called before API requests can be made.
 */
exports.authenticate = () => {
  return loadTokenFromFile()
    .then(() => {
      debug("Loaded authentication token from file");
      exports.api.defaults.headers.common["Authorization"] = getHeader();
      console.log("Authenticated");
    })
    .catch((error) => {
      console.log("Failed to load token from file; trying to get a new one...");
      return getNewToken(true);
    });
};
