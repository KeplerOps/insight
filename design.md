# Workflow Automation Design

## Core Concept

A lightweight MCP server that provides tools for automating prompt sequences and workflow decisions. The server doesn't handle persistence, state management, or file operations - it purely orchestrates the workflow while Cline handles everything else:

1. Cline executes the actual prompts
2. Cline performs all file operations (read_file, write_to_file, replace_in_file)
3. Cline maintains context between steps
4. Cline handles any required code analysis and modifications

The server just tells Cline "run this prompt next" and "if the rating is X, then run prompt Y", while Cline handles all the actual work.

## Tools

### run_prompt_sequence
Executes a sequence of prompts with conditional branching.

Input:
```typescript
{
  sequence: {
    name: string;        // Name of the sequence (e.g. "concept_assessment")
    steps: Array<{
      prompt: string;    // The prompt to run
      save_to?: string;  // Optional file path to save output
      condition?: {      // Optional condition for running this step
        type: "rating";  // Type of condition
        min_value: number;
        max_value: number;
      }
    }>;
  }
}
```

Example Usage:
```typescript
// Concept Assessment Sequence
{
  sequence: {
    name: "concept_assessment",
    steps: [
      {
        prompt: "concept_refinement",
        save_to: "docs/concept/brief.md"
      },
      {
        prompt: "concept_assessment"
      },
      {
        prompt: "requirements_creation",
        save_to: "docs/requirements/requirements.md",
        condition: {
          type: "rating",
          min_value: 9,
          max_value: 10
        }
      }
    ]
  }
}
```

### define_workflow
Defines a reusable workflow that can be executed later.

Input:
```typescript
{
  workflow: {
    name: string;
    sequences: string[];  // Names of sequences to run
    transitions: Array<{
      from: string;      // Source sequence
      to: string;        // Target sequence
      condition: {       // Condition for transition
        type: string;
        value: any;
      }
    }>;
  }
}
```

Example Usage:
```typescript
{
  workflow: {
    name: "concept_to_requirements",
    sequences: ["concept_assessment", "requirements_creation", "requirements_assessment"],
    transitions: [
      {
        from: "concept_assessment",
        to: "requirements_creation",
        condition: {
          type: "rating",
          value: 9
        }
      }
    ]
  }
}
```

### execute_workflow
Executes a defined workflow.

Input:
```typescript
{
  name: string;  // Name of workflow to execute
  context?: any; // Optional context to pass to the workflow
}
```

## Implementation

1. Server focuses purely on workflow orchestration:
   - Defining sequences of prompts to run
   - Managing conditional branching based on responses
   - Tracking workflow progress

2. Cline handles all operations:
   - Executing prompts and processing responses
   - Reading and writing files
   - Making in-place edits when needed
   - Maintaining context between steps
   - Managing state and persistence

3. Interaction Flow:
   a. Server tells Cline "run the requirements_creation prompt"
   b. Cline runs prompt and saves output to requirements.md
   c. Server tells Cline "run the requirements_assessment prompt"
   d. Cline runs assessment and gets rating
   e. If rating < 9, server tells Cline "run the requirements_refinement prompt"
   f. Cline makes necessary edits to requirements.md using replace_in_file
   g. Process continues based on workflow definition

## Example Workflows

### Concept to Requirements
```typescript
{
  workflow: {
    name: "concept_to_requirements",
    sequences: [
      {
        name: "concept_refinement",
        steps: [
          {
            prompt: "concept_refinement",
            save_to: "docs/concept/brief.md"
          },
          {
            prompt: "concept_assessment"
          }
        ]
      },
      {
        name: "requirements_creation",
        steps: [
          {
            prompt: "requirements_creation",
            save_to: "docs/requirements/requirements.md"
          },
          {
            prompt: "requirements_assessment"
          }
        ]
      }
    ],
    transitions: [
      {
        from: "concept_refinement",
        to: "requirements_creation",
        condition: {
          type: "rating",
          value: 9
        }
      }
    ]
  }
}
```

### Requirements Review
```typescript
{
  workflow: {
    name: "requirements_review",
    sequences: [
      {
        name: "requirements_assessment",
        steps: [
          {
            prompt: "requirements_assessment"
          },
          {
            prompt: "requirements_refinement",
            save_to: "docs/requirements/requirements.md",
            condition: {
              type: "rating",
              min_value: 0,
              max_value: 8
            }
          }
        ]
      }
    ]
  }
}
```

## Benefits

1. Simple, focused functionality
2. Leverages Cline's existing capabilities
3. Flexible workflow definitions
4. Easy to extend with new conditions
5. No complex state management
