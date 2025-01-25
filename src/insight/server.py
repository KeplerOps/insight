#!/usr/bin/env python3
from mcp.server.lowlevel import Server
import mcp.types as types
import mcp.server.stdio
import asyncio
import json

# Keep exact same prompts
PROMPTS = {
    "concept_refinement": """Help the user refine their software concept before it is time to work on requirements. No code please. Do not solution. The point is to refine the concept just enough so we can write requirements later, including the scope of the project, which could be anything from a tiny script to a full-blown multi-tenant globally distributed SaaS platform. Don't jump ahead.""",

    "concept_assessment": """As a world-class technical product manager, on a scale of 0 to 10 rate whether there is enough concept information to write a first comprehensive draft of functional and non-functional requirements. The goal isn't to already have requirements from the user. It's to understand the user's goal enough that we can write a comprehensive first draft of requirements, even if that means we have to make some assumptions and use good judgement as a product manager.""",

    "product_brief": """As a world-class technical product manager create a comprehensive product brief based on our discussion. Focus on capturing:
1. Problem Statement
2. Value Proposition
3. Success Criteria
4. Constraints
5. Key Decisions (with rationale)

Keep the brief clear, concise, and focused on the core concept without jumping into implementation details."""
}

class WorkflowServer:
    def __init__(self):
        self.server = Server("workflow-server")
        self.setup_tool_handlers()
        
        # Error handling
        self.server.onerror = lambda error: print("[MCP Error]", error)

    def setup_tool_handlers(self):
        @self.server.list_tools()
        async def handle_list_tools() -> list[types.Tool]:
            return [
                types.Tool(
                    name="get_prompt",
                    description="Get a prompt to inject into Cline conversation",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "prompt_name": {
                                "type": "string",
                                "enum": ["concept_refinement", "concept_assessment", "product_brief"],
                                "description": "Name of the prompt to get"
                            },
                            "context": {
                                "type": "object",
                                "properties": {
                                    "existing_brief": {
                                        "type": "string",
                                        "description": "Existing brief content when updating"
                                    },
                                    "conversation": {
                                        "type": "array",
                                        "items": {
                                            "type": "string"
                                        },
                                        "description": "Relevant conversation history"
                                    }
                                }
                            }
                        },
                        "required": ["prompt_name"]
                    }
                )
            ]

        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: dict) -> list[types.TextContent]:
            if name != "get_prompt":
                raise ValueError(f"Unknown tool: {name}")

            if "prompt_name" not in arguments:
                raise ValueError("prompt_name is required")

            prompt_name = arguments["prompt_name"]
            if prompt_name not in PROMPTS:
                raise ValueError(f"Unknown prompt: {prompt_name}")

            prompt = PROMPTS[prompt_name]

            # For product brief, include context in response
            if prompt_name == "product_brief" and "context" in arguments:
                return [types.TextContent(
                    type="text",
                    text=f"{prompt}\n\nContext:\n{json.dumps(arguments['context'], indent=2)}"
                )]

            # For other prompts, just return the prompt
            return [types.TextContent(
                type="text",
                text=prompt
            )]

    async def run(self):
        async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                self.server.create_initialization_options()
            )

if __name__ == "__main__":
    server = WorkflowServer()
    asyncio.run(server.run())
