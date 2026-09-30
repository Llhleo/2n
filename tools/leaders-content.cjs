const assert = require('node:assert/strict');
const { runInNewContext } = require('node:vm');

const sectionPattern = /<section class="panel leaders"[^>]*>[\s\S]*?<\/section>/;
const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

function readContent(source) {
  const context = { window: {} };
  runInNewContext(source, context, { timeout: 1000 });
  const data = context.window.TwoNLeadersContent;
  assert.ok(data?.intro && Array.isArray(data.people) && data.people.length);
  for (const field of ['eyebrow', 'title'])
    assert.ok(typeof data.intro[field] === 'string' && data.intro[field].trim(), 'Intro ' + field);
  assert.ok(Array.isArray(data.intro.lines) && data.intro.lines.length);
  for (const line of data.intro.lines) assert.ok(typeof line === 'string' && line.trim());
  for (const person of data.people)
    for (const field of ['number', 'role', 'roleEn', 'name', 'description'])
      assert.ok(typeof person[field] === 'string' && person[field].trim(), 'Leader ' + field);
  assert.equal(new Set(data.people.map(person => person.number)).size, data.people.length, 'Duplicate leader number');
  return data;
}

function renderSection(data) {
  const text = escapeHTML;
  const cards = data.people.map(person =>
    '            <article class="leader-card"><span class="number">' + text(person.number) +
    '</span><div><span class="role">' + text(person.role + ' / ' + person.roleEn) +
    '</span><h3>' + text(person.name) + '</h3><p>' + text(person.description) +
    '</p></div></article>'
  ).join('\n');
  return '<section class="panel leaders" id="leaders" data-chapter="' + text(data.intro.title) + '">\n' +
    '          <div class="section-intro">\n' +
    '            <p>' + text(data.intro.eyebrow) + '</p>\n' +
    '            <h2>' + text(data.intro.title) + '</h2>\n' +
    '            <span>' + data.intro.lines.map(text).join('<br>') + '</span>\n' +
    '          </div>\n' +
    '          <div class="leader-list" id="leader-list">\n' + cards + '\n' +
    '          </div>\n' +
    '        </section>';
}

function synchronize(html, data) {
  assert.ok(sectionPattern.test(html), 'Missing leaders section');
  // A replacement callback preserves literal $ sequences in content.
  return html.replace(sectionPattern, () => renderSection(data));
}

module.exports = { readContent, renderSection, synchronize };
