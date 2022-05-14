const debugHelper = require("#helpers/debug");
const debug = debugHelper.create("services/auth");

const twauth = require("#helpers/twitch/auth");

exports.validate = (req, res) => {
  debug("Validating access token");
  twauth
    .validate()
    .then((status) => {
      res.status(200).send({
        success: true,
        message: "validated",
        status: status
      });
    })
    .catch((error) => {
      /* TODO: Make this more specific */
      /* TODO: Ensure this won't expose anything sensitive */
      res.status(500).send({ success: false, message: error.toString() });
    });
};
