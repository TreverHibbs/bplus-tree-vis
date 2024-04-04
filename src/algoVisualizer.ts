//test strings
// 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21
// 1,2,3,4,5,6,7,8,9,10,11,12
// 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100
// 12, 7, 29, 45, 2, 33, 18, 51, 9, 37, 24, 6, 42, 15, 30
import { bPlusTreeNode } from "./types/bPlusTree"
import { AlgoStepHistory, AlgoStep } from "./algoStepHistory"
import { createTimeline, svg as animeSvg } from "./lib/anime.esm"
import { tree, hierarchy } from "d3-hierarchy"
import { select } from "d3-selection"
import { path as d3Path, text } from "d3"
export const SVG_NS = "http://www.w3.org/2000/svg"


/**
 * 
 * This class implements a B+tree algorithm (as described in the Database System
 * Concepts 7th edition) and generates functions that can animate that
 * algorithm. By using this class a web UI can animate a B+tree. Each instance of
 * this class corresponds to a rendered B+tree algorithm.   
 * @dependency For this class to function correctly there must be a blank svg element with
 * the id "main-svg".
 * */
export class AlgoVisualizer {
    /* number of pointers in a node */
    private readonly n: number
    private readonly sudoCodeContainer = document.querySelector("#sudo-code")
    /* When the bplus tree is empty it contains a bplus tree node with an empty
    keys array */
    private bPlusTreeRoot: bPlusTreeNode = new bPlusTreeNode(true)
    //Used in the undo method to restore the previous state of the tree and animation
    private previousBPlusTreeRoot: bPlusTreeNode = this.bPlusTreeRoot
    private previousInsertValue: number | null = null
    /** this is initialized using the color config defined in the :root pseudo
     * class rule of the style.css file*/
    private readonly highlightColor: string
    private readonly sudoCodeBackgroundColor: string
    private readonly keyRectWidth = 42
    private readonly nodeHeight = 29
    private readonly pointerRectWidth = 14
    private readonly nodeWidth: number
    //multiplied by node width to get gap value
    private readonly nodeSiblingsGap = 1.1
    private readonly nodeParentsGap = 2
    //added to the node size height to create a gap between parents and children.
    private readonly nodeChildrenGap = 50
    private readonly leafNodeEdgeClassName = "leaf-node-edge"
    private readonly edgeClassName = "edge"
    private readonly nodeClassName = "node"
    private readonly nodeRectClassName = this.nodeClassName + "-rect"
    private readonly keyTextClassName = "node-key-text"
    //this must match the id of the svg defined in the index.html file.
    private readonly mainSvgId = "#main-svg"
    /* in milliseconds */
    public animationDuration = 1000
    public currentAnimation = createTimeline({})
    /** used to get the x y coords of the trees nodes on the canvas */
    private readonly d3TreeLayout = tree<bPlusTreeNode>()
    // used to store d3 selections that will be removed at the start of a new animation.
    private exitSelections: (d3.Selection<SVGTextElement, unknown, SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>> |
        d3.Selection<SVGPathElement, unknown, d3.BaseType, d3.HierarchyPointNode<bPlusTreeNode>>)[] = []

    /**
     * allows control of the algorithm visualization. By calling the do and undo
     * methods of this object a user of this class can navigate the algorithm
     * visualization. Users of this class should not call the addAlgoStep method
     * of this object.
     */
    public readonly algoStepHistory = new AlgoStepHistory()


    /**
     * 
     * @param nodeSize Determines how many pointers are contained
     * in each node of the B+tree.
     */
    constructor(nodeSize: number) {
        this.n = nodeSize

        this.nodeWidth = (this.keyRectWidth + this.pointerRectWidth) * (this.n - 1) + this.pointerRectWidth

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

        //TODO consider this when implementing sudo code animations.
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


    //TODO add an option to either play animation normally or skip animation to complete state.
    /**
     *
     * Insert a number into the B+Tree if it is not already in the tree. And
     * generates an animation for that insertion.
     * @param value a number to insert into the B+Tree.
     * @param autoplay determines weather or not the animation plays when
     * function is called.
     * @returns The on completion promise of the generated animation
     * @dependency this.bPlusTreeRoot inserts value into this tree
     * @sideEffect any currently animating algorithm step will be interrupted
     * and a new one corresponding to this method will begin.
     * @sideEffect all exit selections stored in this.exitSelection will
     * be removed from the DOM.
     * @sideEffects Manipulates the DOM by adding svg elements and sudo code for animation, and
     * adds elements to the animations array.
     * @sideEffects adds d3 selections to the exitSelections array for removal
     * at before the next insertion animation is generated. Or before the
     * insertion is undone.
     * @sideEffect sets this.currentAnimation to the newly created animation.
     */
    private async insert(value: number, autoplay = true): Promise<unknown> {
        //This needs to be done so that the old elements that are no longer relevant
        //do not interfere with the new animation. If this wasn't done then the new selections
        //could potentially be erroneously selecting old irrelevant elements.
        this.exitSelections.forEach(selection => {
            selection.remove()
        })

        const timeline = createTimeline({
            defaults: {
                duration: this.animationDuration,
                ease: 'linear'
            }
        })

        const insertSudoCode = document.querySelector("#insert-sudo-code")
        if (this.sudoCodeContainer?.innerHTML && insertSudoCode?.innerHTML) {
            this.sudoCodeContainer.innerHTML = insertSudoCode?.innerHTML
        }

        let targetNode: bPlusTreeNode
        if (this.bPlusTreeRoot.keys.length == 0) { //empty tree
            targetNode = this.bPlusTreeRoot

        } else {
            const { found, node } = this.find(value)

            if (found) {
                // Do not allow duplicates
                return
            } else {
                targetNode = node
            }
        }

        // targetNode is ready to have the value inserted into it.
        if (targetNode == null || targetNode.keys.filter(element => typeof element == "number").length < (this.n - 1)) {
            this.insertInLeaf(targetNode, value)
        } else { //leaf node targetNode has n - 1 key values already, split it
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

            this.insertInParent(targetNode, newNode.keys[0], newNode)
        }

        // -- Animation Section -- //
        const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(this.bPlusTreeRoot, (node) => {
            if (node.isLeaf) {
                return []
            } else {
                return node.pointers
            }
        }))

        //enter/new section
        const nodeSelection = select(this.mainSvgId)
            .selectAll<SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>>("g." + this.nodeClassName)
            .data(rootHierarchyNode, (d) => (d).data.id)
        const newSVGGElements = this.createNodeSvgElements(nodeSelection.enter())

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

        const textSelection = nodeSelection.selectAll<SVGTextElement, number>("text." + this.keyTextClassName)
            .data((d) => d.data.keys)
        const newTextSelection = this.createNewNodeText(textSelection.enter(), true)

        // @ts-expect-error
        timeline.add(
            [...newSVGGElements, ...newEdges.nodes(), ...newLeafEdges.nodes(), ...newTextSelection.nodes()],
            { opacity: 1 }
        )


        //update section
        const updatedSVGGElements = nodeSelection.nodes()
        const updatedNodesData = nodeSelection.data()
        const updatedTextSelection = textSelection.nodes()
        const updatedTextData = textSelection.data()
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
        const textExitSelection = textSelection.exit()
        const edgeExitSelection = edgeSelection.exit()
        const leafEdgeExitSelection = leafNodeEdgeSelection.exit()

        this.exitSelections.push(textExitSelection)
        this.exitSelections.push(edgeExitSelection)
        this.exitSelections.push(leafEdgeExitSelection)

        //@ts-expect-error
        timeline.add(
            [...textExitSelection.nodes(), ...edgeExitSelection.nodes(), ...leafEdgeExitSelection.nodes()],
            { opacity: 0 }
        )


        this.currentAnimation = timeline
        return timeline.then(() => true)
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
            parentNode.keys.splice(leftNodeIndex + 1, 0, value)
        } else { // split
            const tempKeys = parentNode.keys.slice()
            const tempPointers = parentNode.pointers.slice()

            tempPointers.splice(leftNodeIndex + 1, 0, rightNode)
            tempKeys.splice(leftNodeIndex + 1, 0, value)

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



    // Undoable Methods Section //
    /**
     * Inserts a value into the BPlus Tree and animates it. Also allows for the
     * redoing undoing of that insert. Making sure that state is remembered for
     * proper restoring.
     * @param value the number to insert, duplicates can't be added to the tree
     * @return The on completion promise of the generated animation
     * @dependency undefined behavior if another undoable method is called before
     * the previous undoable method has completed.
     * @dependency reads this.previousBPlusTreeRoot to set the closure for the
     * created algo step.
     * @dependency if you call this method right after a previous animation generated by and
     * undoable method operation is completed the animation generated by this method will be wrong.
     * Wait at least 10 milliseconds after the completion of the on completion promise of 
     * the previous animation.
     * @dependency this.previousInsertValue to set the closure for the created algo step
     * @sideEffect adds an AlgoStep object corresponding to this insert to this.algoStepHistory
     * @sideEffect sets the this.previousBPlusTreeRoot to the state of the tree before the last insert
     * @sideEffect sets the this.previousInsertValue to the value of the last insert
     */
    public async undoableInsert(value: number) {
        let valueBeforePreviousInsert: number | null = null

        //set the closure variables for the algo step object.
        const BPlusTreeRootStateBeforePreviousInsert = structuredClone(this.previousBPlusTreeRoot)
        valueBeforePreviousInsert = this.previousInsertValue

        /**
         * Undoes the operations of the corresponding insert method call, which
         * is defined in the insertDo function definition. All state including
         * the DOM should be returned to exactly how it was.
         * @returns boolean indicates success or failure
         * @sideEffect Remove Dom elements that were added by the insertDo function
         * @sideEffect Restore the state of this.bPlusTreeRoot to what it was before
         * the corresponding insertDo function was called.
         */
        const insertUndo = () => {
            this.exitSelections.forEach(selection => {
                selection.remove()
            })

            const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(BPlusTreeRootStateBeforePreviousInsert, (node) => {
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
            //this.createNodeSvgElements(nodeSelection.enter(), false)
            nodeSelection.filter((d) => d.data.keys.length === 0).remove() //remove the root node if it is empty.
            //nodeSelection.attr("transform", this.getNodeTransformString)

            nodeSelection.attr("transform", this.getNodeTransformString)

            const textSelection = nodeSelection.selectAll("text." + this.keyTextClassName)
                .data((d) => d.data.keys)
            textSelection.exit().remove()
            this.createNewNodeText(textSelection.enter(), false)

            // return the global state to its state before the previous insert.
            this.bPlusTreeRoot = structuredClone(BPlusTreeRootStateBeforePreviousInsert)
            this.previousInsertValue = valueBeforePreviousInsert
            this.previousBPlusTreeRoot = structuredClone(BPlusTreeRootStateBeforePreviousInsert)

            if (valueBeforePreviousInsert == null) {
                return true
            }
            this.insert(valueBeforePreviousInsert)
            return true
        }

        /**
         *
         * Executes an insert that can be undone later so that all sate
         * including the DOM is returned to its sate from before the method call.
         * @returns The on completion promise of the generated animation
         * @sideEffect the global state this.previousBPlusTreeRoot will be set.
         * @sideEffect the global state this.previousInsertValue will be set.
         */
        const insertDo = async () => {
            // set the global state so that future undoable inserts can create
            // correct closures for undoing.
            this.previousBPlusTreeRoot = structuredClone(this.bPlusTreeRoot)
            this.previousInsertValue = value
            return this.insert(value)
        }

        const insertAlgoStep: AlgoStep = {
            do: insertDo,
            undo: insertUndo
        }

        this.algoStepHistory.addAlgoStep(insertAlgoStep)

        return insertAlgoStep.do()
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
                    throw new Error("rightSiblingNode is undefined")
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
     * @param d d3.HierarchyPointNode<bPlusTreeNode> The node to generate the transform string for.
     * @dependency this.nodeWidth The width of a bplus tree node
     * @return String The string meant to be used as the transform attribute
     */
    private getNodeTransformString = (d: d3.HierarchyPointNode<bPlusTreeNode>) => {
        return "translate(" + String(d.x - this.nodeWidth / 2) + "," + String(d.y) + ")"
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
     * @param nodeEnterSelection A selection containing newly added BPlus tree nodes.
     * @param isTransparent Toggles wether or not the node is transparent. Defaults to true.
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
            .attr("id", d => { return this.nodeClassName + String(d.data.id) })
            .attr("transform-origin", "center")
            .attr("transform", this.getNodeTransformString)
            .attr("opacity", transparencyValue)

        for (let i = 0; i < (this.n - 1); i++) {
            const currentXCordOrigin = i * (this.pointerRectWidth + this.keyRectWidth)
            newGElementsSelection.append('rect')
                .attr("class", this.nodeRectClassName)
                .attr("width", this.pointerRectWidth)
                .attr("height", this.nodeHeight)
                .attr("x", currentXCordOrigin)
                .attr("y", 0)
            newGElementsSelection.append('rect')
                .attr("class", this.nodeRectClassName)
                .attr("width", this.keyRectWidth)
                .attr("height", this.nodeHeight)
                .attr("x", currentXCordOrigin + this.pointerRectWidth)
                .attr("y", 0)
        }
        newGElementsSelection.append('rect')
            .attr("class", this.nodeRectClassName)
            .attr("width", this.pointerRectWidth)
            .attr("height", this.nodeHeight)
            .attr("x", (this.n - 1) * (this.pointerRectWidth + this.keyRectWidth))
            .attr("y", 0)

        const textEnterSelection = newGElementsSelection.selectAll("text." + this.keyTextClassName)
            .data((d) => d.data.keys).enter()

        this.createNewNodeText(textEnterSelection)

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