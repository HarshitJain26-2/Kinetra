import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

function findFiles(dir: string, ext: string[]): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        results = results.concat(findFiles(filePath, ext));
      }
    } else if (ext.some(e => file.endsWith(e))) {
      results.push(filePath);
    }
  }
  return results;
}

describe('Mobile Security & Leak Prevention Tests', () => {
  it('strictly verifies NO service-role key exists in mobile source files', () => {
    const mobileSrcDir = path.resolve(__dirname, '../src');
    const files = findFiles(mobileSrcDir, ['.ts', '.tsx', '.json', '.js']);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      assert.equal(
        content.includes('SUPABASE_SERVICE_ROLE_KEY'),
        false,
        `Forbidden SUPABASE_SERVICE_ROLE_KEY found in ${file}`
      );
      assert.equal(
        content.includes('service_role'),
        false,
        `Forbidden service_role string found in ${file}`
      );
    }
  });

  it('strictly verifies only EXPO_PUBLIC environment variables are read', () => {
    const mobileSrcDir = path.resolve(__dirname, '../src');
    const files = findFiles(mobileSrcDir, ['.ts', '.tsx']);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const processEnvMatches = content.match(/process\.env\.([A-Z0-9_]+)/g) || [];
      for (const match of processEnvMatches) {
        const varName = match.replace('process.env.', '');
        assert.ok(
          varName.startsWith('EXPO_PUBLIC_') || varName === 'NODE_ENV',
          `Non-public env variable accessed in mobile client: ${varName} in ${file}`
        );
      }
    }
  });
});
