/* TODO: Handle 401 Unauthorized on requests */

const debug = require("#helpers/debug").create("helpers/twitch/http");
const axios = require("axios");

const twauth = require("#helpers/twitch/auth");
const twerrors = require("#helpers/twitch/errors");

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

/* Get information about a specific user */
exports.getUser = async (login) => {
  try {
    const resp = await twauth.api.get(`/helix/users?login=${encodeURIComponent(login)}`);
    if (resp.data.data && resp.data.data.length > 0) {
      return resp.data.data[0];
    }
    return null;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const data = err.response.data;
      if (data.status === 400 && data.message.match(/invalid.*id/i)) {
        throw new twerrors.UserNotFoundError(login);
      }
      throw new twerrors.APIError(err.toString());
    }
    throw err;
  }
};

/* Get global badges */
exports.getGlobalBadges = async () => {
  const resp = await twauth.api.get("/helix/chat/badges/global");
  const data = resp.data;
  debug("Loaded %d global badges", data.data.length);
  return data.data;
};

/* Get user's custom badges, using a numeric user ID */
exports.getUserBadges = async (userid) => {
  try {
    const resp = await twauth.api.get(`/helix/chat/badges?broadcaster_id=${userid}`);
    return resp.data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const data = err.response.data;
      if (data.status === 400 && data.message.match(/invalid.*id/i)) {
        throw new twerrors.UserNotFoundError(err);
      }
      throw new twerrors.APIError(err.toString());
    }
    throw err;
  }
};

/* Get user's custom badges, using a login/username */
exports.getBadgesFor = async (login) => {
  const user = await exports.getUser(login);
  return await exports.getUserBadges(user.id);
};
