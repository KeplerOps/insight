"""Main entry point for the insight MCP server.

This module initializes and runs the MCP workflow server.
"""

# !/usr/bin/env python3
import asyncio

from .server import WorkflowServer


def main():
    """Initialize and run the workflow server."""
    server = WorkflowServer()
    asyncio.run(server.run())


if __name__ == "__main__":
    main()
