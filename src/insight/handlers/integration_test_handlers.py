import mcp.types as types
from typing import Optional, List
from mcp.types import Tool, TextContent
from langchain.base_language import BaseLanguageModel
from ..prompts.integration_test_prompts import INTEGRATION_TEST_PROMPTS

def get_integration_test_tools() -> List[Tool]:
    """Return the list of integration test phase tools"""
    return [
        Tool(
            name="get_prompt",
            description="Get an integration test phase prompt to inject into Cline conversation",
            inputSchema={
                "type": "object",
                "properties": {
                    "prompt_name": {
                        "type": "string",
                        "enum": [
                            "integration_testing"
                        ],
                        "description": "Name of the integration test phase prompt to get"
                    }
                },
                "required": ["prompt_name"]
            }
        )
    ]

async def handle_integration_test_tool(name: str, arguments: dict, llm: BaseLanguageModel) -> Optional[List[TextContent]]:
    """Handle integration test phase tool calls"""
    if name != "get_prompt":
        return None

    if "prompt_name" not in arguments:
        raise ValueError("prompt_name is required")

    prompt_name = arguments["prompt_name"]
    if prompt_name not in INTEGRATION_TEST_PROMPTS:
        raise ValueError(f"Unknown prompt: {prompt_name}")

    return [TextContent(
        type="text",
        text=INTEGRATION_TEST_PROMPTS[prompt_name]
    )]
