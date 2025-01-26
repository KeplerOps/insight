import type { Message } from "@db/schema";
import { llmService, type Provider } from "./llm";

// Document type markers (to be hidden in frontend)
const ASSESSMENT_MARKER = '[[ASSESSMENT]]';    
const BRIEF_MARKER = '[[BRIEF]]';         
const REQUIREMENTS_MARKER = '[[REQUIREMENTS]]';   

// LLM message types
type LLMRole = "user" | "assistant";
interface LLMMessage {
  role: LLMRole;
  content: string;
}

export type WorkflowResult = {
  message?: string;
  returnControl: boolean;
};

export type WorkflowHandler = (messages: Message[]) => Promise<WorkflowResult>;

const workflows = new Map<string, WorkflowHandler>();

// Example workflow
workflows.set("hello", async (_messages) => {
  return {
    message: "Hello World! This was triggered by a workflow.",
    returnControl: true
  };
});

// Goat workflow
workflows.set("goat", async (_messages) => {
  return {
    message: "What is a mountain goat?",
    returnControl: false // Returns control to LLM
  };
});

// Gate 0 concept assessment prompt
const GATE0_PROMPT = `As a world-class technical product manager, analyze whether there is enough concept information to write a first comprehensive draft of functional and non-functional requirements. The goal isn't to already have requirements from the user. It's to understand the user's goal enough that we can write a comprehensive first draft of requirements, even if that means we have to make some assumptions and use good judgement as a product manager.

Output your response in this exact JSON format:
{
  "rating": 8,  // A number from 0-10
  "explanation": "Your detailed explanation here, including assessment, supporting points, gaps/concerns if rating < 10, and next steps"
}`;

// Gate 1 requirements assessment prompt
const GATE1_PROMPT = `As a world-class software architect, on a scale of 0 to 10, how ready are these requirements to support implementation? Pay particular attention to completeness given the concept, consistency, orthogonality, and elegance.

Output your response in this exact JSON format:
{
  "rating": 8,  // A number from 0-10
  "explanation": "Your detailed explanation here, including assessment, supporting points, gaps/concerns if rating < 10, and next steps"
}`;

// Common helper functions for LLM workflows
async function createLLMMessages(messages: Message[], finalPrompt: string): Promise<LLMMessage[]> {
  // Create LLM messages array from all messages, filtering out empty messages
  const llmMessages: LLMMessage[] = messages.slice(0, -1)
    .filter(msg => msg.content.trim() !== "")
    .map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    }));

  const lastMessage = messages[messages.length - 1];
  const strippedContent = lastMessage.content.replace(/@\w+/g, "").trim();

  // Add the last message with the prompt
  if (strippedContent) {
    llmMessages.push({
      role: lastMessage.role as "user" | "assistant",
      content: `${strippedContent}\n\n${finalPrompt}`
    });
  } else {
    llmMessages.push({
      role: lastMessage.role as "user" | "assistant",
      content: finalPrompt
    });
  }

  return llmMessages;
}

async function tryLLMRequest(messages: LLMMessage[], parseResponse?: (response: string) => any): Promise<string> {
  const MAX_RETRIES = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`LLM request attempt ${attempt}/${MAX_RETRIES}`);
      
      const llmResponse = await llmService.generateResponse(
        "anthropic" as Provider,
        "claude-3-5-sonnet-20241022",
        messages
      );

      console.log(`LLM response attempt ${attempt}:`, llmResponse);
      
      // Check for empty or invalid response
      if (!llmResponse || typeof llmResponse !== 'string' || llmResponse.trim() === '') {
        throw new Error('Empty or invalid response from LLM');
      }

      if (!parseResponse) return llmResponse;

      try {
        const parsed = parseResponse(llmResponse);
        return parsed;
      } catch (parseError) {
        console.error(`Failed to parse LLM response on attempt ${attempt}:`, parseError);
        lastError = parseError as Error;
        
        // Only throw on parse error if this is the last attempt
        if (attempt === MAX_RETRIES) {
          // On final attempt, return the raw response if parsing fails
          console.log('Returning raw response after all parse attempts failed');
          return llmResponse;
        }
      }
    } catch (error) {
      console.error(`LLM request failed on attempt ${attempt}:`, error);
      lastError = error as Error;
      
      if (attempt === MAX_RETRIES) {
        throw new Error(`Failed to get valid response after ${MAX_RETRIES} attempts: ${lastError?.message}`);
      }
    }
  }

  // This should never be reached due to the throw above, but TypeScript needs it
  throw new Error(`Unexpected error after ${MAX_RETRIES} attempts`);
}

// Product Brief Template
const PRODUCT_BRIEF_PROMPT = `As a world-class product owner, create a comprehensive product brief based on the conversation above. 
The brief should include:

1. Product Vision
   - High-level description of the product
   - Key value propositions
   - Target users/customers

4. High-Level Features
   - Core functionality
   - Key differentiators
   - MVP scope

5. Constraints & Considerations
   - Technical limitations
   - Business constraints
   - Timeline considerations
   - Risk factors

Do not include any other sections. Please write this in a clear, professional format that can be easily understood by all stakeholders.`;

// Refactored Gate 0 workflow using helper functions
workflows.set("gate0", async (messages) => {
  try {
    console.log("gate0 activated");
    
    const llmMessages = await createLLMMessages(messages, GATE0_PROMPT);
    
    const response = await tryLLMRequest(llmMessages, (response) => {
      const assessment = JSON.parse(response);
      // Format the response in a more readable way
      return `${ASSESSMENT_MARKER}Rating: ${assessment.rating}/10\n\n${assessment.explanation.trim()}`
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .join('\n');
    });

    return {
      message: response,
      returnControl: true
    };
  } catch (error: any) {
    console.error("Error in gate0 workflow:", error);
    return {
      message: `Error in gate0 workflow: ${error.message}`,
      returnControl: true
    };
  }
});

// Product Brief workflow
workflows.set("productbrief", async (messages) => {
  try {
    console.log("productbrief activated");
    
    const llmMessages = await createLLMMessages(messages, PRODUCT_BRIEF_PROMPT);
    
    const response = await tryLLMRequest(llmMessages);
    
    return {
      message: `${BRIEF_MARKER}\n${response}`,
      returnControl: true
    };
  } catch (error: any) {
    console.error("Error in productbrief workflow:", error);
    return {
      message: `Error in productbrief workflow: ${error.message}`,
      returnControl: true
    };
  }
});

// Requirements Creation prompt from docs
const REQUIREMENTS_CREATION_PROMPT = `As a world-class technical product manager create a comprehensive requirements document for the concept following this exact structure.

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
[Brief overview of the system/library]

## 2. Terms and Definitions
[Define all key terms, each with numbered subsections like 2.1, 2.1.1, etc.]

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
- Time-bound (if applicable)`;

const REQUIREMENTS_REVIEW_PROMPT = `In the context of the concept and its scope, review your requirements. Assess. If there are areas for improvement rewrite them and provide the COMPLETE rewritten requirements without skipping anything.`;

// Helper to check if requirements are complete
function isRequirementsComplete(requirements: string): boolean {
  // Check for key sections that should be at the end
  const hasGlossary = requirements.includes('## 9. Glossary');
  const hasReferences = requirements.includes('## 10. References');
  
  // Check for abrupt endings
  const endsWithDash = requirements.trim().endsWith('-');
  const endsWithNumber = /\d+\.(\d+\.)*$/.test(requirements.trim());
  const hasIncompleteSection = requirements.includes('[') && requirements.includes(']');
  
  return hasGlossary && hasReferences && !endsWithDash && !endsWithNumber && !hasIncompleteSection;
}

// Continuation prompt
const REQUIREMENTS_CONTINUE_PROMPT = `The requirements document was cut off. Please continue from where it left off, maintaining the same structure, formatting, and numbering scheme. Ensure all sections are complete through section 10.`;

// Phase 1 workflow
workflows.set("phase1", async (messages) => {
  try {
    console.log("phase1 activated");
    
    // Find the most recent product brief
    let productBrief: string | null = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.content.includes(BRIEF_MARKER)) {
        productBrief = message.content.split(BRIEF_MARKER)[1].trim();
        break;
      }
    }

    if (!productBrief) {
      return {
        message: "No product brief found. Please run @productbrief first to generate a product brief.",
        returnControl: true
      };
    }

    // Start requirements chat with initial creation
    let currentRequirements = await tryLLMRequest([
      {
        role: "user",
        content: `${productBrief}\n\n${REQUIREMENTS_CREATION_PROMPT}`
      }
    ]);

    // Check if requirements are complete, if not, request continuation
    while (!isRequirementsComplete(currentRequirements)) {
      console.log("Requirements appear incomplete, requesting continuation...");
      
      const continuationResponse = await tryLLMRequest([
        {
          role: "assistant",
          content: currentRequirements
        },
        {
          role: "user",
          content: REQUIREMENTS_CONTINUE_PROMPT
        }
      ]);

      currentRequirements = currentRequirements + "\n\n" + continuationResponse;
    }

    // Perform 3 iterations of review
    for (let i = 0; i < 3; i++) {
      console.log(`Starting requirements iteration ${i + 1}`);
      
      // Send current requirements and review prompt
      const reviewResponse = await tryLLMRequest([
        {
          role: "assistant",
          content: currentRequirements
        },
        {
          role: "user",
          content: REQUIREMENTS_REVIEW_PROMPT
        }
      ]);

      currentRequirements = reviewResponse;
      
      // Check if review resulted in incomplete requirements
      if (!isRequirementsComplete(currentRequirements)) {
        console.log(`Requirements incomplete after review ${i + 1}, requesting continuation...`);
        
        const continuationResponse = await tryLLMRequest([
          {
            role: "assistant",
            content: currentRequirements
          },
          {
            role: "user",
            content: REQUIREMENTS_CONTINUE_PROMPT
          }
        ]);

        currentRequirements = currentRequirements + "\n\n" + continuationResponse;
      }
    }

    // Return the final requirements to the main chat
    return {
      message: `${REQUIREMENTS_MARKER}\n${currentRequirements}`,
      returnControl: true
    };
  } catch (error: any) {
    console.error("Error in phase1 workflow:", error);
    return {
      message: `Error in phase1 workflow: ${error.message}`,
      returnControl: true
    };
  }
});

// Gate 1 workflow
workflows.set("gate1", async (messages) => {
  try {
    console.log("gate1 activated");
    
    // Find the most recent requirements
    let currentRequirements: string | null = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.content.includes(REQUIREMENTS_MARKER)) {
        currentRequirements = message.content.split(REQUIREMENTS_MARKER)[1].trim();
        break;
      }
    }

    if (!currentRequirements) {
      return {
        message: "No requirements found. Please run @phase1 first to generate requirements.",
        returnControl: true
      };
    }

    let finalAssessment = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 3;

    while (attempts < MAX_ATTEMPTS) {
      console.log(`Assessment attempt ${attempts + 1}/${MAX_ATTEMPTS}`);
      
      // Assess current requirements
      const assessmentResponse = await tryLLMRequest([
        {
          role: "user",
          content: `${currentRequirements}\n\n${GATE1_PROMPT}`
        }
      ], (response) => {
        return JSON.parse(response);
      });

      const assessment = typeof assessmentResponse === 'string' ? JSON.parse(assessmentResponse) : assessmentResponse;
      finalAssessment = assessment;

      // If score is 8 or higher, we're done
      if (assessment.rating >= 8) {
        console.log(`Requirements met threshold with score ${assessment.rating}/10`);
        break;
      }

      // If we've hit max attempts, we're done
      if (attempts === MAX_ATTEMPTS - 1) {
        console.log(`Hit maximum attempts (${MAX_ATTEMPTS}) with final score ${assessment.rating}/10`);
        break;
      }

      // Request improvements
      console.log(`Score ${assessment.rating}/10 below threshold, requesting improvements...`);
      const improvementResponse = await tryLLMRequest([
        {
          role: "assistant",
          content: currentRequirements
        },
        {
          role: "user",
          content: `The current requirements received a rating of ${assessment.rating}/10 with the following feedback:\n\n${assessment.explanation}\n\nPlease provide the COMPLETE rewritten requirements without skipping anything.`
        }
      ]);

      // Update current requirements
      currentRequirements = improvementResponse;

      // Check if requirements are complete, if not, request continuation
      while (!isRequirementsComplete(currentRequirements)) {
        console.log("Improved requirements appear incomplete, requesting continuation...");
        
        const continuationResponse = await tryLLMRequest([
          {
            role: "assistant",
            content: currentRequirements
          },
          {
            role: "user",
            content: REQUIREMENTS_CONTINUE_PROMPT
          }
        ]);

        currentRequirements = currentRequirements + "\n\n" + continuationResponse;
      }

      attempts++;
    }

    // Format the final response with both the final assessment and the improved requirements
    const finalResponse = `${ASSESSMENT_MARKER}Rating: ${finalAssessment.rating}/10\n\n${finalAssessment.explanation.trim()}\n\n${REQUIREMENTS_MARKER}\n${currentRequirements}`;

    return {
      message: finalResponse,
      returnControl: true
    };
  } catch (error: any) {
    console.error("Error in gate1 workflow:", error);
    return {
      message: `Error in gate1 workflow: ${error.message}`,
      returnControl: true
    };
  }
});

export function registerWorkflow(name: string, handler: WorkflowHandler) {
  workflows.set(name, handler);
}

export async function handleTrigger(name: string, messages: Message[]): Promise<WorkflowResult | null> {
  const handler = workflows.get(name);
  if (!handler) return null;
  return handler(messages);
}
export function stripTriggers(content: string): { content: string; triggers: string[] } {
  const triggers: string[] = [];
  const cleanContent = content.replace(/@(\w+)/g, (_, name) => {
    triggers.push(name);
    return name;
  }).trim();
  
  return { content: cleanContent, triggers };
}

