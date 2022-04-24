/* TODO: Handle 401 Unauthorized on requests */

const axios = require("axios");

const twauth = require("../helpers/twauth");
const debug = require("../helpers/debug").create("twhttp");

/* Regular (unauthenticated) API */
exports.api = axios.create({
  baseURL: "https://api.twitch.tv",
  timeout: 1000,
  headers: {
    "Client-Id": process.env.APP_CLIENTID
  }
});

/* Authenticated API */
exports.authedapi = twauth.api;

/* Authenticate and add the Authorization header to authedapi */
exports.authenticate = twauth.authenticate;

/* Get global badges */
exports.getGlobalBadges = async () => {
  const resp = await twauth.api.get("/helix/chat/badges/global", {});
  const data = resp.data;
  debug("Loaded %d global badges", data.data.length);
  return data.data;
};

/* Get user's custom badges */
exports.getUserBadges = async (userid) => {
  const resp = await twauth.api.get("/helix/chat/badges", {
    broadcaster_id: userid
  });
  return resp.data.data;
};

/* Get information about a specific user */
exports.getUser = async () => {
  /* TODO */
  return null;
};
