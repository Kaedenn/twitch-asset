const responses = require("../helpers/responses");
const twhttp = require("../helpers/twhttp");
const debug = require("../helpers/debug");

const badge_cache = {};
const emote_cache = {};
const cheermote_cache = {};

const SIZE_MAP = {
  "1x": "image_url_1x",
  "2x": "image_url_2x",
  "4x": "image_url_4x"
};

function getCachedBadge(set, version) {
  if (badge_cache[set]) {
    for (const badge_version of badge_cache[set].versions) {
      if (badge_version.id === version) {
        return badge_version;
      }
    }
  }
  return null;
}

async function getBadge(set, version) {
  let badge = getCachedBadge(set, version);
  if (badge === null) {
    console.log("Badge %s/%s not found; querying Twitch", set, version);
    const badges = await twhttp.getGlobalBadges();
    for (const badge of badges) {
      badge_cache[badge.set_id] = badge;
    }
    badge = getCachedBadge(set, version);
  }
  return badge;
}

exports.authenticate = twhttp.authenticate;

/* Get a badge for a specific user ID */
exports.getBadgesFor = (req, res) => {
  twhttp.authedapi
    .get("/helix/chat/badges", {
      broadcaster_id: req.params.broadcaster
    })
    .then((data) => {
      res.status(200).send(data.data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
};

/* Get global badges (TODO: parameter for ignoring cache) */
exports.getBadges = (req, res) => {
  if (Object.entries(badge_cache).length > 0) {
    res.status(200).send({ data: Object.values(badge_cache) });
  } else {
    twhttp
      .getGlobalBadges()
      .then((data) => {
        for (const badge of data) {
          badge_cache[badge.set_id] = badge;
        }
        res.status(200).send(data);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send(err);
      });
  }
};

/* Get a specific badge */
exports.getBadge = (req, res) => {
  const set = req.params.set;
  const version = req.params.version;
  getBadge(set, version).then((badge) => {
    if (badge !== null) {
      res.status(200).send(badge);
    } else {
      res.status(404).send({
        message: `Badge ${set}/${version} not found`
      });
    }
  });
};

/* Get a specific badge's URL */
exports.getBadgeUrl = (req, res) => {
  const set = req.params.set;
  const version = req.params.version;
  let size = req.params.size || "image_url_1x";
  if (SIZE_MAP[size]) {
    size = SIZE_MAP[size];
  }
  getBadge(set, version).then((badge) => {
    if (badge !== null) {
      if (badge[size]) {
        res.status(200).send(badge[size]);
      } else {
        res.status(400).send({
          message: `No such size ${size} for badge ${set}/${version}`,
          params: req.params
        });
      }
    } else {
      res.status(404).send({
        message: `Badge ${set}/${version} not found`,
        prams: req.params
      });
    }
  });
};

exports.getBadgeDebug = (req, res) => {
  debug.log("%o", badge_cache);
  res.status(200).send({});
};

exports.getEmote = responses.unimplemented();

exports.getCheermote = responses.unimplemented();
