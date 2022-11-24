/**
 * This interface defines a object that is used to store one atomic step of a algorithm
 * so that that step can be undone and redone.
 */
export interface AlgoStep {
    /**
     * Implementation of this method should execute a atomic series of algorithm
     * steps and there corresponding animations.
     *
     * @return A boolean that indicates success or not
     */
    do: () => boolean

    /**
     * This should return the process and UI to its state from before the corresponding
     * do methods execution.
     * 
     * @return A boolean that indicates success or not
     */
    undo: () => boolean
}

/**
 * This class keeps track of a list of algorithm steps and provides methods to
 * move forward and backward through them. A instance of this class represents a
 * archive of a algorithm visualizations steps.
 */
export class AlgoStepHistory {
    private steps: AlgoStep[] = []
    // Indicates what step in the this.steps array was most recently executed.
    private currentStepIndex = 0

    /**
     * Add a AlgoStep to the history. Assumes that that AlgoStep was the last
     * one to be executed.
     */
    public addAlgoStep(step: AlgoStep) {
        // Get rid of algo steps that are no longer valid because new algo step
        // is being added before.
        if (this.steps[this.currentStepIndex + 1]) {
            this.steps = this.steps.slice(0, this.currentStepIndex + 1)
        }

        this.steps[this.currentStepIndex] = step
        return
    }

    /**
     * Executes the next algo step
     *
     * @returns indicates success
     */
    public stepForwards() {
        this.steps[this.currentStepIndex].do()
        this.currentStepIndex++
        return true
    }

    /**
     * Returns the application to its state from before the last algo step
     * execution.
     *
     * @returns indicates success
     */
    public stepBackwards() {
        this.steps[this.currentStepIndex].undo()
        this.currentStepIndex--
        return true
    }
}