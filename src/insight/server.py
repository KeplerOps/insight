#!/usr/bin/env python3
"""MCP workflow server implementation for the insight project.

This module provides the main server implementation that handles tool registration,
LLM initialization, and request routing for the insight workflow system.
"""
import asyncio
import os
import os.path
from typing import Union

import mcp.server.stdio
import mcp.types as types
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from mcp.server.lowlevel import Server

from .handlers import (
    architecture_handlers,
    concept_handlers,
    implementation_handlers,
    integration_test_handlers,
    requirements_handlers,
)

# Load environment variables from .env file
load_dotenv()


class WorkflowServer:
    """Main workflow server that handles MCP tool requests and LLM interactions."""

    def __init__(self):
        """Initialize the workflow server with tool handlers and LLM configuration."""
        self.server = Server("workflow-server")
        self.setup_tool_handlers()

        # Initialize LLM based on environment
        self.llm = self._initialize_llm()

        # Error handling
        self.server.onerror = lambda error: print("[MCP Error]", error)

    def _initialize_llm(self) -> Union[ChatOpenAI, ChatAnthropic]:
        """Initialize LLM based on environment configuration.

        Returns:
            Union[ChatOpenAI, ChatAnthropic]: Configured LLM instance based on environment settings.
        """
        provider = os.getenv("LLM_PROVIDER", "openai").lower()
        model = os.getenv("LLM_MODEL")

        if provider == "openai":
            if not model:
                model = "gpt-4o"
            return ChatOpenAI(
                model=model,
                temperature=0.5,  # Default temperature, handlers will adjust as needed
            )
        elif provider == "anthropic":
            if not model:
                model = "claude-3-5-sonnet"
            return ChatAnthropic(
                model=model,
                temperature=0.5,  # Default temperature, handlers will adjust as needed
            )
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")

    def setup_tool_handlers(self):
        """Set up handlers for tool listing and execution.

        This method configures the server to handle tool listing requests and tool execution
        by registering appropriate handlers for each workflow phase.
        """

        @self.server.list_tools()
        async def handle_list_tools() -> list[types.Tool]:
            # Combine tools from both phases
            return [
                *concept_handlers.get_concept_tools(),
                *architecture_handlers.get_architecture_tools(),
                *requirements_handlers.get_requirements_tools(),
                *implementation_handlers.get_implementation_tools(),
                *integration_test_handlers.get_integration_test_tools(),
            ]

        @self.server.call_tool()
        async def handle_call_tool(
            name: str, arguments: dict
        ) -> list[types.TextContent]:
            # Try concept phase handlers first
            result = await concept_handlers.handle_concept_tool(
                name, arguments, self.llm
            )
            if result is not None:
                return result

            # Try architecture phase handlers next
            result = await architecture_handlers.handle_architecture_tool(
                name, arguments, self.llm
            )
            if result is not None:
                return result

            # Try requirements phase handlers next
            result = await requirements_handlers.handle_requirements_tool(
                name, arguments, self.llm
            )
            if result is not None:
                return result

            # Try implementation phase handlers next
            result = await implementation_handlers.handle_implementation_tool(
                name, arguments, self.llm
            )
            if result is not None:
                return result

            # Try integration test phase handlers next
            result = await integration_test_handlers.handle_integration_test_tool(
                name, arguments, self.llm
            )
            if result is not None:
                return result

            raise ValueError(f"Unknown tool: {name}")

    async def run(self):
        """Run the workflow server using stdio for communication.

        This method starts the server and handles communication with the client
        through standard input/output streams.
        """
        async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream, write_stream, self.server.create_initialization_options()
            )


if __name__ == "__main__":
    server = WorkflowServer()
    asyncio.run(server.run())
