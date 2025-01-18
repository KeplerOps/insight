// The prompts we want to inject into Cline's conversation
export const PROMPTS = {
    // When user wants to discuss a concept, Cline uses this prompt
    concept_refinement: `Help the user refine their software concept before it is time to work on requirements. No code please. Do not solution. The point is to refine the concept just enough so we can write requirements later, including the scope of the project, which could be anything from a tiny script to a full-blown multi-tenant globally distributed SaaS platform. Don't jump ahead.`,

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
    prompt_name: 'concept_refinement' | 'product_brief';
    context?: {
        existing_brief?: string;  // If updating an existing brief
        conversation?: string[];  // Relevant conversation history
    };
}
