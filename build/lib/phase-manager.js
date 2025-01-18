import { DevelopmentPhase, PROMPTS, QUALITY_GATES } from './types.js';
import path from 'path';
import fs from 'fs';
export class PhaseManager {
    constructor(persistPath) {
        this.persistPath = persistPath;
        this.state = this.loadState();
    }
    loadState() {
        try {
            // Ensure .insight directory exists
            const dir = path.dirname(this.persistPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            // Load state from file if it exists
            if (fs.existsSync(this.persistPath)) {
                const data = fs.readFileSync(this.persistPath, 'utf8');
                return JSON.parse(data);
            }
            // Return default state if file doesn't exist
            return {
                currentPhase: DevelopmentPhase.Concept,
                artifacts: {},
                gateScores: {},
                context: {}
            };
        }
        catch (error) {
            console.error('Failed to load state:', error);
            return {
                currentPhase: DevelopmentPhase.Concept,
                artifacts: {},
                gateScores: {},
                context: {}
            };
        }
    }
    async saveState() {
        try {
            const dir = path.dirname(this.persistPath);
            await fs.promises.mkdir(dir, { recursive: true });
            await fs.promises.writeFile(this.persistPath, JSON.stringify(this.state, null, 2), 'utf8');
        }
        catch (error) {
            console.error('Failed to save state:', error);
            throw new Error(`Failed to save state: ${error}`);
        }
    }
    getCurrentPhase() {
        return this.state.currentPhase;
    }
    getPromptForPhase(phase, type) {
        const prompt = Object.values(PROMPTS).find((p) => p.phase === phase && p.type === type);
        return prompt?.content || null;
    }
    async addArtifact(path, content) {
        this.state.artifacts[path] = content;
        await this.saveState();
    }
    getArtifact(path) {
        return this.state.artifacts[path] || null;
    }
    async addAssessment(gateName, assessment) {
        if (!this.state.gateScores[gateName]) {
            this.state.gateScores[gateName] = [];
        }
        this.state.gateScores[gateName].push(assessment);
        await this.saveState();
    }
    getLatestAssessment(gateName) {
        const assessments = this.state.gateScores[gateName];
        if (!assessments || assessments.length === 0) {
            return null;
        }
        return assessments[assessments.length - 1];
    }
    async evaluateGate(gateName) {
        const gate = QUALITY_GATES[gateName];
        if (!gate) {
            throw new Error(`Unknown gate: ${gateName}`);
        }
        const assessments = this.state.gateScores[gateName] || [];
        const latestAssessments = new Map();
        // Get latest assessment for each criterion
        assessments.forEach((assessment) => {
            gate.criteria.forEach((criterion) => {
                if (assessment.score >= criterion.threshold) {
                    latestAssessments.set(criterion.name, assessment);
                }
            });
        });
        const missingCriteria = gate.criteria
            .filter((criterion) => !latestAssessments.has(criterion.name))
            .map((criterion) => criterion.name);
        return {
            passed: missingCriteria.length === 0,
            scores: Array.from(latestAssessments.values()),
            missingCriteria
        };
    }
    async attemptPhaseTransition(fromPhase, toPhase) {
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
    getGateForTransition(fromPhase, toPhase) {
        // Map phase transitions to gate names
        const transitionMap = {
            [`${DevelopmentPhase.Concept}-${DevelopmentPhase.Requirements}`]: 'conceptToRequirements',
            [`${DevelopmentPhase.Requirements}-${DevelopmentPhase.Design}`]: 'requirementsToDesign',
            // Add other transitions here
        };
        return transitionMap[`${fromPhase}-${toPhase}`] || null;
    }
    async updateContext(phase, context) {
        this.state.context[phase] = context;
        await this.saveState();
    }
    getContext(phase) {
        const context = this.state.context[phase];
        return context || null;
    }
    getPhaseHistory(phase) {
        const artifacts = Object.keys(this.state.artifacts).filter(path => path.includes(`/${phase}/`));
        const assessments = Object.entries(this.state.gateScores)
            .filter(([gate]) => QUALITY_GATES[gate]?.phase === phase)
            .map(([gate, scores]) => ({
            gate,
            assessment: scores[scores.length - 1]
        }));
        return {
            artifacts,
            assessments
        };
    }
}
//# sourceMappingURL=phase-manager.js.map