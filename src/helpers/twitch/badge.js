const debug = require("../debug").create("twasset");

const twhttp = require("../twhttp");
const cache = require("../cache");

const SIZE_MAP = {
  "1x": "image_url_1x",
  "2x": "image_url_2x",
  "4x": "image_url_4x"
};
exports.SIZE_MAP = SIZE_MAP;

const cached_badges = new cache.Cache("badges", async function (name, rules) {
  debug(`Loading cache for ${name}`);
  return {};
});
cached_badges.init();
exports.cached_badges = cached_badges;

async function refreshCache() {
  return await twhttp.getGlobalBadges().then((data) => {
    for (const badge of data) {
      cached_badges.add(badge.set_id, badge);
    }
    return data;
  });
}
exports.refreshCache = refreshCache;

function getCachedBadge(set, version) {
  if (cached_badges.has(set)) {
    for (const badge_version of cached_badges.get(set).versions) {
      if (badge_version.id === version) {
        return badge_version;
      }
    }
  }
  return null;
}
exports.getCachedBadge = getCachedBadge;
