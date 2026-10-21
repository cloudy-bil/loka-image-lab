# Loka — Image Lab

Loka Image Lab is a free, English-first online image and PDF toolkit. The homepage introduces the tools, explains browser-based processing, and includes a usage guide and FAQ. The editor supports image resizing and conversion, compression, grid splitting, and common PDF tasks.

- `index.html` is the complete landing page; the Workbench lives on `tools.html`.
- The shared English and Indonesian translations are loaded from `translations.js`; the homepage uses `home.js` and the Workbench uses `app.js`.

- Image and PDF files are processed in the visitor's browser instead of being uploaded to a Loka conversion server.
- The homepage includes canonical, Open Graph, and social-card metadata, WebApplication and FAQ structured data, plus a generated sitemap and `robots.txt`.
- The public default language and search metadata are English; the interface can also be switched to Indonesian.

- Text and spreadsheet categories are shown as unavailable too. All categories that need a server are disabled and labeled rather than presented as working converters.


## Image formats


- Export: JPG, PNG, WEBP, BMP, TIFF, SVG, and AVIF when the visitor's browser supports AVIF encoding.
- BMP and uncompressed TIFF are encoded in the browser. Unsupported AVIF options are disabled automatically.
- SVG export embeds a PNG image to preserve its appearance. It is an SVG container, not a vector trace, so the image itself is not made of editable vector paths.
- Import formats depend on the browser's image decoder.


## Run locally


- Windows: double-click `start.bat` (requires Node.js).
- Or run `node server.js` in this folder, then open <http://127.0.0.1:4173>.
- You can also open `index.html` directly in a browser.


The generated PDF bundles are included, so no package installation is required to run the site. Use the `EN` / `ID` button in the header to change the interface language.


To rebuild the bundled PDF tools after editing `pdf-tools.js`, install dependencies with `npm install` and run `npm run build:pdf`. The PDF libraries are bundled locally; the deployed site does not load them from a CDN.


## Deploy online


This is a static website, so it can be hosted without running `server.js` or maintaining an image-processing backend. For example, deploy the `image-rescaler` folder with Cloudflare Pages, Netlify, or another static-site host. Connect a custom domain when you are ready to publish it.


The browser does the image and PDF processing; hosting is still needed to serve the website files. Include `pdf-tools.bundle.js` and `pdf.worker.bundle.mjs` when deploying. Verify the deployed site over HTTPS and test the supported formats in your target browsers.


### GitHub Pages


1. Create a **public** GitHub repository (for example, `loka-image-lab`) and add the contents of this `image-rescaler` folder to its repository root.
2. In the repository, open **Settings → Pages** and set the build/deployment source to **GitHub Actions**.
3. Push to the `pai` branch (this repository's default branch). The included workflow builds the static site, creates a sitemap for the GitHub Pages URL, and deploys the `dist` folder.
4. After the workflow succeeds, open the URL shown in the **github-pages** environment under **Actions**. For the example repository, it will be `https://YOUR-USERNAME.github.io/loka-image-lab/`.
5. In Google Search Console, add the public site URL, verify ownership, then submit `https://YOUR-USERNAME.github.io/loka-image-lab/sitemap.xml`.


The repository needs to be public for GitHub Pages on GitHub Free. Google indexing may take time and is not guaranteed. If using a custom domain, update `SITE_URL` in `.github/workflows/deploy-pages.yml` to that domain before deploying, so canonical metadata and sitemap use the public address.


## Monetization ideas


- Add display ads after the site has useful content and returning traffic; ad networks review sites and revenue is not guaranteed.
- Add clearly labeled affiliate links or sponsorships that fit the audience.
- Offer optional support or donations with a payment link.
- A paid plan with accounts, billing, or server-side features needs a backend and payment integration; those are not included in this static version.


Keep a privacy policy and any required cookie or advertising disclosures up to date if you add analytics or ads.
