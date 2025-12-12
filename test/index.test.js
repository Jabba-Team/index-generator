import { test } from 'node:test';
import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

test('index.json is generated with correct structure', async () => {
  await import('../src/index.js');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  assert(existsSync('index.json'), 'index.json should be created');
  
  const content = await readFile('index.json', 'utf8');
  const index = JSON.parse(content);
  
  assert(typeof index === 'object', 'Index should be an object');
  assert('windows' in index, 'Should have windows key');
  assert('linux' in index, 'Should have linux key');
  assert('darwin' in index, 'Should have darwin key');
  
  const hasData = Object.values(index).some(os => Object.keys(os).length > 0);
  assert(hasData, 'At least one OS should have JDK data');
});

test('generated index has valid download links', async () => {
  const content = await readFile('index.json', 'utf8');
  const index = JSON.parse(content);
  
  let linkFound = false;
  
  Object.values(index).forEach(os => {
    Object.values(os).forEach(arch => {
      Object.values(arch).forEach(jdk => {
        Object.values(jdk).forEach(link => {
          if (typeof link === 'string' && link.includes('http')) {
            linkFound = true;
            assert(link.startsWith('tgz+') || link.startsWith('zip+') || 
                   link.startsWith('dmg+') || link.startsWith('exe+'), 
                   'Link should have proper archive type prefix');
          }
        });
      });
    });
  });
  
  assert(linkFound, 'Should have at least one download link');
});