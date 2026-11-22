import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceExtensions = new Set([".cjs", ".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const textExtensions = new Set([
  ...sourceExtensions,
  ".css",
  ".html",
  ".json",
  ".md",
  ".sql",
  ".svg",
  ".toml",
  ".yaml",
  ".yml",
]);
const textFilenames = new Set([".env.example", ".env.sample", ".env.template"]);
const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".vercel",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "playwright-report",
  "test-results",
]);
const serviceRolePublicKey = [
  "NEXT",
  "PUBLIC",
  "SUPABASE",
  "SERVICE",
  "ROLE",
  "KEY",
].join("_");

function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/");
}

function resolveSourceImport(importerPath, specifier, sourceByPath) {
  let basePath;

  if (specifier.startsWith("@/")) {
    basePath = `src/${specifier.slice(2)}`;
  } else if (specifier.startsWith(".")) {
    basePath = path.posix.normalize(
      path.posix.join(path.posix.dirname(importerPath), specifier),
    );
  } else {
    return null;
  }

  const candidates = [
    basePath,
    ...[...sourceExtensions].map((extension) => `${basePath}${extension}`),
    ...[...sourceExtensions].map((extension) =>
      path.posix.join(basePath, `index${extension}`),
    ),
  ];

  return candidates.find((candidate) => sourceByPath.has(candidate)) ?? null;
}

function getClientModulePaths(sourceFiles) {
  const sourceByPath = new Map(
    sourceFiles.map((file) => [file.path, file.content]),
  );
  const clientModules = new Set();
  const pending = sourceFiles
    .filter(
      ({ path: filePath, content }) =>
        filePath.startsWith("src/") &&
        !filePath.startsWith("src/app/api/") &&
        /^\s*["']use client["']\s*;?/.test(content),
    )
    .map(({ path: filePath }) => filePath);

  while (pending.length > 0) {
    const filePath = pending.pop();
    if (
      filePath === undefined ||
      clientModules.has(filePath) ||
      filePath.startsWith("src/app/api/")
    ) {
      continue;
    }

    clientModules.add(filePath);
    const content = sourceByPath.get(filePath);
    if (content === undefined) {
      continue;
    }

    const specifiers = [
      ...content.matchAll(
        /\b(?:import|export)\s+(?:[^'"]*?\s+from\s*)?["']([^'"]+)["']/g,
      ),
      ...content.matchAll(/\bimport\s*\(\s*["']([^'"]+)["']\s*\)/g),
    ].map((match) => match[1]);

    for (const specifier of specifiers) {
      const importedPath = resolveSourceImport(filePath, specifier, sourceByPath);
      if (importedPath !== null && !clientModules.has(importedPath)) {
        pending.push(importedPath);
      }
    }
  }

  return clientModules;
}

function getTextFiles(root, directory = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) ? [] : getTextFiles(root, absolutePath);
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!textExtensions.has(extension) && !textFilenames.has(entry.name)) {
      return [];
    }

    return [
      {
        path: normalizePath(path.relative(root, absolutePath)),
        content: readFileSync(absolutePath, "utf8"),
      },
    ];
  });
}

export function inspectSecuritySources(files) {
  const normalizedFiles = files.map((file) => ({
    ...file,
    path: normalizePath(file.path),
  }));
  const sourceFiles = normalizedFiles.filter((file) =>
    sourceExtensions.has(path.extname(file.path).toLowerCase()),
  );
  const errors = [];
  const notices = [];
  const clientModules = getClientModulePaths(sourceFiles);
  const guidanceExists = normalizedFiles.some(({ path: filePath }) =>
    [
      ".github/copilot-instructions.md",
      ".github/agents/copilot-instructions.md",
    ].includes(filePath),
  );

  if (!guidanceExists) {
    errors.push("Nie znaleziono instrukcji projektu Copilot.");
  }

  for (const filePath of clientModules) {
    const content = sourceFiles.find((file) => file.path === filePath)?.content;
    if (content !== undefined && /\bnew\s+Date\s*\(/.test(content)) {
      errors.push(
        `Walidacja daty przez new Date() w kodzie klienckim: ${filePath}`,
      );
    }
  }

  for (const { path: filePath, content } of normalizedFiles) {
    if (content.includes(serviceRolePublicKey)) {
      errors.push(
        `Niedozwolony klucz service role z prefiksem NEXT_PUBLIC: ${filePath}`,
      );
    }
  }

  const sessionFiles = sourceFiles.filter(
    ({ path: filePath, content }) =>
      filePath.startsWith("src/") &&
      /\b(session|auth|magic[\s_-]?link)\b|cookies?\s*\(|set-cookie/i.test(
        `${filePath}\n${content}`,
      ),
  );

  if (sessionFiles.length === 0) {
    notices.push("Brak logiki sesji — kontrola flag cookie pominięta.");
  } else {
    const sessionSource = sessionFiles.map(({ content }) => content).join("\n");

    if (!/\bhttpOnly\b/i.test(sessionSource)) {
      errors.push("Logika sesji nie ustawia flagi HttpOnly.");
    }
    if (!/\bsameSite\b/i.test(sessionSource)) {
      errors.push("Logika sesji nie ustawia flagi SameSite.");
    }
  }

  return { errors, notices };
}

function main() {
  const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();
  const result = inspectSecuritySources(getTextFiles(root));

  for (const notice of result.notices) {
    console.log(`INFO: ${notice}`);
  }

  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.error(`ERROR: ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Security & Quality Gate passed.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    main();
  } catch (error) {
    console.error(
      `Security & Quality Gate failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    process.exitCode = 1;
  }
}
