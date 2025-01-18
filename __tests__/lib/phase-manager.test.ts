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
  });
});
