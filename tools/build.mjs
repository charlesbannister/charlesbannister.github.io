import { copyFile, cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "src");
const distDir = path.join(root, "dist");

await rm(distDir, { force: true, recursive: true });
await mkdir(distDir, { recursive: true });
await cp(sourceDir, distDir, { recursive: true });
await copyFile(path.join(root, "CNAME"), path.join(distDir, "CNAME"));

console.log("Built static site to dist/");
