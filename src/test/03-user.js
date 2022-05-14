const assert = require("assert");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

describe("user operations", function () {
  /* These take a while longer */
  this.slow(500);
  this.timeout(1000);

  it("should respond to user queries", async function () {
    const response = await this.api.get("/user/kaedenn_");
    assert(response.status === 200);
    assert(response.data.login === "kaedenn_");
  });

  it("should be resilient to invalid users", async function () {
    let failed = false;
    try {
      await this.api.get("/user/_");
    } catch (err) {
      assert(err.response.status === 404);
      failed = true;
    }
    assert(failed);
  });
});
