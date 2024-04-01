//TODO document ui callback functions
import { AlgoVisualizer } from './algoVisualizer'

/**
 * Implements the functionality of buttons and sliders for interaction with a b+ tree visualization.
 *
 * @dependency For this class to function there must be a specific html
 * structure in the dom. This structure is defined in index.html.
 */
export const userInterface = () => {
    // animation afterwards.
    console.debug("init user interface")
    const algoVisualizer = new AlgoVisualizer(4)

    const animationToggle = <HTMLInputElement>document.querySelector('#animation-toggle')
    const setAnimationToggle = () => {
        console.debug('animation toggle event fired')
        if (!algoVisualizer) return

        if (animationToggle?.checked) {
            algoVisualizer.animationDuration = 0.2
        } else {
            algoVisualizer.animationDuration = 1000
        }
    }

    const insertButton = document.querySelector('#insert-button');
    //TODO make is so that this can't run to instances of the async callback at once.
    insertButton?.addEventListener('click', async () => {
        const numberInput = <HTMLInputElement>document.querySelector('#number-input')

        // Make sure that the right animation duration is used
        setAnimationToggle()

        if (numberInput?.value) {
            const numbers = numberInput.value.split(',').map(Number);
            await numbers.reduce(async (previousPromise, num) => {
                await previousPromise;
                return algoVisualizer.undoableInsert(num);
            }, Promise.resolve());
        }
        updateTimelineInput()
    });

    const playButton = document.querySelector('#play-button')
    playButton?.addEventListener('click', () => {
        const currentlyAnimationTimeline = algoVisualizer.currentAnimation
        if (currentlyAnimationTimeline) {
            currentlyAnimationTimeline.play()
        } else {
            console.log('no animation to play')
        }
    })

    const backButton = document.querySelector('#back-button')
    backButton?.addEventListener('click', () => {
        console.debug("pressed back button")
        algoVisualizer.algoStepHistory.stepBackwards()
    })

    const forwardButton = document.querySelector('#forward-button')
    forwardButton?.addEventListener('click', () => {
        console.debug("pressed forward button")
        algoVisualizer.algoStepHistory.stepForwards()
    })

    const timelineInput = <HTMLInputElement>document.querySelector('#timeline-input')
    timelineInput?.addEventListener('input', () => {
        console.debug('input event fired')
        const currentlyAnimationTimeline = algoVisualizer.currentAnimation
        if (currentlyAnimationTimeline) {
            currentlyAnimationTimeline.seek(timelineInput.valueAsNumber * currentlyAnimationTimeline.duration)
            console.debug(timelineInput.valueAsNumber * currentlyAnimationTimeline.duration)
        }
    })

    //when animejs 4.0 comes out this will be possible
    /*     const speedInput = <HTMLInputElement>document.querySelector('#speed-input')
        speedInput?.addEventListener('input', () => {
            console.debug('speed input event fired')
            const currentlyAnimationTimeline = algoVisualizer.getCurrentAnimation()
            if (currentlyAnimationTimeline) {
                currentlyAnimationTimeline.duration = speedInput.valueAsNumber * 2000
            }
        }) 
    */

    animationToggle?.addEventListener('input', setAnimationToggle)


    /**
     * Manipulates the range input dom element for controlling animations so
     * that the current animejs animation can be controlled correctly. Should be
     * called every time that the currentAnimation global is reassigned.
     * 
     * @returns 1 if successful and 0 if not
     */
    const updateTimelineInput = () => {
        console.debug('update timeline input')

        // TODO find solution for the fact that the children attribute is not
        // apart of the type.
        //timelineInput?.setAttribute('max', String(currentAnimation?.children.length))
        return 1
    }
}