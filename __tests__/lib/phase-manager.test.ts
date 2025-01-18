import { jest } from '@jest/globals';
import { PhaseManager } from '../../src/lib/phase-manager.js';
import { DevelopmentPhase, Assessment } from '../../src/lib/types.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('PhaseManager', () => {
  let tempDir: string;
  let statePath: string;
  let phaseManager: PhaseManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'insight-test-'));
    statePath = path.join(tempDir, 'state.json');
    phaseManager = new PhaseManager(statePath);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('State Management', () => {
    test('initializes with default state', () => {
      expect(phaseManager.getCurrentPhase()).toBe(DevelopmentPhase.Concept);
    });

    test('persists state changes', async () => {
      const artifact = {
        path: 'test.md',
        content: 'test content'
      };
      await phaseManager.addArtifact(artifact.path, artifact.content);

      // Create new instance to test persistence
      const newManager = new PhaseManager(statePath);
      expect(newManager.getArtifact(artifact.path)).toBe(artifact.content);
    });
  });

  describe('Phase Management', () => {
    test('starts in concept phase', () => {
      expect(phaseManager.getCurrentPhase()).toBe(DevelopmentPhase.Concept);
    });

    test('prevents invalid phase transitions', async () => {
      await expect(
        phaseManager.attemptPhaseTransition(
          DevelopmentPhase.Concept,
          DevelopmentPhase.Design
        )
      ).rejects.toThrow();
    });

    test('requires passing gate criteria for transition', async () => {
      const result = await phaseManager.attemptPhaseTransition(
        DevelopmentPhase.Concept,
        DevelopmentPhase.Requirements
      );
      expect(result.success).toBe(false);
      expect(result.requiredAssessments).toBeDefined();
      expect(result.requiredAssessments?.length).toBeGreaterThan(0);
    });

    test('allows transition when gate criteria met', async () => {
      // Add passing assessments
      await phaseManager.addAssessment('conceptToRequirements', {
        score: 9,
        explanation: 'Clear concept',
        recommendations: []
      });

      const result = await phaseManager.attemptPhaseTransition(
        DevelopmentPhase.Concept,
        DevelopmentPhase.Requirements
      );
      expect(result.success).toBe(true);
      expect(phaseManager.getCurrentPhase()).toBe(DevelopmentPhase.Requirements);
    });
  });

  describe('Context Management', () => {
    test('handles concept context', async () => {
      const context = {
        problemStatement: 'Test problem',
        valueProposition: 'Test value',
        successCriteria: ['criterion1'],
        constraints: ['constraint1'],
        decisions: [{
          date: '2024-03-14',
          decision: 'Test decision',
          rationale: 'Test rationale'
        }]
      };

      await phaseManager.updateContext(DevelopmentPhase.Concept, context);
      const retrieved = phaseManager.getContext(DevelopmentPhase.Concept);
      expect(retrieved).toEqual(context);
    });

    test('handles requirements context', async () => {
      const context = {
        sections: [{
          id: 'section1',
          title: 'Test Section',
          content: 'Test content',
          subsections: [{
            id: 'sub1',
            title: 'Test Subsection',
            content: 'Test subcontent'
          }]
        }],
        mustRequirements: ['must1'],
        shouldRequirements: ['should1'],
        mayRequirements: ['may1'],
        mustNotRequirements: ['mustnot1']
      };

      await phaseManager.updateContext(DevelopmentPhase.Requirements, context);
      const retrieved = phaseManager.getContext(DevelopmentPhase.Requirements);
      expect(retrieved).toEqual(context);
    });
  });

  describe('Artifact Management', () => {
    test('manages artifacts', async () => {
      const artifact = {
        path: 'test.md',
        content: 'test content'
      };

      await phaseManager.addArtifact(artifact.path, artifact.content);
      expect(phaseManager.getArtifact(artifact.path)).toBe(artifact.content);
    });

    test('returns null for non-existent artifacts', () => {
      expect(phaseManager.getArtifact('nonexistent.md')).toBeNull();
    });
  });

  describe('Assessment Management', () => {
    test('manages assessments', async () => {
      const assessment: Assessment = {
        score: 9,
        explanation: 'Test assessment',
        recommendations: ['rec1']
      };

      await phaseManager.addAssessment('test-gate', assessment);
      const latest = phaseManager.getLatestAssessment('test-gate');
      expect(latest).toEqual(assessment);
    });

    test('returns null for non-existent assessments', () => {
      expect(phaseManager.getLatestAssessment('nonexistent-gate')).toBeNull();
    });

    test('evaluates gate criteria', async () => {
      const assessment: Assessment = {
        score: 7, // Lower than any threshold
        explanation: 'Test assessment',
        recommendations: []
      };

      await phaseManager.addAssessment('conceptToRequirements', assessment);
      const evaluation = await phaseManager.evaluateGate('conceptToRequirements');
      
      expect(evaluation.passed).toBe(false); // Not all criteria met
      expect(evaluation.scores).toHaveLength(1);
      expect(evaluation.missingCriteria).toBeDefined();
      expect(evaluation.missingCriteria.length).toBeGreaterThan(0);
    });
  });

  describe('Phase History', () => {
    test('tracks phase artifacts and assessments', async () => {
      const artifact = {
        path: 'concept/test.md',
        content: 'test content'
      };

      const assessment: Assessment = {
        score: 9,
        explanation: 'Test assessment',
        recommendations: []
      };

      await phaseManager.addArtifact(artifact.path, artifact.content);
      await phaseManager.addAssessment('conceptToRequirements', assessment);

      const history = phaseManager.getPhaseHistory(DevelopmentPhase.Concept);
      expect(history.artifacts).toContain(artifact.path);
      expect(history.assessments).toHaveLength(1);
      expect(history.assessments[0].assessment).toEqual(assessment);
    });

    test('handles gate scores for phase history', async () => {
      // Add some gate scores
      phaseManager['state'].gateScores = {
        'conceptToRequirements': [{
          score: 9,
          explanation: 'Test assessment',
          recommendations: []
        }],
        'requirementsToDesign': [{
          score: 8,
          explanation: 'Another assessment',
          recommendations: []
        }]
      };

      const history = phaseManager.getPhaseHistory(DevelopmentPhase.Concept);
      expect(history.assessments).toHaveLength(1);
      expect(history.assessments[0].gate).toBe('conceptToRequirements');
      expect(history.assessments[0].assessment.score).toBe(9);
    });
  });

  describe('Prompt Management', () => {
    test('retrieves prompts by phase and type', () => {
      const prompt = phaseManager.getPromptForPhase(
        DevelopmentPhase.Concept,
        'refinement'
      );
      expect(prompt).toBeDefined();
      expect(prompt).toContain('Help the user refine their software concept');
    });

    test('returns null for non-existent prompts', () => {
      const prompt = phaseManager.getPromptForPhase(
        DevelopmentPhase.Concept,
        'nonexistent'
      );
      expect(prompt).toBeNull();
    });

    test('retrieves unit test design prompts', () => {
      const designPrompt = phaseManager.getPromptForPhase(
        DevelopmentPhase.UnitTestDesign,
        'design'
      );
      expect(designPrompt).toBeDefined();
      expect(designPrompt).toContain('As a world-class staff QA engineer, design the unit test unit suite');

      const assessmentPrompt = phaseManager.getPromptForPhase(
        DevelopmentPhase.UnitTestDesign,
        'assessment'
      );
      expect(assessmentPrompt).toBeDefined();
      expect(assessmentPrompt).toContain('rate the design of these unit tests');
    });

    test('retrieves unit test implementation prompts', () => {
      const designPrompt = phaseManager.getPromptForPhase(
        DevelopmentPhase.UnitTestImplementation,
        'design'
      );
      expect(designPrompt).toBeDefined();
      expect(designPrompt).toContain('implement the shared mocks, utilities or fixtures');

      const assessmentPrompt = phaseManager.getPromptForPhase(
        DevelopmentPhase.UnitTestImplementation,
        'assessment'
      );
      expect(assessmentPrompt).toBeDefined();
      expect(assessmentPrompt).toContain('rate the coverage provided');
    });

    test('retrieves integration test prompts', () => {
      const designPrompt = phaseManager.getPromptForPhase(
        DevelopmentPhase.IntegrationTestDesign,
        'design'
      );
      expect(designPrompt).toBeDefined();
      expect(designPrompt).toContain('design the integration test suite');

      const assessmentPrompt = phaseManager.getPromptForPhase(
        DevelopmentPhase.IntegrationTestDesign,
        'assessment'
      );
      expect(assessmentPrompt).toBeDefined();
      expect(assessmentPrompt).toContain('rate the design of these integration tests');
    });

    test('retrieves implementation prompts', () => {
      const implementationPrompt = phaseManager.getPromptForPhase(
        DevelopmentPhase.Implementation,
        'implementation'
      );
      expect(implementationPrompt).toBeDefined();
      expect(implementationPrompt).toContain('make a plan to implement the system');
    });

    test('retrieves integration implementation prompts', () => {
      const implementationPrompt = phaseManager.getPromptForPhase(
        DevelopmentPhase.Integration,
        'implementation'
      );
      expect(implementationPrompt).toBeDefined();
      expect(implementationPrompt).toContain('implement the shared utilities and mocks for the integration tests');
    });
  });

  describe('Error Handling', () => {
    test('handles filesystem errors in loadState', () => {
      // Mock fs.existsSync to throw
      const mockExistsSync = jest.spyOn(fs, 'existsSync').mockImplementation(() => {
        throw new Error('Test filesystem error');
      });

      // Mock console.error to verify it's called
      const mockConsoleError = jest.spyOn(console, 'error');

      // Create new instance to trigger loadState
      const manager = new PhaseManager(statePath);
      
      // Verify console.error was called with the error
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to load state:',
        expect.any(Error)
      );

      // Verify default state is returned
      expect(manager.getCurrentPhase()).toBe(DevelopmentPhase.Concept);
      expect(manager.getArtifact('test')).toBeNull();

      mockExistsSync.mockRestore();
      mockConsoleError.mockRestore();
    });

    test('handles filesystem errors in saveState', async () => {
      // Mock fs.promises.mkdir to throw
      const mockMkdir = jest.spyOn(fs.promises, 'mkdir').mockRejectedValue(new Error('Test error'));

      await expect(phaseManager.addArtifact('test.md', 'content'))
        .rejects
        .toThrow('Failed to save state: Error: Test error');

      mockMkdir.mockRestore();
    });

    test('handles unknown gates in evaluateGate', async () => {
      await expect(phaseManager.evaluateGate('nonexistent-gate'))
        .rejects
        .toThrow('Unknown gate: nonexistent-gate');
    });

    test('handles unknown transitions in attemptPhaseTransition', async () => {
      await expect(
        phaseManager.attemptPhaseTransition(
          DevelopmentPhase.Requirements,
          DevelopmentPhase.Concept // Invalid backwards transition
        )
      ).rejects.toThrow('No gate defined for transition requirements -> concept');
    });

    test('handles invalid paths in getPhaseHistory', () => {
      // Add some artifacts with invalid paths
      phaseManager['state'].artifacts = {
        'concept/valid.md': 'content',
        'invalid/path.md': 'content'
      };

      const history = phaseManager.getPhaseHistory(DevelopmentPhase.Concept);
      expect(history.artifacts).toContain('concept/valid.md');
      expect(history.artifacts).not.toContain('invalid/path.md');
    });

    test('handles missing gate scores in evaluateGate', async () => {
      const result = await phaseManager.evaluateGate('conceptToRequirements');
      expect(result.scores).toHaveLength(0);
      expect(result.passed).toBe(false);
    });

    test('handles missing criterion name in assessment', async () => {
      await phaseManager.addAssessment('conceptToRequirements', {
        score: 10,
        explanation: 'test',
        recommendations: []
      });

      const result = await phaseManager.evaluateGate('conceptToRequirements');
      expect(result.scores).toHaveLength(1);
      expect(result.passed).toBe(true);
    });

    test('handles assessments with no matching gates in getPhaseHistory', () => {
      // Add gate scores for multiple phases
      phaseManager['state'].gateScores = {
        'conceptToRequirements': [{
          score: 9,
          explanation: 'Test assessment',
          recommendations: []
        }],
        'requirementsToDesign': [{
          score: 8,
          explanation: 'Another assessment',
          recommendations: []
        }],
        'designToImplementation': [{
          score: 7,
          explanation: 'Design assessment',
          recommendations: []
        }]
      };

      // Get history for Requirements phase - should only include gates starting with 'requirements'
      const history = phaseManager.getPhaseHistory(DevelopmentPhase.Requirements);
      expect(history.assessments).toHaveLength(1);
      expect(history.assessments[0].gate).toBe('requirementsToDesign');
      expect(history.assessments[0].assessment.score).toBe(8);
    });

    test('filters assessments by phase prefix in getPhaseHistory', () => {
      // Add gate scores for multiple phases
      phaseManager['state'].gateScores = {
        'conceptToRequirements': [{
          score: 9,
          explanation: 'Test assessment',
          recommendations: []
        }],
        'requirementsToDesign': [{
          score: 8,
          explanation: 'Another assessment',
          recommendations: []
        }]
      };

      // Get history for each phase and verify filtering
      const conceptHistory = phaseManager.getPhaseHistory(DevelopmentPhase.Concept);
      expect(conceptHistory.assessments).toHaveLength(1);
      expect(conceptHistory.assessments[0].gate).toBe('conceptToRequirements');

      const reqHistory = phaseManager.getPhaseHistory(DevelopmentPhase.Requirements);
      expect(reqHistory.assessments).toHaveLength(1);
      expect(reqHistory.assessments[0].gate).toBe('requirementsToDesign');

      // Design phase has no gates defined yet
      const designHistory = phaseManager.getPhaseHistory(DevelopmentPhase.Design);
      expect(designHistory.assessments).toHaveLength(0);
    });
  });
});
