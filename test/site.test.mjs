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

test("homepage describes Charles Bannister and freelance Google Ads work", () => {
  const html = readRequired("src/index.html");

  assert.match(html, /Charles Bannister/);
  assert.match(html, /software engineer/i);
  assert.match(html, /automation engineer/i);
  assert.match(html, /PPC specialist/);
  assert.match(html, /Freelance Google Ads/);
  assert.doesNotMatch(html, /mailto:/);
  assert.doesNotMatch(html, /hello@charlesbannister\.com/);
  assert.doesNotMatch(html, /Email me/);
  assert.doesNotMatch(html, /<nav/);
  assert.doesNotMatch(html, /id="mockups"/);
  assert.doesNotMatch(html, /Client mockups/);
});

test("washer disinfectors mockup is a static noindex preview with local logo", () => {
  const html = readRequired("src/mockups/washer-disinfectors/index.html");

  assert.match(html, /Washer Disinfectors for Dental Practices/);
  assert.match(html, /name="robots" content="noindex, nofollow, noarchive"/);
  assert.match(html, /assets\/logo\.png/);
  assert.doesNotMatch(html, /<\?php/);
  assert.ok(statSync(projectPath("src/mockups/washer-disinfectors/assets/logo.png")).size > 0);
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
