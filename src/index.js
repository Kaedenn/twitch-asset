const process = require("process");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

if (!process.env.APP_CLIENTID) {
  throw new Error(".env file not found or missing Client ID");
}

const debugHelper = require("#helpers/debug");
const debug = debugHelper.create("index");

const status = require("#services/status");
const twasset = require("#services/twasset");

const app = express();
const corsOptions = {
  origin: "*",
  methods: ["GET", "PUT", "POST", "PATCH", "DELETE", "UPDATE"]
};

debug("Debugging is enabled: %o", debugHelper.info());

app.use(cors(corsOptions));
app.use((req, res, next) => {
  console.log("%s: %s %s", new Date().toLocaleString(), req.method, req.url);
  next();
});

app.get("/", status.getHome);
app.get("/status", status.getStatus);

app.get("/badges", twasset.getBadges);
app.get("/badges/:broadcaster", twasset.getBadgesFor);
app.get("/user/badge/:broadcaster", twasset.getBadgesFor);
app.get("/user/badge/:broadcaster/:set", twasset.getBadgeSetFor);
app.get("/user/badge/:broadcaster/:set/:version", twasset.getBadgeFor);
app.get("/user/badge/:broadcaster/:set/:version/url", twasset.getBadgeUrlFor);
app.get("/user/badge/:broadcaster/:set/:version/url/:size", twasset.getBadgeUrlFor);
app.get("/badge/:set", twasset.getBadgeSet);
app.get("/badge/:set/:version", twasset.getBadge);
app.get("/badge/:set/:version/url", twasset.getBadgeUrl);
app.get("/badge/:set/:version/url/:size", twasset.getBadgeUrl);
app.get("/emote", twasset.getEmote);
app.get("/cheermote", twasset.getCheermote);

app.get("/debug", status.getDebug);
app.get("/debug/dump", (req, res) => {
  console.log(process);
  res.status(200).send({});
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM; exiting");
  process.exit();
});

process.on("SIGINT", () => {
  console.log("Received SIGINT; exiting");
  process.exit();
});

process.stdin.on("readable", () => {
  let chunk;
  while (null !== (chunk = process.stdin.read())) {
    const lines = chunk.toString();
    console.log(`Read ${chunk.length} bytes of data: ${lines.trimEnd()}`);
  }
});

process.stdin.on("end", () => {
  console.log(`Reached EOF on stdin`);
  process.exit();
});

twasset
  .authenticate()
  .then(() => twasset.initialize())
  .then(() => {
    const port = process.env.APP_DEVSERVER_PORT || 8081;
    app.listen(port);
    console.log("Application ready");
  })
  .catch((error) => {
    console.error("Application initialization failed: %o", error);
  });
