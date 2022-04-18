const assert = require("assert");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const port = process.env.APP_DEVSERVER_PORT;
const api = axios.create({
  baseURL: `http://localhost:${port}`,
  timeout: 1000
});

describe("badge resolving", function () {
  it("should provide global badges", async function () {
    const response = await api.get("/badges");
    assert(response.status === 200);
  });
  it("should provide specific global badges", async function () {
    const response = await api.get("/badge/subscriber");
    console.log(response);
    assert(response.status === 200);
  });
});
