const assert = require("assert");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const port = process.env.APP_DEVSERVER_PORT;
const api = axios.create({
  baseURL: `http://localhost:${port}`,
  timeout: 1000
});

describe("endpoint is available", function() {
  it("should respond to simple requests", async function() {
    const response = await api.get("/status");
    assert(response.status === 200);
    const data = response.data;
    assert(data.success === true);
  });
});
