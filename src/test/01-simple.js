const assert = require("assert");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const port = process.env.APP_DEVSERVER_PORT;
const api = axios.create({
  baseURL: `http://localhost:${port}`,
  timeout: 1000
});

describe("endpoint is available", function () {
  it("should respond to simple requests", async function () {
    const response = await api.get("/status");
    assert(response.status === 200);
    const data = response.data;
    assert(data.success === true);
  });

  it("should respond to user queries", async function () {
    const response = await api.get("/user/kaedenn_");
    assert(response.status === 200);
    const data = response.data;
    assert(data.data.login === "kaedenn_");
  });

  it("should be resilient to invalid users", async function () {
    let failed = false;
    try {
      await api.get("/user/_");
    }
    catch (err) {
      assert(err.response.status === 404);
      failed = true;
    }
    assert(failed);
  });
});
