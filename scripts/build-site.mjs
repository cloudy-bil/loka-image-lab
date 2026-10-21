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
  "tools.html",
  "styles.css",
  "home.js",
  "translations.js",
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

if (siteUrl) {
  const canonicalPattern = /<link rel="canonical" href="[^"]*">/;
  for (const [file, canonicalUrl] of [
    ["index.html", siteUrl],
    ["tools.html", `${siteUrl}tools.html`]
  ]) {
    const filePath = resolve(output, file);
    const html = await readFile(filePath, "utf8");
    if (!canonicalPattern.test(html)) {
      throw new Error(`${file} is missing its canonical link`);
    }
    const htmlWithSiteUrl = html
      .replaceAll("https://cloudy-bil.github.io/loka-image-lab/", siteUrl)
      .replace(canonicalPattern, `<link rel="canonical" href="${canonicalUrl}">`);
    await writeFile(filePath, htmlWithSiteUrl);
  }
}

if (siteUrl) {
  const toolPageUrl = `${siteUrl}tools.html`;
  await writeFile(
    resolve(output, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}</loc></url>\n  <url><loc>${toolPageUrl}</loc></url>\n</urlset>\n`
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
