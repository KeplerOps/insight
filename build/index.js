#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { PhaseManager } from './lib/phase-manager.js';
import { DevelopmentPhase } from './lib/types.js';
import path from 'path';
import fs from 'fs/promises';
class InsightServer {
    constructor() {
        this.projectRoot = process.env.PROJECT_ROOT || process.cwd();
        this.phaseManager = new PhaseManager(path.join(this.projectRoot, '.insight', 'state.json'));
        this.server = new Server({
            name: 'insight',
            version: '0.1.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
        // Error handling
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupToolHandlers() {
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
                default:
                    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
            }
        });
    }
    async handleConceptAssessment() {
        const prompt = this.phaseManager.getPromptForPhase(DevelopmentPhase.Concept, 'assessment');
        if (!prompt) {
            throw new McpError(ErrorCode.InternalError, 'Concept assessment prompt not found');
        }
        const context = this.phaseManager.getContext(DevelopmentPhase.Concept);
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
    async handleGenerateBrief() {
        const context = this.phaseManager.getContext(DevelopmentPhase.Concept);
        if (!context) {
            throw new McpError(ErrorCode.InvalidRequest, 'No concept context available');
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
    async handleGenerateRequirements() {
        const context = this.phaseManager.getContext(DevelopmentPhase.Concept);
        if (!context) {
            throw new McpError(ErrorCode.InvalidRequest, 'No concept context available');
        }
        const prompt = this.phaseManager.getPromptForPhase(DevelopmentPhase.Requirements, 'creation');
        if (!prompt) {
            throw new McpError(ErrorCode.InternalError, 'Requirements creation prompt not found');
        }
        const requirementsPath = path.join(this.projectRoot, 'docs', 'requirements', 'requirements.md');
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
    async handleAssessRequirements() {
        const prompt = this.phaseManager.getPromptForPhase(DevelopmentPhase.Requirements, 'assessment');
        if (!prompt) {
            throw new McpError(ErrorCode.InternalError, 'Requirements assessment prompt not found');
        }
        const context = this.phaseManager.getContext(DevelopmentPhase.Requirements);
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
    generateBriefContent(context) {
        return `# Project Brief

## Problem Statement
${context.problemStatement || 'TBD'}

## Value Proposition
${context.valueProposition || 'TBD'}

## Success Criteria
${(context.successCriteria || []).map((c) => `- ${c}`).join('\n')}

## Constraints
${(context.constraints || []).map((c) => `- ${c}`).join('\n')}

## Key Decisions
${(context.decisions || [])
            .map((d) => `### ${d.date}\n${d.decision}\n\nRationale: ${d.rationale}`)
            .join('\n\n')}
`;
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Insight MCP server running on stdio');
    }
}
const server = new InsightServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map