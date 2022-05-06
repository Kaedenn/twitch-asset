const debug = require("#helpers/debug").create("helpers/twitch/errors");

class TwitchError extends Error {
  constructor(message) {
    super(message);
  }
}

class APIError extends TwitchError {
  constructor(message) {
    super(message);
  }

  get type() {
    return "APIError";
  }
}

class ObjectNotFoundError extends TwitchError {
  constructor(message) {
    super(message);
  }
}

class UserNotFoundError extends ObjectNotFoundError {
  constructor(user, message = null) {
    const msg = `User "${user}" not found`;
    if (message !== null) {
      msg += ": " + message;
    }
    super(msg);
  }

  get type() {
    return "UserNotFound";
  }
}

class BadgeNotFoundError extends ObjectNotFoundError {
  constructor(badge, message = null) {
    const msg = `Badge "${badge}" not found`;
    if (message !== null) {
      msg += ": " + message;
    }
    super(msg);
  }

  get type() {
    return "BadgeNotFound";
  }
}

function getStatusFor(error) {
  if (error instanceof ObjectNotFoundError) {
    return [404, error.toString()];
  } else if (error instanceof APIError) {
    return [400, error.toString()];
  } else {
    return [500, error.toString()];
  }
}

Object.assign(exports, {
  TwitchError,
  APIError,
  ObjectNotFoundError,
  UserNotFoundError,
  BadgeNotFoundError,
  getStatusFor
});
