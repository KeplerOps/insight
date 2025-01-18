import { DevelopmentPhase, Assessment, ConceptContext, RequirementsContext, DesignContext, TestContext, ImplementationContext } from './types.js';
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
export declare class PhaseManager {
    private state;
    private persistPath;
    constructor(persistPath: string);
    private loadState;
    private saveState;
    getCurrentPhase(): DevelopmentPhase;
    getPromptForPhase(phase: DevelopmentPhase, type: string): string | null;
    addArtifact(path: string, content: string): Promise<void>;
    getArtifact(path: string): string | null;
    addAssessment(gateName: string, assessment: Assessment): Promise<void>;
    getLatestAssessment(gateName: string): Assessment | null;
    evaluateGate(gateName: string): Promise<{
        passed: boolean;
        scores: Assessment[];
        missingCriteria: string[];
    }>;
    attemptPhaseTransition(fromPhase: DevelopmentPhase, toPhase: DevelopmentPhase): Promise<{
        success: boolean;
        message: string;
        requiredAssessments?: string[];
    }>;
    private getGateForTransition;
    updateContext<P extends DevelopmentPhase>(phase: P, context: PhaseContextType[P extends keyof PhaseContextType ? P : never]): Promise<void>;
    getContext<P extends DevelopmentPhase>(phase: P): PhaseContextType[P extends keyof PhaseContextType ? P : never] | null;
    getPhaseHistory(phase: DevelopmentPhase): {
        artifacts: string[];
        assessments: Array<{
            gate: string;
            assessment: Assessment;
        }>;
    };
}
export {};
