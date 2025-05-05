import { describe, it, expect } from 'vitest';
import { server, handlers } from './setup';

describe('Test setup', () => {
  it('should have MSW server configured', () => {
    expect(server).toBeDefined();
  });

  it('should have handlers configured for mock APIs', () => {
    expect(handlers).toBeInstanceOf(Array);
    expect(handlers.length).toBeGreaterThan(0);
  });
}); 