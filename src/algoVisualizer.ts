//TODO implement all animations of find and insert
//TODO implement undoable versions of find and insert
import { bPlusTreeNode } from "./types/bPlusTree"
import { AlgoStepHistory, AlgoStep } from "./algoStepHistory"
import "animejs"
import anime from "animejs"
import { tree, hierarchy } from "d3-hierarchy"
import { select } from "d3-selection"
export const SVG_NS = "http://www.w3.org/2000/svg"

// DESIGN NOTES TODO consider removing //
/**
 * ----------------
 * DOM manipulation
 * ----------------
 * When the dom is manipulated and then that DOM is animated it is essential
 * that all DOM elements that were apart of that animation remain in the DOM. This
 * is because if a DOM element is removed it will break the saved animation that
 * require that DOM element. 
 */

/**
 * 
 * This class implements a B+tree algorithm (as described in the Database System
 * Concepts 7th edition) and generates functions that can animate that
 * algorithm. By using this class a web UI can animate a B+tree. Each instance of
 * this class corresponds to a rendered B+tree algorithm.   
 * 
 * @dependency For this class to function correctly there must be a blank svg element with
 * the id "main-svg", a blank div with the id "sudo-code", and three template
 * elements with a specific structure in the dom. These elements are defined in index.html.
 */
export class AlgoVisualizer {
    /* number of pointers in a node */
    private readonly n: number
    /** null when tree is empty */
    private bPlusTreeRoot: bPlusTreeNode | null = null
    private readonly algoStepHistory = new AlgoStepHistory()
    private readonly sudoCodeContainer = document.querySelector("#sudo-code")
    /** this is initialized using the color config defined in the :root pseudo
     * class rule of the style.css file*/
    private readonly highlightColor: string
    private readonly keyRectWidth = 42
    private readonly nodeHeight = 29
    private readonly pointerRectWidth = 14
    private readonly nodeWidth: number
    /* in milliseconds */
    readonly animationDuration = 1000
    //array to store the durations of animations
    readonly animations: anime.AnimeTimelineInstance[] = []
    private currentAnimationIndex = 0
    /** used to get the x y coords of the trees nodes on the canvas */
    private readonly d3TreeLayout = tree<bPlusTreeNode>()

    /**
     * 
     * @param nodeSize Determines how many pointers are contained
     * in each node of the B+tree.
     */
    constructor(nodeSize: number) {
        this.n = nodeSize

        this.nodeWidth = (this.keyRectWidth + this.pointerRectWidth) * this.n + this.pointerRectWidth

        this.d3TreeLayout.nodeSize([this.nodeWidth, this.nodeHeight])

        const rootElement = document.querySelector("html")
        if (rootElement) {
            this.highlightColor = getComputedStyle(rootElement).getPropertyValue("--highlighted-text")
        } else {
            console.warn("Text highlight color could not be accessed defaulting to #ffed99")
            this.highlightColor = "#ffed99"
        }
    }

    /**
     * 
     * Find a numeric key in the B+Tree. Assumes that there are no duplicates.
     * 
     * @param keyToFind A number to locate in the B+Tree.
     * 
     * @returns An object that contains a found boolean flag which indicates if
     * the key was found. The bPlusTreeNode that should contain the key if it
     * exists in the tree. The index of the key if it has been found.    
     * 
     */
    find(keyToFind: number): { found: boolean, node: bPlusTreeNode, index?: number } {
        let currentNode = this.bPlusTreeRoot
        while (currentNode && !currentNode.isLeaf) {
            const smallestValidNum = Math.min(...currentNode.keys.filter((element) => { return keyToFind <= element }));
            const smallestValidNumIndex = currentNode.keys.findIndex((element) => { smallestValidNum == element })
            if (smallestValidNum == Infinity) {
                for (let i = currentNode.pointers.length - 1; i >= 0; i--) {
                    if (currentNode.pointers[i]) {
                        currentNode = currentNode.pointers[i]
                        break;
                    }
                }
            } else if (keyToFind == smallestValidNum) {
                currentNode = currentNode.pointers[smallestValidNumIndex + 1]
            } else {
                // keyToFind < smallestValidNum
                currentNode = currentNode.pointers[smallestValidNumIndex]
            }
        }
        if (currentNode.keys && currentNode.keys.includes(keyToFind)) {
            return { found: true, node: currentNode, index: currentNode.keys.indexOf(keyToFind) }
        } else {
            return { found: false, node: currentNode }
        }
    }

    /**
     *
     * Insert a number into the B+Tree if it is not already in the tree. And
     * generate an animation for that insertion.
     * 
     * @param value a number to insert into the B+Tree.
     * @param autoplay determines weather or not the animation plays when
     * function is called.
     *
     * @returns the algoVis instance
     * @sideEffects Manipulates the DOM by adding svg elements and sudo code for animation
     */
    insert(value: number, autoplay: boolean = true): AlgoVisualizer {
        // Initialize animation
        const timeline = anime.timeline({
            duration: 0.1,
            endDelay: this.animationDuration - 0.1,
            autoplay: autoplay,
            easing: 'linear'
        });

        const insertSudoCode = document.querySelector("#insert-sudo-code")
        if (this.sudoCodeContainer?.innerHTML && insertSudoCode?.innerHTML) {
            this.sudoCodeContainer.innerHTML = insertSudoCode?.innerHTML
        }

        let targetNode: bPlusTreeNode | null = null
        if (this.bPlusTreeRoot == null) {
            targetNode = new bPlusTreeNode(true)
            this.bPlusTreeRoot = targetNode

            const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(targetNode, (node) => { return node.pointers }))
            const nodeSelection = select("#main-svg")
                .selectAll("g.node")
                .data(rootHierarchyNode, (d) => (d as typeof rootHierarchyNode).data.id)
            const newSVGGElement = this.createNodeSvgElement(nodeSelection.enter())

            this.addHighlightTextAnimation(timeline, 2)
            // create animation that reveals new node
            timeline.add({
                targets: newSVGGElement,
                opacity: 1
            }, "-=" + String(this.animationDuration))
        } else {
            const { found, node } = this.find(value)

            this.addHighlightTextAnimation(timeline, 3)
            if (found) {
                // Do not allow duplicates
                //this.animations.push(timeline)
                return this
            } else {
                targetNode = node
            }
        }

        this.addHighlightTextAnimation(timeline, 4)

        if (targetNode == null || targetNode.keys.filter(element => typeof element == "number").length < (this.n - 1)) {

            this.addHighlightTextAnimation(timeline, 5)

            this.insertInLeaf(targetNode, value, timeline)
        } else { //targetNode has n - 1 key values already, split it
            const newNode = new bPlusTreeNode(true)
            const tempNode = new bPlusTreeNode(true, targetNode.pointers.slice(0, this.n - 2), targetNode.keys.slice(0, this.n - 2))
            this.insertInLeaf(tempNode, value, timeline)

            const targetNodeOriginalLastNode = targetNode.pointers[this.n - 1]

            targetNode.pointers = tempNode.pointers.slice(0, Math.ceil(this.n / 2) - 1)
            targetNode.pointers[this.n - 1] = newNode
            targetNode.keys = tempNode.keys.slice(0, Math.ceil(this.n / 2) - 1)

            newNode.pointers = tempNode.pointers.slice(Math.ceil(this.n / 2), this.n - 1)
            newNode.pointers[this.n - 1] = targetNodeOriginalLastNode
            newNode.keys = tempNode.keys.slice(Math.ceil(this.n / 2), this.n - 1)

            this.insertInParent(targetNode, newNode.keys[0], newNode)
        }

        this.animations.push(timeline)
        return this
    }

    /**
     * A sub procedure for the insert method
     *
     * @param targetNode The node to insert they key value into
     * @param value The key value to insert
     * @param returnTimeline The animejs timeline object that is generated and
     * returned by the insert method
     * @returns anime.js Animation object if successful and null otherwise
     * @sideEffects adds animations to the returnTimeline object
     */
    private insertInLeaf(targetNode: bPlusTreeNode, value: number, returnTimeline: anime.AnimeTimelineInstance) {
        if (value < targetNode.keys[0] || targetNode.keys.length == 0) {
            // shift all values in keys to the right one spot.
            for (let i = (targetNode.keys.length - 1); i >= 0; i--) {
                if (targetNode.keys[i]) {
                    targetNode.keys[i + 1] = targetNode.keys[i]
                }
            }
            targetNode.keys[0] = value

            const textSelection = select("#node-id-" + String(targetNode.id))
                .selectAll("text")
                .data(targetNode.keys)
            const textElementSelection = this.createNewNodeText(textSelection.enter().append("text"), true)

            returnTimeline.add({
                targets: textElementSelection.nodes(),
                opacity: 1
            }, "-=" + String(this.animationDuration))
        } else {
            // insert value into targetNode.keys just after the 
            // highest number that is less than or equal to value.
            const highestNumberIndex = targetNode.keys.findIndex(element => element >= value) - 1
            // if find Index returns -1 then the last number in keys must be the
            // greatest number that is less than or equal to value.
            if (highestNumberIndex < 0) {
                targetNode.keys.push(value)
            } else {
                targetNode.keys[highestNumberIndex] = value
            }

            //TODO put this code in a reusable method of some form.
            const textSelection = select("#node-id-" + String(targetNode.id))
                .selectAll("text")
                .data(targetNode.keys)
            const textElementSelection = this.createNewNodeText(textSelection.enter().append("text"), true)

            returnTimeline.add({
                targets: textElementSelection.nodes(),
                opacity: 1
            }, "-=" + String(this.animationDuration))
        }
        return 1
    }

    /**
     * 
     * A subsidiary procedure for the insert method
     * @param leftNode A bPlusTreeNode to be placed to the left of the key value
     * @param value The key value to insert into parent node
     * @param rightNode A bPlusTreeNode to be placed to the right of the key value
     * @returns 1 if successful and 0 otherwise
     */
    private insertInParent(leftNode: bPlusTreeNode, value: number, rightNode: bPlusTreeNode) {
        if (leftNode.parent == null) {
            this.bPlusTreeRoot = new bPlusTreeNode(false)
            this.bPlusTreeRoot.isLeaf = false
            this.bPlusTreeRoot.pointers = [leftNode, rightNode]
            this.bPlusTreeRoot.keys = [value]

            leftNode.parent = this.bPlusTreeRoot
            rightNode.parent = this.bPlusTreeRoot

            return 1
        }

        const parentNode = leftNode.parent
        const leftNodeIndex = parentNode.pointers.findIndex(element => element === leftNode)
        if (parentNode.pointers.filter(element => element).length < this.n) {
            parentNode.pointers.splice(leftNodeIndex + 1, 0, rightNode)
            parentNode.keys.splice(leftNodeIndex + 1, 0, value)
        } else { // split
            const tempKeys = parentNode.keys.slice()
            const tempPointers = parentNode.pointers.slice()

            tempPointers.splice(leftNodeIndex + 1, 0, rightNode)
            tempKeys.splice(leftNodeIndex + 1, 0, value)

            parentNode.keys = []
            parentNode.pointers = []

            const newNode = new bPlusTreeNode(false)

            parentNode.pointers = tempPointers.slice(0, Math.ceil(((this.n + 1) / 2) - 1))
            parentNode.keys = tempKeys.slice(0, Math.ceil(((this.n + 1) / 2) - 2))

            const middleKey = tempKeys[Math.ceil(((this.n + 1) / 2) - 1)]

            newNode.pointers = tempPointers.slice(Math.ceil(((this.n + 1) / 2)), this.n)
            newNode.keys = tempKeys.slice(Math.ceil(((this.n + 1) / 2)), this.n - 1)

            this.insertInParent(parentNode, middleKey, newNode)
        }
        return 1
    }



    // Undoable Methods Section //
    /**
     * 
     * Inserts a value into the BPlus Tree and animates it. Also allows for the
     * redoing undoing of that insert. Making sure that state is remembered for
     * proper restoring.
     * 
     * @param value the number to insert, duplicates can't be added to the tree.
     *   
     * @sideEffect adds and AlgoStep object corresponding to this insert to this.algoStepHistory
     * @sideEffect executes this.insert method, please refer to that methods
     * side effects
     */
    public undoableInsert(value: number) {

        const currentBPlusTreeRoot = this.bPlusTreeRoot
        /**
         * Undoes the operations of the corresponding insert method call, which
         * is defined in the insertDo function definition. All state including
         * the DOM should be returned to exactly how it was.
         * 
         * @returns indicates success or failure
         */
        const insertUndo = () => {
            return true
        }

        /**
         * Executes an insert that can be undone later so that all sate
         * including the DOM is returned to its sate from before the method call.
         * 
         * @returns indicates success or failure
         */
        const insertDo = () => {
            //TODO consider moving insert method to here
            this.insert(value, true)
            return true
        }

        const insertAlgoStep: AlgoStep = {
            do: insertDo,
            undo: insertUndo
        }
        this.algoStepHistory.addAlgoStep(insertAlgoStep)
        
        insertDo()

        return
    }



    // Animation Interface Section //
    //TODO Do design work on how these function will utilize the above functions.
    /**
     * Starts the animation from current time (in milliseconds).
     */
    public play() {
        let result = this.animations[0].finished
        for (let i = 1; i < this.animations.length; i++) {
            result = result.then(() => {
                console.debug("playing next animation")
                this.animations[i].play()
            })

        }
        result.catch((reason) => console.error(reason))
        this.animations[0].play()
    }


    /**
     * Pauses the animation at current time (in milliseconds).
     */
    public pause() {
        return null
    }


    //TODO consider getting rid of this
    /**
     * Jump to specific time (in milliseconds)
     *
     * @param time The time to jump to in milliseconds
     * @return this algoVisualizer instance
     */
    public seek(time: number) {
        return this
    }



    // Helper Methods Section //
    /**
     * creates a new set of text dom elements for a B+ Tree node
     * 
     * @param newTextSelection A selection of text dom elements that correspond
     * to a B+ Tree keys array.
     * @param isTransparent toggles wether or not text element is transparent
     * initially. This exists so that text reveal can be animated.
     * @return textElementSelection the selection of newly created text elements
     */
    private createNewNodeText(newTextSelection: d3.Selection<SVGTextElement, number, d3.BaseType, unknown>, isTransparent = false): d3.Selection<SVGTextElement, number, d3.BaseType, unknown> {
        let textElementSelection = newTextSelection.attr("class", "node-key-text")
            // Calculate the x coordinate of the text based on its index in the
            // key array.
            .attr("x", (_, i) => { return this.pointerRectWidth + (this.keyRectWidth / 2) + i * (this.keyRectWidth + this.pointerRectWidth) })
            .attr("y", this.nodeHeight / 2)
            .html(d => { return d ? String(d) : "" })

        if (isTransparent) {
            textElementSelection = textElementSelection.attr("opacity", 0)
        }

        return textElementSelection
    }


    /**
     * 
     * Creates a HTML element that represents one bplus tree node. This method
     * exists to keep all styling of bplus tree nodes in one spot. The origin of
     * the node is at its top left corner. All nodes are made invisible when created
     * so that they can later be revealed in an animation.
     * @dependency this.n The size of a bplus tree node
     * @param nodeEnterSelection A selection containing newly added BPlus tree nodes.
     * @return SVGGElement The first SVGGElement that was created or null if no
     * element was created.
     */
    private createNodeSvgElement(nodeEnterSelection: d3.Selection<d3.EnterElement, d3.HierarchyPointNode<bPlusTreeNode>, d3.BaseType, unknown>): SVGGElement | null {
        const newGElementSelection = nodeEnterSelection.append("g")
            .attr("class", "node")
            .attr("id", d => { return "node-id-" + String(d.data.id) })
            .attr("transform-origin", "center")
            .attr("transform", d => { return "translate(" + String(d.x - this.nodeWidth / 2) + "," + String(d.y) + ")" })
            .attr("opacity", 0)

        for (let i = 0; i < this.n; i++) {
            const currentXCordOrigin = i * (this.pointerRectWidth + this.keyRectWidth)
            newGElementSelection.append('rect')
                .attr("class", "node-rect")
                .attr("width", this.pointerRectWidth)
                .attr("height", this.nodeHeight)
                .attr("x", currentXCordOrigin)
                .attr("y", 0)
            newGElementSelection.append('rect')
                .attr("class", "node-rect")
                .attr("width", this.keyRectWidth)
                .attr("height", this.nodeHeight)
                .attr("x", currentXCordOrigin + this.pointerRectWidth)
                .attr("y", 0)
        }
        newGElementSelection.append('rect')
            .attr("class", "node-rect")
            .attr("width", this.pointerRectWidth)
            .attr("height", this.nodeHeight)
            .attr("x", this.n * (this.pointerRectWidth + this.keyRectWidth))
            .attr("y", 0)

        const textEnterSelection = newGElementSelection.selectAll("text.node-key-text")
            .data((d) => d.data.keys).enter()

        this.createNewNodeText(textEnterSelection.append("text"))

        return newGElementSelection.node()
    }


    private addHighlightTextAnimation(timeline: anime.AnimeTimelineInstance, lineNumber: number) {
        timeline.add({
            targets: '#insert-line' + String(lineNumber),
            backgroundColor: this.highlightColor,
            complete: (anim) => {
                anime.set(anim.animatables.map(a => a.target), { backgroundColor: "transparent" })
            }
        })
    }
}