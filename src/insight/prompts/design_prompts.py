"""Design phase prompt templates.

This module contains prompt templates used in the design development phase
for architecture design, component design, and design review.
"""

from typing import Dict, List, Literal, Optional, TypedDict

# Phase 2: Design Development Prompts
DESIGN_PROMPTS: Dict[str, str] = {
    # When identifying design levels
    "design_level_identification": """As a world-class software architect, analyze the requirements and identify ALL the levels of abstraction needed for this system's design, from highest (system architecture) to lowest (method signatures). For each level, specify:

1. The level name and scope
2. The appropriate design artifacts for this level (e.g., system diagrams, DFDs, sequence diagrams, class diagrams, interface definitions, etc.)
3. The key design decisions that need to be made at this level
4. The cross-cutting concerns relevant to this level

Create a design plan document organizing these levels and noting any critical interfaces or interactions that need special attention during design.

Do not proceed with any actual design yet. We will tackle each level systematically.

STOP after the design plan is created and wait for the user to provide feedback.""",
    # When designing a specific level
    "level_design": """As a world-class software architect, first review the design plan document to ensure continuity with previous design decisions and patterns.

You are designing level [LEVEL] of [TOTAL_LEVELS]. The lowest level will be fully documented method signatures (no implementations).

Current level context from design plan:
- Level scope: [SCOPE]
- Required artifacts: [ARTIFACTS]
- Key decisions needed: [DECISIONS]
- Relevant cross-cutting concerns: [CONCERNS]
- Critical interfaces/interactions: [INTERFACES]

If this level involves file-level designs (modules, classes, etc.), each element MUST include:
- Complete interface documentation
- All method signatures with full docstrings
- Explicit specification of:
  - Valid input types, ranges, and formats
  - All possible return types and their conditions
  - All error conditions and their triggers
  - State requirements (if any)
  - Performance constraints (if any)
  - Thread safety guarantees (if any)

Method signature template:

def process_user_data(
    user_data: Dict[str, Any],
    validation_level: ValidationLevel = ValidationLevel.STANDARD
) -> ProcessedUserData:
    \"\"\"Process and validate user data according to specified rules.

    Args:
        user_data: Dictionary containing user fields
            Required fields:
            - 'email': str, valid email format
            - 'age': int, range 13-150
            Optional fields:
            - 'name': str, 1-100 chars, alphanumeric + spaces
            - 'preferences': Dict[str, str], max 50 items

        validation_level: Level of validation to apply
            STANDARD: Basic format checks
            STRICT: Additional business rule validation

    Returns:
        ProcessedUserData with normalized and validated fields

    Raises:
        ValidationError:
            - If required fields are missing
            - If field formats are invalid
            - If age is out of range
            - If email is invalid format
        ProcessingError:
            - If normalization fails
            - If business rules fail in STRICT mode
        RateLimitError:
            - If processing quota exceeded

    Thread Safety:
        This method is thread-safe and can be called concurrently

    Performance:
        Expected to complete within 100ms for standard validation
        May take up to 500ms for strict validation
    \"\"\"
    raise NotImplementedError(
        "process_user_data: Validates and normalizes user data dictionary"
    )

Now, focus ONLY on designing the current level of abstraction:

1. Create all appropriate design artifacts for this level as identified in the design plan
2. Define all components/elements at this level and their responsibilities
3. Define all interfaces and interactions between components at this level
4. Document any assumptions or constraints
5. Identify any cross-cutting concerns specific to this level
6. Note any critical decisions that will impact lower levels

DO NOT:
- Implement any code
- Design components at lower levels of abstraction
- Make implementation decisions that belong at lower levels

Use the design plan document as a scratchpad to:
- Track design decisions and their rationale
- Note potential impacts on other levels
- Identify risks or areas needing special attention
- Document any interface or interaction patterns that must be consistent across levels

Remember:
- Stay strictly at the current level of abstraction
- Focus on responsibilities and interactions
- Consider the system's scope (from small script to large platform)
- Don't reinvent wheels - note where existing frameworks/libraries will be used
- Security, logging, error handling, and monitoring considerations belong at every level

Before proceeding, update the design plan document with any new insights or patterns discovered during this level's design.

STOP after the design is created/updated and wait for the user to provide feedback.""",
    # When assessing a level's design
    "level_design_assessment": """As a world-class software architect, assess this level's design:

1. Completeness (0-10):
   - Are all components at this level fully defined?
   - Are all interfaces and interactions specified?
   - Are all responsibilities clear?

2. Consistency (0-10):
   - Do the design artifacts align with each other?
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

Is this level ready to support design of the next level? (Yes/No)
If no, what must be addressed first?

Provide specific recommendations for any score below 10, keeping in mind the scope of the concept.

STOP after the assessment and wait for the user to provide feedback.""",
    # When reviewing interfaces across levels
    "interface_review": """As a world-class software architect, review ALL interfaces defined so far across ALL levels designed to date:

1. Assess interface consistency and patterns
2. Identify any gaps or inconsistencies in cross-cutting concerns
3. Verify that interfaces properly support their intended interactions
4. Check for appropriate abstraction and encapsulation
5. Verify that security, logging, error handling, and monitoring are properly considered

Document any issues or patterns that should be addressed before proceeding to the next level.

STOP after the review and wait for the user to provide feedback.""",
}


class DesignPromptContext(TypedDict, total=False):
    """Context information for design prompt generation."""

    level_number: Optional[int]  # Current level being designed
    total_levels: Optional[int]  # Total number of levels
    level_scope: Optional[str]  # Scope of current level
    artifacts: Optional[List[str]]  # Required artifacts for level
    decisions: Optional[List[str]]  # Key decisions needed
    concerns: Optional[List[str]]  # Cross-cutting concerns
    interfaces: Optional[List[str]]  # Critical interfaces/interactions


class GetDesignPromptRequest(TypedDict):
    """Request structure for getting a design prompt."""

    prompt_name: Literal[
        "design_level_identification",
        "level_design",
        "level_design_assessment",
        "interface_review",
    ]
    context: Optional[DesignPromptContext]
