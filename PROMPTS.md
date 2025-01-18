# Organized Prompts by Phase

## Concept Phase

### Concept Refinement

```plaintext
Help the user refine their software concept before it is time to work on requirements. No code please. Do not solution. The point is to refine the concept just enough so we can write requirements later, including the scope of the project, which could be anything from a tiny script to a full-blown multi-tenant globally distributed SaaS platform. Don't jump ahead.
```

### Concept Assessment

```plaintext
As a world-class technical product manager, on a zcale of 0 to 10 rate whether there is enough concept information to write a first comprehensive draft of functional and non-functional requirements. The goal isn't to already have requirements from the user. It's to understand the user's goal enough that we can write a comprehensive first draft of requirements, even if that means we have to make some assumptions and use good judgement as a product manager.
```

## Requirements Phase

### Requirements Creation

```plaintext
As a world-class technical product manager create a comprehensive requirements document for the concept following this exact structure.

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
- Time-bound (if applicable)
```

### Requirements Intermediate Review

```plaintext
In the context of the concept and its scope, review your requirements. Assess. If there are areas for improvement rewrite them and provide the COMPLETE rewritten requirements without skipping anything.
```

### Requirements Assessment

```plaintext
As a world-class software architect, on a scale of 0 to 10, how ready are these requirements to support implementation? Pay particular attention to completeness given the concept, consistency, orthogonality, and elegance.
```

## Design Phase

### Design Creation

```plaintext
As a world class software architect, identity the next highest level of abstraction that needs for design for this project. This will be our current level of abstraction. Design the components at this single layer of abstraction, provide descriptions for them, their interactions and responsibilities. No matter what level of abstraction we start at, DO NOT IMPLEMENT ANY CODE. We will recurse through the levels of abstraction designing at each step until we get to the point of every public method or interface being designed and having docstrings but NO implementations. Then we will move on to TDD.

If the current level of abstraction is above the a level normally associated with repository files, create the design as a single document. If the current level of abstraction is at a level normally associated with repository files (for example, apps, packages, modules and their interfaces, submodules and their interfaces, private methods) then provide a repositiory structure and the relevant files with descriptions and signatures if relevant BUT NO IMPLEMENTATIONS. All methods MUST throw a not implemented exception appropriate to the language and framework so that all tests will fail during later phases.

In your designs, use modern practices and patterns. Explicitly state the use of cross-cutting concerns (e.g. logging, error handling, metrics, etc.) available in the repo if any. Explicitly state the use of any other patterns or practices. Explicitly state code design patterns or important data structures if relevant. Do not reinvent the wheel. Assume you will use existing libraries and frameworks or cross-cutting concerns in the repo if any instead of reinventing them. The most beautiful code is the code that is the simplest and most elegant and requires the least amount of code to implement to meet the requirements. Security, logging, error handling, and monitoring are important to consider from the beginning, as appropriate to the project level. The user's brand hinges on trust built on warmth and competence; quality is the currency of trust. Do not over-engineer.
```

### Design Assessment

```plaintext
As a world-class software architect, on a scale of 0 to 10, assess the readiness of this design to support design at the next level of abstraction, or if we are at the lowest level of abstraction (private methods), to support unit test design.
```

## Unit Test Phase

### Test Design

```plaintext
As a world-class staff QA engineer, design the unit test unit suite to provide comprehensive coverage for the design and requirements. DO NOT IMPLEMENT. Provide the test files, test classes, fixtures, test method signatures, and full documentation. Cover all expected behaviour, exceptions and edge cases. Remember, the methods in the implementation classes are INTENTIONALLY stubbed. This is TDD. Write the test for the EXPECTED behaviour once they are implemented, not the stubbed behaviour.

Design a full set of shared mocks, utilities or fixtures first. Then design unit tests for cross-cutting concerns. When designing unit tests for other code assume cross-cutting utilities, if any, will be used. Remember these are pure unit tests, not integration tests.


DO NOT IMPLEMENT unit tests. This is purely design. Implementing the tests will be another phase. Include a dir structure for the tests.
```

### Unit Test Assessment

```plaintext
As a world class principal software engineer, on a scale of 0 to 10 rate the design of these unit tests with respect to their consistency and coverage of the design and requirements, and their readiness to support unit test implementation.
```

## Unit Test Implementation Phase

### Unit Test Implementation Design

```plaintext
As a world-class QA engineer, implement the shared mocks, utilities or fixtures for the unit tests and the unit tests. Cover all the expected behaviour as documented in the test designs. If the designs are unclear, look at the concept, requirements, and implementation stubs. But remember, we are not testing that the stubs throw not implemented exceptions, we are setting up for TDD by testing the expected behaviour of the eventual implementations.

Use the shared utilities and mocks. Extend or add to them as needed. Remember the real implementations will use cross-cutting concerns (e.g. logging, error handling, metrics, etc.) available in the repo if any.

If you make any changes to shared utilities or mocks, check all the tests that use them to ensure they still work as expected.

If there is a package manager ALWAYS use it to manage dependencies.

Run the tests to ensure they fail. All stubs will throw not implemented exceptions, which is NOT the expected behaviour for the system.
```

### Unit Test Implementation Assessment

```plaintext
As a world-class QA engineer, on a scale of 0 to 10 rate the coverage provided to the design and requirements by these unit tests and their readiness to validate system implementation.
```

## Integration Test Phase

### Integration Test Design

```plaintext
As a world-class QA engineer, design the integration test suite to provide comprehensive coverage for the design and requirements. DO NOT IMPLEMENT. Provide the test files, test classes, fixtures, test method signatures, and full documentation. Cover all expected behaviour, exceptions and edge cases. Remember, the methods in the implementation classes are INTENTIONALLY stubbed. This is TDD. Write the test for the EXPECTED behaviour once they are implemented, not the stubbed behaviour.

Add to or extend shared utilities and mocks as required. If you make any breaking changes, search for all the unit and integration tests that use them to ensure they still work as expected.

Then design unit tests for cross-cutting concerns. When designing unit tests for other code assume cross-cutting utilities, if any, will be used. Remember these are pure unit tests, not integration tests.

DO NOT IMPLEMENT unit tests. This is purely design. Implementing the tests will be another phase. Include a dir structure for the tests.
```

### Integration Test Design Assessment

```plaintext
As a world-class QA engineer, on a scale of 0 to 10 rate the design of these integration tests with respect to their consistency and coverage of the design and requirements, and their readiness to support integration test implementation.
```

### Integration Test Implementation

```plaintext
As a world-class QA engineer, implement the shared utilities and mocks for the integration tests and the integration tests. These integration tests are meant to cover one-hop interactions between components. Use your judgement for the appropriate level of coverage. We are are not testing end to end interactions. That will come later.

Cover all the expected behaviour as documented in the test designs. If the designs are unclear, look at the concept, requirements, and implementation stubs. But remember, we are not testing that the stubs throw not implemented exceptions, we are setting up for TDD by testing the expected behaviour of the eventual implementations.

Use the shared utilities and mocks. Extend or add to them as needed. Remember the real implementations will use cross-cutting concerns (e.g. logging, error handling, metrics, etc.) available in the repo if any.

If you make any changes to shared utilities or mocks, check all the tests that use them to ensure they still work as expected.

If there is a package manager ALWAYS use it to manage dependencies.

Run the tests to ensure they fail. All stubs will throw not implemented exceptions, which is NOT the expected behaviour for the system.
```

## Implementation Phase

### Implementation

```plaintext
As a world-class staff software engineer, make a plan to implement the system and document it in a plan document you can refer to and track your progress against. Prefer implementing cross-cutting concerns first. Your goal is to implement the system in the most elegant way possible, using the most modern practices and patterns, adhering to the design and requirements, and passing all the tests. As you implement, if there are issues, you learn something that may be relevant later, you encounter a problem that may be relevant to other parts of the system, or you learn something that may be relevant to other parts of the system, you document it in the plan document.

Commit often so you can track your progress and have a history of your changes and backtrack if you need to.

Create a debugging document. 

Each time you complete a testable unit of work, run the tests, and document any failures. Check the debugging document for previous failures for the code you are concerned about. Check the relevant code and tests, do a root cause analysis, and document your findings and plan. Use the debugging document to detect if you are repeating the same mistakes or going in circles. It is always better to fix the root cause of the problem than to just make the tests pass. ALWAYS consider the design and requirements when designing fixes. If you are CERTAIN the issue is in the code, search for and plan for the impacts on other code and tests of changes you make.

If you think larger refactoring is needed, document it in the plan document and discuss with the user.

If there is a package manager ALWAYS use it to manage dependencies.

Update your progress in the plan document as you go.
```

## Integration Phase

### Integration Design

```plaintext
As a world-class QA engineer, design the integration test suite to provide comprehensive coverage for the design and requirements. DO NOT IMPLEMENT. The goal here is end to end testing that validates the system works as expected, meets the concept, requirements, and design, and that we have not accidentally failed to use cross-cutting concerns or parts of the system. Designing and implementing cross-cutting concerns or parts of the system and failing to use them in the actual implementation is a common failure mode to check for.

This is a test of the system as a whole, not just the individual components. Individual components have their own unit and one-hop integration tests. We are not testing if systems external to the system work as expected (e.g. we will assume AWS works as expected, that kind of thing).
```

### Integration Assessment

```plaintext
As a world-class QA engineer, on a scale of 0 to 10 rate the design of these integration tests with respect to their consistency and coverage of the design and requirements, and their readiness to support integration test implementation.
```

### Integration Implementation and Fixes

```plaintext
As a world-class QA engineer, implement the end to end integration tests one at a time. Each time you implement an end to end test, run the tests, and document any failures. Check the debugging document for previous failures for the code you are concerned about. Check the relevant code and tests, do a root cause analysis, and document your findings and plan. Use the debugging document to detect if you are repeating the same mistakes or going in circles. It is always better to fix the root cause of the problem than to just make the tests pass. ALWAYS consider the design and requirements when designing fixes.

Discuss ALL fixes with the user BEFORE making them. At this point changes can have significant impact on the system. Provide a detailed analysis of the problem, the fix, and the impact of the fix on the system.
```
