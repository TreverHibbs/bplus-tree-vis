import { Timeline } from "./lib/anime.esm"

/**
 * This interface defines a object that is used to store one atomic step of a algorithm
 * so that that step can be undone and redone.
 */
export interface AlgoStep {
    /**
     * Implementation of this method should execute a atomic series of algorithm
     * steps and generate their corresponding animations.
     *
     * @return A Timeline of the generated animation of the algo step. Or
     * null if there is no next operation in history.
     */
    do: () => Timeline | null

    /**
     * This should return the process and UI to its state from before the corresponding
     * do methods execution.
     * 
     * @return A Timeline of the generated animation for the previous operation. Or
     * null if there is no previous operation in history.
     */
    undo: () => Timeline | null
}

/**
 * This class keeps track of a list of executed algorithm steps and provides methods
 * to undo and redo them. A instance of this class represents a
 * archive of a algorithm visualizations steps.
 */
export class AlgoStepHistory {
    private steps: AlgoStep[] = []
    // The index of the algorithm step that is being currently animated
    private currentStepIndex = -1 // -1 indicates that there are no steps

    /**
     * Add a AlgoStep to the AlgoStep array at the currentStepIndex.
     * 
     * @param step The AlgoStep to add to the history. Must have already been executed.
     * @sideEffect AlgoSteps after the current step index are removed from
     * the AlgoStep array.
     */
    public addAlgoStep(step: AlgoStep) {
        if (this.steps[this.currentStepIndex + 1]) {
            this.steps = this.steps.slice(0, this.currentStepIndex + 1)
        }

        this.steps[++this.currentStepIndex] = step
        return
    }

    /**
     * Executes the next algo step
     *
     * @returns Timeline of the generated animation for the executed algo step. Or
     * null if there is no next step.
     */
    public stepForwards(): Timeline | null {
        if (this.steps[this.currentStepIndex + 1] === undefined) return null // no next step
        this.currentStepIndex++
        const generatedTimeline = this.steps[this.currentStepIndex + 1].do()
        if (generatedTimeline === null) {
            throw new Error('null algo step made it into the history. This should not happen.')
        }
        return generatedTimeline
    }

    /**
     * Returns the application to its state from before the last algo step
     * execution.
     *
     * @returns Timeline of the generated animation for the executed algo step. Or
     * null if there is no next step.
     */
    public stepBackwards(): Timeline | null {
        if (this.steps[this.currentStepIndex] === undefined) return null // oldest step
        const generatedTimeline = this.steps[this.currentStepIndex].undo()
        if (generatedTimeline === null) {
            throw new Error('null algo step made it into the history. This should not happen.')
        }
        this.currentStepIndex--
        return generatedTimeline
    }
}