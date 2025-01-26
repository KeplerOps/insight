from typing import Dict, List, Optional, TypedDict, Literal

# Phase 5: Integration Test Development Prompts
INTEGRATION_TEST_PROMPTS: Dict[str, str] = {
    # When creating integration tests
    "integration_testing": """For each major subsystem or workflow in the system:

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

You are not done until:
- All integration tests pass
- 80% workflow coverage achieved
- No unjustified gaps
- No critical workflows untested
- All debug history documented
- Test output is clean (no warnings/errors)
- No test order dependencies
- No shared state between tests
- All mocks properly documented"""
}

class GetIntegrationTestPromptRequest(TypedDict):
    prompt_name: Literal["integration_testing"]
