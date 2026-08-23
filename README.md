# Sellora Admin Hub

Internal management console for FMCG field sales and distribution operations.
It includes dashboard, entity, inventory, and order views backed by placeholder
data that can later be replaced with API calls.

## Development

Requires Node.js and npm.

```sh
npm install
npm run dev
```

Useful checks:

```sh
npm run build
npm run lint
```

Authentication is intentionally excluded so OIDC can be integrated at the
application boundary.
