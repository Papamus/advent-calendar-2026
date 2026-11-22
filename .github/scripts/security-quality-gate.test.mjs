import assert from "node:assert/strict";
import test from "node:test";
import { inspectSecuritySources } from "./security-quality-gate.mjs";

const guidance = {
  path: ".github/agents/copilot-instructions.md",
  content: "Strict Data Gating",
};

test("rejects client-side date construction outside API routes", () => {
  const result = inspectSecuritySources([
    guidance,
    {
      path: "src/components/Calendar.tsx",
      content: '"use client";\nconst today = new Date();',
    },
    {
      path: "src/app/api/calendar/route.ts",
      content: '"use client";\nconst today = new Date();',
    },
  ]);

  assert.deepEqual(result.errors, [
    "Walidacja daty przez new Date() w kodzie klienckim: src/components/Calendar.tsx",
  ]);
});

test("follows local imports from client components", () => {
  const result = inspectSecuritySources([
    guidance,
    {
      path: "src/components/Calendar.tsx",
      content: '"use client";\nimport { today } from "./today";',
    },
    {
      path: "src/components/today.ts",
      content: "export const today = new Date();",
    },
  ]);

  assert.deepEqual(result.errors, [
    "Walidacja daty przez new Date() w kodzie klienckim: src/components/today.ts",
  ]);
});

test("rejects a public service-role key name", () => {
  const keyName = ["NEXT", "PUBLIC", "SUPABASE", "SERVICE", "ROLE", "KEY"].join(
    "_",
  );
  const result = inspectSecuritySources([
    guidance,
    { path: "src/lib/supabase.ts", content: `process.env.${keyName}` },
  ]);

  assert.match(result.errors.join("\n"), /service role/i);
});

test("requires both cookie flags when session logic exists", () => {
  const result = inspectSecuritySources([
    guidance,
    {
      path: "src/lib/session.ts",
      content: 'cookies().set("calendar", token, { httpOnly: true });',
    },
  ]);

  assert.deepEqual(result.errors, [
    "Logika sesji nie ustawia flagi SameSite.",
  ]);
});

test("accepts session logic with both cookie flags", () => {
  const result = inspectSecuritySources([
    guidance,
    {
      path: "src/lib/session.ts",
      content:
        'cookies().set("calendar", token, { httpOnly: true, sameSite: "strict" });',
    },
  ]);

  assert.deepEqual(result.errors, []);
});

test("skips cookie checks until session logic is present", () => {
  const result = inspectSecuritySources([guidance]);

  assert.deepEqual(result.errors, []);
  assert.match(result.notices.join("\n"), /kontrola flag cookie pominięta/);
});

test("does not mistake test fixtures for application session logic", () => {
  const result = inspectSecuritySources([
    guidance,
    {
      path: ".github/scripts/session-fixture.test.mjs",
      content: 'const session = { httpOnly: true, sameSite: "strict" };',
    },
  ]);

  assert.deepEqual(result.errors, []);
  assert.match(result.notices.join("\n"), /kontrola flag cookie pominięta/);
});
