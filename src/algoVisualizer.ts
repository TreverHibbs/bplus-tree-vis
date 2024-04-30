//test strings
// 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21
// 1,2,3,4,5,6,7,8,9,10,11,12
// 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100
// 12, 7, 29, 45, 2, 33, 18, 51, 9, 37, 24, 6, 42, 15, 30
// 57, 91, 26, 73, 17, 45, 67, 89, 34, 12, 78, 23, 56, 38, 81, 29, 64, 92, 15, 48, 71, 33, 86, 20, 52, 75, 28, 61, 94, 7, 40, 83, 16, 49, 72, 35, 58, 11, 44, 77, 30, 53, 76, 19, 42, 65, 88, 21, 54, 87, 10, 43, 66, 39, 62, 95, 18, 51, 74, 37, 60, 93, 6, 79, 22, 55, 88, 31, 64, 97, 8, 41, 74, 27, 50, 73, 36, 59, 82, 5, 78, 21, 44, 67, 90, 13, 46, 69, 32, 55, 78, 1, 24, 47, 70, 93, 16, 39, 62, 85, 8, 31, 54, 77, 100
// 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1

import { bPlusTreeNode } from "./types/bPlusTree"
import { AlgoStepHistory, AlgoStep } from "./algoStepHistory"
import { createTimeline, svg as animeSvg, Timeline } from "./lib/anime.esm"
import { tree, hierarchy } from "d3-hierarchy"
import { select } from "d3-selection"
import { path as d3Path } from "d3"
export const SVG_NS = "http://www.w3.org/2000/svg"

// This type is used to communicate what algorithm operation is being animated or
// was animated.
type OperationType = "insert" | "delete" | "insert-parent"


/**
 * 
 * This class implements a B+tree algorithm (as described in the Database System
 * Concepts 7th edition) and generates animations for that algorithm.
 * By using this class a web UI can animate a B+tree. Each instance of
 * this class corresponds to a rendered B+tree algorithm.   
 * @dependency For this class to function correctly there must be a certain HTML and CSS
 * structure already rendered by the browser. This structure is defined in the index.html
 * and style.css files of this project.
 */
export class AlgoVisualizer {
    // ** begin global variables section ** //
    //TODO maybe change this convention below.
    /* When the bplus tree is empty it contains a bplus tree node with an empty
    keys array */
    private bPlusTreeRoot: bPlusTreeNode = new bPlusTreeNode(true)
    // The next three variables are used in undo methods to restore the
    // previous state of the tree data structure and DOM from before a
    // operation was executed.
    private previousBPlusTreeRoot: bPlusTreeNode = this.bPlusTreeRoot
    private previousValue: number | null = null //represents a value that was inserted or deleted
    private previousOperationType: OperationType | null = null
    // used to store d3 selections that will be removed at the start of a new animation.
    // this will get rid of the DOM elements corresponding to the old animation.
    private exitSelections: (d3.Selection<SVGTextElement, unknown, SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>> |
        d3.Selection<SVGPathElement, unknown, d3.BaseType, d3.HierarchyPointNode<bPlusTreeNode>> |
        d3.Selection<SVGGElement, unknown, d3.BaseType, unknown>)[] = []
    // public currentAnimation = createTimeline({})
    // ** end global variables section ** //
    // ** begin global constants section ** //
    // number of pointers in a node
    private readonly n: number
    // The following constants are used to generate the style of the bplus tree nodes.
    // You can change their value to change how the tree looks.
    private readonly keyRectWidth = 42
    private readonly nodeHeight = 29
    private readonly pointerRectWidth = 14
    private readonly nodeWidth: number
    //multiplied by node width to get gap value
    private readonly nodeSiblingsGap = 1.1
    private readonly nodeParentsGap = 2
    //added to the node size height to create a gap between parents and children.
    private readonly nodeChildrenGap = 200
    private readonly lightBlue
    private readonly lightGreen
    /* in milliseconds */
    private animationDuration = 1000
    // end of style constants
    // The following constants are here to help the programmer to keep track of the
    // class and id names of the relevant elements in the DOM. This names are defined
    // in the index.html and style.css files of this project.
    private readonly leafNodeEdgeClassName = "leaf-node-edge"
    private readonly edgeClassName = "edge"
    private readonly nodeClassName = "node"
    //  All nodes are g elements so you can use this along with the d3 selection
    //  function to select nodes.
    private readonly nodeSelector = "g.node"
    private readonly nodeRectClassName = this.nodeClassName + "-rect"
    private readonly keyTextClassName = "node-key-text"
    private readonly mainSvgId = "#main-svg"
    // end of class and id names constants
    /** used to get the x y coords of the trees nodes on the canvas */
    private readonly d3TreeLayout = tree<bPlusTreeNode>()
    //TODO make this a return value of the operation methods rather than a 
    //public field.
    /**
     * allows control of the algorithm visualization. By calling the do and undo
     * methods of this object a user of this class can navigate the algorithm
     * visualization. Users of this class should not call the addAlgoStep method
     * of this object.
     */
    public readonly algoStepHistory = new AlgoStepHistory()
    // ** end global constants section ** //


    /**
     * 
     * @param nodeSize Determines how many pointers are contained
     * in each node of the B+tree.
     */
    constructor(nodeSize: number) {
        this.n = nodeSize
        this.nodeWidth = (this.keyRectWidth + this.pointerRectWidth) * (this.n - 1) + this.pointerRectWidth
        const style = getComputedStyle(document.body)
        this.lightBlue = style.getPropertyValue("--light-blue")
        this.lightGreen = style.getPropertyValue("--light-green")

        this.d3TreeLayout.nodeSize([this.nodeWidth, this.nodeHeight + this.nodeChildrenGap])
        this.d3TreeLayout.separation((a, b) => {
            //TODO make this actually work for inner nodes. So that inner nodes are closer
            //than leaf nodes. Also this should probably be dynamically calculated based on
            //node size.
            if (a.parent == b.parent) {
                return this.nodeSiblingsGap
            } else {
                return this.nodeParentsGap
            }
        })
    }



    // Operation Methods Section //
    /**
     * 
     * Find a numeric key in the B+Tree. Assumes that there are no duplicates.
     * @param keyToFind A number to locate in the B+Tree.
     * @returns An object that contains a found boolean flag which indicates if
     * the key was found. The bPlusTreeNode that should contain the key if it
     * exists in the tree. The index of the key if it has been found.    
     */
    find(keyToFind: number): { found: boolean, node: bPlusTreeNode, index?: number } {
        let currentNode = this.bPlusTreeRoot
        while (currentNode && !currentNode.isLeaf) {
            const smallestValidNum = Math.min(...currentNode.keys.filter((element) => { return keyToFind <= element }));
            const smallestValidNumIndex = currentNode.keys.findIndex((element) => smallestValidNum == element)
            if (smallestValidNumIndex == -1) { // if there is no smallest valid number
                const lastNonNullPointer = currentNode.pointers[currentNode.pointers.length - 1]
                if (lastNonNullPointer) currentNode = lastNonNullPointer
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
     * generates an animation for that insertion.
     * @param value a number to insert into the B+Tree.
     * @returns The animejs timeline object that represents the animation of the
     * insertion. Or null if the value to be inserted is already in the tree.
     * @sidEffect modifies this.bPlusTreeRoot by inserting a value into the tree.
     * @sideEffect this.mainSvgId, manipulates the children of this DOM element
     * @sideEffect any currently animating algorithm step will be interrupted
     * and a new one corresponding to this method will begin.
     * @sideEffect all exit selections stored in this.exitSelection will
     * be removed from the DOM.
     * @sideEffects adds d3 selections to the exitSelections array for removal.
     * */
    private insert(value: number): Timeline | null {
        //This needs to be done so that the old elements that are no longer relevant
        //do not interfere with the new animation. If this wasn't done then the new selections
        //could potentially be erroneously selecting old irrelevant elements.
        this.exitSelections.forEach(selection => {
            selection.remove()
        })
        const timeline = createTimeline({
            autoplay: false,
            defaults: {
                duration: this.animationDuration,
                ease: 'linear'
            }
        })
        const bPlusTreeChildrenDefinition = (node: bPlusTreeNode) => {
            if (node.isLeaf) {
                return []
            } else {
                return node.pointers
            }
        }

        const moveSudoCodeRectangle = this.createSudoCodeRectangleObj(timeline, "insert")
        moveSudoCodeRectangle(1)
        moveSudoCodeRectangle(2)
        let targetNode: bPlusTreeNode
        if (this.bPlusTreeRoot.keys.length == 0) { //empty tree
            targetNode = this.bPlusTreeRoot
            moveSudoCodeRectangle(3)

            //First create the new node for the root and then animate the new root node
            const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(this.bPlusTreeRoot,
                bPlusTreeChildrenDefinition))
            const nodeSelection = select(this.mainSvgId)
                .selectAll<SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>>(this.nodeSelector)
                .data(rootHierarchyNode, function (d) { return d ? d.data.id : (this as SVGGElement).id })
            const newNodes = nodeSelection.enter().data().map((node) => {
                return this.createNodeElement(node.data)
            })
            //@ts-expect-error
            timeline.add(
                [...newNodes],
                {
                    opacity: { to: 1, ease: "outQuad" },
                }
            )
            const newSVGGElementsRectChildren = newNodes.map((element) => {
                //check each child array for rect elements and only select those.
                const rectChildNodes: ChildNode[] = []
                element.childNodes.forEach((child) => {
                    if (child.nodeName == "rect") {
                        rectChildNodes.push(child)
                    }
                })
                return rectChildNodes
            })
            if (newSVGGElementsRectChildren.length != 0) {
                timeline.add(
                    newSVGGElementsRectChildren[0],
                    {
                        translateY: { from: "-40" }
                    },
                    '<<'
                )
            }
            //@ts-expect-error
            timeline.set(newSVGGElementsRectChildren[0],
                {
                    fill: this.lightBlue
                }
            )
        } else {
            moveSudoCodeRectangle(4)
            const { found, node } = this.find(value)

            if (found) {
                return null
            } else {
                targetNode = node
            }
        }

        moveSudoCodeRectangle(5)
        // targetNode is ready to have the value inserted into it.
        if (targetNode == null || targetNode.keys.filter(element => typeof element == "number").length < (this.n - 1)) {
            moveSudoCodeRectangle(6)
            this.insertInLeaf(targetNode, value)

            //animate adding the new key value to the leaf node
            const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(targetNode, bPlusTreeChildrenDefinition))
            const nodeSelection = select(this.mainSvgId)
                .selectAll<SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>>(this.nodeSelector)
                .data(rootHierarchyNode, function (d) { return d ? d.data.id : (this as SVGGElement).id })
            const newNodesTextSelection = nodeSelection.selectAll<SVGTextElement, number>("text." + this.keyTextClassName)
                .data((d) => d.data.keys)
            const textSelection = this.createNewNodeText(newNodesTextSelection.enter(), true)
            //@ts-expect-error
            timeline.set(textSelection.nodes(),
                {
                    opacity: 1
                }
                //@ts-expect-error
            ).add(textSelection.nodes(),
                {
                    translateY: { from: "-40" },
                    duration: this.animationDuration * 2
                    //@ts-expect-error
                }).set(textSelection.nodes(),
                    {
                        fill: "#000000"
                    }
                )
        } else { //leaf node targetNode has n - 1 key values already, split it
            moveSudoCodeRectangle(7)
            const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(targetNode, bPlusTreeChildrenDefinition))

            const newNode = new bPlusTreeNode(true)
            const tempNode = new bPlusTreeNode(true)
            tempNode.pointers = targetNode.pointers.slice(0, this.n - 1)
            tempNode.keys = targetNode.keys.slice(0, this.n - 1)
            this.insertInLeaf(tempNode, value)

            const targetNodeOriginalLastNode = targetNode.pointers[this.n - 1]

            targetNode.pointers = tempNode.pointers.slice(0, Math.ceil(this.n / 2))
            targetNode.pointers[this.n - 1] = newNode
            targetNode.keys = tempNode.keys.slice(0, Math.ceil(this.n / 2))

            newNode.pointers = tempNode.pointers.slice(Math.ceil(this.n / 2), this.n)
            if (targetNodeOriginalLastNode) {
                newNode.pointers[this.n - 1] = targetNodeOriginalLastNode
            }
            newNode.keys = tempNode.keys.slice(Math.ceil(this.n / 2), this.n)
            newNode.parent = targetNode.parent

            // animate node splitting
            // first need to find the coordinates of the target node
            const nodeSelection = select(this.mainSvgId)
                .selectAll<SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>>(this.nodeSelector)
                .data(rootHierarchyNode, function (d) { return d ? d.data.id : (this as SVGGElement).id })
            const targetNodeSelection = nodeSelection.filter((d) => d.data === targetNode)
            const newNodeElement = this.createNodeElement(newNode,
                targetNodeSelection.data()[0].x + this.nodeWidth,
                targetNodeSelection.data()[0].y + this.nodeHeight * 1.5)

            //@ts-expect-error
            timeline.add(
                targetNodeSelection.nodes(),
                {
                    translateX: { to: targetNodeSelection.data()[0].x - this.nodeWidth },
                    translateY: { to: targetNodeSelection.data()[0].y + this.nodeHeight * 1.5 },
                }
                //@ts-expect-error
            ).add(
                newNodeElement,
                {
                    opacity: { to: 1, ease: "outQuad" },
                }
            )

            const rectChildNodes: ChildNode[] = []
            newNodeElement.childNodes.forEach((child) => {
                if (child.nodeName == "rect") {
                    rectChildNodes.push(child)
                }
            })
            if (rectChildNodes.length != 0) {
                timeline.add(
                    rectChildNodes,
                    {
                        translateY: { from: "-40" }
                    },
                    '<<'
                )
            }
            //@ts-expect-error
            timeline.set(newNodeElement,
                {
                    fill: this.lightBlue
                }
            )

            //TODO animate insert in parent
            this.insertInParent(targetNode, newNode.keys[0], newNode)
        }
        moveSudoCodeRectangle(10)
        moveSudoCodeRectangle(10, true)

        return timeline
    }

    /**
     *
     * A sub procedure for the insert method
     * @param targetNode The node to insert they key value into
     * @param value The key value to insert
     * @sideEffect Adds the value to the keys array of the targetNode
     */
    private insertInLeaf(targetNode: bPlusTreeNode, value: number) {
        if (value < targetNode.keys[0] || targetNode.keys.length == 0) {
            // shift all values in keys to the right one spot.
            for (let i = (targetNode.keys.length - 1); i >= 0; i--) {
                if (targetNode.keys[i]) {
                    targetNode.keys[i + 1] = targetNode.keys[i]
                }
            }
            targetNode.keys[0] = value
        } else {
            // insert value into targetNode.keys just after the 
            // highest number that is less than or equal to value.
            const highestNumberIndex = targetNode.keys.findIndex(element => element >= value)
            // if find Index returns -1 then the last number in keys must be the
            // greatest number that is less than or equal to value.
            if (highestNumberIndex < 0) {
                targetNode.keys.push(value)
            } else {
                targetNode.keys.splice(highestNumberIndex, 0, value);
            }
        }
        return
    }

    /**
     * 
     * A subsidiary procedure for the insert method
     * @param leftNode A bPlusTreeNode to be placed to the left of the key value
     * @param value The key value to insert into parent node
     * @param rightNode A bPlusTreeNode to be placed to the right of the key value
     * @sideEffect potentially splits the parent node of leftNode and rightNode
     * @sideEffects edits the contents of the pointers and keys arrays of
     * the parent node, leftNode and rightNode.
     */
    private insertInParent(leftNode: bPlusTreeNode, value: number, rightNode: bPlusTreeNode) {
        if (leftNode.parent == null) {
            this.bPlusTreeRoot = new bPlusTreeNode(false)
            this.bPlusTreeRoot.isLeaf = false
            this.bPlusTreeRoot.pointers = [leftNode, rightNode]
            this.bPlusTreeRoot.keys = [value]

            leftNode.parent = this.bPlusTreeRoot
            rightNode.parent = this.bPlusTreeRoot

            return
        }

        const parentNode = leftNode.parent
        const leftNodeIndex = parentNode.pointers.findIndex(element => element === leftNode)
        if (parentNode.pointers.filter(element => element).length < this.n) {
            parentNode.pointers.splice(leftNodeIndex + 1, 0, rightNode)
            parentNode.keys.splice(leftNodeIndex, 0, value)
        } else { // split
            const tempKeys = parentNode.keys.slice()
            const tempPointers = parentNode.pointers.slice()

            tempPointers.splice(leftNodeIndex + 1, 0, rightNode)
            tempKeys.splice(leftNodeIndex, 0, value)

            parentNode.keys = []
            parentNode.pointers = []

            const newNode = new bPlusTreeNode(false)

            parentNode.pointers = tempPointers.slice(0, Math.ceil((this.n + 1) / 2))
            parentNode.keys = tempKeys.slice(0, Math.ceil((this.n + 1) / 2) - 1)

            const middleKey = tempKeys[Math.ceil(((this.n + 1) / 2) - 1)]

            newNode.pointers = tempPointers.slice(Math.ceil(((this.n + 1) / 2)), this.n + 1)
            newNode.keys = tempKeys.slice(Math.ceil(((this.n + 1) / 2)), this.n)

            newNode.parent = parentNode.parent

            parentNode.pointers.forEach(node => {
                if (node) {
                    node.parent = parentNode;
                }
            });
            newNode.pointers.forEach(node => {
                if (node) {
                    node.parent = newNode;
                }
            });

            this.insertInParent(parentNode, middleKey, newNode)
        }
        return
    }


    /**
     *
     * Delete a number from the B+Tree if it is in the tree. And
     * generates an animation for that deletion.
     * @param value a number to delete from the B+Tree.
     * @returns The timeline object that represents the animation of the
     * deletion. Or null if the value to be deleted is not in the tree.
     * @sideEffect this.bPlusTreeRoot delete value from this tree
     * @sideEffect will play the generated timeline
     * @sideEffect all exit selections stored in this.exitSelection will
     * be removed from the DOM. And new elements may be added.
     * @sideEffect manipulates the children of the DOM element corresponding to this.mainSvgId.
     * */
    private delete(value: number): Timeline | null {
        let targetNode: bPlusTreeNode
        if (this.bPlusTreeRoot.keys.length == 0) { //empty tree
            return null // nothing to delete

        } else {
            const { found, node } = this.find(value)

            if (found) {
                targetNode = node
            } else {
                return null // value not in tree
            }
        }

        //TODO add animation to this method
        return this.deleteEntry(targetNode, value)
    }

    /**
     * 
     * A subsidiary procedure for the delete method
     * @param leftNode A bPlusTreeNode to delete the key value from
     * @param value The key value to delete
     * @param node A node to be deleted from target node pointers array
     * @sideEffects Edits the b+tree structure(this.bPlusTreeRoot) to remove the value from the tree
     */
    private deleteEntry(targetNode: bPlusTreeNode, value: number, node: bPlusTreeNode | null = null) {
        //Attempt to delete the value from the targetNode
        //Algorithm found in Database System Concepts 7th edition ch.14 p.648
        //TODO decide if in the case of the last value in the tree being
        //deleted if the tree should be set to empty.
        targetNode.keys = targetNode.keys.filter(element => element != value)
        if (node != null) {
            targetNode.pointers = targetNode.pointers.filter(element => element !== node)
        }

        let siblingNode: bPlusTreeNode | null = null;
        let betweenValue = null
        let isPreviousSibling = false

        if (targetNode === this.bPlusTreeRoot && targetNode.pointers.length === 1) {
            // targetNode is the root and has only one child
            this.bPlusTreeRoot = targetNode.pointers.filter(element => element != null)[0];
            this.bPlusTreeRoot.parent = null
        } else if (!(targetNode === this.bPlusTreeRoot && targetNode.isLeaf) &&
            (targetNode.isLeaf && targetNode.keys.length < Math.ceil((this.n - 1) / 2) ||
                !targetNode.isLeaf && targetNode.pointers.length < Math.ceil(this.n / 2))) {
            // Find a sibling node to borrow from
            if (targetNode.parent) {
                const index = targetNode.parent.pointers.indexOf(targetNode);

                if (index > 0) { // There is a previous sibling
                    siblingNode = targetNode.parent.pointers[index - 1];
                    betweenValue = targetNode.parent.keys[index - 1];
                    isPreviousSibling = true
                } else {
                    siblingNode = targetNode.parent.pointers[index + 1];
                    betweenValue = targetNode.parent.keys[index];
                    isPreviousSibling = false
                }
            }

            if (siblingNode == null || betweenValue == null) {
                throw new Error("valid sibling node or between value not found")
            }

            const totalKeys = siblingNode.keys.length + targetNode.keys.length;

            if (targetNode.isLeaf && totalKeys <= this.n - 1 || !targetNode.isLeaf && totalKeys <= this.n - 2) {
                // The keys of siblingNode and targetNode can fit in a single node. Coalesce them.
                if (!isPreviousSibling) { // targetNode should always be the right sibling
                    const temp = siblingNode;
                    siblingNode = targetNode;
                    targetNode = temp;
                }
                if (!targetNode.isLeaf) {
                    siblingNode.keys.push(betweenValue)
                    siblingNode.keys.push(...targetNode.keys)
                    siblingNode.pointers.push(...targetNode.pointers)
                    targetNode.pointers.forEach(node => {
                        node.parent = siblingNode
                    })
                } else {
                    siblingNode.keys.push(...targetNode.keys)
                    const targetNodeLastPointer = targetNode.pointers[targetNode.pointers.length - 1]
                    if (targetNodeLastPointer) {
                        siblingNode.pointers[siblingNode.pointers.length - 1] = targetNodeLastPointer
                    } else {
                        siblingNode.pointers = []
                    }
                }
                if (targetNode.parent == null) {
                    throw new Error("target node parent is null")
                }
                this.deleteEntry(targetNode.parent, betweenValue, targetNode)
            } else {
                // Redistribution: borrow an entry from a sibling
                if (isPreviousSibling) {
                    if (!targetNode.isLeaf) {
                        const lastPointer = siblingNode.pointers.pop()
                        const lastKey = siblingNode.keys.pop()
                        if (lastPointer == undefined || lastKey == undefined) {
                            throw new Error("malformed data structure")
                        }
                        targetNode.pointers.unshift(lastPointer)
                        lastPointer.parent = targetNode
                        targetNode.keys.unshift(betweenValue)
                        if (targetNode.parent == null) {
                            throw new Error("target node parent is null")
                        }
                        targetNode.parent.keys[targetNode.parent.keys.indexOf(betweenValue)] = lastKey
                    } else {
                        const lastKey = siblingNode.keys.pop()
                        if (lastKey == undefined) {
                            throw new Error("malformed data structure")
                        }
                        targetNode.keys.unshift(lastKey)
                        if (targetNode.parent == null) {
                            throw new Error("target node parent is null")
                        }
                        targetNode.parent.keys[targetNode.parent.keys.indexOf(betweenValue)] = lastKey
                    }
                } else {
                    if (!targetNode.isLeaf) {
                        const firstPointer = siblingNode.pointers.shift()
                        const firstKey = siblingNode.keys.shift()
                        if (firstPointer == undefined || firstKey == undefined) {
                            throw new Error("malformed data structure")
                        }
                        targetNode.pointers.push(firstPointer)
                        firstPointer.parent = targetNode
                        targetNode.keys.push(betweenValue)
                        if (targetNode.parent == null) {
                            throw new Error("target node parent is null")
                        }
                        targetNode.parent.keys[targetNode.parent.keys.indexOf(betweenValue)] = firstKey
                    } else {
                        const firstKey = siblingNode.keys.shift()
                        if (firstKey == undefined) {
                            throw new Error("malformed data structure")
                        }
                        targetNode.keys.push(firstKey)
                        if (targetNode.parent == null) {
                            throw new Error("target node parent is null")
                        }
                        targetNode.parent.keys[targetNode.parent.keys.indexOf(betweenValue)] = firstKey
                    }
                }
            }
        }
    }


    // Undoable Methods Section //
    /**
     * Inserts a value into the BPlus Tree and animates it. Also allows for the
     * redoing undoing of that insert.
     * @param value the number to insert, duplicates can't be added to the tree
     * @return The timeline of the generated animation or null if the value is a duplicate.
     * @dependency undefined behavior if another undoable method is called when
     * the current operations corresponding animation is not in its completed state.
     * //TODO experiment with the below quirk.
     * @dependency if you call this method right after a previous animation generated by and
     * undoable method operation is completed the animation generated by this method will be wrong.
     * Wait at least 10 milliseconds after the completion of the on completion promise of 
     * the previous animation.
     * @sideEffect reads and then sets the this.previousBPlusTreeRoot to the state of the tree
     * before the last undoable method call.
     * @sideEffect reads and then sets the this.previousAnimationType to the type of this
     * undoable method call.
     * @sideEffect reads and sets the this.previousValue to the value given to the last
     * undoable method call.
     * @sideEffect adds an AlgoStep object corresponding to this insert to this.algoStepHistory
     */
    public undoableInsert(value: number): Timeline | null {
        let previousOperationValue: number | null = null
        let previousOperationType: OperationType | null = null
        //set the closure variables for the algo step object.
        const BPlusTreeBeforePreviousOperation = structuredClone(this.previousBPlusTreeRoot)
        previousOperationValue = this.previousValue
        previousOperationType = this.previousOperationType

        /**
         * Undoes the operations of the corresponding insert method call, which
         * is defined in the insertDo function definition. All state including
         * the DOM should be returned to exactly how it was.
         * @return A Timeline of the generated animation for the previous operation. Or
         * null if there is no previous operation in history.
         * @dependencies uses the previousOperationValue, previousOperationType, and
         * PreviousBPlusTree to recreate the previous operations execution.
         * @sideEffect calls the operation method corresponding to the previousOperationType
         */
        const insertUndo = () => {
            this.exitSelections.forEach(selection => {
                selection.remove()
            })

            const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(BPlusTreeBeforePreviousOperation, (node) => {
                if (node.isLeaf) {
                    return []
                } else {
                    return node.pointers
                }
            }))

            const edgeSelection = select(this.mainSvgId)
                .selectAll<SVGPathElement, d3.HierarchyPointLink<bPlusTreeNode>>("path." + this.edgeClassName)
                .data(rootHierarchyNode.links())
            edgeSelection.exit().remove()

            const leafNodeLinks = this.getLeafNodeLinks(rootHierarchyNode)
            const leafNodeEdgeSelection = select(this.mainSvgId)
                .selectAll<SVGPathElement, d3.HierarchyPointLink<bPlusTreeNode>>("path." + this.leafNodeEdgeClassName)
                .data(leafNodeLinks)
            leafNodeEdgeSelection.exit().remove()

            const nodeSelection = select(this.mainSvgId)
                .selectAll<SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>>("g." + this.nodeClassName)
                .data(rootHierarchyNode, (d) => d.data.id)

            nodeSelection.exit().remove()
            nodeSelection.filter((d) => d.data.keys.length === 0).remove() //remove the root node if it is empty.

            nodeSelection.attr("transform", (d) => {
                return this.getNodeTransformString(d.x, d.y)
            })

            const textSelection = nodeSelection.selectAll("text." + this.keyTextClassName)
                .data((d) => d.data.keys)
            textSelection.exit().remove()
            this.createNewNodeText(textSelection.enter(), false)

            // return the global state to its state before the previous insert.
            this.bPlusTreeRoot = structuredClone(BPlusTreeBeforePreviousOperation)
            this.previousValue = previousOperationValue

            if (previousOperationValue == null) {
                return null
            } else if (previousOperationType == "insert") {
                return this.insert(previousOperationValue)
            } else {
                return this.delete(previousOperationValue)
            }
        }

        /**
         *
         * Executes an insert that can be undone later so that all sate
         * including the DOM is returned to its sate from before the method call.
         * @return A Timeline of the generated animation of the algo step. Or
         * null if there is no next operation in history.
         * @sideEffect the global state this.previousBPlusTreeRoot will be set.
         * @sideEffect the global state this.previousValue will be set.
         */
        const insertDo = () => {
            // set the global state so that future undoable inserts can create
            // correct closures for undoing.
            this.previousBPlusTreeRoot = structuredClone(this.bPlusTreeRoot)
            this.previousValue = value
            this.previousOperationType = "insert"
            return this.insert(value)
        }

        const generatedTimeline = insertDo()
        // we don't want to save the algo step if the value to be inserted is already in the tree.
        // Since nothing would happen and the undo and redo would be a noop.
        if (generatedTimeline != null) {
            const insertAlgoStep: AlgoStep = {
                do: insertDo,
                undo: insertUndo
            }
            this.algoStepHistory.addAlgoStep(insertAlgoStep)
        }
        return generatedTimeline
    }

    /**
     * Deletes a value from the BPlus Tree and animates it. Also allows for the
     * redoing undoing of that delete. Making sure that state is remembered for
     * proper restoring.
     * @param value the number to delete
     * @return The on completion promise of the generated animation
     * @dependency undefined behavior if another undoable method is called before
     * the previous undoable method has completed.
     * @dependency if you call this method right after a previous animation generated by and
     * undoable method operation is completed the animation generated by this method will be wrong.
     * Wait at least 10 milliseconds after the completion of the on completion promise of 
     * the previous animation.
     * @dependency reads this.previousBPlusTreeRoot to set the closure for the
     * created algo step.
     * @dependency reads this.previousValue to set the closure for the created algo step
     * @sideEffect reads and then sets the this.previousAnimationType to the type of this
     * undoable method call.
     * @sideEffect adds an AlgoStep object corresponding to this delete to this.algoStepHistory
     * @sideEffect sets the this.previousBPlusTreeRoot to the state of the tree before 
     * the previous undoable method call.
     * @sideEffect sets the this.previousValue to the value given to the
     * previous undoable method call.
     */
    public undoableDelete(value: number) {
        let valueBeforePreviousOperation: number | null = null
        let operationTypeBeforePreviousOperation: OperationType | null = null

        //set the closure variables for the algo step object.
        const BPlusTreeRootStateBeforePreviousOperation = structuredClone(this.previousBPlusTreeRoot)
        valueBeforePreviousOperation = this.previousValue
        operationTypeBeforePreviousOperation = this.previousOperationType

        /**
         * Undoes the operations of the corresponding delete method call, which
         * is defined in the deleteDo function definition. All state including
         * the DOM should be returned to exactly how it was.
         * @sideEffect Remove Dom elements that were added by the deleteDo function
         * @sideEffect Restore the state of this.bPlusTreeRoot to what it was before
         * the corresponding DeleteDo function was called.
         */
        const deleteUndo = () => {
            // return the global state to its state before the previous delete.
            this.bPlusTreeRoot = structuredClone(BPlusTreeRootStateBeforePreviousOperation)
            this.previousValue = valueBeforePreviousOperation
            this.previousOperationType = operationTypeBeforePreviousOperation

            this.animateOperation()

            if (valueBeforePreviousOperation == null) {
                return
            } else if (operationTypeBeforePreviousOperation == "insert") {
                this.insert(valueBeforePreviousOperation)
            } else if (operationTypeBeforePreviousOperation == "delete") {
                this.delete(valueBeforePreviousOperation)
            }

            return
        }

        /**
         *
         * Executes an delete that can be undone later so that all sate
         * including the DOM is returned to its sate from before the method call.
         * @returns The on completion promise of the generated animation
         * @sideEffect the global state this.previousBPlusTreeRoot will be set.
         * @sideEffect the global state this.previousValue will be set.
         */
        const deleteDo = () => {
            // set the global state so that future undoable operations can create
            // correct closures for undoing.
            this.previousBPlusTreeRoot = structuredClone(this.bPlusTreeRoot)
            this.previousValue = value
            //TODO add this to side effects
            this.previousOperationType = "delete"
            return this.delete(value)
        }

        const generatedTimeline = deleteDo()
        // we don't want to save the algo step if the value to be deleted is not in the tree.
        // Since nothing would happen and the undo and redo would be a noop.
        if (generatedTimeline != null) {
            const deleteAlgoStep: AlgoStep = {
                do: deleteDo,
                undo: deleteUndo
            }
            this.algoStepHistory.addAlgoStep(deleteAlgoStep)
        }

        return generatedTimeline
    }




    // Helper Methods Section //

    /**
     * Generates a list of links that represent a pair of leaf nodes that should
     * have a edge between them.
     * @param rootHierarchyNode A d3 node that represents the root node of the tree.
     * @returns An array of links that represent a pair of leaf nodes. One of
     * which has a reference to the other.
     */
    private getLeafNodeLinks = (rootHierarchyNode: d3.HierarchyPointNode<bPlusTreeNode>): d3.HierarchyPointLink<bPlusTreeNode>[] => {
        const getLeafNodes = (rootHierarchyNode: d3.HierarchyPointNode<bPlusTreeNode>): d3.HierarchyPointNode<bPlusTreeNode>[] => {
            if (rootHierarchyNode.data.isLeaf) {
                return [rootHierarchyNode]
            } else {
                let leafNodes: d3.HierarchyPointNode<bPlusTreeNode>[] = []
                rootHierarchyNode.children?.forEach((child) => {
                    leafNodes = leafNodes.concat(getLeafNodes(child))
                })
                return leafNodes
            }
        }
        const leafNodes = getLeafNodes(rootHierarchyNode)

        const leafNodeLinks: d3.HierarchyPointLink<bPlusTreeNode>[] = []
        leafNodes.forEach((leafNode) => {
            const rightSiblingBPlusTreeNode = leafNode.data.pointers[this.n - 1]
            if (rightSiblingBPlusTreeNode != undefined) {
                const rightSiblingNode = leafNodes.find((leafNode) => leafNode.data == rightSiblingBPlusTreeNode)

                if (rightSiblingNode == undefined) {
                    throw new Error("malformed data structure")
                }

                leafNodeLinks.push({
                    source: leafNode,
                    target: rightSiblingNode
                })
            }
        })
        return leafNodeLinks
    }

    /**
     * creates a new set of text dom elements for a B+ Tree node
     * @param newTextSelection A d3 selection of text data that are to be created.
     * @param isTransparent toggles wether or not text element is transparent
     * initially. This exists so that text reveal can be animated.
     * @return textElementSelection the selection of newly created text elements
     */
    private createNewNodeText(newTextSelection: d3.Selection<d3.EnterElement, number, SVGGElement | d3.BaseType, d3.HierarchyPointNode<bPlusTreeNode>>,
        isTransparent = false): d3.Selection<SVGTextElement, number, d3.BaseType, unknown> {
        const newSvgTextElement = newTextSelection.append("text")
        let textElementSelection = newSvgTextElement.attr("class", "node-key-text")
            // Calculate the x coordinate of the text based on its index in the
            // key array.
            .attr("x", (_, i) => { return this.pointerRectWidth + (this.keyRectWidth / 2) + i * (this.keyRectWidth + this.pointerRectWidth) })
            .attr("y", this.nodeHeight / 2)
            .attr("fill", "#48D016")
            .html(d => { return d ? String(d) : "" })

        if (isTransparent) {
            textElementSelection = textElementSelection.attr("opacity", 0)
        }

        return textElementSelection
    }

    /**
     * 
     * Returns the string that represents the svg transform attribute for a
     * B+ Tree node. This function exists to keep the logic for calculating a
     * nodes placement in one spot.
     * @param x The x coordinate of the node
     * @param y The y coordinate of the node
     * @dependency this.nodeWidth The width of a bplus tree node
     * @return String The string meant to be used as the transform attribute
     */
    private getNodeTransformString = (x: number, y: number) => {
        return "translate(" + String(x - this.nodeWidth / 2) + "," + String(y) + ")"
    }

    /**
     * Creates a string that represents the svg path for a B+ Tree node edge.
     * Do not change interface createNewEdgeSvgElements depends on it.
     * @param d A d3 datum that contains the source and target data for a B+ Tree edge.
     * @return The string meant to be used as the d attribute of an svg path element.
     */
    private generateEdgePathFN = (d: d3.HierarchyPointLink<bPlusTreeNode>) => {
        const targetIndex = d.source.data.pointers.indexOf(d.target.data)

        const sourceX = (d.source.x - ((this.nodeWidth / 2) - (this.pointerRectWidth / 2))) + ((this.pointerRectWidth + this.keyRectWidth) * targetIndex)
        const sourceY = d.source.y + this.nodeHeight / 2

        const path = d3Path()
        path.moveTo(sourceX, sourceY)
        //draw a solid circle with a radius of 2 at the source of the edge
        path.bezierCurveTo(sourceX, sourceY + 70, d.target.x, d.target.y - 50, d.target.x, d.target.y)

        return path.toString()
    }

    /**
     * Create a svg path element and insert it into the DOM so that it can be used
     * in a call to the morphTo method of the animejs library.
     * @param d A d3 datum that contains the source and target data for a B+ Tree edge.
     * @param isLeaf Changes the path generator function to match the case of leaf edge vs node edge.
     * @sideEffect Adds a path element as a child of the defs element of the main svg element.
     * @sideEffect Throws error on failure to select the defs element.
     * @return The created path element
     */
    private generateMorphToPath = (d: d3.HierarchyPointLink<bPlusTreeNode>, isLeaf = false) => {
        let pathString = this.generateEdgePathFN(d)
        if (isLeaf) {
            pathString = this.generateLeafEdgePathFN(d)
        }

        let svgElement = document.createElementNS(SVG_NS, "path");
        svgElement.setAttribute("d", pathString);

        const defsElement: SVGElement | null = document.querySelector(this.mainSvgId + " defs")
        if (!defsElement) {
            throw new Error("defs element not found")
        }

        defsElement.appendChild(svgElement);
        return svgElement
    }

    /**
     * Creates a string that represents the svg path for a B+ Tree leaf edge.
     * @param d A d3 datum that contains the source and target data for a B+ Tree leaf edge.
     * @return The string meant to be used as the d attribute of an svg path element.
     */
    private generateLeafEdgePathFN = (d: d3.HierarchyPointLink<bPlusTreeNode>) => {
        const path = d3Path()

        const x1 = (this.nodeWidth / 2) - (this.pointerRectWidth / 2)
        const x2 = (this.nodeWidth / 2)

        path.moveTo(d.source.x + x1, d.source.y + this.nodeHeight / 2)
        path.lineTo(d.target.x - x2, d.target.y + this.nodeHeight / 2)
        return path.toString()
    }

    /**
     * Creates a new set of svg elements for B+ Tree edges.
     * @param edgeSelection A selection of svg path elements that correspond to
     * a B+ Tree edges.
     * @param areLeafNodeEdges toggles wether or not the edges are to be
     * generated for links between leaf node siblings or not.
     * @param isTransparent toggles wether or not the edges are transparent
     * initially. This exists so that edge reveal can be animated.
     * @return newEdgesSvgElements the selection of newly created svg path
     * elements
     * @dependency this.nodeWidth The width of a bplus tree node
     * @dependency this.nodeHeight The height of a bplus tree node
     * @dependency this.pointerRectWidth The width of a bplus tree pointer
     * rectangle
     * @dependency this.keyRectWidth The width of a bplus tree key rectangle
     */
    private createNewEdgeSvgElements(edgeSelection: d3.Selection<SVGPathElement, d3.HierarchyPointLink<bPlusTreeNode>, d3.BaseType, unknown>,
        areLeafNodeEdges = false, isTransparent = true): d3.Selection<SVGPathElement, d3.HierarchyPointLink<bPlusTreeNode>, d3.BaseType, unknown> {
        let className = this.edgeClassName
        let edgePathFnGenerator = this.generateEdgePathFN

        if (areLeafNodeEdges) {
            edgePathFnGenerator = this.generateLeafEdgePathFN
            className = this.leafNodeEdgeClassName
        }

        const newEdges = edgeSelection.enter().append("path")
            .attr("class", className)
            .attr("d", edgePathFnGenerator)
            .attr("fill", "none")
            .attr("id", (d) => { return this.edgeClassName + "-" + String(d.source.data.id) + "-" + String(d.target.data.id) })
            .attr("stroke", "black")
            .attr("stroke-width", "2px")
            .attr("marker-end", "url(#arrow)")
            .attr("marker-start", "url(#circle)")
            .attr("opacity", isTransparent ? 0 : 1) //make edges invisible by default so that they can be animated in later")

        return newEdges
    }

    /**
     * 
     * Creates a HTML element that represents one bplus tree node. This method
     * exists to keep all styling of bplus tree nodes in one spot. The origin of
     * the node is at its top left corner. By default all nodes are made invisible when created
     * so that they can later be revealed in an animation.
     * @param node The bPlusTreeNode to create an svg element for.
     * @param x The x coordinate of the node. Defaults to 0.
     * @param y The y coordinate of the node. Defaults to 0.
     * @param isTransparent Toggles wether or not the node is transparent. Defaults to true.
     *
     * @dependency this.n The size of a bplus tree node
     * @return SVGGElement The SVGGElement that was created
     */
    private createNodeElement(node: bPlusTreeNode, x = 0, y = 0, isTransparent = true): SVGGElement {
        let transparencyValue = 0
        if (isTransparent == false) {
            transparencyValue = 1
        }


        const newGElementsSelection = select(this.mainSvgId).append("g")
            .attr("class", "node")
            .attr("id", String(node.id))
            .attr("transform-origin", "center")
            .attr("transform", this.getNodeTransformString(x, y))
            .attr("opacity", transparencyValue)

        for (let i = 0; i < (this.n - 1); i++) {
            const currentXCordOrigin = i * (this.pointerRectWidth + this.keyRectWidth)
            newGElementsSelection.append('rect')
                .attr("class", this.nodeRectClassName)
                .attr("width", this.pointerRectWidth)
                .attr("height", this.nodeHeight)
                .attr("x", currentXCordOrigin)
                .attr("y", 0)
                .attr("fill", this.lightGreen)
            newGElementsSelection.append('rect')
                .attr("class", this.nodeRectClassName)
                .attr("width", this.keyRectWidth)
                .attr("height", this.nodeHeight)
                .attr("x", currentXCordOrigin + this.pointerRectWidth)
                .attr("y", 0)
                .attr("fill", this.lightGreen)
        }
        newGElementsSelection.append('rect')
            .attr("class", this.nodeRectClassName)
            .attr("width", this.pointerRectWidth)
            .attr("height", this.nodeHeight)
            .attr("x", (this.n - 1) * (this.pointerRectWidth + this.keyRectWidth))
            .attr("y", 0)
            .attr("fill", this.lightGreen)

        return newGElementsSelection.nodes()[0]
    }

    //TODO this method may be adding complexity in the long run. Consider removing it
    //especially if later more params are needed.
    /**
     *
     * Create animation based on the current state of the B+ Tree.
     * This method is meant to be called by the operation methods (ex. insert or delete).
     * @returns The on completion promise of the generated animation
     * @sideEffect any currently animating algorithm step will be interrupted
     * and a new one corresponding to the latest operation will begin
     * @sideEffect all exit selections stored in this.exitSelection will
     * be removed from the DOM
     * @sideEffects Manipulates the DOM by adding svg elements for animation
     * @sideEffects adds d3 selections to the exitSelections array for removal
     * @sideEffect sets this.currentAnimation to the newly created animation
     */
    private animateOperation() {
        //This needs to be done so that the old elements that are no longer relevant
        //do not interfere with the new animation. If this wasn't done then the new selections
        //could potentially be erroneously selecting old irrelevant elements.
        this.exitSelections.forEach(selection => {
            selection.remove()
        })

        const timeline = createTimeline({
            autoplay: false,
            defaults: {
                duration: this.animationDuration,
                ease: 'linear'
            }
        })

        const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(this.bPlusTreeRoot, (node) => {
            if (node.isLeaf) {
                return []
            } else {
                return node.pointers
            }
        }))

        const operationSudoCodeDivs = document.querySelectorAll(".operation-sudo-code");
        if (operationSudoCodeDivs == null) {
            throw new Error("sudo code div not found in the DOM")
        }
        // we do this so that the previous sudo code for the previous operation is
        // hidden.
        operationSudoCodeDivs.forEach((div) => {
            div.classList.remove("active")
        })
        const insertSudoCodeDiv = document.querySelector("#insert-sudo-code")
        if (insertSudoCodeDiv == null) {
            throw new Error("insert sudo code div not found in the DOM")
        }
        insertSudoCodeDiv.classList.add("active")

        //enter/new section
        const nodeSelection = select(this.mainSvgId)
            .selectAll<SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>>("g." + this.nodeClassName)
            .data(rootHierarchyNode, (d) => (d).data.id)
        const newNodes = this.createNodeSvgElements(nodeSelection.enter())

        //create svg elements for the new edges created by the split
        const edgeSelection = select(this.mainSvgId)
            .selectAll<SVGPathElement, d3.HierarchyPointLink<bPlusTreeNode>>("path." + this.edgeClassName)
            .data(rootHierarchyNode.links(), (d) => (d).source.data.id + "-" + (d).target.data.id)
        const newEdges = this.createNewEdgeSvgElements(edgeSelection)

        const leafNodeLinks = this.getLeafNodeLinks(rootHierarchyNode)
        const leafNodeEdgeSelection = select(this.mainSvgId)
            .selectAll<SVGPathElement, d3.HierarchyPointLink<bPlusTreeNode>>("path." + this.leafNodeEdgeClassName)
            .data(leafNodeLinks, (d) => (d).source.data.id + "-" + (d).target.data.id)
        const newLeafEdges = this.createNewEdgeSvgElements(leafNodeEdgeSelection, true)

        const oldNodeTextSelection = nodeSelection.selectAll("text." + this.keyTextClassName)
            .data((d) => d.data.keys)
        const oldNodesNewTextSelection = this.createNewNodeText(oldNodeTextSelection.enter(), true)

        const newNodesTextSelection = newNodes.selectAll<SVGTextElement, number>("text." + this.keyTextClassName)
            .data((d) => d.data.keys)
        const newNodesNewTextSelection = this.createNewNodeText(newNodesTextSelection.enter(), true)

        //@ts-expect-error
        timeline.add(
            [...newEdges.nodes(), ...newLeafEdges.nodes(),],
            { opacity: 1 }
        )

        const moveSudoCodeRectangle = this.createSudoCodeRectangleObj(timeline)
        moveSudoCodeRectangle(1)
        moveSudoCodeRectangle(2)
        //@ts-expect-error
        timeline.add(
            [...newNodes],
            {
                opacity: { to: 1, ease: "outQuad" },
            }
        )
        const newSVGGElementsRectChildren = newNodes.nodes().map((element) => {
            //check each child array for rect elements and only select those.
            const rectChildNodes: ChildNode[] = []
            element.childNodes.forEach((child) => {
                if (child.nodeName == "rect") {
                    rectChildNodes.push(child)
                }
            })
            return rectChildNodes
        })
        if (newSVGGElementsRectChildren.length != 0) {
            timeline.add(
                newSVGGElementsRectChildren[0],
                {
                    translateY: { from: "-40" }
                },
                '<<'
            )
        }
        //@ts-expect-error
        timeline.set(newSVGGElementsRectChildren[0],
            {
                fill: this.lightBlue
            }
        )
        moveSudoCodeRectangle(4)
        moveSudoCodeRectangle(5)
        //@ts-expect-error
        timeline.set([...newNodesNewTextSelection.nodes(), ...oldNodesNewTextSelection.nodes()],
            {
                opacity: 1
            }
            //@ts-expect-error
        ).add([...newNodesNewTextSelection.nodes(), ...oldNodesNewTextSelection.nodes()],
            {
                translateY: { from: "-40" },
                duration: this.animationDuration * 2
                //@ts-expect-error
            }).set([...newNodesNewTextSelection.nodes(), ...oldNodesNewTextSelection.nodes()],
                {
                    fill: "#000000"
                }
            )
        moveSudoCodeRectangle(9)
        moveSudoCodeRectangle(9, true)

        //update section
        const updatedSVGGElements = nodeSelection.nodes()
        const updatedNodesData = nodeSelection.data()
        const updatedTextSelection = oldNodeTextSelection.nodes()
        const updatedTextData = oldNodeTextSelection.data()
        const updatedEdges = edgeSelection.nodes()
        const updatedEdgesData = edgeSelection.data()
        const updatedLeafNodeEdges = leafNodeEdgeSelection.nodes()
        const updatedLeafNodeEdgesData = leafNodeEdgeSelection.data()

        // @ts-expect-error
        timeline.add(
            updatedSVGGElements,
            {
                transform: (_: SVGGElement, i: number) => {
                    return "translate(" + String(updatedNodesData[i].x - this.nodeWidth / 2) + "," + String(updatedNodesData[i].y) + ")"
                }
            }
        )
        updatedTextSelection.forEach((text, i) => {
            const textData = updatedTextData[i].toString()
            if (textData == text.textContent) {
                return
            }
            timeline.add(
                text,
                {
                    opacity: 0,
                    onComplete: () => {
                        text.textContent = textData // Update the text
                    }
                },
                '<<'
            )
            timeline.add(
                text,
                {
                    opacity: 1,
                },
                '>>'
            );
        });

        updatedEdges.forEach((edge, i) => {
            timeline.add(
                edge,
                {
                    d: animeSvg.morphTo(this.generateMorphToPath(updatedEdgesData[i]))
                },
                "<<"
            )
        })

        updatedLeafNodeEdges.forEach((edge, i) => {
            timeline.add(
                edge,
                {
                    d: animeSvg.morphTo(this.generateMorphToPath(updatedLeafNodeEdgesData[i], true))
                },
                "<<"
            )
        })


        //exit section
        const textExitSelection = oldNodeTextSelection.exit()
        const edgeExitSelection = edgeSelection.exit()
        const leafEdgeExitSelection = leafNodeEdgeSelection.exit()
        const nodeExitSelection = nodeSelection.exit()

        this.exitSelections.push(textExitSelection)
        this.exitSelections.push(edgeExitSelection)
        this.exitSelections.push(leafEdgeExitSelection)
        this.exitSelections.push(nodeExitSelection)

        //@ts-expect-error
        timeline.add(
            [...textExitSelection.nodes(), ...edgeExitSelection.nodes(), ...leafEdgeExitSelection.nodes(), ...nodeExitSelection.nodes()],
            { opacity: 0 }
        )

        this.currentAnimation = timeline

        return timeline.then(() => true)
    }

    //TODO consider getting rid of the factory part of this.
    /**
     *
     * Represents the sudo code rectangle that is used to provide a visual
     * indication of where the animation is currently at in the sudo code.
     * @param timeline the timeline to add the animations to
     * @param operationType the type of operation that the sudo code rectangle
     * is being used for.
     * @dependency The specific css and html sudo code definitions located in the
     * index.html file and the style.css files.
     * @returns A function used to move the sudo code rectangle to a specific line
     */
    private createSudoCodeRectangleObj(timeline: Timeline, operationType: OperationType) {
        const sudoCodeLineHeight = "1lh"
        const style = getComputedStyle(document.body)
        const sudoCodeRectWidth = style.getPropertyValue("--sudo-code-rectangle-width")
        //We need this so that we can compute the width of the rectangle
        //The width is stored in em units so we need to convert it to pixels.
        const sudoCodeRectWidthFloat = parseFloat(sudoCodeRectWidth)
        const sudoCodeLineHeightFloat = parseFloat(sudoCodeLineHeight)
        const sudoCodeRectangle = document.querySelector("#" + operationType + "-cursor") // id defined in the index.html file
        const insertSudoCodeDiv = document.querySelector("#insert-sudo-code")
        const insertParentSudoCodeDiv = document.querySelector("#insert-parent-sudo-code")
        let divArray = [insertSudoCodeDiv, insertParentSudoCodeDiv]
        if (!insertSudoCodeDiv || !insertParentSudoCodeDiv || !sudoCodeRectangle) {
            throw new Error("incorrect html DOM structure")
        }
        if (!timeline) {
            throw new Error("bad timeline object passed in")
        }
        let divToReveal: null | Element = null
        if (operationType == "insert") {
            divToReveal = insertSudoCodeDiv
        } else if (operationType == "insert-parent") {
            divToReveal = insertParentSudoCodeDiv
        }
        divArray = divArray.filter((div) => {
            div !== divToReveal
        })
        if (divToReveal == null) {
            throw new Error("bad HTML structure or bad query selector string")
        }
        // this will be used to convert em units to pixels
        const fontSize = parseFloat(window.getComputedStyle(divToReveal).fontSize)

        //@ts-expect-error
        timeline.add(divToReveal, {
            opacity: 1,
        })
        // hide all the other sudo code that isn't being used
        divArray.forEach((div) => {
            timeline.set(div, {
                opacity: 0
            }, "<<")
        })

        /**
         *
         * Add sudo code rectangle animations to the timeline
         * @param sudoCodeLineGoal the line number of the sudo code that the rectangle
         * should be moved to
         * @param end If true the rectangle will be moved back to its starting position and
         * sudoCodeLineGoal will be ignored.
         * @returns Timeline the modified timeline
         * @sideEffect adds animations to the given timeline
         */
        const moveSudoCodeRectangle = (sudoCodeLineGoal: number, end = false) => {
            const sudoCodeLineGoalElement = document.querySelector("#" + operationType + "-line" + String(sudoCodeLineGoal))
            if (!sudoCodeLineGoalElement) {
                throw new Error("bad HTML structure or bad query selector string")
            }
            // The width of the rectangle hast to be added to the offset with because
            // padding of the parent element is used to position the rectangle. This extra
            // width needs to be accounted for.
            const widthToAnimate = (sudoCodeLineGoalElement as HTMLElement).offsetWidth + (sudoCodeRectWidthFloat * fontSize)
            // Since the rectangle starts at the first line we don't need to move it there first.
            // This is defined in the index.html file
            if (end) {
                //@ts-expect-error
                timeline.add(sudoCodeRectangle, {
                    width: sudoCodeRectWidth,
                    //@ts-expect-error
                }).add(sudoCodeRectangle, {
                    top: ((sudoCodeLineHeightFloat * 1) - 1) + "lh",
                })
            } else if (sudoCodeLineGoal == 1) {
                //@ts-expect-error
                timeline.add(sudoCodeRectangle, {
                    width: widthToAnimate + "px",
                })
            } else {
                //@ts-expect-error
                timeline.add(sudoCodeRectangle, {
                    width: sudoCodeRectWidth,
                    //@ts-expect-error
                }).add(sudoCodeRectangle, {
                    top: ((sudoCodeLineHeightFloat * sudoCodeLineGoal) - 1) + "lh",
                    //@ts-expect-error
                }).add(sudoCodeRectangle, {
                    width: widthToAnimate + "px",
                })
            }

            return timeline
        }

        return moveSudoCodeRectangle
    }
}