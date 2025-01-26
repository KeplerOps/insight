#!/usr/bin/env python3
import asyncio
from .server import WorkflowServer

def main():
    server = WorkflowServer()
    asyncio.run(server.run())

if __name__ == "__main__":
    main()
