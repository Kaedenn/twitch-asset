exports.build = (code, success = true, data = {}) => {
  return (req, res) => {
    res.status(code).send({
      success: success,
      ...data
    });
  };
};

exports.unimplemented = () => {
  return (req, res) => {
    res.status(400).send({
      success: false,
      message: `The endpoint "${req.path}" is not yet functional`
    });
  };
};
