"""Requirements phase prompt templates.

This module contains prompt templates used in the requirements development phase
for requirements generation, review, and assessment.
"""

from typing import Dict, Literal, Optional, TypedDict

# Phase 1: Requirements Development Prompts
REQUIREMENTS_PROMPTS: Dict[str, str] = {
    # When generating requirements from a product brief
    "requirements_creation": """Generate a comprehensive software requirements document based on the product brief.
Focus on functional and non-functional requirements, constraints, and acceptance criteria.

Consider:
1. User requirements
2. System requirements
3. Performance requirements
4. Security requirements
5. Integration requirements

Brief:
{brief}
""",
    # When assessing if requirements are ready for design
    "requirements_assessment": """Review the following requirements document and assess its quality,
completeness, and clarity.

Evaluate:
1. Completeness
2. Clarity and specificity
3. Testability
4. Consistency
5. Feasibility

Requirements:
{requirements}
""",
}


class RequirementsPromptContext(TypedDict, total=False):
    """Context information for requirements prompt generation."""

    brief_path: Optional[str]  # Path to the product brief file
    existing_requirements: Optional[str]  # If updating existing requirements


class GetRequirementsPromptRequest(TypedDict):
    """Request structure for getting a requirements prompt."""

    prompt_name: Literal["requirements_creation", "requirements_intermediate_review"]
    context: Optional[RequirementsPromptContext]


class RequirementsPromptTemplate:
    """Template for generating requirements-related prompts with context."""

    pass


class RequirementsPromptConfig:
    """Configuration for requirements prompt generation and processing."""

    pass
