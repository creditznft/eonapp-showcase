import assert from 'node:assert/strict';
import test from 'node:test';
import { mapEonbotMultilingualRoutingSeed, listEonbotMultilingualRoutingSeeds } from '../../assets/js/chat/eonbot-multilingual-routing.js';

const cases = [
  ['Quiero crear un vídeo', 'create a video'],
  ['我想创建一个网站', 'build a website'],
  ['画像を作りたい', 'create an image'],
  ['음성으로 말하고 싶어요', 'language and voice settings'],
  ['Aide-moi à commencer', 'getting started guide me'],
  ['Ich brauche lokale KI', 'set up local ai'],
  ['Quero criar uma automação', 'create an automation workflow'],
  ['Создай документ проекта', 'create a project document'],
  ['أريد إنشاء صورة', 'create an image'],
  ['मुझे वीडियो बनाना है', 'create a video'],
  ['Open EON City', 'open eon city']
];

test('W623F routes high-value requests across all eleven release languages', () => {
  for (const [input, expected] of cases) assert.equal(mapEonbotMultilingualRoutingSeed(input), expected, input);
});

test('W623F routing lexicon stays finite and product-focused', () => {
  const seeds = listEonbotMultilingualRoutingSeeds();
  assert.equal(seeds.length >= 12, true);
  assert.equal(new Set(seeds).size, seeds.length);
  assert.equal(mapEonbotMultilingualRoutingSeed('A completely unrelated private sentence'), null);
});
