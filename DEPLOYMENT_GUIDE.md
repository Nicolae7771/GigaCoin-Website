# Deployment guide

1. Extract `GigaCoin_Complete_Website_Upgrade.zip` into the existing static-site repository.
2. Copy the archive contents to the repository's published root (or its configured `public` directory). Keep `index.html`, the root assets, and the complete `game/` directory together. Replace the prior root site files; do not nest the contents in an extra folder.
3. Commit and push the files to the GitHub branch watched by Render.
4. In Render, keep the existing Static Site and custom domain settings. Confirm the Publish Directory points to the directory containing `index.html`, then trigger a deploy.
5. Open the deployed home page and use **Play Game**. The dedicated route is `/game/` (Render serves `game/index.html` for this path).

No build command is required. No secrets or environment variables are used. The page and game reference local assets with relative paths. If the configured Render publish directory is `public`, place the package contents inside that directory.
