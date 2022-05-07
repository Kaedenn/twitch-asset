const debug = require("#helpers/debug").create("helpers/twitch/badge");

const twhttp = require("#helpers/twitch/http");
const cache = require("#helpers/cache");

/* Permitted "shorthand" sizes and their values */
const SIZE_MAP = {
  "1x": "image_url_1x",
  "2x": "image_url_2x",
  "4x": "image_url_4x"
};

function badgeSetToObject(badge_set) {
  const versions = {};
  for (const version of badge_set.versions) {
    versions[version.id] = version;
  }
  return versions;
}

/* Cache object for storing badge data */
const badge_cache = new cache.Cache("badges", async function (name /*, rules*/) {
  debug(`Refreshing cache ${name} from Twitch...`);
  const badge_info = await twhttp.getGlobalBadges();
  const entries = badge_info.map((badge) => [badge.set_id, badge]);
  const data = Object.fromEntries(entries);
  debug(`Refreshed cache ${name}: ${Object.keys(data).length} items`);
  return data;
});

function getCachedBadge(set, version) {
  if (badge_cache.has(set)) {
    for (const badge_version of badge_cache.get(set).versions) {
      if (badge_version.id === version) {
        return badge_version;
      }
    }
  }
  return null;
}

Object.assign(exports, {
  SIZE_MAP,
  badgeSetToObject,
  badge_cache,
  getCachedBadge
});
