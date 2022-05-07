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

This application mostly serves JSON, except for the specific endpoints that serve text.

## Badges

Each badge object has the following layout:

```
{ "set_id": String, "versions": [ Object ... ] }
```

where `set_id` refers to the badge's name (eg. `subscriber`) and each version has the following layout:

```
{ "id": Number, "image_url_1x": String, "image_url_2x": String, "image_url_4x": String }
```

where `id` is the version index (starting at `0`). The `1x` URL gives a small badge icon, `2x` gives a medium badge image, and `4x` gives a full-size badge image.

# Endpoints

## `GET /`

Responds `HTTP 200 OK` with the following payload:

```
{ success: true, status: "online" }
```

## `GET /status`

Responds `HTTP 200 OK` with the following payload:

```
{ success: true }
```

## `GET /debug`

Responds `HTTP 200 OK` if debugging is enabled, `HTTP 400 Bad Request` otherwise. Payloads are either `{ success: true }` or `{ success: false, message: "Bad Request" }`.

## `GET /badge_debug`

Dumps the badge cache to the calling terminal. Returns `HTTP 200 OK` with an empty payload.

## `GET /badges`

Responds with a list of all known global badges:

```
{ data: [ Badge... ] }
```

See above for the `Badge` structure.

## `GET /badges/:broadcaster`

Obtain badge definitions for a specific broadcaster's user ID. Response structure TBD.

## `GET /badge/:set`

Responds with a specific badge's information:

```
{ data: Badge }
```

See above for the `Badge` structure.

## `GET /badge/:set/:version`

Responds with a specific badge and version:

```
{ data: Object }
```

See above for the `Object`'s structure.

## `GET /badge/:set/:version/url`

Responds with the given badge and version's smallest URL. This is equivalent to `GET /badge/:set/:version/url/1x`. This endpoint gives text, not JSON.

## `GET /badge/:set/:version/url/:size`

Responds with the given badge and version's URL for the specified size. This endpoint gives text, not JSON. In addition to the size values defined for each badge, the following extra sizes are understood:

| Size | Value          |
| ---- | -------------- |
| `1x` | `image_url_1x` |
| `2x` | `image_url_2x` |
| `4x` | `image_url_4x` |

## `GET /emote`

Not yet implemented.

## `GET /cheermote`

Not yet implemented.

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

# Bugs and other issues

There are consistency issues with response HTTP status codes. Certain problems (such as failure to authenticate with Twitch, failures querying the Twitch API due to token issues, etc) that don't always use the proper HTTP status code.

Response status and message fields are inconsistent; some APIs have a `success` field, some have a `message` field, some have both, and some have neither.

# Future work

I want to implement the following things:

1. Authorization to send requests on behalf of a specific user
2. HTTPS
   - Certificate location should be configurable.
   - Generate a self-signed certificate if no other certificate is found.
3. Administrative interface (perhaps via ejs or vue) locked behind `https://localhost` access
   - Perhaps configure "host whitelist" of users allowed to access the interface.
   - Allow for refreshing the access token via this administrative interface.

