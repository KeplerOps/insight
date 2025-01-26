#!/usr/bin/env python3
from mcp.server.lowlevel import Server
import mcp.types as types
import mcp.server.stdio
import asyncio
import os
import os.path
from typing import Union
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

from .handlers import concept_handlers, requirements_handlers, unit_test_handlers, implementation_handlers, integration_test_handlers

# Load environment variables from .env file
load_dotenv()

class WorkflowServer:
    def __init__(self):
        self.server = Server("workflow-server")
        self.setup_tool_handlers()
        
        # Initialize LLM based on environment
        self.llm = self._initialize_llm()
        
        # Error handling
        self.server.onerror = lambda error: print("[MCP Error]", error)

    def _initialize_llm(self) -> Union[ChatOpenAI, ChatAnthropic]:
        """Initialize LLM based on environment configuration"""
        provider = os.getenv("LLM_PROVIDER", "openai").lower()
        model = os.getenv("LLM_MODEL")
        
        if provider == "openai":
            if not model:
                model = "gpt-4o"
            return ChatOpenAI(
                model=model,
                temperature=0.5  # Default temperature, handlers will adjust as needed
            )
        elif provider == "anthropic":
            if not model:
                model = "claude-3-5-sonnet"
            return ChatAnthropic(
                model=model,
                temperature=0.5  # Default temperature, handlers will adjust as needed
            )
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")

    def setup_tool_handlers(self):
        @self.server.list_tools()
        async def handle_list_tools() -> list[types.Tool]:
            # Combine tools from both phases
            return [
                *concept_handlers.get_concept_tools(),
                *requirements_handlers.get_requirements_tools(),
                *unit_test_handlers.get_unit_test_tools(),
                *implementation_handlers.get_implementation_tools(),
                *integration_test_handlers.get_integration_test_tools()
            ]

        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: dict) -> list[types.TextContent]:
            # Try concept phase handlers first
            result = await concept_handlers.handle_concept_tool(name, arguments, self.llm)
            if result is not None:
                return result

            # Try requirements phase handlers next
            result = await requirements_handlers.handle_requirements_tool(name, arguments, self.llm)
            if result is not None:
                return result

            # Try unit test phase handlers next
            result = await unit_test_handlers.handle_unit_test_tool(name, arguments, self.llm)
            if result is not None:  
                return result

            # Try implementation phase handlers next
            result = await implementation_handlers.handle_implementation_tool(name, arguments, self.llm)
            if result is not None:
                return result

            # Try integration test phase handlers next
            result = await integration_test_handlers.handle_integration_test_tool(name, arguments, self.llm)
            if result is not None:
                return result

            raise ValueError(f"Unknown tool: {name}")

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
