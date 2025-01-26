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
2.1 [Term]
2.2 [Term]

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
```

### Requirements Intermediate Review

```plaintext
In the context of the concept and its scope, review the requirements for coverage of the concept, coherence, consistency and orthogonality. Assess. If there are areas for improvement rewrite them and provide the COMPLETE rewritten requirements without skipping anything. AVOID SCOPE CREEP. Do not include any comments or meta-commentary, just the requirements.
```

### Requirements Assessment

```plaintext
As a world-class software architect, on a scale of 0 to 10, how ready are these requirements to support implementation? Pay particular attention to completeness given the concept, consistency, orthogonality, and elegance.
```

## Design Phase

### Design Level Identification

```plaintext
As a world-class software architect, analyze the requirements and identify ALL the levels of abstraction needed for this system's design, from highest (system architecture) to lowest (method signatures). For each level, specify:

1. The level name and scope
2. The appropriate design artifacts for this level (e.g., system diagrams, DFDs, sequence diagrams, class diagrams, interface definitions, etc.)
3. The key design decisions that need to be made at this level
4. The cross-cutting concerns relevant to this level

Create a design plan document organizing these levels and noting any critical interfaces or interactions that need special attention during design.

Do not proceed with any actual design yet. We will tackle each level systematically.
```

### Level Design

```plaintext
As a world-class software architect, first review the design plan document to ensure continuity with previous design decisions and patterns.

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
    """Process and validate user data according to specified rules.
    
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
    """
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
```

### Level Design Assessment

```plaintext
As a world-class software architect, assess this level's design:

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

STOP after designing this level and wait for the user to provide feedback.
```

### Interface Review

```plaintext
As a world-class software architect, review ALL interfaces defined so far across ALL levels designed to date:

1. Assess interface consistency and patterns
2. Identify any gaps or inconsistencies in cross-cutting concerns
3. Verify that interfaces properly support their intended interactions
4. Check for appropriate abstraction and encapsulation
5. Verify that security, logging, error handling, and monitoring are properly considered

Document any issues or patterns that should be addressed before proceeding to the next level.
```

## Implementation Phase

### Mock Library Creation

```plaintext
Review the complete system design. For each class/module interface:

1. Verify interface documentation completeness:
   - All method signatures have clear input/output specifications
   - All error conditions are documented
   - All dependencies are identified
   If any documentation is incomplete, DO NOT PROCEED until design is updated.

2. Create mock class/module:
   - Match interface exactly
   - Implement basic happy path behavior
   - Return documented error conditions
   - Add configuration options only for essential test scenarios
   - Include validation capabilities for test verification

DO NOT:
- Add behaviors not specified in the interface
- Create complex mock chains
- Mock standard library features
- Modify the original interface design

Document created mocks in test_helpers/mocks.py (or equivalent).
```

### Mock Consistency Check

```plaintext
After completing each class/module:

1. Compare mock implementations with real implementations:
   - Verify interface consistency
   - Verify error condition handling matches
   - Verify mock behavior assumptions were correct

2. If inconsistencies found:
   - Document the differences
   - DO NOT modify the real implementation
   - DO NOT modify the interface
   - Seek design review

This check ensures test validity and catches design issues early.
```

### Paired Implementation

```plaintext
For each method in the system, execute this sequence:

1. Write the test:
   - Use existing mocks from mock library
   - Test the primary happy path
   - Test documented error conditions
   - Test obvious edge cases
   - Verify the test FAILS with NotImplementedError

2. Implement the method:
   - Follow the design documentation EXACTLY
   - Implement ONLY the current method
   - DO NOT modify other methods or classes
   - Meet the interface specification
   - Handle documented error cases
   - Use existing dependencies/mocks AS IS

3. Verify:
   - Test passes
   - Implementation matches design
   - No mock modifications were needed
   - No interface changes were needed
   - No other components were modified
   - Test coverage is at least 80%

4. Debug History:
   BEFORE attempting ANY fix:
   - Check Debug History for similar problems in this component
   - Record new problems and their context
   - If you've seen similar problems:
     - DO NOT retry failed solutions
     - DO NOT try minor variations of failed fixes
     - Seek guidance

   AFTER each fix attempt:
   - Document exact changes and results
   - Note which files/components were affected
   - Update problem patterns

If verification fails due to:

A. Implementation Issues (current method only):
   - If the issue is confined to ONLY the current method:
     - Check Debug History for similar failures
     - Revise implementation
     - Document changes in Debug History
     - Re-verify ALL checks
   - If you've tried 3 times or seen similar failures:
     - Document exact failure pattern
     - Include all related Debug History
     - Seek guidance

B. Design Issues (affects other components):
   - STOP implementation immediately
   - DO NOT modify other components
   - DO NOT modify interfaces
   - Document:
     1. The specific design issue discovered
     2. Which components/interfaces are affected
     3. Why the current design cannot satisfy requirements
     4. Related problems from Debug History
   - Seek guidance

C. Test Issues:
   - If the test is wrong (not the implementation):
     - Check Debug History for similar test issues
     - Fix ONLY the current method's test
     - DO NOT modify other tests
     - Document fix in Debug History
     - Re-verify from step 1
   - If fixing the test would require changing other tests:
     - STOP
     - Document the test interdependency
     - Include relevant Debug History
     - Seek guidance

ALWAYS seek guidance when:
- Changes would affect multiple components
- Interface changes are needed
- Test changes affect other tests
- Implementation fails verification 3 times
- Mock behavior needs modification
- Same problem/failure occurs 3 times
- Similar fixes have failed twice
- Fix breaks previously working code
- Multiple workarounds accumulating
- Component assumptions prove incorrect

Proceed to next method only when current method is complete and verified.
```

### Implementation Assessment

```plaintext
As a world-class principal software engineer, assess the implementation on a scale of 0 to 10:

1. Code Quality (0-10):
   - Clean, readable, and maintainable code
   - Follows language idioms and best practices
   - Proper error handling and logging
   - Efficient resource usage
   - Clear naming and organization

2. Design Adherence (0-10):
   - Implements design specifications accurately
   - Maintains intended abstractions
   - Respects component boundaries
   - Follows documented interfaces
   - Handles all specified error conditions

3. Robustness (0-10):
   - Proper input validation
   - Comprehensive error handling
   - Thread safety (if applicable)
   - Resource cleanup
   - No edge case oversights

4. Implementation Completeness (0-10):
   - All required functionality implemented
   - No TODOs or placeholder code
   - All error conditions handled
   - Required logging/monitoring in place
   - Documentation complete and accurate

Recommend seeking guidance from the user if any score is below 5.
Provide specific recommendations for any score below 10, but avoid scope creep.

Fail:
- If any score is below 5.
- Any unit tests are failing (you need to run them to check).
- Unit test coverage is below 80%.

STOP after the assessment and wait for the user to provide feedback.
```

## Integration Testing

### Integration Testing

```plaintext
For each major subsystem or workflow in the system:

1. Write the Integration Test:
   - Start with test skeleton and mocks
   - Document the workflow being tested
   - Map all components in the chain
   - List all external dependencies
   - Verify test FAILS initially

2. Test Structure:
   - Clear workflow documentation
   - Explicit setup of test data
   - Well-defined entry and exit points
   - Clear success/failure criteria
   - Proper cleanup of resources

3. Mock Strategy:
   - Mock ALL external dependencies
   - Use existing mocks from mock library
   - Create minimal new mocks only when needed
   - Mock at system boundary only
   - Document mock behavior assumptions

4. Test Implementation:
   - Test complete internal workflows
   - Verify data flows through components
   - Test error propagation
   - Verify system-level error handling
   - Test configuration variations

5. Debug History:
   BEFORE any fix attempt:
   - Check Debug History for similar issues
   - Document new test failures
   - If pattern exists:
     - DO NOT retry failed approaches
     - DO NOT try minor variations
     - Seek guidance

   AFTER each fix:
   - Document exact changes
   - Note affected components
   - Update failure patterns

6. Boundaries and Limitations:
   DO NOT:
   - Test external system integration
   - Test third-party API behavior
   - Test infrastructure
   - Test deployment scenarios
   - Modify production code
   - Change component interfaces

If verification fails due to:

A. Test Implementation Issues:
   - If confined to current test:
     - Check Debug History
     - Revise test implementation
     - Document changes
     - Re-verify
   - After 3 failures:
     - Document pattern
     - Include Debug History
     - Seek guidance

B. Component Integration Issues:
   - STOP testing
   - DO NOT modify components
   - Document:
     1. Integration issue found
     2. Components involved
     3. Expected vs actual behavior
     4. Related Debug History
   - Seek guidance

C. Mock Issues:
   - If mock behavior is wrong:
     - Fix ONLY current test's mocks
     - DO NOT modify other tests
     - Document changes
     - Re-verify
   - If fix affects other tests:
     - STOP
     - Document dependencies
     - Seek guidance

ALWAYS seek guidance when:
- Component changes needed
- Interface changes needed
- Mock changes affect multiple tests
- Same failure occurs 3 times
- Similar fixes fail twice
- Fix breaks other tests
- Integration assumptions incorrect

### Integration Test Assessment

```plaintext
Verify integration test completeness:

1. Workflow Coverage:
   - All major workflows tested
   - Component chains verified
   - Error paths tested
   - Configuration variations covered
   - No critical paths untested

2. Test Quality:
   - Clear workflow documentation
   - Proper mock usage
   - Meaningful assertions
   - Proper resource cleanup
   - Independent tests

3. Coverage Requirements:
   - ALL tests MUST pass
   - No flaky tests
   - No external dependencies
   - Clean test output
   - Minimum 80% integration coverage

4. Test Independence:
   - No test order dependencies
   - No shared state
   - Proper setup/teardown
   - Isolated test data
   - Independent mock configurations

Implementation MUST NOT proceed to next phase until:
- All integration tests pass
- 80% workflow coverage achieved
- No unjustified gaps
- No critical workflows untested
- All debug history documented

Provide specific recommendations for any gaps.
STOP after assessment and wait for user feedback.
```