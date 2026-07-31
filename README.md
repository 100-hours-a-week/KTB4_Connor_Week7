# KBTroom frontend

Vite and React Router single-page application for the KBTroom service.

## Local development

```bash
npm ci
npm run dev
```

Local development uses `http://localhost:8080` and fixture booking data unless
`APP_CONFIG` or Vite environment variables override them.

## Verification

```bash
npm run check:js
npm test
npm run test:react
npm run build
```

## Production image

The multi-stage Dockerfile builds the Vite application with Node.js and serves
the result from Nginx with React Router fallback support.

```bash
docker build --platform linux/arm64 -t kbtroom-frontend .
docker run --rm -p 127.0.0.1:3000:80 kbtroom-frontend
```

The production defaults are `https://api.kbtroom.cloud` for implemented APIs
and fixture-backed booking data because the current backend has no room or
reservation controller. They can be changed with `VITE_API_BASE_URL` and
`VITE_BOOKING_DATA_SOURCE` Docker build arguments after that contract exists.

## Deployment

Pushes to `main` verify and publish an immutable commit-SHA image to private
ECR. Deployment uses GitHub OIDC and SSM; no AWS key or SSH key is stored in
GitHub.

Required repository variables:

```text
AWS_DEPLOY_ROLE_ARN
EC2_INSTANCE_ID
EC2_DEPLOY_ENABLED=true
```

Keep `EC2_DEPLOY_ENABLED` unset until Terraform has created the frontend ECR
and frontend-only OIDC role, and the EC2 host has the reviewed Compose file,
root-owned deployment runner, and a valid `kbtroom.cloud` Nginx certificate.
