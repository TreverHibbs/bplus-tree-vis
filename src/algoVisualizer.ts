//TODO implement all animations of find and insert
//TODO implement undoable versions of find and insert
import { bPlusTreeNode } from "./types/bPlusTree"
import { AlgoStepHistory, AlgoStep } from "./algoStepHistory"
import "animejs"
import anime from "animejs"
import { tree, hierarchy } from "d3-hierarchy"
import { select } from "d3-selection"
export const SVG_NS = "http://www.w3.org/2000/svg"

// DESIGN NOTES TODO consider removing
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
    private readonly sudoCodeContainer = document.querySelector("#sudo-code")
    /* When the Bplus tree is empty it contains a bplus tree node with an empty
    keys array */
    private bPlusTreeRoot: bPlusTreeNode = new bPlusTreeNode(true)
    /** this is initialized using the color config defined in the :root pseudo
     * class rule of the style.css file*/
    private readonly highlightColor: string
    private readonly sudoCodeBackgroundColor: string
    private readonly keyRectWidth = 42
    private readonly nodeHeight = 29
    private readonly pointerRectWidth = 14
    private readonly nodeWidth: number
    /* in milliseconds */
    public animationDuration = 1000 //must not be any less than 0.2
    //TODO replace this with current animation
    //array to store the durations of animations
    private readonly animations: anime.AnimeTimelineInstance[] = []
    /** used to get the x y coords of the trees nodes on the canvas */
    private readonly d3TreeLayout = tree<bPlusTreeNode>()
    // used to store d3 selections that will be removed at the start of a new animation.

    private exitSelections: d3.Selection<SVGTextElement, unknown,
        SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>>[] = []

    //TODO pass the do and undo methods to the user of this class
    /**
     * allows control of the algorithm visualization. By calling the do and undo
     * methods of this object a user of this class can navigate the algorithm
     * visualization. Users of this class should not call the addAlgoStep method
     * of this object.
     */
    public readonly algoStepHistory = new AlgoStepHistory()
    // TODO pass the seek animation method of the current timeline object to the
    // user of this class. As well as the play and pause methods


    /**
     * 
     * @param nodeSize Determines how many pointers are contained
     * in each node of the B+tree.
     */
    constructor(nodeSize: number) {
        this.n = nodeSize

        this.nodeWidth = (this.keyRectWidth + this.pointerRectWidth) * (this.n - 1) + this.pointerRectWidth

        this.d3TreeLayout.nodeSize([this.nodeWidth, this.nodeHeight])

        const rootElement = document.querySelector("html")
        if (rootElement) {
            this.highlightColor = getComputedStyle(rootElement).getPropertyValue("--highlighted-text")
            this.sudoCodeBackgroundColor = getComputedStyle(rootElement).getPropertyValue("--light-blue")
        } else {
            console.warn("Text highlight color could not be accessed defaulting to #ffed99")
            this.highlightColor = "#ffed99"
            console.warn("Text highlight color could not be accessed defaulting to #c7ebfc")
            this.sudoCodeBackgroundColor = "#c7ebfc"
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
    private insert(value: number, autoplay = true): AlgoVisualizer {
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

        let targetNode: bPlusTreeNode
        if (this.bPlusTreeRoot.keys.length == 0) {
            //targetNode = new bPlusTreeNode(true)
            targetNode = this.bPlusTreeRoot

            // create a new svg element for the root node for animation
            const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(targetNode, (node) => { return node.pointers }))
            const nodeSelection = select("#main-svg")
                .selectAll("g.node")
                .data(rootHierarchyNode, (d) => (d as typeof rootHierarchyNode).data.id)
            const newSVGGElement = this.createNodeSvgElements(nodeSelection.enter())

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
            //insert in leaf
            this.addHighlightTextAnimation(timeline, 5)

            this.insertInLeaf(targetNode, value, timeline)
        } else { //leaf node targetNode has n - 1 key values already, split it
            const newNode = new bPlusTreeNode(true)
            const tempNode = new bPlusTreeNode(true)
            tempNode.pointers = targetNode.pointers.slice(0, this.n - 1)
            tempNode.keys = targetNode.keys.slice(0, this.n - 1)
            this.insertInLeaf(tempNode, value, timeline)

            const targetNodeOriginalLastNode = targetNode.pointers[this.n - 1]

            targetNode.pointers = tempNode.pointers.slice(0, Math.ceil(this.n / 2))
            //targetNode.pointers[this.n - 1] = newNode
            targetNode.keys = tempNode.keys.slice(0, Math.ceil(this.n / 2))

            newNode.pointers = tempNode.pointers.slice(Math.ceil(this.n / 2), this.n)
            if (targetNodeOriginalLastNode) {
                newNode.pointers[this.n - 1] = targetNodeOriginalLastNode
            }
            newNode.keys = tempNode.keys.slice(Math.ceil(this.n / 2), this.n)

            this.insertInParent(targetNode, newNode.keys[0], newNode)


            // create svg elements for the new bplus tree nodes created by the
            // split.
            const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(this.bPlusTreeRoot, (node) => {
                if (node.isLeaf) {
                    return []
                } else {
                    return node.pointers
                }
            }))
            //render root rootHierarchyNode with d3
            const nodeSelection = select("#main-svg")
                .selectAll<SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>>("g.node")
                .data(rootHierarchyNode, (d) => (d).data.id)
            const newSVGGElements = this.createNodeSvgElements(nodeSelection.enter())

            // reveal newSVGGElement
            timeline.add({
                targets: newSVGGElements,
                opacity: 1
            }, "-=" + String(this.animationDuration))

            const updatedSVGGElements = nodeSelection.nodes()
            const updatedNodesData = nodeSelection.data()

            const textExitSelection = nodeSelection.selectAll<SVGTextElement, number>("text.node-key-text")
                .data((d) => d.data.keys).exit()
            this.exitSelections.push(textExitSelection)
            timeline.add({
                targets: textExitSelection.nodes(),
                opacity: 0
            }, "-=" + String(this.animationDuration))

            //move update nodes
            timeline.add({
                targets: updatedSVGGElements,
                transform: (_: SVGGElement, i: number) => {
                    return "translate(" + String(updatedNodesData[i].x - this.nodeWidth / 2) + "," + String(updatedNodesData[i].y) + ")"
                }
            }, "-=" + String(this.animationDuration))
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
     * @sideEffect any currently animating algorithm step will be interrupted
     * and a new one corresponding to this method will begin.
     */
    public undoableInsert(value: number) {
        const currentBPlusTreeRoot = structuredClone(this.bPlusTreeRoot)

        //create a function that deep copies this.bPlusTreeRoot


        //TODO implement this for the current functionality of the insertDo function
        /**
         * Undoes the operations of the corresponding insert method call, which
         * is defined in the insertDo function definition. All state including
         * the DOM should be returned to exactly how it was.
         * 
         * @returns indicates success or failure
         */
        const insertUndo = () => {
            //TODO write the case for when the currentBPlusTreeRoot is null
            const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(currentBPlusTreeRoot, (node) => {
                if (node.isLeaf) {
                    return []
                } else {
                    return node.pointers
                }
            }))

            const nodeSelection = select("#main-svg")
                .selectAll<SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>>("g.node")

            nodeSelection.data(rootHierarchyNode, (d) => (d).data.id)

            nodeSelection.exit().remove()
            this.createNodeSvgElements(nodeSelection.enter(), false)
            nodeSelection.filter((d) => d.data.keys.length === 0).remove() //remove the root node if it is empty.
            nodeSelection.attr("transform", (d) => "translate(" + String(d.x) + "," + String(d.y) + ")")
            this.bPlusTreeRoot = currentBPlusTreeRoot

            return true
        }

        /**
         * Executes an insert that can be undone later so that all sate
         * including the DOM is returned to its sate from before the method call.
         * 
         * @returns indicates success or failure
         * @sideEffect all exit selections stored in this.exitSelection will
         * be removed from the DOM.
         */
        const insertDo = () => {
            //remove all selection in this.exitSelections
            this.exitSelections.forEach(selection => {
                selection.remove()
            })
            this.insert(value)

            return true
        }

        const insertAlgoStep: AlgoStep = {
            do: insertDo,
            undo: insertUndo
        }

        // Must execute the do method before it is added, because addAlgoStep
        // assumes that that algo step was the last algo step executed.
        insertAlgoStep.do()
        this.algoStepHistory.addAlgoStep(insertAlgoStep)

        return

    }


    /**
     * return the currently animating animation timeline object.
     *
     * @returns anime.AnimeTimelineInstance A animejs timeline instance that can
     * be used to control the current animation. Or undefined if there is no current
     * animation.
     */
    public getCurrentAnimation(): anime.AnimeTimelineInstance | undefined {
        return this.animations[this.animations.length - 1]
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
     * the node is at its top left corner. By default all nodes are made invisible when created
     * so that they can later be revealed in an animation.
     * @param nodeEnterSelection A selection containing newly added BPlus tree nodes.
     * @param boolean Toggles wether or not the node is transparent. Defaults to true.
     *
     * @dependency this.n The size of a bplus tree node
     * @return SVGGElement[] The SVGGElements that were created
     */
    private createNodeSvgElements(nodeEnterSelection: d3.Selection<d3.EnterElement, d3.HierarchyPointNode<bPlusTreeNode>, d3.BaseType, unknown>, isTransparent = true): SVGGElement[] {
        let transparencyValue = 0
        if (isTransparent == false) {
            transparencyValue = 1
        }

        const newGElementsSelection = nodeEnterSelection.append("g")
            .attr("class", "node")
            .attr("id", d => { return "node-id-" + String(d.data.id) })
            .attr("transform-origin", "center")
            .attr("transform", d => { return "translate(" + String(d.x - this.nodeWidth / 2) + "," + String(d.y) + ")" })
            .attr("opacity", transparencyValue)

        for (let i = 0; i < (this.n - 1); i++) {
            const currentXCordOrigin = i * (this.pointerRectWidth + this.keyRectWidth)
            newGElementsSelection.append('rect')
                .attr("class", "node-rect")
                .attr("width", this.pointerRectWidth)
                .attr("height", this.nodeHeight)
                .attr("x", currentXCordOrigin)
                .attr("y", 0)
            newGElementsSelection.append('rect')
                .attr("class", "node-rect")
                .attr("width", this.keyRectWidth)
                .attr("height", this.nodeHeight)
                .attr("x", currentXCordOrigin + this.pointerRectWidth)
                .attr("y", 0)
        }
        newGElementsSelection.append('rect')
            .attr("class", "node-rect")
            .attr("width", this.pointerRectWidth)
            .attr("height", this.nodeHeight)
            .attr("x", (this.n - 1) * (this.pointerRectWidth + this.keyRectWidth))
            .attr("y", 0)

        const textEnterSelection = newGElementsSelection.selectAll("text.node-key-text")
            .data((d) => d.data.keys).enter()

        this.createNewNodeText(textEnterSelection.append("text"))

        return newGElementsSelection.nodes()
    }


    private addHighlightTextAnimation(timeline: anime.AnimeTimelineInstance, lineNumber: number) {
        timeline.add({
            targets: '#insert-line' + String(lineNumber),
            backgroundColor: this.highlightColor,
            //complete: (anim) => {
            //    anime.set(anim.animatables.map(a => a.target), { backgroundColor: "transparent" })
            //}
        })

        timeline.add({
            targets: '#insert-line' + String(lineNumber),
            backgroundColor: this.sudoCodeBackgroundColor,
            endDelay: 0,
        })
    }
}