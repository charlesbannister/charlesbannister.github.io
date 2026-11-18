import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function projectPath(relativePath) {
  return path.join(root, relativePath);
}

function readRequired(relativePath) {
  const filePath = projectPath(relativePath);
  assert.ok(existsSync(filePath), `${relativePath} should exist`);
  return readFileSync(filePath, "utf8");
}

test("homepage offers freelance services and uses one tools marquee", () => {
  const html = readRequired("src/index.html");

  assert.match(html, /Charles Bannister/);
  for (const page of ["google-ads", "end-to-end", "websites", "automation"]) {
    assert.match(html, new RegExp(`href="${page}\\.html"`));
    assert.doesNotMatch(readRequired(`src/${page}.html`), /class="logo-marquee"/);
  }
  assert.equal([...html.matchAll(/class="logo-marquee /g)].length, 1);
  assert.match(html, /id="services"[\s\S]*?class="logo-marquee /);
  assert.doesNotMatch(html, /data-marquee-toggle|name="robots" content="noindex/);
  assert.doesNotMatch(html, /mailto:|id="mockups"|Client mockups/);
});

test("external links open a new tab and internal links stay in the current tab", () => {
  for (const page of ["index", "about", "automation", "campaign-zip-sync", "contact", "end-to-end", "google-ads", "how-i-work", "reviews", "websites", "work"]) {
    const html = readRequired(`src/${page}.html`);
    for (const [link, href] of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)) {
      if (href.startsWith("https://")) {
        assert.match(link, /target="_blank"/, `${page}: ${href}`);
        assert.match(link, /rel="noopener"/, `${page}: ${href}`);
      } else {
        assert.doesNotMatch(link, /target="_blank"/, `${page}: ${href}`);
      }
    }
  }
});

test("washer disinfectors mockup is a static noindex preview with local logo", () => {
  const html = readRequired("src/mockups/washer-disinfectors/index.html");

  assert.match(html, /Washer Disinfectors for Dental Practices/);
  assert.match(html, /name="robots" content="noindex, nofollow, noarchive"/);
  assert.match(html, /assets\/logo\.png/);
  assert.doesNotMatch(html, /<\?php/);
  assert.ok(statSync(projectPath("src/mockups/washer-disinfectors/assets/logo.png")).size > 0);
});

test("DDL redesign mockups are static noindex pages with local assets", () => {
  for (const key of ["a", "b", "c"]) {
    for (const page of ["home", "autoclave-service"]) {
      const html = readRequired(`src/mockups/ddl-redesign/${key}-${page}.html`);
      assert.match(html, /name="robots" content="noindex, nofollow, noarchive"/);
      assert.match(html, new RegExp(`assets/${key}\\.css`));
    }
  }
  assert.ok(statSync(projectPath("src/mockups/ddl-redesign/assets/img/logo.png")).size > 0);
});

test("contact page uses the live Lambda form and preserves the honeypot field", () => {
  const html = readRequired("src/contact.html");
  assert.match(html, /data-endpoint="https:\/\/[a-z0-9]+\.lambda-url\.us-east-2\.on\.aws\/"/);
  assert.match(html, /name="website"[^>]*tabindex="-1"/);
  assert.doesNotMatch(html, /data-note|data-ed-|Preview form/);
  assert.match(html, /name="company"/);
  assert.match(html, /src="contact\.js"/);
});

test("robots.txt hides mockups from crawlers", () => {
  const robots = readRequired("src/robots.txt");
  assert.match(robots, /Disallow: \/mockups\//);
});

test("package scripts use built-in test, build, and Python dev server without dependencies", () => {
  const pkg = JSON.parse(readRequired("package.json"));

  assert.equal(pkg.scripts.test, "node --test test/*.test.mjs");
  assert.equal(pkg.scripts.build, "node tools/build.mjs");
  assert.equal(pkg.scripts.dev, "python3 -m http.server 5173 --directory src");
  assert.deepEqual(pkg.dependencies ?? {}, {});
  assert.deepEqual(pkg.devDependencies ?? {}, {});
});

test("build writes dist with CNAME, homepage, and mockup", () => {
  const cname = readRequired("CNAME").trim();
  assert.equal(cname, "charlesbannister.com");

  rmSync(projectPath("dist"), { force: true, recursive: true });
  mkdirSync(projectPath(".agent-runs"), { recursive: true });

  const result = spawnSync(process.execPath, ["tools/build.mjs"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(existsSync(projectPath("dist/index.html")), "dist/index.html exists");
  assert.ok(existsSync(projectPath("dist/styles.css")), "dist/styles.css exists");
  assert.ok(existsSync(projectPath("dist/mockups/washer-disinfectors/index.html")));
  assert.equal(readRequired("dist/CNAME").trim(), "charlesbannister.com");
});

test("GitHub Pages workflow tests and builds dist before main-branch deployment", () => {
  const workflow = readRequired(".github/workflows/pages.yml");

  assert.match(workflow, /branches:\s*\[\s*["']main["']\s*\]/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /actions\/upload-pages-artifact@/);
  assert.match(workflow, /path:\s*dist/);
  assert.match(workflow, /actions\/deploy-pages@/);
});

test("content.md headings and title mirror the homepage", () => {
  const html = readRequired("src/index.html");
  const content = readRequired("content.md");
  const decode = (text) => text.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();

  const title = content.match(/^title: (.+)$/m)?.[1];
  assert.equal(title, decode(html.match(/<title>(.+)<\/title>/)[1]));

  const h1 = content.match(/^# (.+)$/m)?.[1];
  assert.equal(h1, decode(html.match(/<h1[^>]*>(.+)<\/h1>/)[1]));

  const mdHeadings = [...content.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  const withoutDialogs = html.replace(/<dialog[^>]*>[\s\S]*?<\/dialog>/g, "");
  const htmlHeadings = [...withoutDialogs.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map((m) => decode(m[1]));
  assert.deepEqual(mdHeadings, htmlHeadings);
});

test("homepage never contains content.md instruction blocks or hotlinked images", () => {
  const html = readRequired("src/index.html");
  // The contact form is the one place inputs belong.
  const withoutForm = html.replace(/<form class="contact-form"[\s\S]*?<\/form>/, "");

  assert.doesNotMatch(withoutForm, /<\/?input\b/i);
  assert.doesNotMatch(html, /<img[^>]+src="https?:/i);
});

test("jerseys page lists scraped kids' kits from a local JSON file", async () => {
  const html = readRequired("src/jerseys/index.html");
  assert.match(html, /Kids' football kits/);
  assert.match(html, /fetch\("kids-kits\.json"\)/);

  const data = JSON.parse(readRequired("src/jerseys/kids-kits.json"));
  assert.ok(data.kits.length > 100, "expected a full scrape of kids' kits");
  for (const kit of data.kits) {
    assert.match(kit.url, /^https:\/\/www\.ifunstudio\.ru\/products\//);
    assert.ok(kit.team, `${kit.title} has a team`);
  }

  const { isKids, teamName } = await import("../tools/scrape-ifun-kids.mjs");
  assert.equal(teamName("2025/2026 Manchester City Home Shirt Kids Size"), "Manchester City");
  assert.equal(teamName("1998 Retro Brazil Home Shirt Kids Size"), "Brazil");
  assert.equal(teamName("2026 New York Red Bulls Home Shirt Kids Size"), "New York Red Bulls");
  assert.equal(teamName("2026 Mexico National Team Away Jersey Kids Size"), "Mexico");
  assert.equal(isKids({ title: "2025/2026 Manchester City KidSuper Joint Edition White Shirt", handle: "x" }), false);
  assert.equal(isKids({ title: "2024 France Half-Pull Training Suit Baby blue Shirt Set", handle: "x" }), false);
  assert.equal(isKids({ title: "2024/2025 Liverpool Home Shirt Kids Size", handle: "x" }), true);
});
