/* Title-case the given string */
exports.toTitleCase = (string) => {
  if (string) {
    return string[0].toUpperCase() + string.slice(1).toLowerCase();
  }
  return string;
};
