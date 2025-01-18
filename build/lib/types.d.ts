export declare enum DevelopmentPhase {
    Concept = "concept",
    Requirements = "requirements",
    Design = "design",
    UnitTestDesign = "unit-test-design",
    UnitTestImplementation = "unit-test-implementation",
    IntegrationTestDesign = "integration-test-design",
    Implementation = "implementation",
    Integration = "integration"
}
export interface Assessment {
    score: number;
    explanation: string;
    recommendations?: string[];
}
export interface ProcessState {
    currentPhase: DevelopmentPhase;
    artifacts: {
        [key: string]: string;
    };
    gateScores: {
        [key: string]: Assessment[];
    };
    context: Partial<{
        [DevelopmentPhase.Concept]: ConceptContext;
        [DevelopmentPhase.Requirements]: RequirementsContext;
        [DevelopmentPhase.Design]: DesignContext;
        [DevelopmentPhase.UnitTestDesign]: TestContext;
        [DevelopmentPhase.UnitTestImplementation]: TestContext;
        [DevelopmentPhase.IntegrationTestDesign]: TestContext;
        [DevelopmentPhase.Implementation]: ImplementationContext;
        [DevelopmentPhase.Integration]: ImplementationContext;
    }>;
}
export interface ConceptContext {
    problemStatement?: string;
    valueProposition?: string;
    successCriteria?: string[];
    constraints?: string[];
    decisions?: Array<{
        date: string;
        decision: string;
        rationale: string;
    }>;
}
export interface RequirementsContext {
    sections: Array<{
        id: string;
        title: string;
        content: string;
        subsections?: Array<{
            id: string;
            title: string;
            content: string;
        }>;
    }>;
    mustRequirements: string[];
    shouldRequirements: string[];
    mayRequirements: string[];
    mustNotRequirements: string[];
}
export interface DesignContext {
    components: Array<{
        name: string;
        description: string;
        responsibilities: string[];
        interfaces: Array<{
            name: string;
            description: string;
            methods: Array<{
                name: string;
                description: string;
                parameters: Array<{
                    name: string;
                    type: string;
                    description: string;
                }>;
                returnType: string;
            }>;
        }>;
    }>;
    patterns: Array<{
        name: string;
        description: string;
        rationale: string;
    }>;
    crossCuttingConcerns: Array<{
        name: string;
        description: string;
        implementation: string;
    }>;
}
export interface TestContext {
    unitTests: Array<{
        component: string;
        testCases: Array<{
            name: string;
            description: string;
            expectedBehavior: string;
            setup?: string;
            cleanup?: string;
        }>;
    }>;
    integrationTests: Array<{
        components: string[];
        testCases: Array<{
            name: string;
            description: string;
            workflow: string;
            expectedBehavior: string;
            setup?: string;
            cleanup?: string;
        }>;
    }>;
    sharedFixtures: Array<{
        name: string;
        description: string;
        setup: string;
        cleanup: string;
    }>;
}
export interface ImplementationContext {
    components: Array<{
        name: string;
        status: 'not-started' | 'in-progress' | 'completed';
        issues?: Array<{
            description: string;
            severity: 'high' | 'medium' | 'low';
            status: 'open' | 'resolved';
        }>;
    }>;
    crossCuttingConcerns: Array<{
        name: string;
        status: 'not-started' | 'in-progress' | 'completed';
    }>;
}
export interface Prompt {
    phase: DevelopmentPhase;
    type: string;
    content: string;
}
export declare const PROMPTS: {
    [key: string]: Prompt;
};
export interface QualityGate {
    name: string;
    phase: DevelopmentPhase;
    criteria: Array<{
        name: string;
        description: string;
        threshold: number;
        weight: number;
    }>;
}
export declare const QUALITY_GATES: {
    [key: string]: QualityGate;
};
