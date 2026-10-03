# Architecture Rules

- Keep the global product search URL-driven through `/products?search=` so header searches remain shareable and refresh-safe.
- Keep `/cart` as the single cart destination; future cart state and checkout actions should extend this page.