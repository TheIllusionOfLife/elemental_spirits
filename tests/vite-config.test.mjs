import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const configPath = resolve(process.cwd(), "vite.config.ts");
const config = readFileSync(configPath, "utf8");

const baseRegex = /base\s*:\s*["']\.\//;
if (!baseRegex.test(config)) {
  console.error('vite.config.ts is missing base: "./" for relative asset paths');
  process.exit(1);
}

console.log('vite.config.ts includes base: "./"');
