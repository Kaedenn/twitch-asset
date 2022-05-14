# twitch-asset

Application for obtaining URLs for specific Twitch assets.

This application intends to serve image URLs and other information for a specified asset. The asset can be a badge, emote, or cheermote. Example usage would be something akin to the following:

Request:

```
GET http://localhost:8081/badge/subscriber/0/url/1x
```

Response:

```
https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/1
```

The intent is to provide functionality Twitch should provide, seeing how they already store emote images according to their name and size. You can use this in web pages, Twitch extensions, and more.

```
<img title="Subscriber" href="http://localhost:8081/badge/subscriber/0/url/1x" />
```

# What this application is not

This application does not make request on behalf of any specific user. The access token it uses is not _your_ access token; it can be considered anonymous. Therefore, this is not a specific user's chat bot.

# Response structure

This application serves JSON, except where stated otherwise (such as the URL endpoints).

## Badge object structure

```typescript
type Badge = {
  set_id: string,
  versions: Version[]
}

type Version = {
  id: string,
  image_url_1x: URL,
  image_url_2x: URL,
  image_url_4x: URL
}
```

`set_id` is a string that uniquely identifies the badge. This is generally the badge's name.

A `Version`'s `id` attribute uniquely identifies that version of the badge. This is used for subscription tiers, months subscribed, cumulative bits donated, and more. The value is typically numeric, but as a string.

`image_url_1x` is a URL to the small version of the badge.

`image_url_2x` is a URL to the medium version of the badge.

`image_url_4x` is a URL to the large version of the badge.

For example, the global `subscriber` badge has the following layout:

```
{
  "data": {
    "set_id": "subscriber",
    "versions": [
      {
        "id": "0",
        "image_url_1x": "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/1",
        "image_url_2x": "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2",
        "image_url_4x": "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/3"
      },
      {
        "id": "1",
        "image_url_1x": "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/1",
        "image_url_2x": "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2",
        "image_url_4x": "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/3"
      }
    ]
  }
}
```

The `1x` URL gives a small badge icon, `2x` gives a medium badge image, and `4x` gives a full-size badge image.

# Endpoints

## Misc endpoints

### `GET /`

Responds `HTTP 200 OK` with the following payload:

```
{ success: true, status: "online" }
```

### `GET /status`

Responds `HTTP 200 OK` with the following payload:

```
{ success: true }
```

### `GET /validate`

Validates the access token against Twitch. Responds `HTTP 200 OK` on success with the following payload:

```
{ success: true, message: "validated" }
```

### `GET /debug`

Responds `HTTP 200 OK` if debugging is enabled, `HTTP 400 Bad Request` otherwise. Payloads are either `{ success: true }` or `{ success: false, message: "Bad Request" }`.

## Global badges

### `GET /badges` or `GET /badge`

Get a list of all global badges.

### `GET /badge/:set`

Get a specific global badge. Includes all versions.

### `GET /badge/:set/:version`

Get a specific version of the global badge.

### `GET /badge/:set/:version/url`

This endpoint serves text.

Get the URL to the smallest image of the given global badge and version. This is equivalent to `GET /badge/:set/:version/url/1x`.

### `GET /badge/:set/:version/url/:size`

This endpoint serves text.

Get the URL to a specific image of the given global badge and version.

Extra sizes are accepted in addition to the ones defined in the badge:

| Alias | Value          | Description          |
| ----- | -------------- | -------------------- |
| `1x`  | `image_url_1x` | Small, chat-sized    |
| `2x`  | `image_url_2x` | Medium               |
| `4x`  | `image_url_4x` | Large, profile-sized |

## User badges

### `GET /badges/:user` or `GET /user/badges/:user` or `GET /user/badge/:user`

Get a list of all badges for the given user.

### `GET /user/badge/:user/:set`

Get a user's badge. Includes all versions.

See `GET /badge/:set`.

### `GET /user/badge/:user/:set/:version`

Get a specific version of the user's badge.

See `GET /badge/:set/:version`.

### `GET /user/badge/:user/:set/:version/url`

This endpoint serves text.

See `GET /badge/:set/:version/url`.

### `GET /user/badge/:user/:set/:version/url/:size`

This endpoint serves text.

See `GET /badge/:set/:version/url/:size`.

## Emotes and cheermotes

### `GET /emote`

Not yet implemented.

### `GET /cheermote`

Not yet implemented.

## Other endpoints

### `GET /user/:login`

Get information about a specific user.

# Local deployment

I highly recommend you use this endpoint locally. You will need to add a Twitch extension and configure this endpoint with the values you receive. Follow these steps to do that:

1. Register a new Twitch application.
   - Go to [https://dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps).
   - Click "Register Your Application".
   - Give your application a name.
   - Configure the endpoint to be `http://localhost:8081`. Feel free to change the port number if desired. You should not use a port number less than 1024.
   - Select any category that makes sense. I selected "Website Integration".
   - Make note of your Client ID.
   - Generate a new client secret and make note of the value. This value will appear once and you cannot view it again without generating a new one. Therefore, copy it somewhere safe and secure (such as a password manager).
2. Configure this application to use your Client ID and client secret.
   - Copy or rename `.env.sample` to `.env`.
   - Edit `.env` and replace `APP_CLIENTID` and `APP_SECRET` with the values you obtained above. Feel free to change the port number if desired.
   - Run `npm install` if you haven't already.
   - Run `npm run start`.

You can now run `npm test` to ensure the endpoint works properly.

# Local deployment with SSL

If you want to use SSL, then follow these steps in addition to the ones above:

1. Purchase or generate your SSL certificate and key files.
2. Modify the `.env` file:
   - Set `APP_USE_HTTPS` to `1`.
   - Change `APP_KEY_FILE` and `APP_CRT_FILE` to your certificate files' paths. They don't need to be in the `certs/` subdirectory.

That should be it. Be sure to run `npm test` to ensure the tests work.

# Bugs and other issues

There are consistency issues with response HTTP status codes. Certain problems (such as failure to authenticate with Twitch, failures querying the Twitch API due to token issues, etc) that don't always use the proper HTTP status code.

Response status and message fields are inconsistent; some APIs have a `success` field, some have a `message` field, some have both, and some have neither.

# Future work

I want to implement the following things:

- Things are getting a bit disorganized (see `index.js`). Refactor to separate responsibilities into their own modules.
- Authorization to send requests on behalf of a specific user.
- Administrative interface (perhaps via ejs or vue) locked behind `https://localhost` access.
  - Perhaps configure "host whitelist" of users allowed to access the interface.
  - Allow for refreshing the access token via this administrative interface.

