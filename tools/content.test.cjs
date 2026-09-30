const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { readContent, synchronize } = require('./leaders-content.cjs');

const source = readFileSync(require.resolve('../content/leaders.json'), 'utf8');
const html = readFileSync(require.resolve('../dist/index.html'), 'utf8');

test('generated leaders content stays synchronized with HTML', () => {
  assert.equal(synchronize(html, readContent(source)), html);
});

test('content generation escapes markup and preserves literal replacement sequences', () => {
  const data = JSON.parse(JSON.stringify(readContent(source)));
  data.people[0].name = '<script>&"$&';
  data.people[0].description = "Member's contribution";
  const updated = synchronize(html, data);
  assert.ok(updated.includes('&lt;script&gt;&amp;&quot;$&amp;'));
  assert.ok(updated.includes('Member&#39;s contribution'));
  assert.equal((updated.match(/class="leader-card"/g) || []).length, data.people.length);
});

test('content validation rejects missing fields and duplicate numbers', () => {
  const duplicate = JSON.parse(JSON.stringify(readContent(source)));
  duplicate.people[1].number = duplicate.people[0].number;
  assert.throws(() => readContent(JSON.stringify(duplicate)), /Duplicate/);
  delete duplicate.people[0].name;
  assert.throws(() => readContent(JSON.stringify(duplicate)), /Leader name/);
});

test('editing the JSON alone can change the heading and add a management card', () => {
  const data = JSON.parse(source);
  data.intro.title = '新的管理层标题';
  data.people.push({ number: '06', role: '管理层', roleEn: 'MANAGEMENT', name: '新成员', description: '新的贡献说明。' });
  const updated = synchronize(html, readContent(JSON.stringify(data)));
  assert.ok(updated.includes('<h2>新的管理层标题</h2>'));
  assert.ok(updated.includes('<h3>新成员</h3><p>新的贡献说明。</p>'));
  assert.equal((updated.match(/class="leader-card"/g) || []).length, data.people.length);
});
