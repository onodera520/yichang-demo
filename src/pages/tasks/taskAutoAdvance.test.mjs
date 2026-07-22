import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createTaskAdvanceIntent,
  resolveTaskAdvance,
} from './taskAutoAdvance.js';
import * as taskAutoAdvance from './taskAutoAdvance.js';

test('selects the next task in the current displayed order', () => {
  const intent = createTaskAdvanceIntent(['task-a', 'task-b', 'task-c'], 'task-b');

  assert.deepEqual(resolveTaskAdvance(intent, ['task-a', 'task-b', 'task-c'], 9), {
    taskId: 'task-c',
    page: 1,
    isQueueComplete: false,
  });
});

test('moves to the page containing the next task', () => {
  const intent = createTaskAdvanceIntent(['task-a', 'task-b', 'task-c'], 'task-b');

  assert.deepEqual(resolveTaskAdvance(intent, ['task-a', 'task-b', 'task-c'], 2), {
    taskId: 'task-c',
    page: 2,
    isQueueComplete: false,
  });
});

test('keeps the last task selected when it remains visible', () => {
  const intent = createTaskAdvanceIntent(['task-a', 'task-b'], 'task-b');

  assert.deepEqual(resolveTaskAdvance(intent, ['task-a', 'task-b'], 9), {
    taskId: 'task-b',
    page: 1,
    isQueueComplete: false,
  });
});

test('falls back to the previous task when the last task leaves the queue', () => {
  const intent = createTaskAdvanceIntent(['task-a', 'task-b'], 'task-b');

  assert.deepEqual(resolveTaskAdvance(intent, ['task-a'], 9), {
    taskId: 'task-a',
    page: 1,
    isQueueComplete: false,
  });
});

test('returns a completed queue when no tasks remain', () => {
  const intent = createTaskAdvanceIntent(['task-a'], 'task-a');

  assert.deepEqual(resolveTaskAdvance(intent, [], 9), {
    taskId: null,
    page: 1,
    isQueueComplete: true,
  });
});

test('uses the supplied sorted order instead of task creation order', () => {
  const intent = createTaskAdvanceIntent(['task-z', 'task-a', 'task-m'], 'task-z');

  assert.equal(resolveTaskAdvance(intent, ['task-z', 'task-a', 'task-m'], 9).taskId, 'task-a');
});

test('source queue advances to the next visible item without returning to the processed item', () => {
  assert.equal(typeof taskAutoAdvance.createSourceAdvanceIntent, 'function');
  assert.equal(typeof taskAutoAdvance.resolveSourceAdvance, 'function');

  const intent = taskAutoAdvance.createSourceAdvanceIntent(['a', 'b', 'c'], 'a');
  assert.deepEqual(taskAutoAdvance.resolveSourceAdvance(intent, ['a', 'b', 'c'], 2), {
    itemId: 'b',
    page: 1,
    isQueueComplete: false,
  });
});

test('source queue can cross pages and skips successors that are no longer visible', () => {
  const intent = taskAutoAdvance.createSourceAdvanceIntent(['a', 'b', 'c', 'd'], 'b');

  assert.deepEqual(taskAutoAdvance.resolveSourceAdvance(intent, ['a', 'b', 'd'], 2), {
    itemId: 'd',
    page: 2,
    isQueueComplete: false,
  });
});

test('source queue closes at the tail instead of cycling or reopening the processed item', () => {
  const intent = taskAutoAdvance.createSourceAdvanceIntent(['a', 'b'], 'b');

  assert.deepEqual(taskAutoAdvance.resolveSourceAdvance(intent, ['a', 'b'], 10), {
    itemId: null,
    page: 1,
    isQueueComplete: true,
  });
});
