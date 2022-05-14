const assert = require("assert");

describe("endpoint is available", function () {
  it("should respond to simple requests", async function () {
    const response = await this.api.get("/status");
    assert.equal(response.data.success, true);
  });

  it("should validate tokens", async function () {
    this.slow(500);
    const response = await this.api.get("/validate");
    assert.equal(response.data.success, true);
  });
});
