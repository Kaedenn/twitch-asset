const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

if (!process.env.npm_package_name) {
  throw new Error("Please run this through npm");
}

const debugHelper = require("./helpers/debug");
const debug = debugHelper.create("index");

const status = require("./services/status");
const twasset = require("./services/twasset");

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

app.get("/debug", status.getDebug);
app.get("/badge_debug", twasset.getBadgeDebug);

app.get("/badges", twasset.getBadges);
app.get("/badges/:broadcaster", twasset.getBadgesFor);
app.get("/badge/:set", twasset.getBadge);
app.get("/badge/:set/:version", twasset.getBadge);
app.get("/badge/:set/:version/url", twasset.getBadgeUrl);
app.get("/badge/:set/:version/url/:size", twasset.getBadgeUrl);
app.get("/emote", twasset.getEmote);
app.get("/cheermote", twasset.getCheermote);

twasset
  .authenticate()
  .then(() => {
    const port = process.env.APP_DEVSERVER_PORT || 8081;
    app.listen(port);
  })
  .catch((error) => {
    console.error("Failed to authenticate with Twitch: %o", error);
  });
