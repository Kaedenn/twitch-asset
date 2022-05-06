/*
 * const debug = require("#helpers/debug").create("services/asset");
 */

const twbadge = require("./badge");
Object.assign(exports, twbadge);

const twemote = require("./emote");
Object.assign(exports, twemote);

exports.initialize = async function () {
  return await Promise.all([twbadge.initialize(), twemote.initialize()]);
};
