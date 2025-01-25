import mcp.types as types
import json
import os
from typing import Optional, Dict, Any
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain.chains import SequentialChain, LLMChain

from ..requirements_prompts import REQUIREMENTS_PROMPTS

def get_requirements_tools() -> list[types.Tool]:
    """Return the list of requirements phase tools"""
    return [
        types.Tool(
            name="get_prompt",
            description="Get a requirements phase prompt to inject into Cline conversation",
            inputSchema={
                "type": "object",
                "properties": {
                    "prompt_name": {
                        "type": "string",
                        "enum": ["requirements_creation", "requirements_intermediate_review"],
                        "description": "Name of the requirements phase prompt to get"
                    },
                    "context": {
                        "type": "object",
                        "properties": {
                            "brief_path": {
                                "type": "string",
                                "description": "Path to the product brief file"
                            },
                            "existing_requirements": {
                                "type": "string",
                                "description": "Existing requirements content when updating"
                            }
                        }
                    }
                },
                "required": ["prompt_name"]
            }
        ),
        types.Tool(
            name="generate_requirements",
            description="Generate requirements document from a product brief",
            inputSchema={
                "type": "object",
                "properties": {
                    "brief_path": {
                        "type": "string",
                        "description": "Path to the product brief file"
                    }
                },
                "required": ["brief_path"]
            }
        )
    ]

async def handle_requirements_tool(name: str, arguments: Dict[str, Any], llm: Any) -> Optional[list[types.TextContent]]:
    """Handle requirements phase tool calls"""
    if name == "get_prompt":
        if "prompt_name" not in arguments:
            raise ValueError("prompt_name is required")

        prompt_name = arguments["prompt_name"]
        if prompt_name not in REQUIREMENTS_PROMPTS:
            return None

        prompt = REQUIREMENTS_PROMPTS[prompt_name]
        return [types.TextContent(
            type="text",
            text=prompt
        )]

    elif name == "generate_requirements":
        if "brief_path" not in arguments:
            raise ValueError("brief_path is required")

        brief_path = arguments["brief_path"]
        if not os.path.exists(brief_path):
            raise ValueError(f"Brief file not found: {brief_path}")

        # Read the brief
        with open(brief_path, 'r') as f:
            brief_content = f.read()

        # Setup the chain
        requirements_chain = LLMChain(
            llm=llm,
            prompt=PromptTemplate(
                input_variables=["brief"],
                template=REQUIREMENTS_PROMPTS["requirements_creation"]
            ),
            output_parser=StrOutputParser()
        )

        review_chain = LLMChain(
            llm=llm,
            prompt=PromptTemplate(
                input_variables=["requirements"],
                template=REQUIREMENTS_PROMPTS["requirements_intermediate_review"]
            ),
            output_parser=StrOutputParser()
        )

        chain = SequentialChain(
            chains=[requirements_chain, review_chain],
            input_variables=["brief"],
            output_variables=["requirements"],
        )

        # Generate requirements
        result = await chain.ainvoke({"brief": brief_content})
        final_requirements = result["requirements"]

        # Return requirements content with metadata
        response = {
            "requirements": final_requirements,
            "metadata": {
                "suggested_filename": "requirements.md",
                "source_brief": brief_path
            }
        }

        return [types.TextContent(
            type="text",
            text=json.dumps(response, indent=2)
        )]

    return None
