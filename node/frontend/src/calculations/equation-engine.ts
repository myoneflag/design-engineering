// engine to resolve equations that depend on variables.

export default class EquationEngine {

    resolved: Map<string, any>;

    unresolved: Map<string, Equation[]>;

    constructor() {
        this.resolved = new Map<string, any>();
        this.unresolved = new Map<string, Equation[]>();
    }

    submitEquation(equation: Equation): void;
    submitEquation(inputs: string[], evaluator: Evaluator): void;

    submitEquation(p1: Equation | string[], p2?: Evaluator) {
        let equation: Equation;
        if (p2 === undefined) {
            equation = p1 as Equation;
        } else {
            equation = {
                evaluate: p2 as Evaluator, inputs: p1 as string[],
            };
        }
        equation.inputs.forEach((i) => {
            if (!this.resolved.has(i)) {
                if (this.unresolved.has(i)) {
                    this.unresolved.get(i)!.push(equation);
                } else {
                    this.unresolved.set(i, [equation]);
                }
            }
        });
        this.touchEquation(equation);
    }

    get(key: string) {
        return this.resolved.get(key);
    }

    submitValue(id: string, value: any) {
        if (this.resolved.has(id)) {
            throw new Error('Value already submitted');
        }

        this.resolved.set(id, value);

        const equations = this.unresolved.get(id);
        if (equations) {
            equations.forEach((e) => {
                this.touchEquation(e);
            });
        }

        this.unresolved.delete(id);
    }

    touchEquation(e: Equation) {
        if (e.inputs.filter((i) => !this.resolved.has(i)).length === 0) {
            // Equation is ready
            const inputs = new Map<string, any>();
            e.inputs.forEach((i) => {
                inputs.set(i, this.resolved.get(i)!);
            });

            const results = e.evaluate(inputs);
            results.forEach(([i, v]) => {
                this.submitValue(i, v);
            });
        }
    }

    isComplete() {
        return this.unresolved.size === 0;
    }

    toString() {
        return JSON.stringify(Array.from(this.resolved.entries()), null, 2) + '\n' +
            JSON.stringify(Array.from(this.unresolved.entries()), null, 2);
    }
}

export type Evaluator = (inputs: Map<string, any>) => Array<[string, any]>;

export interface Equation {
    inputs: string[];
    evaluate: Evaluator;
}
