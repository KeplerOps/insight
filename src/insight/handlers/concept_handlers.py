import mcp.types as types
import json
from typing import Optional, Dict, Any

from ..concept_prompts import CONCEPT_PROMPTS

def get_concept_tools() -> list[types.Tool]:
    """Return the list of concept phase tools"""
    return [
        types.Tool(
            name="get_prompt",
            description="Get a concept phase prompt to inject into Cline conversation",
            inputSchema={
                "type": "object",
                "properties": {
                    "prompt_name": {
                        "type": "string",
                        "enum": ["concept_refinement", "concept_assessment", "product_brief"],
                        "description": "Name of the concept phase prompt to get"
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

async def handle_concept_tool(name: str, arguments: Dict[str, Any]) -> Optional[list[types.TextContent]]:
    """Handle concept phase tool calls"""
    if name != "get_prompt":
        return None
        
    if "prompt_name" not in arguments:
        raise ValueError("prompt_name is required")

    prompt_name = arguments["prompt_name"]
    if prompt_name not in CONCEPT_PROMPTS:
        return None

    prompt = CONCEPT_PROMPTS[prompt_name]

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
