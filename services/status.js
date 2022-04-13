const responses = require("../helpers/responses");
const debug = require("../helpers/debug");

exports.getHome = responses.build(200, true, { status: "online" });

exports.getStatus = responses.build(200, true);

exports.getDebug = (req, res) => {
  debug.log(process);
  if (process.env.APP_DEBUG === "on") {
    res.status(200).send({ success: true });
  } else {
    res.status(400).send({
      success: false,
      message: "Bad request"
    });
  }
};
