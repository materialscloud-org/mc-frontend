# Materials Cloud main frontend

Built with Astro, which allows for a simple but powerful and flexible way to create the static frontend.

## Deployment

### Cloudflare pages - Production

The main/production deployment is performed with Cloudflare pages to https://www.materialscloud.org.

In addition to the production deployment, each commit and branch also get a preview deployment at `<branch/commit>.mc-frontend.pages.dev`, such as

- https://develop.mc-frontend.pages.dev

But note that special characters in branch names (e.g. `_`, `/`) get replaced with `-` in the URL.

### Github pages

Additionally, the `main` branch is automatically deployed to https://materialscloud-org.github.io/mc-frontend via a Github action.

This, however, doesn't contain the redirects that are present on Cloudflare.

## Development notes

- when linking to pages/resources don't use the leading slash (so use e.g. `<a href="work">` or `<img src="images/logos/mc3d.png">`). This will use the `base:` subpath correctly.

## Links

Legacy repositories:

- [frontend-common](https://github.com/materialscloud-org/frontend-common)
- [frontend-learn](https://github.com/materialscloud-org/frontend-learn)
- [frontend-work](https://github.com/materialscloud-org/frontend-work)
- [frontend-discover](https://github.com/materialscloud-org/frontend-discover)
- [frontend-explore](https://github.com/materialscloud-org/frontend-explore)
- [legacy-frontend-docker](https://github.com/materialscloud-org/legacy-frontend-docker)

# Astro notes

This repo was created with

```sh
npm create astro@latest -- --template basics
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## Astro commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
