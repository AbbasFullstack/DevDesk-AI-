import assert from 'node:assert/strict';
import test from 'node:test';
import { preferredVoiceTerms, speechLanguage, toSpeechText } from './voice-utils';

test('voice call uses the chosen language or the device language in auto mode', () => {
  assert.equal(speechLanguage('ur-PK', 'en-US'), 'ur-PK');
  assert.equal(speechLanguage('auto', 'ur-PK'), 'ur-PK');
});

test('voice call strips markdown and code before AI speech playback', () => {
  assert.equal(toSpeechText('**Hello**\n```js\nconsole.log("secret")\n```\nUse `Preview`.'), 'Hello Code is available in the chat. Use Preview.');
});

test('voice style preferences contain matching hints without claiming a device voice exists', () => {
  assert.ok(preferredVoiceTerms('woman').includes('female'));
  assert.deepEqual(preferredVoiceTerms('adult'), []);
});
