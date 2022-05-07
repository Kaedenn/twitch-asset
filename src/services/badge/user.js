const debug = require("#helpers/debug").create("services/badge/user");

const twhttp = require("#helpers/twitch/http");
const twbadge = require("#helpers/twitch/badge");
const twerrors = require("#helpers/twitch/errors");

async function initialize() {
  debug("initializing user badge services");
}

/* Get all custom badges for a specific login/username */
function getBadgesFor(req, res) {
  twhttp
    .getUser(req.params.broadcaster)
    .then((data) => twhttp.getUserBadges(data.id))
    .then((data) => {
      res.status(200).send({ data: data });
    })
    .catch((err) => {
      const [status, message] = twerrors.getStatusFor(err);
      res.status(status).send({ message: message });
    });
}

/* Get a user's custom badges by set name */
function getBadgeSetFor(req, res) {
  const caster = req.params.broadcaster;
  const set = req.params.set;
  twhttp
    .getBadgesFor(caster)
    .then((data) => {
      for (const badge of data) {
        if (badge.set_id === set) {
          return badge;
        }
      }
    })
    .then((badge) => {
      if (badge !== null) {
        res.status(200).send({ data: badge });
      } else {
        res.status(404).send({
          message: `Badge set ${set} for user ${caster} not found`
        });
      }
    })
    .catch((err) => {
      const [status, message] = twerrors.getStatusFor(err);
      res.status(status).send({ message: message });
    });
}

/* Get a user's custom badges by set and version */
function getBadgeFor(req, res) {
  const caster = req.params.broadcaster;
  const set = req.params.set;
  const version = req.params.version;
  twhttp
    .getBadgesFor(caster)
    .then((data) => {
      for (const badge of data) {
        if (badge.set_id === set) {
          for (const bver of badge.versions) {
            if (bver.id === version) {
              return bver;
            }
          }
        }
      }
      throw new twerrors.BadgeNotFoundError(
        `Failed to find badge ${set}/${version} for user ${caster}`
      );
    })
    .then((data) => {
      res.send({ data });
    })
    .catch((err) => {
      const [status, message] = twerrors.getStatusFor(err);
      res.status(status).send({ message: message });
    });
}

/* Get the URL for a user's custom badge */
function getBadgeUrlFor(req, res) {
  const caster = req.params.broadcaster;
  const set = req.params.set;
  const version = req.params.version;
  let size = req.params.size || "image_url_1x";
  if (twbadge.SIZE_MAP[size]) {
    size = twbadge.SIZE_MAP[size];
  }
  twhttp
    .getBadgesFor(caster)
    .then((data) => {
      for (const badge of data) {
        if (badge.set_id === set) {
          for (const bver of badge.versions) {
            if (bver.id === version) {
              if (Object.prototype.hasOwnProperty.call(bver, size)) {
                return bver[size];
              }
            }
          }
        }
      }
      throw new twerrors.BadgeNotFoundError(
        `Failed to find badge ${set}/${version} for user ${caster}`
      );
    })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      const [status, message] = twerrors.getStatusFor(err);
      res.status(status).send({ message: message });
    });
}

Object.assign(exports, {
  authenticate: twhttp.authenticate,
  initialize,
  getBadgesFor,
  getBadgeSetFor,
  getBadgeFor,
  getBadgeUrlFor
});
