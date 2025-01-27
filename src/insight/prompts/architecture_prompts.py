"""Architecture phase prompt templates.

This module contains prompt templates used in the architecture design phase
for architecture design, component design, and design review.
"""

from typing import Dict, List, Literal, Optional, TypedDict

# Phase 2: Architecture Development Prompts
ARCHITECTURE_PROMPTS: Dict[str, str] = {
    # When identifying architecture levels
    "architecture_level_identification": """You are a software architect tasked with creating an architecture approach for [project description]. Your ONLY task is to:

1. Reference architectural levels:
- Ecosystem (multiple SaaS platforms)
- Platform (SaaS/PaaS/IaaS or equivalent)
- Application (end-user, server)
- Package (python package, rust crate)
- File (python module)
- Class (struct, trait, class)
- Interface/Method/Property

2. Analyze requirements to identify the highest relevant level for this project

3. Complete the following by adding it to the architecture_plan.md. DO NOT make any commentary, just the list of levels:

# Architecture Levels

- [list of levels]
""",
    # When designing a specific level
    "level_architecture": """As a world-class software architect, first review the architecture_plan.md document to ensure continuity with previous architectural decisions and patterns.

## Architectural Levels and Artifacts

** Note: Not all artifacts are required at all levels. For example, if an application has no API, do not invent an API.
** Note: If the generalized folder structure below conflicts with MODERN best practices for the programming language, use the language best practices and use your best judgement to adapt.

### ECOSYSTEM

- Current level repository directory structure **required**
- /docs/ecosystem/README.md: High-level architecture, responsibilities, interactions, and cross-cutting concerns **required**
- /docs/ecosystem/diagrams/: Diagrams **required**
- /docs/ecosystem/contracts/: Contracts **required**

### PLATFORM

- Current level repository directory structure **required**
- /docs/[platform]/README.md: High-level architecture, responsibilities, interactions, and cross-cutting concerns **required**
- /docs/[platform]/diagrams/: Diagrams **required**
- /docs/[platform]/api/: APIs specifications **required**

### APPLICATION

- Current level repository directory structure **required**
- /[app]/README.md: Architecture, responsibilities, interactions, and cross-cutting concerns **required**
- /[app]/diagrams/: Diagrams **required**
- /[app]/api/: APIs specifications

### PACKAGE

- Current level repository directory structure, and package level files if language requires it **required**
- /[app]/[package]/README.md, __init__.py, or as applicable for a given language: Architecture, responsibilities, interactions, and cross-cutting concerns **required**

### FILE

- Files **required**
- Module docstring: Architecture, design patterns, responsibilities, interactions, and cross-cutting concerns **required**
- Cross-module contracts **required if more than one module**

### CLASS

- Class stub and comprehensive docstring with responsibility, invariants, and design patterns **required**
    - If it will help implementation later, include comments on data structures, algorithms, or design patterns
    - Any concurrency, async, or threading guarantees **required**
- NO PROPERTIES OR METHOD SIGNATURES
- Threading/performance contracts (if any) **required**

### INTERFACE/METHOD/PROPERTY

- Interface or method stub with signature and types **required**
- Method stubs must throw not implemented errors. Implementations will come later. DO NOT IMPLEMENT ANYTHING. **required**
- Comprehensive docstring with:
    - Explicit specification of:
        - Valid input types, ranges, and formats **required**
        - All possible return types and their conditions **required**
        - Side effects (these should generally be avoided if possible) **required**
        - All error conditions and their triggers **required**
        - State requirements (if any) **required**
        - Performance constraints (if any) **required**
        - Thread safety guarantees (if any) **required**
    - If it will help implementation later, include comments on data structures, algorithms, or design patterns

## Architecture Design

### Principles
- **Do not reinvent the wheel**: Use existing frameworks and libraries where possible.
- **Keep it simple**: Avoid unnecessary complexity.
- **Be consistent**: Use consistent naming and patterns.
- **Be explicit**: Document all assumptions and constraints.
- **Be safe**: Avoid side effects and ensure thread safety.
- **DRY**: Don't repeat yourself.
- Principles from the book "Clean Code" by Robert C. Martin and "Clean Architecture" by Robert C. Martin.

### Design

[] Review architecture_plan.md from previous session
[] Create ONLY these required artifacts for [current level]:
   - [list specific required artifacts]
[] Update architecture_plan.md with progress
[] Stop for review

Now, focus ONLY on architecting the current level of abstraction. This is CRITICAL.

DO NOT:
- Implement any methods
- Design components at lower levels of abstraction
- Make implementation decisions that belong at lower levels
- Jump to lower levels of abstraction

Use the architecture plan document as a scratchpad to:
- Track architectural decisions and their rationale
- Note impacts on other levels
- Identify risks or areas needing special attention
- Document any interface or interaction patterns that must be consistent across levels

Remember:
- Stay strictly at the current level of abstraction
- Focus on responsibilities and interactions
- Consider the system's scope (from small script to large platform)
- Security, logging, error handling, and monitoring considerations belong at every level

When you are done, update the architecture_plan.md with your progress, new insights, patterns, or concerns. THEN STOP and wait for review by the user.

YOU MUST NOT PROCEED TO THE NEXT LEVEL UNTIL YOU HAVE PERMISSION FROM THE USER. There are other steps to do first.""",
    # When assessing a level's architecture
    "level_architecture_assessment": """As a world-class software architect, assess this level's architecture:

1. Completeness (0-10):
   - Are all components at this level fully defined?
   - Are all interfaces and interactions specified?
   - Are all responsibilities clear?

2. Consistency (0-10):
   - Do the architecture artifacts align with each other?
   - Are naming and patterns consistent?
   - Are cross-cutting concerns handled consistently?

3. Clarity (0-10):
   - Are responsibilities and boundaries clear?
   - Are interfaces well-defined?
   - Is the documentation sufficient?

4. Integration (0-10):
   - How well does this level integrate with levels above?
   - Are interfaces appropriate for levels below?
   - Are cross-cutting concerns properly addressed?

Provide specific recommendations for any score below 8.

Is this level ready to support architecture of the next level? (Yes/No)
If no, what must be addressed first?

Provide specific recommendations for any score below 10, keeping in mind the scope of the concept.

STOP after the assessment and wait for the user to provide feedback.""",
    # When reviewing interfaces across levels
    "interface_review": """As a world-class software architect, review ALL interfaces defined so far across ALL levels architected to date:

1. Assess interface consistency and patterns
2. Identify any gaps or inconsistencies in cross-cutting concerns
3. Verify that interfaces properly support their intended interactions
4. Check for appropriate abstraction and encapsulation
5. Verify that security, logging, error handling, and monitoring are properly considered

Document any issues or patterns that should be addressed before proceeding to the next level.

STOP after the review and wait for the user to provide feedback.""",
}


class ArchitecturePromptContext(TypedDict, total=False):
    """Context information for architecture prompt generation."""

    level_number: Optional[int]  # Current level being architected
    total_levels: Optional[int]  # Total number of levels
    level_scope: Optional[str]  # Scope of current level
    artifacts: Optional[List[str]]  # Required artifacts for level
    decisions: Optional[List[str]]  # Key decisions needed
    concerns: Optional[List[str]]  # Cross-cutting concerns
    interfaces: Optional[List[str]]  # Critical interfaces/interactions


class GetArchitecturePromptRequest(TypedDict):
    """Request structure for getting an architecture prompt."""

    prompt_name: Literal[
        "architecture_level_identification",
        "level_architecture",
        "level_architecture_assessment",
        "interface_review",
    ]
    context: Optional[ArchitecturePromptContext]
