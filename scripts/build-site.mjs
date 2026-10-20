import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, "dist");
const repository = process.env.GITHUB_REPOSITORY;
const defaultSiteUrl = repository
  ? `https://${repository.split("/")[0]}.github.io/${repository.split("/")[1]}/`
  : "";
const configuredSiteUrl = process.env.SITE_URL || defaultSiteUrl;
const siteUrl = configuredSiteUrl ? configuredSiteUrl.replace(/\/?$/, "/") : "";
const files = [
  "index.html",
  "styles.css",
  "app.js",
  "pdf-tools.bundle.js",
  "pdf.worker.bundle.mjs",
  "favicon.svg",
  "robots.txt"
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of files) {
  await cp(resolve(root, file), resolve(output, file));
}

const indexPath = resolve(output, "index.html");
const html = await readFile(indexPath, "utf8");
const canonicalLink = siteUrl
  ? `<link rel="canonical" href="${siteUrl}">`
  : "";
await writeFile(
  indexPath,
  html.replace('<link rel="canonical" href="__SITE_URL__">', canonicalLink)
);

if (siteUrl) {
  await writeFile(
    resolve(output, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}</loc></url>\n</urlset>\n`
  );
  const robotsPath = resolve(output, "robots.txt");
  const robots = await readFile(robotsPath, "utf8");
  const robotsWithoutSitemap = robots
    .split(/\r?\n/)
    .filter(line => !/^Sitemap:/i.test(line))
    .join("\n")
    .trimEnd();
  await writeFile(
    robotsPath,
    `${robotsWithoutSitemap}\nSitemap: ${siteUrl}sitemap.xml\n`
  );
}

console.log(`Static site ready in ${output}`);
