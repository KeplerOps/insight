import mcp.types as types
from typing import Optional, List
from mcp.types import Tool, TextContent
from langchain.base_language import BaseLanguageModel
from ..prompts.implementation_prompts import IMPLEMENTATION_PROMPTS

def get_implementation_tools() -> List[Tool]:
    """Return the list of implementation phase tools"""
    return [
        Tool(
            name="get_prompt",
            description="Get an implementation phase prompt to inject into Cline conversation",
            inputSchema={
                "type": "object",
                "properties": {
                    "prompt_name": {
                        "type": "string",
                        "enum": [
                            "mock_library_creation",
                            "mock_consistency_check",
                            "paired_implementation"
                        ],
                        "description": "Name of the implementation phase prompt to get"
                    }
                },
                "required": ["prompt_name"]
            }
        )
    ]

async def handle_implementation_tool(name: str, arguments: dict, llm: BaseLanguageModel) -> Optional[List[TextContent]]:
    """Handle implementation phase tool calls"""
    if name != "get_prompt":
        return None

    if "prompt_name" not in arguments:
        raise ValueError("prompt_name is required")

    prompt_name = arguments["prompt_name"]
    if prompt_name not in IMPLEMENTATION_PROMPTS:
        raise ValueError(f"Unknown prompt: {prompt_name}")

    return [TextContent(
        type="text",
        text=IMPLEMENTATION_PROMPTS[prompt_name]
    )]
