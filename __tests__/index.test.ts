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
      // Add expectations for new tools
      expect(toolNames).toContain('design_creation');
      expect(toolNames).toContain('design_assessment');
      expect(toolNames).toContain('unit_test_design');
      expect(toolNames).toContain('unit_test_assessment');
      expect(toolNames).toContain('implement_unit_tests');
      expect(toolNames).toContain('integration_test_design');
      expect(toolNames).toContain('integration_test_assessment');
      expect(toolNames).toContain('implementation');
      expect(toolNames).toContain('integration_design');
      expect(toolNames).toContain('integration_assessment');
      expect(toolNames).toContain('integration_implementation');
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

    it('throws error when design context is not available', async () => {
      const mockPhaseManager = {
        getContext: jest.fn().mockReturnValue(null)
      };
      (server as any).phaseManager = mockPhaseManager;

      await expect((server as any).handleDesignCreation())
        .rejects
        .toThrow('No requirements context available');
    });

    it('throws error when design prompt is not found', async () => {
      const mockPhaseManager = {
        getContext: jest.fn().mockReturnValue({ requirements: [] }),
        getPromptForPhase: jest.fn().mockReturnValue(null)
      };
      (server as any).phaseManager = mockPhaseManager;

      await expect((server as any).handleDesignCreation())
        .rejects
        .toThrow('Design creation prompt not found');
    });

    it('throws error when unit test design context is not available', async () => {
      const mockPhaseManager = {
        getContext: jest.fn().mockReturnValue(null)
      };
      (server as any).phaseManager = mockPhaseManager;

      await expect((server as any).handleUnitTestDesign())
        .rejects
        .toThrow('No design context available');
    });

    it('throws error when unit test design prompt is not found', async () => {
      const mockPhaseManager = {
        getContext: jest.fn().mockReturnValue({ components: [] }),
        getPromptForPhase: jest.fn().mockReturnValue(null)
      };
      (server as any).phaseManager = mockPhaseManager;

      await expect((server as any).handleUnitTestDesign())
        .rejects
        .toThrow('Unit test design prompt not found');
    });

    it('throws error when implementation context is not available', async () => {
      const mockPhaseManager = {
        getContext: jest.fn().mockReturnValue(null)
      };
      (server as any).phaseManager = mockPhaseManager;

      await expect((server as any).handleImplementation({ component: 'test', status: 'in-progress' }))
        .rejects
        .toThrow('No design context available');
    });

    it('throws error when implementation prompt is not found', async () => {
      const mockPhaseManager = {
        getContext: jest.fn().mockReturnValue({ components: [] }),
        getPromptForPhase: jest.fn().mockReturnValue(null)
      };
      (server as any).phaseManager = mockPhaseManager;

      await expect((server as any).handleImplementation({ component: 'test', status: 'in-progress' }))
        .rejects
        .toThrow('Implementation prompt not found');
    });

    it('throws error when integration context is not available', async () => {
      const mockPhaseManager = {
        getContext: jest.fn().mockReturnValue(null)
      };
      (server as any).phaseManager = mockPhaseManager;

      await expect((server as any).handleIntegrationImplementation({ workflow: 'test' }))
        .rejects
        .toThrow('No integration context available');
    });

    it('throws error when integration prompt is not found', async () => {
      const mockPhaseManager = {
        getContext: jest.fn().mockReturnValue({ workflows: [] }),
        getPromptForPhase: jest.fn().mockReturnValue(null)
      };
      (server as any).phaseManager = mockPhaseManager;

      await expect((server as any).handleIntegrationImplementation({ workflow: 'test' }))
        .rejects
        .toThrow('Integration implementation prompt not found');
    });
  });

  describe('tool routing', () => {
    it('routes tool calls to correct handlers', async () => {
      const serverInstance = server.getServer();
      const callHandler = (serverInstance as any)._requestHandlers.get('tools/call');

      // Spy on all handler methods
      const conceptSpy = jest.spyOn(server as any, 'handleConceptAssessment');
      const briefSpy = jest.spyOn(server as any, 'handleGenerateBrief');
      const reqSpy = jest.spyOn(server as any, 'handleGenerateRequirements');
      const assessSpy = jest.spyOn(server as any, 'handleAssessRequirements');
      const designCreateSpy = jest.spyOn(server as any, 'handleDesignCreation');
      const designAssessSpy = jest.spyOn(server as any, 'handleDesignAssessment');
      const unitTestDesignSpy = jest.spyOn(server as any, 'handleUnitTestDesign');
      const unitTestAssessSpy = jest.spyOn(server as any, 'handleUnitTestAssessment');
      const implementUnitTestsSpy = jest.spyOn(server as any, 'handleImplementUnitTests');
      const integrationTestDesignSpy = jest.spyOn(server as any, 'handleIntegrationTestDesign');
      const integrationTestAssessSpy = jest.spyOn(server as any, 'handleIntegrationTestAssessment');
      const implementationSpy = jest.spyOn(server as any, 'handleImplementation');
      const integrationDesignSpy = jest.spyOn(server as any, 'handleIntegrationDesign');
      const integrationAssessSpy = jest.spyOn(server as any, 'handleIntegrationAssessment');
      const integrationImplementationSpy = jest.spyOn(server as any, 'handleIntegrationImplementation');

      // Call each tool
      await callHandler({ method: 'tools/call', params: { name: 'concept_assessment' } }).catch(() => {});
      await callHandler({ method: 'tools/call', params: { name: 'generate_brief' } }).catch(() => {});
      await callHandler({ method: 'tools/call', params: { name: 'generate_requirements' } }).catch(() => {});
      await callHandler({ method: 'tools/call', params: { name: 'assess_requirements' } }).catch(() => {});
      await callHandler({ method: 'tools/call', params: { name: 'design_creation' } }).catch(() => {});
      await callHandler({ method: 'tools/call', params: { name: 'design_assessment' } }).catch(() => {});
      await callHandler({ method: 'tools/call', params: { name: 'unit_test_design' } }).catch(() => {});
      await callHandler({ method: 'tools/call', params: { name: 'unit_test_assessment' } }).catch(() => {});
      await callHandler({ method: 'tools/call', params: { name: 'implement_unit_tests', params: { component: 'test' } } }).catch(() => {});
      await callHandler({ method: 'tools/call', params: { name: 'integration_test_design' } }).catch(() => {});
      await callHandler({ method: 'tools/call', params: { name: 'integration_test_assessment' } }).catch(() => {});
      await callHandler({ method: 'tools/call', params: { name: 'implementation', params: { component: 'test', status: 'in-progress' } } }).catch(() => {});
      await callHandler({ method: 'tools/call', params: { name: 'integration_design' } }).catch(() => {});
      await callHandler({ method: 'tools/call', params: { name: 'integration_assessment' } }).catch(() => {});
      await callHandler({ method: 'tools/call', params: { name: 'integration_implementation', params: { workflow: 'test' } } }).catch(() => {});

      // Verify each handler was called
      expect(conceptSpy).toHaveBeenCalled();
      expect(briefSpy).toHaveBeenCalled();
      expect(reqSpy).toHaveBeenCalled();
      expect(assessSpy).toHaveBeenCalled();
      expect(designCreateSpy).toHaveBeenCalled();
      expect(designAssessSpy).toHaveBeenCalled();
      expect(unitTestDesignSpy).toHaveBeenCalled();
      expect(unitTestAssessSpy).toHaveBeenCalled();
      expect(implementUnitTestsSpy).toHaveBeenCalled();
      expect(integrationTestDesignSpy).toHaveBeenCalled();
      expect(integrationTestAssessSpy).toHaveBeenCalled();
      expect(implementationSpy).toHaveBeenCalled();
      expect(integrationDesignSpy).toHaveBeenCalled();
      expect(integrationAssessSpy).toHaveBeenCalled();
      expect(integrationImplementationSpy).toHaveBeenCalled();
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

    it('throws error when prompt is not found', async () => {
      const mockPhaseManager = {
        getContext: jest.fn().mockReturnValue({ problemStatement: 'test' }),
        getPromptForPhase: jest.fn().mockReturnValue(null)
      };
      (server as any).phaseManager = mockPhaseManager;

      await expect((server as any).handleGenerateRequirements())
        .rejects
        .toThrow('Requirements creation prompt not found');
    });

    it('throws error when concept context is not available', async () => {
      const mockPhaseManager = {
        getContext: jest.fn().mockReturnValue(null),
        getPromptForPhase: jest.fn().mockReturnValue('prompt')
      };
      (server as any).phaseManager = mockPhaseManager;

      await expect((server as any).handleGenerateRequirements())
        .rejects
        .toThrow('No concept context available');
    });
  });

  describe('requirements assessment', () => {
    it('returns prompt and context for requirements assessment', async () => {
      const mockPhaseManager = {
        getPromptForPhase: jest.fn().mockReturnValue('test assessment prompt'),
        getContext: jest.fn().mockReturnValue({ requirements: [] }),
        getCurrentPhase: jest.fn().mockReturnValue(DevelopmentPhase.Requirements)
      };
      (server as any).phaseManager = mockPhaseManager;

      const result = await (server as any).handleAssessRequirements();
      
      expect(mockPhaseManager.getPromptForPhase).toHaveBeenCalledWith(
        DevelopmentPhase.Requirements,
        'assessment'
      );
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: expect.stringContaining('test assessment prompt')
        }]
      });
    });

    it('throws error when prompt is not found', async () => {
      const mockPhaseManager = {
        getPromptForPhase: jest.fn().mockReturnValue(null)
      };
      (server as any).phaseManager = mockPhaseManager;

      await expect((server as any).handleAssessRequirements())
        .rejects
        .toThrow('Requirements assessment prompt not found');
    });

    it('returns empty context when no requirements context exists', async () => {
      const mockPhaseManager = {
        getPromptForPhase: jest.fn().mockReturnValue('test assessment prompt'),
        getContext: jest.fn().mockReturnValue(null),
        getCurrentPhase: jest.fn().mockReturnValue(DevelopmentPhase.Requirements)
      };
      (server as any).phaseManager = mockPhaseManager;

      const result = await (server as any).handleAssessRequirements();
      
      expect(result.content[0].text).toContain('test assessment prompt');
      expect(JSON.parse(result.content[0].text).context).toBeNull();
    });
  });

  describe('error handling', () => {
    it('handles SIGINT signal', async () => {
      const mockClose = jest.spyOn(server.getServer(), 'close');
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      
      // Simulate SIGINT
      process.emit('SIGINT');
      
      // Wait for any async handlers
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockClose).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(0);
      
      // Cleanup
      mockExit.mockRestore();
    });
  });

  describe('concept assessment', () => {
    it('throws error when prompt is not found', async () => {
      const mockPhaseManager = {
        getPromptForPhase: jest.fn().mockReturnValue(null)
      };
      (server as any).phaseManager = mockPhaseManager;

      await expect((server as any).handleConceptAssessment())
        .rejects
        .toThrow('Concept assessment prompt not found');
    });
  });

  describe('design phase', () => {
    it('creates design document when requirements context is available', async () => {
      const mockPhaseManager = {
        getPromptForPhase: jest.fn().mockReturnValue('test design prompt'),
        getContext: jest.fn().mockReturnValue({ requirements: [] }),
        getCurrentPhase: jest.fn().mockReturnValue(DevelopmentPhase.Design)
      };
      (server as any).phaseManager = mockPhaseManager;

      const result = await (server as any).handleDesignCreation();
      
      expect(mockPhaseManager.getPromptForPhase).toHaveBeenCalledWith(
        DevelopmentPhase.Design,
        'creation'
      );
      expect(result.content[0].text).toContain('test design prompt');
      expect(JSON.parse(result.content[0].text).outputPath).toContain('docs/design/design.md');
    });

    it('assesses design when context is available', async () => {
      const mockPhaseManager = {
        getPromptForPhase: jest.fn().mockReturnValue('test design assessment prompt'),
        getContext: jest.fn().mockReturnValue({ design: {} }),
        getCurrentPhase: jest.fn().mockReturnValue(DevelopmentPhase.Design)
      };
      (server as any).phaseManager = mockPhaseManager;

      const result = await (server as any).handleDesignAssessment();
      
      expect(mockPhaseManager.getPromptForPhase).toHaveBeenCalledWith(
        DevelopmentPhase.Design,
        'assessment'
      );
      expect(result.content[0].text).toContain('test design assessment prompt');
    });

    it('returns empty context when no design context exists', async () => {
      const mockPhaseManager = {
        getPromptForPhase: jest.fn().mockReturnValue('test design assessment prompt'),
        getContext: jest.fn().mockReturnValue(null),
        getCurrentPhase: jest.fn().mockReturnValue(DevelopmentPhase.Design)
      };
      (server as any).phaseManager = mockPhaseManager;

      const result = await (server as any).handleDesignAssessment();
      
      expect(result.content[0].text).toContain('test design assessment prompt');
      expect(JSON.parse(result.content[0].text).context).toBeNull();
    });
  });

  describe('unit test design phase', () => {
    it('creates unit test design when design context is available', async () => {
      const mockPhaseManager = {
        getPromptForPhase: jest.fn().mockReturnValue('test unit test design prompt'),
        getContext: jest.fn().mockReturnValue({ components: [] }),
        getCurrentPhase: jest.fn().mockReturnValue(DevelopmentPhase.UnitTestDesign)
      };
      (server as any).phaseManager = mockPhaseManager;

      const result = await (server as any).handleUnitTestDesign();
      
      expect(mockPhaseManager.getPromptForPhase).toHaveBeenCalledWith(
        DevelopmentPhase.UnitTestDesign,
        'creation'
      );
      expect(result.content[0].text).toContain('test unit test design prompt');
      expect(JSON.parse(result.content[0].text).outputPath).toContain('__tests__/design/test-plan.md');
    });

    it('implements unit tests for a component', async () => {
      const mockPhaseManager = {
        getPromptForPhase: jest.fn().mockReturnValue('test unit test implementation prompt'),
        getContext: jest.fn().mockReturnValue({
          unitTests: [{
            component: 'TestComponent',
            testCases: [{ name: 'test case' }]
          }]
        }),
        getCurrentPhase: jest.fn().mockReturnValue(DevelopmentPhase.UnitTestImplementation)
      };
      (server as any).phaseManager = mockPhaseManager;

      const result = await (server as any).handleImplementUnitTests({ component: 'TestComponent' });
      
      expect(mockPhaseManager.getPromptForPhase).toHaveBeenCalledWith(
        DevelopmentPhase.UnitTestImplementation,
        'creation'
      );
      expect(result.content[0].text).toContain('TestComponent');
      expect(JSON.parse(result.content[0].text).outputPath).toContain('__tests__/TestComponent.test.ts');
    });

    it('returns empty context when no unit test design context exists', async () => {
      const mockPhaseManager = {
        getPromptForPhase: jest.fn().mockReturnValue('test unit test assessment prompt'),
        getContext: jest.fn().mockReturnValue(null),
        getCurrentPhase: jest.fn().mockReturnValue(DevelopmentPhase.UnitTestDesign)
      };
      (server as any).phaseManager = mockPhaseManager;

      const result = await (server as any).handleUnitTestAssessment();
      
      expect(result.content[0].text).toContain('test unit test assessment prompt');
      expect(JSON.parse(result.content[0].text).context).toBeNull();
    });
  });

  describe('implementation phase', () => {
    it('tracks component implementation status', async () => {
      const mockPhaseManager = {
        getPromptForPhase: jest.fn().mockReturnValue('test implementation prompt'),
        getContext: jest.fn().mockReturnValue({
          components: [],
          crossCuttingConcerns: []
        }),
        getCurrentPhase: jest.fn().mockReturnValue(DevelopmentPhase.Implementation),
        addArtifact: jest.fn()
      };
      (server as any).phaseManager = mockPhaseManager;

      const result = await (server as any).handleImplementation({
        component: 'TestComponent',
        status: 'in-progress',
        issue: {
          description: 'Test issue',
          severity: 'medium'
        }
      });
      
      expect(mockPhaseManager.addArtifact).toHaveBeenCalledWith(
        expect.stringContaining('docs/debugging/TestComponent.md'),
        expect.stringContaining('Test issue')
      );
      expect(result.content[0].text).toContain('TestComponent');
    });

    it('generates debugging content correctly', () => {
      const component = {
        name: 'TestComponent',
        status: 'in-progress',
        issues: [{
          description: 'Test issue',
          severity: 'medium',
          status: 'open'
        }]
      };

      const result = (server as any).generateDebuggingContent(component);
      
      expect(result).toContain('# TestComponent Debugging Log');
      expect(result).toContain('Implementation Status: in-progress');
      expect(result).toContain('Test issue');
      expect(result).toContain('Severity: medium');
    });

    it('handles empty issues array', () => {
      const component = {
        name: 'TestComponent',
        status: 'in-progress',
        issues: []
      };

      const result = (server as any).generateDebuggingContent(component);
      
      expect(result).toContain('# TestComponent Debugging Log');
      expect(result).toContain('Implementation Status: in-progress');
      expect(result).not.toContain('### ');
    });

    it('handles missing issues array', () => {
      const component = {
        name: 'TestComponent',
        status: 'in-progress'
      };

      const result = (server as any).generateDebuggingContent(component);
      
      expect(result).toContain('# TestComponent Debugging Log');
      expect(result).toContain('Implementation Status: in-progress');
      expect(result).not.toContain('### ');
    });
  });

  describe('integration phase', () => {
    it('creates integration test design', async () => {
      const mockPhaseManager = {
        getPromptForPhase: jest.fn().mockReturnValue('test integration design prompt'),
        getContext: jest.fn().mockReturnValue({ components: [] }),
        getCurrentPhase: jest.fn().mockReturnValue(DevelopmentPhase.Integration)
      };
      (server as any).phaseManager = mockPhaseManager;

      const result = await (server as any).handleIntegrationDesign();
      
      expect(mockPhaseManager.getPromptForPhase).toHaveBeenCalledWith(
        DevelopmentPhase.Integration,
        'design'
      );
      expect(result.content[0].text).toContain('test integration design prompt');
      expect(JSON.parse(result.content[0].text).outputPath).toContain('__tests__/e2e/design/test-plan.md');
    });

    it('implements integration tests for a workflow', async () => {
      const mockPhaseManager = {
        getPromptForPhase: jest.fn().mockReturnValue('test integration implementation prompt'),
        getContext: jest.fn().mockReturnValue({ workflows: [] }),
        getCurrentPhase: jest.fn().mockReturnValue(DevelopmentPhase.Integration)
      };
      (server as any).phaseManager = mockPhaseManager;

      const result = await (server as any).handleIntegrationImplementation({
        workflow: 'TestWorkflow'
      });
      
      expect(mockPhaseManager.getPromptForPhase).toHaveBeenCalledWith(
        DevelopmentPhase.Integration,
        'implementation'
      );
      expect(result.content[0].text).toContain('TestWorkflow');
      expect(JSON.parse(result.content[0].text).outputPath).toContain('__tests__/e2e/TestWorkflow.test.ts');
    });

    it('assesses integration readiness', async () => {
      const mockPhaseManager = {
        getPromptForPhase: jest.fn().mockReturnValue('test integration assessment prompt'),
        getContext: jest.fn().mockReturnValue({ integration: {} }),
        getCurrentPhase: jest.fn().mockReturnValue(DevelopmentPhase.Integration)
      };
      (server as any).phaseManager = mockPhaseManager;

      const result = await (server as any).handleIntegrationAssessment();
      
      expect(mockPhaseManager.getPromptForPhase).toHaveBeenCalledWith(
        DevelopmentPhase.Integration,
        'assessment'
      );
      expect(result.content[0].text).toContain('test integration assessment prompt');
    });
  });
});
