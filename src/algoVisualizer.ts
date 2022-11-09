//TODO implement all animations of find and insert
//TODO implement undoable versions of find and insert
import { bPlusTreeNode } from "./types/bPlusTree"
import { AlgoStep, AlgoStepHistory } from "./stepHistory"
import "animejs"
import anime, { AnimeTimelineInstance } from "animejs"
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
    // Number of pointers in a node.
    readonly n: number
    private bPlusTreeRoot: bPlusTreeNode
    private rootCanvasPos: [string, string] = ['0', '0']
    private algoStepHistory = new AlgoStepHistory()


    private sudoCodeContainer = document.querySelector("#sudo-code")
    private svgCanvas = document.querySelector('#main-svg')

    private keyRectWidth = 42
    private nodeHeight = 29
    private pointerRectWidth = 14
    private nodeWidth: number
    // in milliseconds
    readonly animationDuration = 2000
    //Some array to store the durations of animations
    readonly animations: anime.AnimeTimelineInstance[] = []

    /**
     * 
     * @param nodeSize Determines how many pointers are contained
     * in each node of the B+tree.
     */
    constructor(nodeSize: number) {
        this.n = nodeSize
        this.bPlusTreeRoot = new bPlusTreeNode(true)

        // The following finds the center of the svg canvas
        if (this.svgCanvas != null) {
            const viewboxArray = this.svgCanvas?.getAttributeNS(null, 'viewBox')?.split(' ')
            if (viewboxArray) {
                const midXCord = Number(viewboxArray[2]) / 2
                this.rootCanvasPos = [String(midXCord), '20']
            } else {
                console.error('viewbox attribute on svg canvas was undefined')
            }
        } else {
            console.error('svg canvas could not be selected')
        }

        this.nodeWidth = (this.keyRectWidth + this.pointerRectWidth) * this.n + this.pointerRectWidth
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
            duration: 1,
            endDelay: this.animationDuration - 1,
            autoplay: false,
            easing: 'linear'
        });

        const insertSudoCode = document.querySelector("#insert-sudo-code")
        if (this.sudoCodeContainer?.innerHTML && insertSudoCode?.innerHTML) {
            this.sudoCodeContainer.innerHTML = insertSudoCode?.innerHTML
        }

        timeline.add({
            targets: '#insert-line1',
            backgroundColor: '#ffed99'
        })

        let targetNode: bPlusTreeNode | null = null
        if (this.bPlusTreeRoot.keys.length == 0) {
            targetNode = this.bPlusTreeRoot
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
        if (targetNode.keys.filter(element => typeof element == "number").length < (this.n - 1)) {
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
     * 
     * A subsidiary procedure for the insert method
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

            // This create the first bplus tree node svg element
            if (targetNode.svgElement == null) {
                const rootCanvasXCord = Number(this.rootCanvasPos[0]) - (this.nodeWidth / 2)
                targetNode.svgElement = this.createNodeSvgElement(String(rootCanvasXCord), this.rootCanvasPos[1])
                targetNode.svgElement.setAttribute('opacity', '0')
                const keyTextElement = targetNode.svgElement.children.namedItem('key-text')
                if (keyTextElement) {
                    keyTextElement.innerHTML = String(value)
                }
                this.svgCanvas?.appendChild(targetNode.svgElement)
            }
            returnTimeline.add({
                targets: targetNode.svgElement,
                opacity: 1
            })

            targetNode.keys[0] = value
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

    /**
     * 
     * Creates a HTML element that represents one bplus tree node. This method
     * exists to keep all styling of bplus tree nodes in one spot. The origin of
     * the node is at its top left corner.
     * @dependency this.n The size of a bplus tree node.
     * @param x
     * @param y
     * @returns A g element the children of which are the elements that make up
    the new bplus tree node visual.
     */
    private createNodeSvgElement(x = '0', y = '0'): SVGGElement {
        const nodeFillColor = '#C7EBFC'
        const nodeStrokeColor = 'black'

        const svgNodeG = document.createElementNS(SVG_NS, 'g')
        svgNodeG.setAttributeNS(null, 'transform', `translate(${x}, ${y})`)


        // Each iteration of this loop creates the svg elements that correspond
        // to one pointer key pair in the node
        for (let i = 0; i < this.n; i++) {
            const currentXCordOrigin = i * (this.pointerRectWidth + this.keyRectWidth)

            const pointerRect = document.createElementNS(SVG_NS, 'rect')
            pointerRect.setAttributeNS(null, 'x', String(currentXCordOrigin))
            pointerRect.setAttributeNS(null, 'y', '0')
            pointerRect.setAttributeNS(null, 'width', String(this.pointerRectWidth))
            pointerRect.setAttributeNS(null, 'height', String(this.nodeHeight))
            pointerRect.setAttributeNS(null, 'fill', nodeFillColor)
            pointerRect.setAttributeNS(null, 'stroke', nodeStrokeColor)
            svgNodeG.appendChild(pointerRect)

            const keyRect = document.createElementNS(SVG_NS, 'rect')
            keyRect.setAttributeNS(null, 'x', String(this.pointerRectWidth + currentXCordOrigin))
            keyRect.setAttributeNS(null, 'y', '0')
            keyRect.setAttributeNS(null, 'width', String(this.keyRectWidth))
            keyRect.setAttributeNS(null, 'height', String(this.nodeHeight))
            keyRect.setAttributeNS(null, 'fill', nodeFillColor)
            keyRect.setAttributeNS(null, 'stroke', nodeStrokeColor)
            svgNodeG.appendChild(keyRect)

            const keyText = document.createElementNS(SVG_NS, 'text')
            keyText.setAttributeNS(null, 'x', String((this.keyRectWidth / 2) + this.pointerRectWidth + currentXCordOrigin))
            keyText.setAttributeNS(null, 'y', String(this.nodeHeight / 2))
            keyText.setAttributeNS(null, 'dominant-baseline', 'middle')
            keyText.setAttributeNS(null, 'text-anchor', 'middle')
            keyText.setAttributeNS(null, 'id', 'key-text')
            svgNodeG.appendChild(keyText)
        }

        const pointerRect = document.createElementNS(SVG_NS, 'rect')
        pointerRect.setAttributeNS(null, 'x', String(this.n * (this.pointerRectWidth + this.keyRectWidth)))
        pointerRect.setAttributeNS(null, 'y', '0')
        pointerRect.setAttributeNS(null, 'width', String(this.pointerRectWidth))
        pointerRect.setAttributeNS(null, 'height', String(this.nodeHeight))
        pointerRect.setAttributeNS(null, 'fill', nodeFillColor)
        pointerRect.setAttributeNS(null, 'stroke', nodeStrokeColor)
        svgNodeG.appendChild(pointerRect)

        return svgNodeG
    }



    // Animation Interface Section //
    /**
     * Starts the animation from current time (in milliseconds).
     */
    public play() {
        this.animations[this.animations.length-1].play()
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
}