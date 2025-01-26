"""Design phase handlers for the MCP workflow server.

This module provides tools and handlers for the design development phase,
including architecture design, component design, and design review.
"""

from typing import List, Optional

from langchain.base_language import BaseLanguageModel
from mcp.types import TextContent, Tool

from ..prompts.design_prompts import DESIGN_PROMPTS


def get_design_tools() -> List[Tool]:
    """Return the list of design phase tools."""
    return [
        Tool(
            name="get_prompt",
            description="Get a design phase prompt to inject into Cline conversation",
            inputSchema={
                "type": "object",
                "properties": {
                    "prompt_name": {
                        "type": "string",
                        "enum": [
                            "design_level_identification",
                            "level_design",
                            "level_design_assessment",
                            "interface_review",
                        ],
                        "description": "Name of the design phase prompt to get",
                    }
                },
                "required": ["prompt_name"],
            },
        )
    ]


async def handle_design_tool(
    name: str, arguments: dict, llm: BaseLanguageModel
) -> Optional[List[TextContent]]:
    """Handle design phase tool calls."""
    if name != "get_prompt":
        return None

    if "prompt_name" not in arguments:
        raise ValueError("prompt_name is required")

    prompt_name = arguments["prompt_name"]
    if prompt_name not in DESIGN_PROMPTS:
        raise ValueError(f"Unknown prompt: {prompt_name}")

    return [TextContent(type="text", text=DESIGN_PROMPTS[prompt_name])]
