"""Concept phase prompt templates.

This module contains prompt templates used in the concept development phase
for concept generation, refinement, and assessment.
"""

from typing import Dict, List, Literal, Optional, TypedDict

# Phase 0: Concept Development Prompts
CONCEPT_PROMPTS: Dict[str, str] = {
    # When user wants to discuss a concept, Cline uses this prompt
    "concept_refinement": """
Your role is to be a collaborative thought partner helping the user explore and refine their software concept.

IMPORTANT: DO NOT WRITE ANY CODE OR PSEUDO-CODE. If you find yourself thinking about implementation details, stop and return to concept exploration.

Process:
1. Start with open-ended questions about:
   - Core problem/need
   - Intended users
   - Success criteria

2. Practice active listening:
   - Reflect understanding
   - Note areas needing exploration
   - Surface assumptions

3. If the user brings up technical details:
   - Redirect to user needs and goals
   - Ask "What problem would that solve?"
   - Focus on the "what" not the "how"

Begin with: "Could you tell me about the concept you'd like to explore?""",
    # When assessing if a concept is ready for requirements
    "concept_assessment": """As a world-class technical product manager, on a scale of 0 to 10 rate whether there is enough concept information to write a first comprehensive draft of functional and non-functional requirements. The goal isn't to already have requirements from the user. It's to understand the user's goal enough that we can write a comprehensive first draft of requirements, even if that means we have to make some assumptions and use good judgement as a product manager.

STOP after the assessment and wait for the user to provide feedback.""",
    # When Cline needs to create/update the product brief
    "product_brief": """As a world-class technical product manager create a comprehensive product brief based on our discussion. Focus on capturing:
1. Problem Statement
2. Value Proposition
3. Success Criteria
4. Constraints
5. Key Decisions (with rationale)

Keep the brief clear, concise, and focused on the core concept without jumping into implementation details.

Write the brief to an appropriate location in the project. If the user wants to make changes, update the
brief file.

Do not include any comments or meta-commentary, just the brief.

STOP after the brief is written and wait for the user to provide feedback.""",
}


class ConceptPromptContext(TypedDict, total=False):
    """Context information for concept prompt generation."""

    existing_brief: Optional[str]  # If updating an existing brief
    conversation: Optional[List[str]]  # Relevant conversation history


class GetConceptPromptRequest(TypedDict):
    """Request structure for getting a concept prompt."""

    prompt_name: Literal["concept_refinement", "concept_assessment", "product_brief"]
    context: Optional[ConceptPromptContext]


class ConceptPromptTemplate:
    """Template for generating concept-related prompts with context."""

    pass


class ConceptPromptConfig:
    """Configuration for concept prompt generation and processing."""

    pass
