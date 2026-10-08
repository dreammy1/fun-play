# Admin login deployment repair

## Implementation

The `fun-admin` Render web service currently runs only the Node API, so `/` returns `server is running` and the React admin login cannot load. Keep the existing single web service and make it serve the built React client from `client/dist` while preserving all API routes. Build the client locally as a committed deployment artifact because the existing Render build command installs only `server` dependencies; this avoids relying on an unavailable Render service-command update path.

- `server/index.js`: serve `client/dist` assets and return the SPA entry document for `/admin` and `/dashboard` routes.
- `client/.env.production`: use same-origin API paths so the integrated deployment calls its own API.
- `client/src/redux/features/baseApi.js`: retain same-origin fallback for local and integrated deployments.
- `client/src/pages/AdminLogin.jsx`: handle RTK Query mutation errors explicitly and prevent duplicate submissions.
- `public/manus-routes.json`: declare the user-facing and admin entry routes.

## Design

Use the existing dark admin login aesthetic: focused, high-contrast, responsive, and minimal. Preserve the current two-panel layout and improve only behavior needed for reliable access.

## Project structure

- `client/src/pages/AdminLogin.jsx`: admin credential form and login transition.
- `client/src/redux/features/allApis/usersApi/usersApi.js`: login/profile API contracts.
- `client/src/redux/features/baseApi.js`: API base URL and auth headers.
- `server/index.js`: Mongo-backed API plus integrated static client serving.
- `client/dist`: committed production bundle consumed by the current Render web service.
