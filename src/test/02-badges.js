const assert = require("assert");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

function badgeArrayToObject(badges) {
  const result = {};
  for (const item of badges) {
    for (const version of item.versions) {
      const key = `${item.set_id}/${version.id}`;
      result[key] = { ...version };
      delete result[key].id;
    }
  }
  return result;
}

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function assertUrl(url) {
  assert(url);
  assert.equal(typeof url, "string");
  assert(url.match(/^http[s]?:/));
}

describe("global badges", function () {
  it("should provide global badges", async function () {
    const response = await this.api.get("/badges");
    const badges = badgeArrayToObject(response.data);
    assert(hasOwnProperty(badges, "subscriber/1"));
    assert(hasOwnProperty(badges["subscriber/1"], "image_url_1x"));
    assertUrl(badges["subscriber/1"]["image_url_1x"]);
  });

  it("should provide specific global badge", async function () {
    const response = await this.api.get("/badge/subscriber/1");
    const badge = response.data;
    assert(hasOwnProperty(badge, "image_url_1x"));
    assertUrl(badge["image_url_1x"]);
    assert(badge["image_url_1x"].match(/^http[s]?:/));
  });

  it("should provide specific global badges", async function () {
    const response = await this.api.get("/badge/subscriber");
    const badges = badgeArrayToObject([response.data]);
    assert(hasOwnProperty(badges, "subscriber/1"));
    assert(hasOwnProperty(badges["subscriber/1"], "image_url_1x"));
    assertUrl(badges["subscriber/1"]["image_url_1x"]);
  });

  it("should provide specific global badge", async function () {
    const response = await this.api.get("/badge/subscriber/1");
    const badge = response.data;
    assert.equal(badge.id, "1");
    assert(hasOwnProperty(badge, "image_url_1x"));
    assertUrl(badge["image_url_1x"]);
    assert(hasOwnProperty(badge, "image_url_2x"));
    assertUrl(badge["image_url_2x"]);
    assert(hasOwnProperty(badge, "image_url_4x"));
    assertUrl(badge["image_url_4x"]);
  });

  it("should provide specific global badge URL", async function () {
    const response = await this.api.get("/badge/subscriber/1/url");
    assertUrl(response.data);
  });

  it("should provide specific global badge size URL", async function () {
    const response = await this.api.get("/badge/subscriber/1/url/1x");
    assertUrl(response.data);
  });

  it("should provide badge image data", async function () {
    this.slow(1000);
    this.timeout(1500);
    const response = await this.api.get("/badge/subscriber/1/url/1x");
    const img = await axios.get(response.data);
    assert(img.data);
    assert(img.data.length > 64);
  });
});

describe("streamer badges", function () {
  /* These take a while longer */
  this.slow(1000);
  this.timeout(1500);

  it("should be able to list streamer badges", async function () {
    const response = await this.api.get("/user/badge/v0oid");
    assert(response.data.length > 0);
    const badges = badgeArrayToObject(response.data);
    assert(Object.entries(badges).length >= response.data.length);
    for (const badge of Object.values(badges)) {
      assert(hasOwnProperty(badge, "image_url_1x"));
      assertUrl(badge["image_url_1x"]);
      assert(hasOwnProperty(badge, "image_url_2x"));
      assertUrl(badge["image_url_2x"]);
      assert(hasOwnProperty(badge, "image_url_4x"));
      assertUrl(badge["image_url_4x"]);
    }
  });

  it("should provide specific streamer badges", async function () {
    const response = await this.api.get("/user/badge/v0oid/subscriber");
    const badges = badgeArrayToObject([response.data]);
    assert(Object.entries(badges).length > 0);
    for (const badge of Object.values(badges)) {
      assert(hasOwnProperty(badge, "image_url_1x"));
      assertUrl(badge["image_url_1x"]);
      assert(hasOwnProperty(badge, "image_url_2x"));
      assertUrl(badge["image_url_2x"]);
      assert(hasOwnProperty(badge, "image_url_4x"));
      assertUrl(badge["image_url_4x"]);
    }
  });

  it("should provide specific streamer badge URLs", async function () {
    const response = await this.api.get("/user/badge/v0oid/subscriber/0");
    const badge = response.data;
    assert(hasOwnProperty(badge, "image_url_1x"));
    assertUrl(badge["image_url_1x"]);
    assert(hasOwnProperty(badge, "image_url_2x"));
    assertUrl(badge["image_url_2x"]);
    assert(hasOwnProperty(badge, "image_url_4x"));
    assertUrl(badge["image_url_4x"]);
  });

  it("should provide specific streamer badge URL", async function () {
    const response = await this.api.get("/user/badge/v0oid/subscriber/0/url");
    assertUrl(response.data);
  });

  it("should provide specific streamer badge URL", async function () {
    const response = await this.api.get("/user/badge/v0oid/subscriber/0/url/1x");
    assertUrl(response.data);
  });

  it("should be resilient to invalid logins", async function () {
    let failed = false;
    try {
      await this.api.get("/user/badge/_");
    } catch (err) {
      assert.equal(err.response.status, 404);
      failed = true;
    }
    assert(failed);
  });
});
