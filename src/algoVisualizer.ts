//TODO implement all animations of find and insert
//TODO implement undoable versions of find and insert
import { bPlusTreeNode } from "./types/bPlusTree"
import { AlgoStep, AlgoStepHistory } from "./stepHistory"
import "animejs"
import anime, { AnimeTimelineInstance } from "animejs"
import { tree, hierarchy } from "d3-hierarchy"
import { select } from "d3-selection"
import { transform } from "typescript"
import { HierarchyPointNode, text } from "d3"
export const SVG_NS = "http://www.w3.org/2000/svg"

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
    private readonly svgCanvas = document.querySelector('#main-svg')
    /** this is initialized using the color config defined in the :root pseudo
     * class rule of the style.css file*/
    private readonly HIGHLIGHTCOLOR: string
    private readonly keyRectWidth = 42
    private readonly nodeHeight = 29
    private readonly pointerRectWidth = 14
    private readonly nodeWidth: number
    /* in milliseconds */
    readonly animationDuration = 1000
    //array to store the durations of animations
    readonly animations: anime.AnimeTimelineInstance[] = []
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
            this.HIGHLIGHTCOLOR = getComputedStyle(rootElement).getPropertyValue("--highlighted-text")
        } else {
            console.warn("Text highlight color could not be accessed defaulting to #ffed99")
            this.HIGHLIGHTCOLOR = "#ffed99"
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
     * @param value A number to insert into the B+Tree.
     *
     * @returns the algoVis instance
     */
    insert(value: number): AlgoVisualizer {
        // Initialize animation
        const timeline = anime.timeline({
            duration: 0.1,
            endDelay: this.animationDuration - 0.1,
            autoplay: false,
            easing: 'linear'
        });

        const insertSudoCode = document.querySelector("#insert-sudo-code")
        if (this.sudoCodeContainer?.innerHTML && insertSudoCode?.innerHTML) {
            this.sudoCodeContainer.innerHTML = insertSudoCode?.innerHTML
        }

        let targetNode: bPlusTreeNode | null = null
        if (this.bPlusTreeRoot == null || this.bPlusTreeRoot.keys.length == 0) {
            targetNode = this.bPlusTreeRoot
            targetNode = new bPlusTreeNode(true)


            const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(targetNode, (node) => { return node.pointers }))
            const nodeSelection = select("#main-svg")
                .selectAll("g.node")
                .data(rootHierarchyNode, (d) => (d as typeof rootHierarchyNode).data.id)
            const newSVGGElement = this.createNodeSvgElement(nodeSelection.enter())


            timeline.add({
                targets: '#insert-line2',
                backgroundColor: this.HIGHLIGHTCOLOR,
                complete: (anim) => {
                    anime.set(anim.animatables.map(a => a.target), { backgroundColor: "transparent" })
                }
            })
            // create animation that reveals new node
            timeline.add({
                targets: newSVGGElement,
                opacity: 1
            }, "-=" + String(this.animationDuration))
        } else {
            const { found, node } = this.find(value)
            if (found) {
                // Do not allow duplicates
                this.animations.push(timeline)
                return this
            } else {
                targetNode = node
            }
        }

        timeline.add({
            targets: '#insert-line4',
            backgroundColor: this.HIGHLIGHTCOLOR,
            complete: (anim) => {
                anime.set(anim.animatables.map(a => a.target), { backgroundColor: "transparent" })
            }
        })

        if (targetNode == null || targetNode.keys.filter(element => typeof element == "number").length < (this.n - 1)) {

            timeline.add({
                targets: '#insert-line5',
                backgroundColor: this.HIGHLIGHTCOLOR,
                complete: (anim) => {
                    anime.set(anim.animatables.map(a => a.target), { backgroundColor: "transparent" })
                }
            })

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
            // insert value into targetNode.keys just after the value in
            // targetNode.keys that is the highest value that is less than or
            // equal to value.
            for (let i = (targetNode.keys.length - 1); i >= 0; i--) {
                if (targetNode.keys[i] <= value) {
                    for (let j = (targetNode.keys.length - 1); j >= i; j--) {
                        if (targetNode.keys[j]) {
                            if (i == j) {
                                targetNode.keys[j] = value
                                break;
                            } else {
                                targetNode.keys[j + 1] = targetNode.keys[j]
                            }
                        }
                    }
                    break;
                }
            }
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



    // Animation Interface Section //
    /**
     * Starts the animation from current time (in milliseconds).
     */
    public play() {
        this.animations[this.animations.length - 1].play()
        return null
    }


    /**
     * Pauses the animation at current time (in milliseconds).
     */
    public pause() {
        return null
    }


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
            .attr("x", (_, i) => { return this.pointerRectWidth + (this.keyRectWidth / 2) + i * this.keyRectWidth })
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
}