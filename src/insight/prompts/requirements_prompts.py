"""Requirements phase prompt templates.

This module contains prompt templates used in the requirements development phase
for requirements generation, review, and assessment.
"""

from typing import Dict, Literal, Optional, TypedDict

# Phase 1: Requirements Development Prompts
REQUIREMENTS_PROMPTS: Dict[str, str] = {
    # When generating requirements from a product brief
    "requirements_creation": """As a world-class technical product manager create a comprehensive requirements document for the concept following this exact structure.

Ensure all requirements maintain full hierarchical numbering (e.g., 3.1.2.3) and use consistent formatting:

- Each major section should be numbered (1., 2., 3., etc.)
- Use bold headers with double asterisks (Header)
- Maintain consistent indentation for subsections
- Use bullet points with specific requirement markers:
  - MUST for essential requirements
  - SHOULD for recommended requirements
  - MAY for optional requirements
  - MUST NOT for prohibited features

## Document Structure:

## 1. Introduction
1.1 [Brief overview of the system/library]

## 2. Terms and Definitions
2.1 [term: definition]
2.2 [term: definition]

## 3. Functional Requirements
[Break down into subsections like:]

### 3.1 [Component/Feature]
#### 3.1.1 [Subcomponent]
3.1.1.1 [Specific requirement]
3.1.1.2 [Specific requirement]

## 4. Non-Functional Requirements
[Similar structure to Section 3]

## 5. Constraints
[Similar structure to Section 3]

## 6. Out of Scope
[Numbered list of exclusions]

## 7. Acceptance Criteria
[Similar structure to Section 3]

## 8. Verification and Validation
[Similar structure to Section 3]

## 9. Glossary
[Alphabetical list with clear definitions]

## 10. References
[If applicable]

Important formatting notes:
1. Every requirement must have a unique, hierarchical number
2. Use consistent terminology throughout
3. Each requirement should be atomic (single requirement per statement)
4. Use clear, unambiguous language
5. Include validation criteria where applicable6. Maintain consistent formatting for all sections
7. Use tables where appropriate for complex relationships
8. Include examples where helpful
Please ensure each requirement is:
- Specific
- Measurable
- Achievable
- Relevant
9. Do NOT include timelines or deadlines.
10. Do not include specific performance metrics, SLAs, or other metrics unless you are explicitly asked to include them.

Requirements MUST be scoped to the concept and its scope (i.e. do not include enterprise requirements for a tiny poc).

These are TECHNICAL requirements. Do not include any business requirements or non-technical requirements unless they are directly relevant to the technical requirements or you are explicitly asked to include them.

Write the requirements to an appropriate location in the project. If the user wants to make changes, update the requirements file.

Do not include any comments or meta-commentary, just the requirements.

STOP after writing the requirements to a file and wait for the user to provide feedback.""",
    # When assessing if requirements are ready for design
    "requirements_assessment": """As a world-class software architect, on a scale of 0 to 10, how ready are these requirements to support implementation? Pay particular attention to completeness given the concept, consistency, orthogonality, and elegance. Everything in the requirements must be numbered. Requirements must be appropriate to the scope of the concept.

STOP after the assessment and wait for the user to provide feedback.""",
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
