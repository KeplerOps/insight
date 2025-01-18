import { 
  DevelopmentPhase, 
  ProcessState, 
  Assessment,
  PROMPTS,
  QUALITY_GATES,
  QualityGate,
  ConceptContext,
  RequirementsContext,
  DesignContext,
  TestContext,
  ImplementationContext,
  Prompt
} from './types.js';
import path from 'path';
import fs from 'fs';

// Create a type-safe mapping for phase contexts
type PhaseContextType = {
  concept: ConceptContext;
  requirements: RequirementsContext;
  design: DesignContext;
  'unit-test-design': TestContext;
  'unit-test-implementation': TestContext;
  'integration-test-design': TestContext;
  implementation: ImplementationContext;
  integration: ImplementationContext;
};

export class PhaseManager {
  private state: ProcessState;
  private persistPath: string;

  constructor(persistPath: string) {
    this.persistPath = persistPath;
    this.state = this.loadState();
  }

  private loadState(): ProcessState {
    try {
      // Ensure .insight directory exists
      const dir = path.dirname(this.persistPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Load state from file if it exists
      if (fs.existsSync(this.persistPath)) {
        const data = fs.readFileSync(this.persistPath, 'utf8');
        return JSON.parse(data) as ProcessState;
      }

      // Return default state if file doesn't exist
      return {
        currentPhase: DevelopmentPhase.Concept,
        artifacts: {},
        gateScores: {},
        context: {}
      };
    } catch (error) {
      console.error('Failed to load state:', error);
      return {
        currentPhase: DevelopmentPhase.Concept,
        artifacts: {},
        gateScores: {},
        context: {}
      };
    }
  }

  private async saveState(): Promise<void> {
    try {
      const dir = path.dirname(this.persistPath);
      await fs.promises.mkdir(dir, { recursive: true });
      
      await fs.promises.writeFile(
        this.persistPath,
        JSON.stringify(this.state, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Failed to save state:', error);
      throw new Error(`Failed to save state: ${error}`);
    }
  }

  public getCurrentPhase(): DevelopmentPhase {
    return this.state.currentPhase;
  }

  public getPromptForPhase(phase: DevelopmentPhase, type: string): string | null {
    const prompt = Object.values(PROMPTS).find((p: Prompt) => 
      p.phase === phase && p.type === type
    );
    return prompt?.content || null;
  }

  public async addArtifact(path: string, content: string): Promise<void> {
    this.state.artifacts[path] = content;
    await this.saveState();
  }

  public getArtifact(path: string): string | null {
    return this.state.artifacts[path] || null;
  }

  public async addAssessment(gateName: string, assessment: Assessment): Promise<void> {
    if (!this.state.gateScores[gateName]) {
      this.state.gateScores[gateName] = [];
    }
    this.state.gateScores[gateName].push(assessment);
    await this.saveState();
  }

  public getLatestAssessment(gateName: string): Assessment | null {
    const assessments = this.state.gateScores[gateName];
    if (!assessments || assessments.length === 0) {
      return null;
    }
    return assessments[assessments.length - 1];
  }

  public async evaluateGate(gateName: string): Promise<{
    passed: boolean;
    scores: Assessment[];
    missingCriteria: string[];
  }> {
    const gate = QUALITY_GATES[gateName];
    if (!gate) {
      throw new Error(`Unknown gate: ${gateName}`);
    }

    const assessments = this.state.gateScores[gateName] || [];
    const latestAssessments = new Map<string, Assessment>();

    const latestAssessment = assessments[assessments.length - 1];
    const scores = latestAssessment ? [latestAssessment] : [];
    
    // Check which criteria pass their thresholds
    const passingCriteria = new Set<string>();
    
    if (latestAssessment) {
      if (latestAssessment.criterionName) {
        // If assessment has a criterionName, only check that criterion
        const criterion = gate.criteria.find(c => c.name === latestAssessment.criterionName);
        if (criterion && latestAssessment.score >= criterion.threshold) {
          passingCriteria.add(criterion.name);
        }
      } else {
        // If no criterionName, check all criteria
        gate.criteria.forEach(criterion => {
          if (latestAssessment.score >= criterion.threshold) {
            passingCriteria.add(criterion.name);
          }
        });
      }
    }

    const missingCriteria = gate.criteria
      .filter(criterion => !passingCriteria.has(criterion.name))
      .map(criterion => criterion.name);

    return {
      passed: missingCriteria.length === 0,
      scores,
      missingCriteria
    };
  }

  public async attemptPhaseTransition(fromPhase: DevelopmentPhase, toPhase: DevelopmentPhase): Promise<{
    success: boolean;
    message: string;
    requiredAssessments?: string[];
  }> {
    // Get the gate that guards this transition
    const gateName = this.getGateForTransition(fromPhase, toPhase);
    if (!gateName) {
      throw new Error(`No gate defined for transition ${fromPhase} -> ${toPhase}`);
    }

    const evaluation = await this.evaluateGate(gateName);
    if (!evaluation.passed) {
      return {
        success: false,
        message: `Cannot transition to ${toPhase}. Missing criteria: ${evaluation.missingCriteria.join(', ')}`,
        requiredAssessments: evaluation.missingCriteria
      };
    }

    this.state.currentPhase = toPhase;
    await this.saveState();

    return {
      success: true,
      message: `Successfully transitioned to ${toPhase}`
    };
  }

  private getGateForTransition(fromPhase: DevelopmentPhase, toPhase: DevelopmentPhase): string | null {
    // Map phase transitions to gate names
    const transitionMap: { [key: string]: string } = {
      [`${DevelopmentPhase.Concept}-${DevelopmentPhase.Requirements}`]: 'conceptToRequirements',
      [`${DevelopmentPhase.Requirements}-${DevelopmentPhase.Design}`]: 'requirementsToDesign',
      // Add other transitions here
    };

    return transitionMap[`${fromPhase}-${toPhase}`] || null;
  }

  public async updateContext<P extends DevelopmentPhase>(
    phase: P,
    context: PhaseContextType[P extends keyof PhaseContextType ? P : never]
  ): Promise<void> {
    this.state.context[phase] = context;
    await this.saveState();
  }

  public getContext<P extends DevelopmentPhase>(
    phase: P
  ): PhaseContextType[P extends keyof PhaseContextType ? P : never] | null {
    const context = this.state.context[phase];
    return (context as PhaseContextType[P extends keyof PhaseContextType ? P : never]) || null;
  }

  public getPhaseHistory(phase: DevelopmentPhase): {
    artifacts: string[];
    assessments: Array<{
      gate: string;
      assessment: Assessment;
    }>;
  } {
    const artifacts = Object.keys(this.state.artifacts).filter(path => 
      path.startsWith(`${phase}/`)
    );

    const assessments = Object.entries(this.state.gateScores)
      .filter(([gate]) => QUALITY_GATES[gate]?.phase === phase)
      .map(([gate, scores]) => ({
        gate,
        assessment: scores[scores.length - 1] as Assessment
      }));

    return {
      artifacts,
      assessments
    };
  }
}
