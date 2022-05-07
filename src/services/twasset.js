const debug = require("#helpers/debug").create("services/asset");

const twbadge_global = require("#services/badge/global");
Object.assign(exports, twbadge_global);

const twbadge_user = require("#services/badge/user");
Object.assign(exports, twbadge_user);

const twemote = require("#services/emote");
Object.assign(exports, twemote);

exports.initialize = async function () {
  debug("initialize()");
  return await Promise.all([
    twbadge_global.initialize(),
    twbadge_user.initialize(),
    twemote.initialize()
  ]);
};
