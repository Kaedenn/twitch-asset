const assert = require("assert");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const port = process.env.APP_DEVSERVER_PORT;
const api = axios.create({
  baseURL: `http://localhost:${port}`,
  timeout: 1000
});

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

describe("badge resolving", function () {
  it("should provide global badges", async function () {
    const response = await api.get("/badges");
    assert(response.status === 200);
    const badges = badgeArrayToObject(response.data.data);
    assert(badges.hasOwnProperty("subscriber/1"));
    assert(badges["subscriber/1"].hasOwnProperty("image_url_1x"));
  });
  it("should provide specific global badge", async function () {
    const response = await api.get("/badge/subscriber/1");
    const badge = response.data.data;
    assert(response.status === 200);
    assert(badge.hasOwnProperty("image_url_1x"));
  });
  it("should provide specific global badges", async function () {
    const response = await api.get("/badge/subscriber");
    const badges = badgeArrayToObject([response.data.data]);
    assert(response.status === 200);
    assert(badges.hasOwnProperty("subscriber/1"));
    assert(badges["subscriber/1"].hasOwnProperty("image_url_1x"));
    assert(badges["subscriber/1"]["image_url_1x"]);
    assert(typeof badges["subscriber/1"]["image_url_1x"] === "string");
  });
  it("should provide specific global badge URL", async function () {
    const response = await api.get("/badge/subscriber/1/url");
    assert(response.status === 200);
    assert(typeof response.data === "string");
    assert(response.data);
  });
  it("should provide specific global badge size URL", async function () {
    const response = await api.get("/badge/subscriber/1/url/1x");
    assert(response.status === 200);
    assert(typeof response.data === "string");
    assert(response.data);

    /* XXX: Add a test that has a longer timeout allowance
    const img = await axios.get(response.data);
    assert(img.status === 200);
    */
  });
});
