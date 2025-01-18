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

  describe('tool routing', () => {
    it('routes tool calls to correct handlers', async () => {
      const serverInstance = server.getServer();
      const callHandler = (serverInstance as any)._requestHandlers.get('tools/call');

      // Spy on the handler methods
      const conceptSpy = jest.spyOn(server as any, 'handleConceptAssessment');
      const briefSpy = jest.spyOn(server as any, 'handleGenerateBrief');
      const reqSpy = jest.spyOn(server as any, 'handleGenerateRequirements');
      const assessSpy = jest.spyOn(server as any, 'handleAssessRequirements');

      // Call each tool
      await callHandler({ method: 'tools/call', params: { name: 'concept_assessment' } }).catch(() => {});
      await callHandler({ method: 'tools/call', params: { name: 'generate_brief' } }).catch(() => {});
      await callHandler({ method: 'tools/call', params: { name: 'generate_requirements' } }).catch(() => {});
      await callHandler({ method: 'tools/call', params: { name: 'assess_requirements' } }).catch(() => {});

      // Verify each handler was called
      expect(conceptSpy).toHaveBeenCalled();
      expect(briefSpy).toHaveBeenCalled();
      expect(reqSpy).toHaveBeenCalled();
      expect(assessSpy).toHaveBeenCalled();
    });
  });

  describe('brief generation', () => {
    it('generates brief file when context is available', async () => {
      // Mock PhaseManager methods
      const mockPhaseManager = {
        getContext: jest.fn().mockReturnValue({
          problemStatement: 'test problem',
          valueProposition: 'test value',
          successCriteria: ['criterion 1']
        }),
        addArtifact: jest.fn()
      };
      (server as any).phaseManager = mockPhaseManager;
      
      const result = await (server as any).handleGenerateBrief();
      
      // Verify context was requested
      expect(mockPhaseManager.getContext).toHaveBeenCalledWith(DevelopmentPhase.Concept);
      
      // Verify artifact was added
      expect(mockPhaseManager.addArtifact).toHaveBeenCalledWith(
        expect.stringContaining('docs/concept/brief.md'),
        expect.stringContaining('test problem')
      );
      
      // Verify response format
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: expect.stringContaining('Brief generated successfully')
        }]
      });
    });

    it('throws error when concept context is not available', async () => {
      // Mock PhaseManager to return null context
      const mockPhaseManager = {
        getContext: jest.fn().mockReturnValue(null)
      };
      (server as any).phaseManager = mockPhaseManager;
      
      await expect((server as any).handleGenerateBrief())
        .rejects
        .toThrow('No concept context available');
    });

    it('formats brief content correctly', async () => {
      const context = {
        problemStatement: 'A test problem',
        valueProposition: 'A test value',
        successCriteria: ['criterion 1', 'criterion 2'],
        constraints: ['constraint 1'],
        decisions: [{
          date: '2024-01-01',
          decision: 'A test decision',
          rationale: 'A test rationale'
        }]
      };

      const result = await (server as any).generateBriefContent(context);
      
      expect(result).toBe(
`# Project Brief

## Problem Statement
A test problem

## Value Proposition
A test value

## Success Criteria
- criterion 1
- criterion 2

## Constraints
- constraint 1

## Key Decisions
### 2024-01-01
A test decision

Rationale: A test rationale
`);
    });

    it('uses TBD for missing fields', async () => {
      const incompleteContext = {
        // Missing problemStatement and valueProposition
        successCriteria: ['criterion 1']
      };

      const result = await (server as any).generateBriefContent(incompleteContext);
      
      // Verify each section has the expected content
      expect(result).toContain('## Problem Statement\nTBD');
      expect(result).toContain('## Value Proposition\nTBD');
      expect(result).toContain('## Success Criteria\n- criterion 1');
      expect(result).toContain('## Constraints');
      expect(result).toContain('## Key Decisions');
    });
  });

  describe('requirements generation', () => {
    it('returns prompt and context for requirements generation', async () => {
      // Mock PhaseManager methods
      const mockPhaseManager = {
        getPromptForPhase: jest.fn().mockReturnValue('test requirements prompt'),
        getContext: jest.fn().mockReturnValue({ 
          problemStatement: 'test problem'
        }),
        getCurrentPhase: jest.fn().mockReturnValue(DevelopmentPhase.Requirements)
      };
      (server as any).phaseManager = mockPhaseManager;

      const result = await (server as any).handleGenerateRequirements();
      
      // Verify the prompt was requested with correct phase and type
      expect(mockPhaseManager.getPromptForPhase).toHaveBeenCalledWith(
        DevelopmentPhase.Requirements,
        'creation'
      );

      // Verify context was requested for concept phase
      expect(mockPhaseManager.getContext).toHaveBeenCalledWith(DevelopmentPhase.Concept);

      // Verify the response format
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: expect.stringContaining('test requirements prompt')
        }]
      });

      // Verify the JSON structure in the response
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson).toEqual({
        prompt: 'test requirements prompt',
        context: { problemStatement: 'test problem' },
        currentPhase: DevelopmentPhase.Requirements,
        outputPath: expect.stringContaining('docs/requirements/requirements.md')
      });
    });
  });
});
