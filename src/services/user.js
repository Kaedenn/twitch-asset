const debug = require("#helpers/debug").create("services/badge");

const twhttp = require("#helpers/twitch/http");
const twerrors = require("#helpers/twitch/errors");

/* Refresh the cache from Twitch. This is done on every startup */
async function initialize() {
  debug("initializing user services");
  return null;
}

function getUser(req, res) {
  const user = req.params.login;
  twhttp
    .getUser(user)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      const [status, message] = twerrors.getStatusFor(err);
      res.status(status).send({ message: message, error: err.toString() });
    });
}

Object.assign(exports, {
  initialize,
  getUser
});
