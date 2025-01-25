from typing import Dict, List, Optional, TypedDict, Literal

# Phase 1: Requirements Development Prompts
REQUIREMENTS_PROMPTS: Dict[str, str] = {
    # When generating requirements from a product brief
    "requirements_creation": """Create a comprehensive requirements document from the given product brief. Include:

1. Functional Requirements
   - Core features and capabilities
   - User interactions and workflows
   - System behaviors and responses
   - Data handling and storage

2. Non-Functional Requirements
   - Performance expectations
   - Security requirements
   - Scalability needs
   - Reliability targets
   - Usability standards

3. Constraints
   - Technical limitations
   - Business rules
   - Regulatory compliance
   - Resource constraints

Format the document in Markdown with clear sections and subsections.""",

    # When reviewing generated requirements
    "requirements_intermediate_review": """Review the generated requirements document and provide feedback on:
1. Completeness - Are all key aspects covered?
2. Clarity - Are requirements clearly stated and unambiguous?
3. Testability - Can each requirement be verified?
4. Consistency - Are there any contradictions?
5. Feasibility - Are all requirements achievable?

Suggest specific improvements if needed."""
}

class RequirementsPromptContext(TypedDict, total=False):
    brief_path: Optional[str]  # Path to the product brief file
    existing_requirements: Optional[str]  # If updating existing requirements

class GetRequirementsPromptRequest(TypedDict):
    prompt_name: Literal["requirements_creation", "requirements_intermediate_review"]
    context: Optional[RequirementsPromptContext]
