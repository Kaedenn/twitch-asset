const debug = require("#helpers/debug").create("services/badge/global");

const twhttp = require("#helpers/twitch/http");
const twbadge = require("#helpers/twitch/badge");

/* Refresh the cache from Twitch. This is done on every startup */
async function initialize() {
  debug("initializing badge services");
  return await twbadge.badge_cache.refresh();
}

/* Get global badges */
function getBadges(req, res) {
  res.status(200).send({
    data: twbadge.badge_cache.values()
  });
}

/* Get global badges by set name */
function getBadgeSet(req, res) {
  const set = req.params.set;
  if (twbadge.badge_cache.has(set)) {
    res.status(200).send({
      data: twbadge.badge_cache.get(set)
    });
  } else {
    res.status(404).send({
      message: `Unknown set ID "${set}"`
    });
  }
}

/* Get a specific badge */
function getBadge(req, res) {
  const set = req.params.set;
  const version = req.params.version;

  const result = twbadge.getCachedBadge(set, version);
  if (result !== null) {
    res.status(200).send({
      data: result
    });
  } else {
    res.status(404).send({
      message: `Badge ${set}/${version} not found`
    });
  }
}

/* Get a specific badge's URL */
function getBadgeUrl(req, res) {
  const set = req.params.set;
  const version = req.params.version;
  let size = req.params.size || "image_url_1x";
  if (twbadge.SIZE_MAP[size]) {
    size = twbadge.SIZE_MAP[size];
  }

  const badge = twbadge.getCachedBadge(set, version);
  if (badge !== null) {
    if (Object.prototype.hasOwnProperty.call(badge, size)) {
      res.status(200).send(badge[size]);
    } else {
      res.status(404).send({
        message: `Badge ${set}/${version} lacks size ${size}`
      });
    }
  } else {
    res.status(404).send({
      message: `Badge ${set}/${version} not found`
    });
  }
}

Object.assign(exports, {
  authenticate: twhttp.authenticate,
  initialize,
  getBadges,
  getBadgeSet,
  getBadge,
  getBadgeUrl
});
