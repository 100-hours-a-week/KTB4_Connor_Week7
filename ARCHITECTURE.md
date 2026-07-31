# Frontend architecture

## Application

The browser enters through the Vite-built React Router SPA. `app` owns routing
and application providers, `pages` compose route screens, `features` own user
actions, `api` owns HTTP and fixture adapters, and `shared` contains only
cross-feature utilities and UI.

The production build calls `https://api.kbtroom.cloud` for implemented APIs.
Booking remains fixture-backed until the backend implements the documented room
and reservation contracts. Local development uses `http://localhost:8080`
unless configuration overrides it.

## Production runtime

```text
Browser
  -> EC2 host Nginx (TLS, kbtroom.cloud)
  -> kbtroom-frontend container (127.0.0.1:3000)
  -> static React assets and SPA route fallback

Browser
  -> EC2 host Nginx (TLS, api.kbtroom.cloud)
  -> kbtroom-backend container (127.0.0.1:8080)
```

GitHub Actions builds the ARM64 frontend image and publishes it to private ECR.
The EC2 host pulls the image through SSM and runs it with the backend and MySQL
from the backend repository's Docker Compose definition. Images are built in
CI, not on the 1 GiB production instance.
