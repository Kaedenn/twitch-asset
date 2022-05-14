const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const process = require("process");
dotenv.config();

if (!process.env.APP_CLIENTID) {
  throw new Error(".env file not found or missing Client ID");
}

const debugHelper = require("#helpers/debug");
const debug = debugHelper.create("index");

const auth = require("#services/auth");
const status = require("#services/status");
const twasset = require("#services/twasset");
const twuser = require("#services/user");

debug("Debugging is enabled: %o", debugHelper.info());

/** TODO/FIXME
 *
 * Create module to handle commands on stdin.
 * - Allow for sending requests to localhost on the proper port.
 *
 * Listen on both HTTP and HTTPS with protocol elevation.
 */

/* Should we use HTTPS? */
let enable_https = false;
const cert_info = {};
if (process.env.APP_USE_HTTPS) {
  if (process.env.APP_KEY_FILE && process.env.APP_CRT_FILE) {
    const key_path = path.resolve(process.env.APP_KEY_FILE);
    const crt_path = path.resolve(process.env.APP_CRT_FILE);
    try {
      const key = fs.readFileSync(key_path);
      debug("Read key file %s (%d bytes)", key_path, key.length);
      const crt = fs.readFileSync(crt_path);
      debug("Read cert file %s (%d bytes)", crt_path, crt.length);
      cert_info.key = key;
      cert_info.cert = crt;
      enable_https = true;
    } catch (err) {
      /* Failure to read cert files is not fatal; fall back to HTTP */
      console.error("Failed to load certificates; falling back to HTTP...");
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
  /* Allow for http->https elevation */
  if (req.headers["x-forwarded-proto"] == "http") {
    return res.redirect(301, "https://" + req.headers.host + "/");
  } else {
    return next();
  }
});

app.get("/", status.getHome);
app.get("/status", status.getStatus);

app.get("/validate", auth.validate);

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

/* Gracefully handle SIGTERM and SIGINT */
(() => {
  for (const signal of ["SIGTERM", "SIGINT"]) {
    process.on(signal, () => {
      console.log(`Received ${signal}; exiting`);
      process.exit(0);
    });
  }
})();

const commands = {};
commands["do"] = async function () {
  console.log("Commands:");
  for (const command of Object.keys(commands)) {
    if (command.startsWith("do ")) {
      console.log("\t%s", command);
    }
  }
};

commands["do validate"] = async function () {
  const twauthlib = require("#helpers/twitch/auth");
  if (await twauthlib.validate()) {
    console.log("Successfully validated auth token");
  } else {
    console.error("Failed to validate");
  }
};

/* Allow for things sent via stdin */
process.stdin.on("readable", () => {
  let chunk;
  while (null !== (chunk = process.stdin.read())) {
    const lines = chunk.toString().trimEnd();
    for (const line of lines.split(/\n/)) {
      console.log(`Processing "%s"`, line);
      if (line in commands) {
        commands[line]()
          .then((resp) => {
            if (resp) {
              console.log("%s: %o", line, resp);
            }
          })
          .catch((err) => {
            console.error("Error in %s: %o", line, err);
          });
      } else {
        console.error("Unknown command %s", line);
      }
    }
  }
});

/* Exit gracefully if stdin closes */
process.stdin.on("end", () => {
  console.log(`Reached EOF on stdin`);
  process.exit(0);
});

/* Primary entry point */
async function main() {
  /* Determine the scheme and port and create the server */
  let http_server;
  let http_port;
  if (enable_https) {
    http_server = https.createServer(cert_info, app);
    http_port = process.env.APP_HTTPS_PORT;
  } else {
    http_server = http.createServer(app);
    http_port = process.env.APP_HTTP_PORT;
  }

  try {
    await twasset.authenticate();
    await twasset.initialize();
    http_server.listen(http_port, () => {
      debug("Listening on port %d", http_port);
      /* Used by test suite as indication to start tests */
      console.log("Application ready");
    });
  } catch (error) {
    /* Used by test suite as indication to abort tests */
    console.error("Application initialization failed: %o", error);
  }
}

main();
