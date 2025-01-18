# Cline Development Process Tools

An MCP server that enhances Cline with software development process automation, artifact management, and quality gates.

## Installation

1. Install the server package:
```bash
npm install @modelcontextprotocol/cline-process-tools
```

2. Add to your Cline MCP settings (cline_mcp_settings.json):
```json
{
  "mcpServers": {
    "cline-process": {
      "command": "npx",
      "args": ["@modelcontextprotocol/cline-process-tools"],
      "env": {
        "PROJECT_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

## Usage

### Natural Language Integration

Simply chat with Cline naturally about your development process. The server recognizes key phrases and offers assistance:

#### Concept Phase
- "Let's discuss a new project idea"
- "Is this concept ready for requirements?"
- "Create a brief from our discussion"
- "Assess if we can move to requirements"

Example conversation:
```
You: Let's discuss a new project idea. I want to build a task management app.
Cline: Great! Let me help guide the concept discussion.
[Asks questions about users, goals, constraints...]

You: I think we've covered the main points. Is this concept ready?
Cline: I'll assess the concept readiness...
[Provides detailed assessment with scores and recommendations]

You: Create a brief from our discussion
Cline: I'll generate a structured brief...
[Creates and saves brief.md with problem statement, value prop, etc.]
```

#### Requirements Phase
- "Let's write requirements"
- "Generate requirements doc"
- "Are these requirements complete?"
- "Assess requirements quality"

Example conversation:
```
You: Let's write requirements based on our concept
Cline: I'll help create formal requirements...
[Guides through requirements sections, creates requirements.md]

You: Are these requirements good enough?
Cline: I'll assess the requirements...
[Provides quality scores and specific improvement recommendations]
```

### File Management

The server automatically manages process artifacts in your project:

```
project/
  └── docs/
      ├── concept/
      │   ├── brief.md
      │   └── assessment.md
      ├── requirements/
      │   ├── requirements.md
      │   └── assessment.md
      ├── design/
      │   └── design.md
      └── tests/
          └── test-plan.md
```

All documents use standardized templates and maintain version history.

### Quality Gates

The server enforces quality gates at key transition points:

1. **Concept → Requirements**
   - Concept clarity score ≥ 8/10
   - Goal alignment score ≥ 9/10
   - All critical questions addressed

2. **Requirements → Design**
   - Requirements completeness score ≥ 9/10
   - Internal consistency score ≥ 9/10
   - All MUST requirements clearly specified

Example gate check:
```
You: Can we move to design phase?
Cline: Let me check if we're ready...
[Runs quality gate assessment]
✓ Concept clarity: 9/10
✓ Goal alignment: 9/10
✓ Requirements completeness: 9/10
✓ Internal consistency: 9/10
✓ MUST requirements: All specified
→ Quality gate passed! We can proceed to design.
```

If a gate fails, Cline provides specific recommendations to meet the quality criteria.

### Process State

The server maintains development context across conversations. You can always ask:
- "What phase are we in?"
- "Show current status"
- "What's next?"
- "List open issues"

Example status check:
```
You: Show current status
Cline: Current Development Status:
Phase: Requirements
Progress: 75%
Last Gate: Concept (PASSED)
Next Gate: Requirements Quality
Open Issues: 2 medium, 1 low
Recent Files:
- docs/requirements/requirements.md (10 mins ago)
- docs/concept/brief.md (1 hour ago)
```

## Best Practices

1. **Start Early**: Begin with concept discussion to build a strong foundation

2. **Regular Assessments**: Request assessments frequently to catch issues early
   ```
   You: Quick check - how are we doing on requirements?
   ```

3. **Incremental Progress**: Address feedback iteratively rather than trying to pass gates in one go
   ```
   You: What's the most important issue to fix?
   Cline: The top priority is clarifying the user authentication requirements...
   ```

4. **Document Decisions**: Ask Cline to record important decisions
   ```
   You: Add this decision to our brief
   ```

5. **Review History**: Reference previous discussions and decisions
   ```
   You: What did we decide about the database last week?
   ```

## Troubleshooting

### Common Issues

1. **Gate Failures**
   - Review the specific criteria that failed
   - Ask for detailed recommendations
   - Address issues one at a time

2. **File Conflicts**
   - The server will never overwrite files without confirmation
   - Use version control to track changes
   - Request file diffs before updates

3. **Context Loss**
   - The server persists state between sessions
   - Request status update when resuming work
   - Explicitly save important context

### Getting Help

- Ask Cline to explain any assessment or recommendation in detail
- Request examples of how to address specific issues
- Use "help" with any command for usage details

## Contributing

This MCP server is open source. To contribute:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

We especially welcome contributions for:
- Additional quality checks
- New process templates
- Integration with development tools
- Improved natural language processing

## License

MIT License - See LICENSE file for details
