// The prompts we want to inject into Cline's conversation
export const PROMPTS = {
    // When user wants to discuss a concept, Cline uses this prompt
    concept_refinement: `Help the user refine their software concept before it is time to work on requirements. No code please. Do not solution. The point is to refine the concept just enough so we can write requirements later, including the scope of the project, which could be anything from a tiny script to a full-blown multi-tenant globally distributed SaaS platform. Don't jump ahead.`,

    // When assessing if a concept is ready for requirements
    concept_assessment: `As a world-class technical product manager, on a scale of 0 to 10 rate whether there is enough concept information to write a first comprehensive draft of functional and non-functional requirements. The goal isn't to already have requirements from the user. It's to understand the user's goal enough that we can write a comprehensive first draft of requirements, even if that means we have to make some assumptions and use good judgement as a product manager.`,

    // When Cline needs to create/update the product brief
    product_brief: `As a world-class technical product manager create a comprehensive product brief based on our discussion. Focus on capturing:
1. Problem Statement
2. Value Proposition
3. Success Criteria
4. Constraints
5. Key Decisions (with rationale)

Keep the brief clear, concise, and focused on the core concept without jumping into implementation details.`
};

// Simple tool schemas
export interface GetPromptRequest {
    prompt_name: 'concept_refinement' | 'concept_assessment' | 'product_brief';
    context?: {
        existing_brief?: string;  // If updating an existing brief
        conversation?: string[];  // Relevant conversation history
    };
}
