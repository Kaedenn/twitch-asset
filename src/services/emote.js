const debug = require("#helpers/debug").create("services/emote");

const responses = require("#helpers/responses");
const cache = require("#helpers/cache");
const twhttp = require("#helpers/twitch/http");
const twbadge = require("#helpers/twitch/badge");

async function initialize() {
  debug("initializing emote services");
  return null;
}

Object.assign(exports, {
  initialize,
  getEmote: responses.unimplemented(),
  getCheermote: responses.unimplemented()
});
