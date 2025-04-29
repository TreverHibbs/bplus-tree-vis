import { AlgoVisualizer } from './algoVisualizer'
import { Timeline, utils } from "animejs"

//TODO disable input when animation is playing
/**
 *
 * Implements the functionality of buttons and sliders for interaction with a
 * b+ tree visualization.
 * @dependency For this class to function there must be a specific html
 * structure in the dom. This structure is defined in index.html.
 */
export const userInterface = () => {
    // ** global constants section ** //
    const algoVisualizer = new AlgoVisualizer(4)
    const speedControlCheckboxes: NodeListOf<HTMLInputElement> = document.
        querySelectorAll('input[type="checkbox"][name="speed"]');
    // ** end global constants section ** // 
    // ** begin global variables section ** //
    let currentAnimation: Timeline | null = null
    // for animation, 1 is normal speed, 2 is double speed ex.
    let speedModifier = 1
    // ** end global variables section ** //

    const insertButton = document.querySelector('#insert-button');
    insertButton?.addEventListener('click', async () => {
        const numberInput = <HTMLInputElement>document.querySelector('#number-input')
        if (numberInput?.value) {
            const numbers = numberInput.value.split(',').map(Number);
            await numbers.reduce(async (previousPromise, num) => {
                await previousPromise;
                //TODO we need a delay between the completion of the last animation
                //ad the initialization and playing of the next animation, in order to
                //avoid the next animation beginning in it's completed state. I don't 
                //know why this is. Figure it out in the future.
                //temporarily make this 10ms for testing. 1000ms seems to be what is needed to avoid
                //artifacts
                await new Promise(resolve => setTimeout(resolve, 10));
                currentAnimation = algoVisualizer.undoableInsert(num);
                if (currentAnimation === null) return
                currentAnimation.speed = speedModifier
                currentAnimation.play()
                return currentAnimation.then()
            }, Promise.resolve());
        }
        updateTimelineInput()
    });

    const deleteButton = document.querySelector('#delete-button');
    deleteButton?.addEventListener('click', async () => {
        const numberInput = <HTMLInputElement>document.querySelector('#number-input')
        if (numberInput?.value) {
            const numbers = numberInput.value.split(',').map(Number);
            await numbers.reduce(async (previousPromise, num) => {
                await previousPromise;
                const currentAnimation = algoVisualizer.undoableDelete(num);
                if (currentAnimation === null) return
                await currentAnimation.then(() => true)
                await new Promise(resolve => setTimeout(resolve, 10)); // Wait for 10 milliseconds
            }, Promise.resolve());
        }
        updateTimelineInput()
    });

    const playButton = document.querySelector('#play-button')
    playButton?.addEventListener('click', () => {
        if (currentAnimation) {
            currentAnimation.play()
        } else {
            console.log('no animation to play')
        }
    })

    const backButton = document.querySelector('#back-button')
    backButton?.addEventListener('click', () => {
        const stepBackReturn = algoVisualizer.algoStepHistory.stepBackwards()
        if (stepBackReturn === null) return
        currentAnimation = stepBackReturn
        //@ts-ignore
        currentAnimation.stretch(currentAnimation.duration / speedModifier)
        currentAnimation.progress = 1
    })

    const forwardButton = document.querySelector('#forward-button')
    forwardButton?.addEventListener('click', () => {
        const stepForwardReturn = algoVisualizer.algoStepHistory.stepForwards()
        if (stepForwardReturn === null) return
        currentAnimation = stepForwardReturn
        //@ts-ignore
        currentAnimation.stretch(currentAnimation.duration / speedModifier)
        currentAnimation.play()
    })

    const timelineInput = <HTMLInputElement>document.querySelector('#timeline-input')
    timelineInput?.addEventListener('input', () => {
        // console.debug('input event fired')
        if (currentAnimation) {
            //@ts-ignore
            currentAnimation.seek(timelineInput.valueAsNumber * currentAnimation.duration)
        }
    })

    speedControlCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener('mousedown', function(this: HTMLInputElement) {
            if (this.checked == false) {
                // Make the checkboxes mutually exclusive
                speedControlCheckboxes.forEach((checkbox) => {
                    checkbox.checked = false;
                })
                speedModifier = Number(this.value)
            } else {
                speedModifier = 1
            }
            utils.sync(() => {
                if (currentAnimation === null) return
                currentAnimation.speed = speedModifier
            })
        })
    })

    /**
     *
     * Manipulates the range input dom element for controlling animations so
     * that the current animejs animation can be controlled correctly. Should be
     * called every time that the currentAnimation global is reassigned.
     * @returns 1 if successful and 0 if not
     */
    const updateTimelineInput = () => {
        console.debug('update timeline input')

        // TODO find solution for the fact that the children attribute is not
        // apart of the type.
        //timelineInput?.setAttribute('max', String(currentAnimation?.children.length))
        return 1
    }

    let svg = document.querySelector('svg'); // select the SVG element
    if (svg == null) throw new Error('svg element not found')
    svg.addEventListener('click', function(event) {
        //@ts-ignore
        let point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;

        //@ts-ignore
        const getScreenCTM = svg.getScreenCTM();
        if (getScreenCTM === null) throw new Error('getScreenCTM returned null')
        let svgPoint = point.matrixTransform(getScreenCTM.inverse());

        console.log(`x: ${svgPoint.x}, y: ${svgPoint.y}`);
    });
}
