"""Implementation phase prompt templates.

This module contains prompt templates used in the implementation phase
for code generation, review, and implementation guidance.
"""

from typing import Dict, Literal, TypedDict

# Phase 3: Implementation Development Prompts
IMPLEMENTATION_PROMPTS: Dict[str, str] = {
    # When creating mock library
    "mock_library_creation": """Review the complete system design. For each class/module interface:

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

Document created mocks in test_helpers/mocks.py (or equivalent).""",
    # When checking mock consistency
    "mock_consistency_check": """After completing each class/module:

1. Compare mock implementations with real implementations:
   - Verify interface consistency
   - Verify error condition handling matches
   - Verify mock behavior assumptions were correct

2. If inconsistencies found:
   - Document the differences
   - DO NOT modify the real implementation
   - DO NOT modify the interface
   - Seek design review

This check ensures test validity and catches design issues early.""",
    # When implementing paired tests and code
    "paired_implementation": """For each method in the system, execute this sequence:

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

Proceed to next method only when current method is complete and verified.""",
}


class GetImplementationPromptRequest(TypedDict):
    """Request structure for getting an implementation prompt."""

    prompt_name: Literal[
        "mock_library_creation", "mock_consistency_check", "paired_implementation"
    ]


class ImplementationPromptTemplate:
    """Template for generating implementation-related prompts with context."""

    pass
