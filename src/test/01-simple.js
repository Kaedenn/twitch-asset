const assert = require("assert");

describe("endpoint is available", function () {
  it("should respond to simple requests", async function () {
    assert(this.api);
    const response = await this.api.get("/status");
    assert(response.status === 200);
    const data = response.data;
    assert(data.success === true);
  });
});
