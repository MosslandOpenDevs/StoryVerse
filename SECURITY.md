# Security Policy

## Supported Versions

StoryVerse is under active development on the `main` branch. Security fixes land
on `main`; there is no long-term-support branch yet. Always run the latest
`main` for security patches.

## Reporting a Vulnerability

Please report suspected vulnerabilities **privately** rather than opening a
public issue:

- Use GitHub's [private security advisory](https://github.com/MosslandOpenDevs/StoryVerse/security/advisories/new) flow, or
- Contact the maintainers at the address listed on the organization profile.

Include reproduction steps, affected routes/versions, and impact. We aim to
acknowledge reports within a few business days.

## Deployment Hardening Notes

- **Catalog generation** (`POST /api/catalog/generate`) is refused in production
  unless `CATALOG_GENERATE_SECRET` is set; callers must then send
  `Authorization: Bearer <secret>`. The development localhost fallback relies on
  the client-controlled `Host` header and is **not** a network-level control —
  always configure the secret for any deployed environment, and place the app
  behind an authenticated gateway or network policy where possible.
- **Dependencies**: keep `next` and the AI SDK patched. Run
  `npm audit --omit=dev` before releases; the project pins a patched Next.js
  release to address published advisories.
- **Secrets**: never commit `.env.local`. Use `storyverse-web/.env.example` as
  the template.
