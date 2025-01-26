# Insight MCP Server

A Model Context Protocol (MCP) server that provides software development automation and development assistance through LLM integration.

## Features

- Flexible LLM provider support (OpenAI GPT-4 and Anthropic Claude)
- Workflow automation through MCP tools
- Environment-based configuration

## Installation

1. Set up your environment variables in `.env`:

```bash
LLM_PROVIDER=openai  # or anthropic
LLM_MODEL=gpt-4o    # or claude-3-5-sonnet
```

2. Install dependencies:

```bash
pip install .
```

## Usage

Run the server:

```bash
python -m insight
```

## Configuration

The server behavior can be customized through environment variables:

- `LLM_PROVIDER`: Choose between 'openai' or 'anthropic'
- `LLM_MODEL`: Specify the model to use (defaults: gpt-4o for OpenAI, claude-3-5-sonnet for Anthropic)

## Development

The server is built using:

- Python 3.12+
- MCP SDK for server implementation
- LangChain for LLM integration

## License

MIT License - See LICENSE file for details
