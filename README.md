# Racik Sumatera — clean Vercel package

This is the latest site, including the corrected atlas framing, single myth-card CTA,
editorial myth details, and numbered SDG learning panels. The ZIP contains only
deployment sources, referenced assets, required data, credits/licenses, and this guide.
`index.html`, `package.json`, and `vercel.json` are at the ZIP root: no nested project copy.

## Before public deployment

The team's original image photographer/source/license permissions remain unconfirmed.
Confirm permission before publishing the site. Packaging does not grant image rights.
Original PNGs are preserved in the original workspace but excluded here; the website
uses the unchanged WebP versions. `data/assets.json` retains their provenance mapping.

## Easiest: Vercel Drop

1. Sign in to https://vercel.com and open https://vercel.com/drop.
2. Upload this ZIP directly, or extract it into a fresh folder and upload that folder.
3. Choose your team/account and a project name, then select Deploy.
4. The included `vercel.json` configures the build. If settings are requested, use:

| Setting | Value |
|---|---|
| Framework Preset | Other |
| Root Directory | The folder containing index.html and vercel.json; `.` when extracted at the repository root |
| Build Command | node scripts/build.js |
| Output Directory | dist |
| Install Command | Override with an empty value; no dependencies are required |
| Node.js | 22.x |

In the project's Environment Variables settings, keep **Enable access to System
Environment Variables** enabled. The build uses the actual Vercel production domain
for canonical and social-image URLs. Alternatively, set `SITE_URL` to your real HTTPS
origin, with no path or hash. Do not enter a guessed/example domain. Redeploy after
changing settings. If you see "Enable Vercel system environment variables or set
SITE_URL", enable that checkbox and deploy again.

Vercel Drop publishes directly to production. A dropped project has no Git connection;
to update it, drop the new extracted folder onto that project in the dashboard.

## GitHub alternative

Upload the extracted contents (not the ZIP) to a GitHub repository, with index.html
at the repository root. In Vercel choose Add New -> Project, import that repository,
and use the settings above. If you put all files inside a subfolder, choose that exact
subfolder as Root Directory. Only committed and pushed files are deployed by Git.

## CLI alternative

With Node.js 22 installed, extract the ZIP, open PowerShell in its root folder, and run:

```powershell
npx.cmd vercel@latest login
npx.cmd vercel@latest --prod
```

Select your account/team and the correct project; use `.` for the directory. Review
the same build settings above. These commands publish the site; no deployment has
been performed as part of preparing this package.

## Verify after deployment

- Open the generated HTTPS URL and check the homepage, atlas, and all six regions.
- Check #herbs, a herbal detail, #myths, a myth detail, #sdg3, and #sdg4.
- Check #dampak/sdg3/literasi-kesehatan and #dampak/sdg4/pelestarian-pengetahuan.
- Check #references, source links, the mobile menu, keyboard focus, and copy actions.
- Refresh a detail URL directly; hash routing does not need a rewrite rule.
- Confirm that styles/images load and the sharing image uses the actual public domain.

Do not open index.html using file://. JSON and JavaScript modules need an HTTP server.
`node scripts/build.js` produces the public static files in `dist/` without installing
dependencies. Build on Vercel instead of uploading dist as this package's root.

## Excluded from this deployment package

Git history, node_modules, tests, screenshots, test/Lighthouse reports, old delivery
ZIPs, old nested project copies, placeholder files, research/download/image-processing
helper scripts, the local dev server, original PNG archives, and unreferenced images.
Required images/icons were copied byte-for-byte; no image was edited or replaced.
All scholarly content, image credits, and license files used by the site are retained.

Safari and physical-device checks are still separate from automated browser testing.
This package is technically deployable, not a certification of publication permissions.

Official guidance: https://vercel.com/docs/drop and https://vercel.com/docs/deployments
