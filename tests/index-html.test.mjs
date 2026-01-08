import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const indexPath = resolve(process.cwd(), "index.html");
const html = readFileSync(indexPath, "utf8");

const scriptRegex = /<script\s+type=["']module["']\s+src=["']\/index\.tsx["']\s*><\/script>/;
if (!scriptRegex.test(html)) {
  console.error("index.html is missing module script for /index.tsx");
  process.exit(1);
}

console.log("index.html includes module script for /index.tsx");
