# Loka — Image Lab

An English-first image toolkit to resize, convert, compress, rotate, flip, split image grids, and work with PDF files. Images and PDFs are processed in the visitor's browser and are not sent to the hosting server.

## PDF tools

- Images → one PDF: put each selected image on its own PDF page.
- PDF pages → images: export pages as PNG or JPG.
- Split PDF: save each page as a separate PDF.
- Merge PDFs: combine selected PDF files in selection order.
- PDF tools run in the browser. Files are limited to 100 MB each, PDF page operations to 200 pages per run, and page rendering to 60 seconds per page.
- The tool picker shows image and PDF workflows as available. Audio, video, archive, and e-book conversion are not included in this browser-only build; those formats need additional browser codecs or a server-side conversion engine.
- Image tools are grouped under Convert + resize, Compress, and Grid split. The image conversion flow includes source and output format selectors; PDF tools have source/output selectors for image ↔ PDF conversion, plus split and merge actions.
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
3. Push to the `main` branch. The included workflow builds the static site, creates a sitemap for the GitHub Pages URL, and deploys the `dist` folder.
4. After the workflow succeeds, open the URL shown in the **github-pages** environment under **Actions**. For the example repository, it will be `https://YOUR-USERNAME.github.io/loka-image-lab/`.
5. In Google Search Console, add the public site URL, verify ownership, then submit `https://YOUR-USERNAME.github.io/loka-image-lab/sitemap.xml`.

The repository needs to be public for GitHub Pages on GitHub Free. Google indexing may take time and is not guaranteed. If using a custom domain, update `SITE_URL` in `.github/workflows/deploy-pages.yml` to that domain before deploying, so canonical metadata and sitemap use the public address.

## Monetization ideas

- Add display ads after the site has useful content and returning traffic; ad networks review sites and revenue is not guaranteed.
- Add clearly labeled affiliate links or sponsorships that fit the audience.
- Offer optional support or donations with a payment link.
- A paid plan with accounts, billing, or server-side features needs a backend and payment integration; those are not included in this static version.

Keep a privacy policy and any required cookie or advertising disclosures up to date if you add analytics or ads.
