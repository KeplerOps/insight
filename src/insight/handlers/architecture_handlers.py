"""Architecture phase handlers for the MCP workflow server.

This module provides tools and handlers for the architecture development phase,
including architecture design, component design, and design review.
"""

from typing import List, Optional

from langchain.base_language import BaseLanguageModel
from mcp.types import TextContent, Tool

from ..prompts.architecture_prompts import ARCHITECTURE_PROMPTS


def get_architecture_tools() -> List[Tool]:
    """Return the list of architecture phase tools."""
    return [
        Tool(
            name="get_prompt",
            description="Get a prompt to help the user architect a software project.",
            inputSchema={
                "type": "object",
                "properties": {
                    "prompt_name": {
                        "type": "string",
                        "enum": [
                            "architecture_level_identification",
                            "level_architecture",
                            "level_architecture_assessment",
                            "interface_review",
                        ],
                        "description": "Name of the architecture prompt to get",
                    }
                },
                "required": ["prompt_name"],
            },
        )
    ]


async def handle_architecture_tool(
    name: str, arguments: dict, llm: BaseLanguageModel
) -> Optional[List[TextContent]]:
    """Handle architecture phase tool calls."""
    if name != "get_prompt":
        return None

    if "prompt_name" not in arguments:
        raise ValueError("prompt_name is required")

    prompt_name = arguments["prompt_name"]
    if prompt_name not in ARCHITECTURE_PROMPTS:
        raise ValueError(f"Unknown prompt: {prompt_name}")

    return [TextContent(type="text", text=ARCHITECTURE_PROMPTS[prompt_name])]
