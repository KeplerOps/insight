#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { PhaseManager } from './lib/phase-manager.js';
import { DevelopmentPhase, Prompt } from './lib/types.js';
import path from 'path';
import fs from 'fs/promises';

export class InsightServer {
  private server: Server;
  private phaseManager: PhaseManager;
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.env.PROJECT_ROOT || process.cwd();
    this.phaseManager = new PhaseManager(
      path.join(this.projectRoot, '.insight', 'state.json')
    );

    this.server = new Server(
      {
        name: 'insight',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  public getServer(): Server {
    return this.server;
  }

  public async close(): Promise<void> {
    await this.server.close();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'concept_assessment',
          description: 'Get expert assessment of concept readiness',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'generate_brief',
          description: 'Create structured product brief from discussion',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'generate_requirements',
          description: 'Create formal requirements document',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'assess_requirements',
          description: 'Get expert assessment of requirements',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'design_creation',
          description: 'Create design document for current abstraction level',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'design_assessment',
          description: 'Get expert assessment of design readiness',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'unit_test_design',
          description: 'Create unit test design document',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'unit_test_assessment',
          description: 'Get expert assessment of unit test design',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'implement_unit_tests',
          description: 'Implement unit tests based on test design',
          inputSchema: {
            type: 'object',
            properties: {
              component: {
                type: 'string',
                description: 'The component to implement tests for',
              },
            },
            required: ['component'],
          },
        },
        {
          name: 'integration_test_design',
          description: 'Create integration test design document',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'integration_test_assessment',
          description: 'Get expert assessment of integration test design',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'implementation',
          description: 'Track implementation progress and debugging',
          inputSchema: {
            type: 'object',
            properties: {
              component: {
                type: 'string',
                description: 'The component being implemented',
              },
              status: {
                type: 'string',
                enum: ['not-started', 'in-progress', 'completed'],
                description: 'The implementation status',
              },
              issue: {
                type: 'object',
                properties: {
                  description: {
                    type: 'string',
                    description: 'Description of the issue',
                  },
                  severity: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                    description: 'Issue severity',
                  },
                },
                required: ['description', 'severity'],
              },
            },
            required: ['component', 'status'],
          },
        },
        {
          name: 'integration_design',
          description: 'Create end-to-end integration test design',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'integration_assessment',
          description: 'Get expert assessment of integration readiness',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'integration_implementation',
          description: 'Implement end-to-end integration tests',
          inputSchema: {
            type: 'object',
            properties: {
              workflow: {
                type: 'string',
                description: 'The workflow to implement tests for',
              },
            },
            required: ['workflow'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'concept_assessment':
          return this.handleConceptAssessment();
        case 'generate_brief':
          return this.handleGenerateBrief();
        case 'generate_requirements':
          return this.handleGenerateRequirements();
        case 'assess_requirements':
          return this.handleAssessRequirements();
        case 'design_creation':
          return this.handleDesignCreation();
        case 'design_assessment':
          return this.handleDesignAssessment();
        case 'unit_test_design':
          return this.handleUnitTestDesign();
        case 'unit_test_assessment':
          return this.handleUnitTestAssessment();
        case 'implement_unit_tests':
          return this.handleImplementUnitTests(request.params);
        case 'integration_test_design':
          return this.handleIntegrationTestDesign();
        case 'integration_test_assessment':
          return this.handleIntegrationTestAssessment();
        case 'implementation':
          return this.handleImplementation(request.params);
        case 'integration_design':
          return this.handleIntegrationDesign();
        case 'integration_assessment':
          return this.handleIntegrationAssessment();
        case 'integration_implementation':
          return this.handleIntegrationImplementation(request.params);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  private async handleConceptAssessment() {
    const prompt = this.phaseManager.getPromptForPhase(
      DevelopmentPhase.Concept,
      'assessment'
    );
    if (!prompt) {
      throw new McpError(
        ErrorCode.InternalError,
        'Concept assessment prompt not found'
      );
    }

    const context = this.phaseManager.getContext<DevelopmentPhase.Concept>(DevelopmentPhase.Concept);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            prompt,
            context,
            currentPhase: this.phaseManager.getCurrentPhase(),
          }, null, 2),
        },
      ],
    };
  }

  private async handleGenerateBrief() {
    const context = this.phaseManager.getContext<DevelopmentPhase.Concept>(DevelopmentPhase.Concept);
    if (!context) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'No concept context available'
      );
    }

    const briefPath = path.join(this.projectRoot, 'docs', 'concept', 'brief.md');
    await fs.mkdir(path.dirname(briefPath), { recursive: true });
    
    const brief = this.generateBriefContent(context);
    await this.phaseManager.addArtifact(briefPath, brief);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'Brief generated successfully',
            path: briefPath,
          }, null, 2),
        },
      ],
    };
  }

  private async handleGenerateRequirements() {
    const context = this.phaseManager.getContext<DevelopmentPhase.Concept>(DevelopmentPhase.Concept);
    if (!context) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'No concept context available'
      );
    }

    const prompt = this.phaseManager.getPromptForPhase(
      DevelopmentPhase.Requirements,
      'creation'
    );
    if (!prompt) {
      throw new McpError(
        ErrorCode.InternalError,
        'Requirements creation prompt not found'
      );
    }

    const requirementsPath = path.join(
      this.projectRoot,
      'docs',
      'requirements',
      'requirements.md'
    );
    await fs.mkdir(path.dirname(requirementsPath), { recursive: true });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            prompt,
            context,
            currentPhase: this.phaseManager.getCurrentPhase(),
            outputPath: requirementsPath,
          }, null, 2),
        },
      ],
    };
  }

  private async handleAssessRequirements() {
    const prompt = this.phaseManager.getPromptForPhase(
      DevelopmentPhase.Requirements,
      'assessment'
    );
    if (!prompt) {
      throw new McpError(
        ErrorCode.InternalError,
        'Requirements assessment prompt not found'
      );
    }

    const context = this.phaseManager.getContext<DevelopmentPhase.Requirements>(DevelopmentPhase.Requirements);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            prompt,
            context,
            currentPhase: this.phaseManager.getCurrentPhase(),
          }, null, 2),
        },
      ],
    };
  }

  private async handleDesignCreation() {
    const context = this.phaseManager.getContext<DevelopmentPhase.Requirements>(DevelopmentPhase.Requirements);
    if (!context) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'No requirements context available'
      );
    }

    const prompt = this.phaseManager.getPromptForPhase(
      DevelopmentPhase.Design,
      'creation'
    );
    if (!prompt) {
      throw new McpError(
        ErrorCode.InternalError,
        'Design creation prompt not found'
      );
    }

    const designPath = path.join(
      this.projectRoot,
      'docs',
      'design',
      'design.md'
    );
    await fs.mkdir(path.dirname(designPath), { recursive: true });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            prompt,
            context,
            currentPhase: this.phaseManager.getCurrentPhase(),
            outputPath: designPath,
          }, null, 2),
        },
      ],
    };
  }

  private async handleDesignAssessment() {
    const prompt = this.phaseManager.getPromptForPhase(
      DevelopmentPhase.Design,
      'assessment'
    );
    if (!prompt) {
      throw new McpError(
        ErrorCode.InternalError,
        'Design assessment prompt not found'
      );
    }

    const context = this.phaseManager.getContext<DevelopmentPhase.Design>(DevelopmentPhase.Design);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            prompt,
            context,
            currentPhase: this.phaseManager.getCurrentPhase(),
          }, null, 2),
        },
      ],
    };
  }

  private async handleUnitTestDesign() {
    const designContext = this.phaseManager.getContext<DevelopmentPhase.Design>(DevelopmentPhase.Design);
    if (!designContext) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'No design context available'
      );
    }

    const prompt = this.phaseManager.getPromptForPhase(
      DevelopmentPhase.UnitTestDesign,
      'creation'
    );
    if (!prompt) {
      throw new McpError(
        ErrorCode.InternalError,
        'Unit test design prompt not found'
      );
    }

    const testDesignPath = path.join(
      this.projectRoot,
      '__tests__',
      'design',
      'test-plan.md'
    );
    await fs.mkdir(path.dirname(testDesignPath), { recursive: true });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            prompt,
            context: designContext,
            currentPhase: this.phaseManager.getCurrentPhase(),
            outputPath: testDesignPath,
          }, null, 2),
        },
      ],
    };
  }

  private async handleUnitTestAssessment() {
    const prompt = this.phaseManager.getPromptForPhase(
      DevelopmentPhase.UnitTestDesign,
      'assessment'
    );
    if (!prompt) {
      throw new McpError(
        ErrorCode.InternalError,
        'Unit test assessment prompt not found'
      );
    }

    const context = this.phaseManager.getContext<DevelopmentPhase.UnitTestDesign>(DevelopmentPhase.UnitTestDesign);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            prompt,
            context,
            currentPhase: this.phaseManager.getCurrentPhase(),
          }, null, 2),
        },
      ],
    };
  }

  private async handleImplementUnitTests(params: any) {
    const testContext = this.phaseManager.getContext<DevelopmentPhase.UnitTestDesign>(DevelopmentPhase.UnitTestDesign);
    if (!testContext) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'No unit test design context available'
      );
    }

    const prompt = this.phaseManager.getPromptForPhase(
      DevelopmentPhase.UnitTestImplementation,
      'creation'
    );
    if (!prompt) {
      throw new McpError(
        ErrorCode.InternalError,
        'Unit test implementation prompt not found'
      );
    }

    // Find the test cases for the specified component
    const componentTests = testContext.unitTests.find(
      test => test.component === params.component
    );
    if (!componentTests) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `No test design found for component: ${params.component}`
      );
    }

    const testFilePath = path.join(
      this.projectRoot,
      '__tests__',
      `${params.component}.test.ts`
    );
    await fs.mkdir(path.dirname(testFilePath), { recursive: true });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            prompt,
            context: {
              component: params.component,
              testCases: componentTests.testCases,
            },
            currentPhase: this.phaseManager.getCurrentPhase(),
            outputPath: testFilePath,
          }, null, 2),
        },
      ],
    };
  }

  private generateBriefContent(context: any): string {
    return `# Project Brief

## Problem Statement
${context.problemStatement || 'TBD'}

## Value Proposition
${context.valueProposition || 'TBD'}

## Success Criteria
${(context.successCriteria || []).map((c: string) => `- ${c}`).join('\n')}

## Constraints
${(context.constraints || []).map((c: string) => `- ${c}`).join('\n')}

## Key Decisions
${(context.decisions || [])
  .map(
    (d: { date: string; decision: string; rationale: string }) =>
      `### ${d.date}\n${d.decision}\n\nRationale: ${d.rationale}`
  )
  .join('\n\n')}
`;
  }

  private async handleIntegrationTestDesign() {
    const designContext = this.phaseManager.getContext<DevelopmentPhase.Design>(DevelopmentPhase.Design);
    if (!designContext) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'No design context available'
      );
    }

    const prompt = this.phaseManager.getPromptForPhase(
      DevelopmentPhase.IntegrationTestDesign,
      'creation'
    );
    if (!prompt) {
      throw new McpError(
        ErrorCode.InternalError,
        'Integration test design prompt not found'
      );
    }

    const testDesignPath = path.join(
      this.projectRoot,
      '__tests__',
      'integration',
      'design',
      'test-plan.md'
    );
    await fs.mkdir(path.dirname(testDesignPath), { recursive: true });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            prompt,
            context: designContext,
            currentPhase: this.phaseManager.getCurrentPhase(),
            outputPath: testDesignPath,
          }, null, 2),
        },
      ],
    };
  }

  private async handleIntegrationTestAssessment() {
    const prompt = this.phaseManager.getPromptForPhase(
      DevelopmentPhase.IntegrationTestDesign,
      'assessment'
    );
    if (!prompt) {
      throw new McpError(
        ErrorCode.InternalError,
        'Integration test assessment prompt not found'
      );
    }

    const context = this.phaseManager.getContext<DevelopmentPhase.IntegrationTestDesign>(DevelopmentPhase.IntegrationTestDesign);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            prompt,
            context,
            currentPhase: this.phaseManager.getCurrentPhase(),
          }, null, 2),
        },
      ],
    };
  }

  private async handleImplementation(params: any) {
    const designContext = this.phaseManager.getContext<DevelopmentPhase.Design>(DevelopmentPhase.Design);
    if (!designContext) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'No design context available'
      );
    }

    const prompt = this.phaseManager.getPromptForPhase(
      DevelopmentPhase.Implementation,
      'creation'
    );
    if (!prompt) {
      throw new McpError(
        ErrorCode.InternalError,
        'Implementation prompt not found'
      );
    }

    // Update implementation context
    const implementationContext = this.phaseManager.getContext<DevelopmentPhase.Implementation>(DevelopmentPhase.Implementation) || {
      components: [],
      crossCuttingConcerns: [],
    };

    let component = implementationContext.components.find(c => c.name === params.component);
    if (!component) {
      component = {
        name: params.component,
        status: params.status,
        issues: [],
      };
      implementationContext.components.push(component);
    } else {
      component.status = params.status;
    }

    // Add issue if provided
    if (params.issue) {
      component.issues = component.issues || [];
      component.issues.push({
        ...params.issue,
        status: 'open',
      });
    }

    // Create or update debugging document
    const debuggingPath = path.join(
      this.projectRoot,
      'docs',
      'debugging',
      `${params.component}.md`
    );
    await fs.mkdir(path.dirname(debuggingPath), { recursive: true });

    // Generate debugging content
    const debuggingContent = this.generateDebuggingContent(component);
    await this.phaseManager.addArtifact(debuggingPath, debuggingContent);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            prompt,
            context: {
              component,
              implementationContext,
            },
            currentPhase: this.phaseManager.getCurrentPhase(),
            debuggingPath,
          }, null, 2),
        },
      ],
    };
  }

  private generateDebuggingContent(component: any): string {
    return `# ${component.name} Debugging Log

## Implementation Status: ${component.status}

## Issues
${(component.issues || []).map((issue: any) => `
### ${issue.description}
- Severity: ${issue.severity}
- Status: ${issue.status}
`).join('\n')}
`;
  }

  private async handleIntegrationDesign() {
    const designContext = this.phaseManager.getContext<DevelopmentPhase.Design>(DevelopmentPhase.Design);
    if (!designContext) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'No design context available'
      );
    }

    const prompt = this.phaseManager.getPromptForPhase(
      DevelopmentPhase.Integration,
      'design'
    );
    if (!prompt) {
      throw new McpError(
        ErrorCode.InternalError,
        'Integration design prompt not found'
      );
    }

    const integrationDesignPath = path.join(
      this.projectRoot,
      '__tests__',
      'e2e',
      'design',
      'test-plan.md'
    );
    await fs.mkdir(path.dirname(integrationDesignPath), { recursive: true });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            prompt,
            context: designContext,
            currentPhase: this.phaseManager.getCurrentPhase(),
            outputPath: integrationDesignPath,
          }, null, 2),
        },
      ],
    };
  }

  private async handleIntegrationAssessment() {
    const prompt = this.phaseManager.getPromptForPhase(
      DevelopmentPhase.Integration,
      'assessment'
    );
    if (!prompt) {
      throw new McpError(
        ErrorCode.InternalError,
        'Integration assessment prompt not found'
      );
    }

    const context = this.phaseManager.getContext<DevelopmentPhase.Integration>(DevelopmentPhase.Integration);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            prompt,
            context,
            currentPhase: this.phaseManager.getCurrentPhase(),
          }, null, 2),
        },
      ],
    };
  }

  private async handleIntegrationImplementation(params: any) {
    const integrationContext = this.phaseManager.getContext<DevelopmentPhase.Integration>(DevelopmentPhase.Integration);
    if (!integrationContext) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'No integration context available'
      );
    }

    const prompt = this.phaseManager.getPromptForPhase(
      DevelopmentPhase.Integration,
      'implementation'
    );
    if (!prompt) {
      throw new McpError(
        ErrorCode.InternalError,
        'Integration implementation prompt not found'
      );
    }

    const testFilePath = path.join(
      this.projectRoot,
      '__tests__',
      'e2e',
      `${params.workflow}.test.ts`
    );
    await fs.mkdir(path.dirname(testFilePath), { recursive: true });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            prompt,
            context: {
              workflow: params.workflow,
              integrationContext,
            },
            currentPhase: this.phaseManager.getCurrentPhase(),
            outputPath: testFilePath,
          }, null, 2),
        },
      ],
    };
  }

  public async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Insight MCP server running on stdio');
  }
}

const server = new InsightServer();
server.run().catch(console.error);
