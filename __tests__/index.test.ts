import { jest } from '@jest/globals';
import { InsightServer } from '../src/index.js';
import { DevelopmentPhase } from '../src/lib/types.js';

jest.mock('../src/lib/phase-manager.js');

describe('InsightServer', () => {
  let server: InsightServer;

  beforeEach(() => {
    jest.clearAllMocks();
    server = new InsightServer();
  });

  afterEach(async () => {
    await server.close();
  });

  describe('tool registration', () => {
    it('registers all required tools', () => {
      const serverInstance = server.getServer();
      const handlers = (serverInstance as any)._requestHandlers;
      
      // Verify tools/list and tools/call handlers are registered
      expect(handlers.has('tools/list')).toBe(true);
      expect(handlers.has('tools/call')).toBe(true);
    });

    it('lists available tools', async () => {
      const serverInstance = server.getServer();
      const listHandler = (serverInstance as any)._requestHandlers.get('tools/list');
      const result = await listHandler({ method: 'tools/list' });

      // Verify all required tools are listed
      const toolNames = result.tools.map((t: any) => t.name);
      expect(toolNames).toContain('concept_assessment');
      expect(toolNames).toContain('generate_brief');
      expect(toolNames).toContain('generate_requirements');
      expect(toolNames).toContain('assess_requirements');
    });
  });

  describe('error handling', () => {
    it('throws error for unknown tools', async () => {
      const serverInstance = server.getServer();
      const callHandler = (serverInstance as any)._requestHandlers.get('tools/call');
      
      await expect(callHandler({ 
        method: 'tools/call',
        params: { name: 'unknown_tool' } 
      })).rejects.toThrow('Unknown tool: unknown_tool');
    });
  });
});
