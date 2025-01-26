"""Concept phase handlers for the MCP workflow server.

This module provides tools and handlers for the concept development phase,
including concept generation, refinement, and assessment.
"""

import json
from typing import List, Optional

from langchain.base_language import BaseLanguageModel
from mcp.types import TextContent, Tool

from ..prompts.concept_prompts import CONCEPT_PROMPTS


def get_concept_tools() -> List[Tool]:
    """Return the list of concept phase tools."""
    return [
        Tool(
            name="get_concept_prompt",
            description="Get a prompt for concept refinement phase",
            inputSchema={
                "type": "object",
                "properties": {
                    "prompt_name": {
                        "type": "string",
                        "enum": [
                            "concept_refinement",
                            "concept_assessment",
                            "product_brief",
                        ],
                        "description": "Name of the prompt to get",
                    },
                    "context": {
                        "type": "object",
                        "properties": {
                            "existing_brief": {
                                "type": "string",
                                "description": "Existing brief content when updating",
                            },
                            "conversation": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Relevant conversation history",
                            },
                        },
                    },
                },
                "required": ["prompt_name"],
            },
        )
    ]


async def handle_concept_tool(
    name: str, arguments: dict, llm: BaseLanguageModel
) -> Optional[List[TextContent]]:
    """Handle concept phase tool calls."""
    if name != "get_concept_prompt":
        return None

    if "prompt_name" not in arguments:
        raise ValueError("prompt_name is required")

    prompt_name = arguments["prompt_name"]
    if prompt_name not in CONCEPT_PROMPTS:
        raise ValueError(f"Unknown prompt: {prompt_name}")

    prompt = CONCEPT_PROMPTS[prompt_name]

    # For product brief, include context in response
    if prompt_name == "product_brief" and "context" in arguments:
        return [
            TextContent(
                type="text",
                text=f"{prompt}\n\nContext:\n{json.dumps(arguments['context'], indent=2)}",
            )
        ]

    # For other prompts, just return the prompt
    return [TextContent(type="text", text=prompt)]
