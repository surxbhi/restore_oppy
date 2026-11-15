# Deploying Restore Oppy (Vercel)

The game is plain static files with no build step. Vercel serves the repo root, and `vercel.json` hides the `prototype/` folder from the addresses: the main game is at `/`, other game files are served from `/<file>` (for example `/audio/...`), and any old `/prototype/...` link redirects. The pages load `../storytimes/`, which resolves to `/storytimes/`. A mini-game opened on its own on the live site goes to the main game (`stage.js`); on localhost it still opens on its own for testing.

**Live link:** https://restore-oppy.vercel.app (Vercel project `restore-oppy`).

## Redeploy

From the repo root:

```bash
npx vercel@latest --prod
```

That uploads this folder and updates the live link. Leave out `--prod` to get a private preview link first. `.vercelignore` keeps `.git`, `.env` files and other local files out of the upload.

## First time on a new computer

1. Sign in: `npx vercel@latest login`.
2. Link this folder to the existing project, so the same live link is kept:

   ```bash
   npx vercel@latest link --project restore-oppy
   ```

   This writes a local `.vercel/` folder, and a `.env.local` holding a short-lived Vercel token. Both are git-ignored; never commit them.
3. Deploy with `npx vercel@latest --prod`.

If Vercel asks about settings: framework "Other", no build command, no output directory, root directory `./`.

## Deploying on every push (optional)

In the Vercel dashboard, open the `restore-oppy` project, then Settings, then Git, and connect the GitHub repo `surxbhi/restore_oppy`. Every push to `main` then deploys automatically.
