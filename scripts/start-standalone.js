#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const projectRoot = process.cwd();
const nextRoot = path.join(projectRoot, ".next");
const standaloneDir = path.join(nextRoot, "standalone");

if (!fs.existsSync(standaloneDir)) {
  console.error(
    "Cannot find .next/standalone output. Run `npm run build` before `npm start`."
  );
  process.exit(1);
}

const ensureStaticAssets = () => {
  const staticSource = path.join(nextRoot, "static");
  const staticTarget = path.join(standaloneDir, ".next", "static");

  if (!fs.existsSync(staticSource)) {
    console.warn("No .next/static directory found. Skipping copy step.");
    return;
  }

  fs.mkdirSync(path.dirname(staticTarget), { recursive: true });
  if (fs.existsSync(staticTarget)) {
    fs.rmSync(staticTarget, { recursive: true, force: true });
  }
  fs.cpSync(staticSource, staticTarget, { recursive: true });
};

ensureStaticAssets();

const prepareOnly = process.argv.includes("--prepare-only");
if (prepareOnly) {
  console.log("Standalone assets prepared.");
  process.exit(0);
}

const child = spawn("node", [path.join(".next", "standalone", "server.js")], {
  stdio: "inherit",
  env: process.env,
});

child.on("close", (code) => {
  process.exit(code);
});

child.on("error", (error) => {
  console.error("Failed to start standalone server:", error);
  process.exit(1);
});
