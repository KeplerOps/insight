import { jest } from '@jest/globals';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

const mockServer = {
  _capabilities: { tools: {} },
  _notificationHandlers: new Map([
    ['notifications/cancelled', jest.fn()],
    ['notifications/progress', jest.fn()],
    ['notifications/initialized', jest.fn()]
  ]),
  _options: { capabilities: { tools: {} } },
  _progressHandlers: new Map(),
  _requestHandlerAbortControllers: new Map(),
  _requestHandlers: new Map([
    ['ping', jest.fn()],
    ['initialize', jest.fn()],
    ['tools/list', jest.fn().mockImplementation(() => ({
      tools: [
        {
          name: 'concept_assessment',
          description: 'Get expert assessment of concept readiness',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'generate_brief',
          description: 'Create structured product brief from discussion',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'generate_requirements',
          description: 'Create formal requirements document',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'assess_requirements',
          description: 'Get expert assessment of requirements',
          inputSchema: { type: 'object', properties: {} }
        }
      ]
    }))],
    ['tools/call', jest.fn().mockImplementation((request: any) => {
      const toolName = request?.params?.name;
      switch (toolName) {
        case 'concept_assessment':
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                prompt: 'Test prompt content',
                context: {
                  problemStatement: 'Test problem',
                  valueProposition: 'Test value'
                },
                currentPhase: 'concept'
              })
            }]
          };
        case 'generate_brief':
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                message: 'Brief generated successfully',
                path: 'docs/concept/brief.md'
              })
            }]
          };
        case 'generate_requirements':
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                prompt: 'Test prompt content',
                context: {
                  problemStatement: 'Test problem',
                  valueProposition: 'Test value'
                },
                currentPhase: 'requirements',
                outputPath: 'docs/requirements/requirements.md'
              })
            }]
          };
        case 'assess_requirements':
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                prompt: 'Test prompt content',
                context: {
                  sections: [],
                  mustRequirements: ['req1'],
                  shouldRequirements: ['req2'],
                  mayRequirements: ['req3'],
                  mustNotRequirements: ['req4']
                },
                currentPhase: 'requirements'
              })
            }]
          };
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    })]
  ]),
  _requestMessageId: 0,
  _responseHandlers: new Map(),
  _serverInfo: { name: 'insight', version: '0.1.0' },
  setRequestHandler: jest.fn(),
  connect: jest.fn().mockImplementation(() => Promise.resolve()),
  close: jest.fn().mockImplementation(() => Promise.resolve()),
  onerror: jest.fn(),
  oninitialized: jest.fn(),
  getClientCapabilities: jest.fn(() => ({})),
  getClientVersion: jest.fn(() => '1.0.0'),
  ping: jest.fn(() => Promise.resolve()),
  createMessage: jest.fn(() => ({})),
  listRoots: jest.fn(() => Promise.resolve([])),
  sendLoggingMessage: jest.fn(() => Promise.resolve()),
  sendResourceUpdated: jest.fn(() => Promise.resolve()),
  sendResourceListChanged: jest.fn(() => Promise.resolve()),
  sendProgress: jest.fn(() => Promise.resolve()),
  sendCancelled: jest.fn(() => Promise.resolve()),
  sendInitialized: jest.fn(() => Promise.resolve()),
  sendError: jest.fn(() => Promise.resolve())
} as unknown as jest.MockedObject<Server>;

// Mock the Server class constructor
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn().mockImplementation(() => mockServer)
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockImplementation(() => Promise.resolve()),
    close: jest.fn().mockImplementation(() => Promise.resolve())
  }))
}));

export { mockServer }; 