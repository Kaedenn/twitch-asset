const debug = require("../helpers/debug").create("twasset");

const responses = require("../helpers/responses");
const twhttp = require("../helpers/twhttp");
const cache = require("../helpers/cache");

const twbadge = require("../helpers/twitch/badge");

exports.authenticate = twhttp.authenticate;

async function initialize() {
  twbadge.refreshCache();
}
exports.initialize = initialize;

/* Get a badge for a specific user ID */
exports.getBadgesFor = (req, res) => {
  twbadge.getUserBadges(req.params.broadcaster)
    .then((data) => {
      res.status(200).send(data.data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
};

/* Get global badges */
exports.getBadges = (req, res) => {
  res.status(200).send({
    data: twbadge.cached_badges.values()
  });
};

/* Get global badges by set name */
exports.getBadgeSet = (req, res) => {
  const set = req.params.set;
  if (twbadge.cached_badges.has(set)) {
    res.status(200).send({ data: twbadge.cached_badges.get(set) });
  } else {
    res.status(404).send({ message: `Unknown set ID "${set}"` });
  }
};

/* Get a specific badge */
exports.getBadge = (req, res) => {
  const set = req.params.set;
  const version = req.params.version;

  const result = twbadge.getCachedBadge(set, version);
  if (result !== null) {
    res.status(200).send({ data: result });
  } else {
    res.status(404).send({ message: `Badge ${set}/${version} not found` });
  }
};

/* Get a specific badge's URL */
exports.getBadgeUrl = (req, res) => {
  const set = req.params.set;
  const version = req.params.version;
  let size = req.params.size || "image_url_1x";
  if (twbadge.SIZE_MAP[size]) {
    size = twbadge.SIZE_MAP[size];
  }

  const badge = twbadge.getCachedBadge(set, version);
  if (badge !== null) {
    if (badge.hasOwnProperty(size)) {
      res.status(200).send(badge[size]);
    } else {
      res.status(404).send({ message: `Badge ${set}/${version} lacks size ${size}` });
    }
  } else {
    res.status(404).send({ message: `Badge ${set}/${version} not found` });
  }
};

exports.getBadgeDebug = (req, res) => {
  debug("%o", badge_cache);
  res.status(200).send({});
};

exports.getEmote = responses.unimplemented();

exports.getCheermote = responses.unimplemented();
