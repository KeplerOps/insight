#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { PROMPTS, GetPromptRequest } from './types.js';

class WorkflowServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: 'workflow-server',
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

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'get_prompt',
                    description: 'Get a prompt to inject into Cline conversation',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            prompt_name: {
                                type: 'string',
                                enum: ['concept_refinement', 'product_brief'],
                                description: 'Name of the prompt to get',
                            },
                            context: {
                                type: 'object',
                                properties: {
                                    existing_brief: {
                                        type: 'string',
                                        description: 'Existing brief content when updating',
                                    },
                                    conversation: {
                                        type: 'array',
                                        items: {
                                            type: 'string'
                                        },
                                        description: 'Relevant conversation history',
                                    }
                                }
                            }
                        },
                        required: ['prompt_name'],
                    },
                }
            ],
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            switch (request.params.name) {
                case 'get_prompt': {
                    const args = request.params.arguments;
                    if (!args || typeof args.prompt_name !== 'string') {
                        throw new McpError(
                            ErrorCode.InvalidParams,
                            'prompt_name is required and must be a string'
                        );
                    }
                    return this.handleGetPrompt({
                        prompt_name: args.prompt_name as 'concept_refinement' | 'product_brief',
                        context: args.context as GetPromptRequest['context']
                    });
                }
                default:
                    throw new McpError(
                        ErrorCode.MethodNotFound,
                        `Unknown tool: ${request.params.name}`
                    );
            }
        });
    }

    private async handleGetPrompt(args: GetPromptRequest) {
        const prompt = PROMPTS[args.prompt_name];
        if (!prompt) {
            throw new McpError(
                ErrorCode.InvalidParams,
                `Unknown prompt: ${args.prompt_name}`
            );
        }

        // For product brief, include context in the response
        if (args.prompt_name === 'product_brief' && args.context) {
            // Combine prompt and context into a single text response
            return {
                content: [
                    {
                        type: 'text',
                        text: `${prompt}\n\nContext:\n${JSON.stringify(args.context, null, 2)}`
                    }
                ],
            };
        }

        // For concept refinement, just return the prompt
        return {
            content: [
                {
                    type: 'text',
                    text: prompt
                }
            ],
        };
    }

    public async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Workflow MCP server running on stdio');
    }
}

const server = new WorkflowServer();
server.run().catch(console.error);
