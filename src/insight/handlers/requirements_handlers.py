"""Requirements phase handlers for the MCP workflow server.

This module provides tools and handlers for the requirements development phase,
including requirements generation, assessment, and prompt management.
"""

import os
import sys
from typing import List, Optional

from langchain.base_language import BaseLanguageModel
from langchain.chains import LLMChain, SequentialChain
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from mcp.types import TextContent, Tool

from ..prompts.requirements_prompts import REQUIREMENTS_PROMPTS


def get_requirements_tools() -> List[Tool]:
    """Return the list of requirements phase tools."""
    return [
        Tool(
            name="get_prompt",
            description=(
                "Get a prompt to help the user create requirements for a software "
                "project to inject into Cline conversation"
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "prompt_name": {
                        "type": "string",
                        "enum": [
                            "requirements_creation",
                            "requirements_intermediate_review",
                        ],
                        "description": "Name of the requirements prompt to get",
                    },
                    "context": {
                        "type": "object",
                        "properties": {
                            "brief_path": {
                                "type": "string",
                                "description": "Path to the product brief file",
                            },
                            "existing_requirements": {
                                "type": "string",
                                "description": "Existing requirements content when updating",
                            },
                        },
                    },
                },
                "required": ["prompt_name"],
            },
        ),
        Tool(
            name="generate_requirements",
            description="Generate requirements document from a product brief",
            inputSchema={
                "type": "object",
                "properties": {
                    "brief_path": {
                        "type": "string",
                        "description": "Path to the product brief file",
                    }
                },
                "required": ["brief_path"],
            },
        ),
        Tool(
            name="assess_requirements",
            description="Assess the quality and completeness of requirements document",
            inputSchema={
                "type": "object",
                "properties": {
                    "requirements_path": {
                        "type": "string",
                        "description": "Path to the requirements document to assess",
                    }
                },
                "required": ["requirements_path"],
            },
        ),
    ]


async def handle_requirements_tool(
    name: str, arguments: dict, llm: BaseLanguageModel
) -> Optional[List[TextContent]]:
    """Handle requirements phase tool calls."""
    if name == "get_prompt":
        if "prompt_name" not in arguments:
            raise ValueError("prompt_name is required")

        prompt_name = arguments["prompt_name"]
        if prompt_name not in REQUIREMENTS_PROMPTS:
            return None

        prompt = REQUIREMENTS_PROMPTS[prompt_name]
        return [TextContent(type="text", text=prompt)]

    elif name == "generate_requirements":
        if "brief_path" not in arguments:
            raise ValueError("brief_path is required")

        brief_path = arguments["brief_path"]
        if not os.path.exists(brief_path):
            raise ValueError(f"Brief file not found: {brief_path}")

        # Read the brief
        with open(brief_path, "r") as f:
            brief_content = f.read()

        # Setup the chain
        requirements_chain = LLMChain(
            llm=llm,
            prompt=PromptTemplate(
                input_variables=["brief"],
                template=REQUIREMENTS_PROMPTS["requirements_creation"],
            ),
            output_parser=StrOutputParser(),
        )

        review_chain = LLMChain(
            llm=llm,
            prompt=PromptTemplate(
                input_variables=["requirements"],
                template=REQUIREMENTS_PROMPTS["requirements_intermediate_review"],
            ),
            output_parser=StrOutputParser(),
        )

        chain = SequentialChain(
            chains=[requirements_chain, review_chain],
            input_variables=["brief"],
            output_variables=["requirements"],
        )

        # Generate requirements
        result = await chain.ainvoke({"brief": brief_content})
        final_requirements = result["requirements"]

        # Write requirements to file
        requirements_path = os.path.join(os.path.dirname(brief_path), "requirements.md")
        with open(requirements_path, "w") as f:
            f.write(final_requirements)

        return [TextContent(type="text", text=requirements_path)]

    elif name == "assess_requirements":
        if "requirements_path" not in arguments:
            raise ValueError("requirements_path is required")

        requirements_path = arguments["requirements_path"]
        if not os.path.exists(requirements_path):
            raise ValueError(f"Requirements path not found: {requirements_path}")

        # Handle directory or single file
        requirements_content = ""
        if os.path.isdir(requirements_path):
            # Get all files in directory and sort them
            files = sorted(
                [
                    f
                    for f in os.listdir(requirements_path)
                    if os.path.isfile(os.path.join(requirements_path, f))
                ]
            )

            # Read and concatenate all files
            for file in files:
                file_path = os.path.join(requirements_path, file)
                try:
                    with open(file_path, "r") as f:
                        requirements_content += f"\n\n# From {file}:\n\n"
                        requirements_content += f.read()
                except Exception as e:
                    print(f"Warning: Could not read {file}: {str(e)}", file=sys.stderr)
        else:
            # Single file case
            with open(requirements_path, "r") as f:
                requirements_content = f.read()

        if not requirements_content.strip():
            raise ValueError("No readable requirements content found")

        # Setup the assessment chain
        assessment_chain = LLMChain(
            llm=llm,
            prompt=PromptTemplate(
                input_variables=["requirements"],
                template=REQUIREMENTS_PROMPTS["requirements_assessment"],
            ),
            output_parser=StrOutputParser(),
        )

        # Generate assessment
        result = await assessment_chain.ainvoke({"requirements": requirements_content})

        return [TextContent(type="text", text=result)]

    return None
