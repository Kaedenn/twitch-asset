const fs = require("fs");
const process = require("process");
const http = require("http");
const https = require("https");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

if (!process.env.APP_CLIENTID) {
  throw new Error(".env file not found or missing Client ID");
}

if (!process.env.APP_HTTP_PORT) {
  throw new Error(".env file not found or missing HTTP port");
}

const debugHelper = require("#helpers/debug");
const debug = debugHelper.create("index");

const status = require("#services/status");
const twasset = require("#services/twasset");
const twuser = require("#services/user");

debug("Debugging is enabled: %o", debugHelper.info());

let enable_https = false;
const cert_info = {};
if (process.env.APP_USE_HTTPS) {
  if (process.env.APP_KEY_FILE && process.env.APP_CRT_FILE) {
    const key_path = __dirname + "/../" + process.env.APP_KEY_FILE;
    const crt_path = __dirname + "/../" + process.env.APP_CRT_FILE;
    try {
      const key = fs.readFileSync(key_path);
      debug("Read key file %s (%d bytes)", key_path, key.length);
      const crt = fs.readFileSync(crt_path);
      debug("Read cert file %s (%d bytes)", crt_path, crt.length);
      cert_info.key = key;
      cert_info.cert = crt;
      enable_https = true;
    } catch (err) {
      console.error(err);
    }
  }
}

const app = express();
const corsOptions = {
  origin: "*",
  methods: ["GET", "PUT", "POST", "PATCH", "DELETE", "UPDATE"]
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  console.log("%s: %s %s", new Date().toLocaleString(), req.method, req.url);
  if (req.headers["x-forwarded-proto"] == "http") {
    return resp.redirect(301, "https://" + req.headers.host + "/");
  } else {
    return next();
  }
});

app.get("/", status.getHome);
app.get("/status", status.getStatus);

app.get("/user/:login", twuser.getUser);

/* Get all badges for the given user */
app.get("/badges/:user", twasset.getBadgesFor);
app.get("/user/badges/:user", twasset.getBadgesFor);
app.get("/user/badge/:user", twasset.getBadgesFor);

/* Get badge-specific information for the given user */
app.get("/user/badge/:user/:set", twasset.getBadgeSetFor);
app.get("/user/badge/:user/:set/:version", twasset.getBadgeFor);
app.get("/user/badge/:user/:set/:version/url", twasset.getBadgeUrlFor);
app.get("/user/badge/:user/:set/:version/url/:size", twasset.getBadgeUrlFor);

/* Get all global badges */
app.get("/badges", twasset.getBadges);
app.get("/badge", twasset.getBadges);

/* Get global badge-specific information */
app.get("/badge/:set", twasset.getBadgeSet);
app.get("/badge/:set/:version", twasset.getBadge);
app.get("/badge/:set/:version/url", twasset.getBadgeUrl);
app.get("/badge/:set/:version/url/:size", twasset.getBadgeUrl);
app.get("/emote", twasset.getEmote);
app.get("/cheermote", twasset.getCheermote);

/* Diagnostic endpoints */
app.get("/debug", status.getDebug);
app.get("/q", (req, res) => {
  res.send("Using https");
});

(() => {
  for (const signal of ["SIGTERM", "SIGINT"]) {
    process.on(signal, () => {
      console.log(`Received ${signal}; exiting`);
      process.exit(0);
    });
  }
})();

process.stdin.on("readable", () => {
  let chunk;
  while (null !== (chunk = process.stdin.read())) {
    const lines = chunk.toString();
    console.log(`Read ${chunk.length} bytes of data: ${lines.trimEnd()}`);
  }
});

process.stdin.on("end", () => {
  console.log(`Reached EOF on stdin`);
  process.exit(0);
});

let http_server;
let http_port;
if (enable_https) {
  http_server = https.createServer(cert_info, app);
  http_port = process.env.APP_HTTPS_PORT;
} else {
  http_server = http.createServer(app);
  http_port = process.env.APP_HTTP_PORT;
}

twasset
  .authenticate()
  .then(() => twasset.initialize())
  .then(() => {
    http_server.listen(http_port, () => {
      debug("Listening on port %d", http_port);
      /* Used by test suite as indication to start tests */
      console.log("Application ready");
    });
  })
  .catch((error) => {
    /* Used by test suite as indication to abort tests */
    console.error("Application initialization failed: %o", error);
  });
