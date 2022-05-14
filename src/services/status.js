const responses = require("#helpers/responses");
const debugHelper = require("#helpers/debug");
const debug = debugHelper.create("services/status");

exports.getHome = responses.build(200, true, { status: "online" });

exports.getStatus = responses.build(200, true);

exports.getDebug = (req, res) => {
  debug(process);

  if (debugHelper.enabled()) {
    res.send({ success: true });
  } else {
    res.status(400).send({
      success: false,
      message: "Bad request"
    });
  }
};
