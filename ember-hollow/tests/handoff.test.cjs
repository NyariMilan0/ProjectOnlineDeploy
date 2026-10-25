const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('HANDOFF.md is kept in step with the package version and lists next steps', () => {
  const root = path.join(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const handoff = fs.readFileSync(path.join(root, 'HANDOFF.md'), 'utf8');
  const match = handoff.match(/\*\*Version:\*\*\s*([0-9]+\.[0-9]+\.[0-9]+)/);
  assert.ok(match, 'HANDOFF.md must state **Version:** x.y.z');
  assert.equal(match[1], pkg.version, 'Update HANDOFF.md (version, changelog, next steps) whenever package.json changes version');
  assert.ok(handoff.includes('## Changelog') && handoff.includes('- **' + pkg.version + '**'), 'changelog needs an entry for ' + pkg.version);
  const next = handoff.split('## Next steps')[1] || '';
  assert.ok(/\n1\. /.test(next), 'HANDOFF.md needs a numbered "Next steps" list');
});
