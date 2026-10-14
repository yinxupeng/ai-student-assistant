import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

for (const entry of ['index.html', 'legacy.html', 'dist/app.html']) {
  test(`${entry} loads a browser-only classic script`, () => {
    const html = readFileSync(new URL(`../${entry}`, import.meta.url), 'utf8');
    const scripts = [...html.matchAll(/<script\b([^>]*)src="([^"]+)"[^>]*>/g)];
    assert.ok(scripts.length > 0, 'Entry must load an application bundle');
    for (const [, attributes, source] of scripts) {
      assert.doesNotMatch(attributes, /type="module"/, 'Direct file opening requires classic scripts');
      const bundle = readFileSync(new URL(source.split('?')[0], new URL(`../${entry}`, import.meta.url)), 'utf8');
      assert.equal(/\bprocess\.env\.NODE_ENV\b/.test(bundle), false, 'Build must resolve NODE_ENV');
      // Without a DOM, execution may stop at document, but never at a Node global.
      try {
        runInNewContext(bundle, {}, { timeout: 3000 });
      } catch (error) {
        assert.equal(error.name, 'ReferenceError');
        assert.match(error.message, /document is not defined/);
      }
    }
  });
}
