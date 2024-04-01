//TODO test the other insert cases and go from there
//test strings
// 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21
// 1,2,3,4,5,6,7,8,9,10,11,12
// 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100
import { bPlusTreeNode } from "./types/bPlusTree"
import { AlgoStepHistory, AlgoStep } from "./algoStepHistory"
import "animejs"
import anime, { AnimeTimelineInstance, timeline } from "animejs"
import { createTimeline, Timeline, svg as animeSvg, utils } from "./lib/anime.esm"
import { tree, hierarchy } from "d3-hierarchy"
import { select } from "d3-selection"
import { linkVertical } from "d3-shape"
//import d3 link generator
import { link } from "d3-shape"
//import bezierCurveTo
import { path as d3Path, svg } from "d3"
import ts from "typescript"
//import { text } from "d3"
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
    private readonly sudoCodeContainer = document.querySelector("#sudo-code")
    /* When the Bplus tree is empty it contains a bplus tree node with an empty
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
    /* in milliseconds */
    public animationDuration = 1000 //must not be any less than 0.2
    //private readonly animations: Timeline[] = []
    //private readonly currentAnimation: anime.AnimeTimelineInstance
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
            //if the nodes are siblings then the separation is 1
            //TODO make this actually work for inner nodes. So that inner nodes are closer
            //than leaf nodes. Also this should probably be dynamically caluclated based on
            //node size.
            if (a.parent == b.parent) {
                return this.nodeSiblingsGap
            } else {
                return 1
            }
        })

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


    //TODO add an optoint to either play animation normally or skip animation to complete state.
    /**
     *
     * Insert a number into the B+Tree if it is not already in the tree. And
     * generates an animation for that insertion.
     * 
     * @param value a number to insert into the B+Tree.
     * @param autoplay determines weather or not the animation plays when
     * function is called.
     *
     * @returns the algoVis instance
     * @sideEffects Manipulates the DOM by adding svg elements and sudo code for animation, and
     * adds elements to the animations array.
     * @sideEffects adds d3 selections to the exitSelections array for removal
     * at before the next insertion animation is generated. Or before the
     * insertion is undone.
     * @sideEffect sets this.currentAnimation to the newly created animation.
     */
    private async insert(value: number, autoplay = true) {
        // Initialize animation
        const timeline = createTimeline({
            defaults: {
                duration: this.animationDuration,
                ease: 'linear'
            }
        })
        const timelineCompletePromise = timeline.then(() => true)
        // const timeline = anime.timeline({
        //     duration: 0.1,
        //     endDelay: this.animationDuration - 0.1,
        //     autoplay: autoplay,
        //     easing: 'linear'
        // });

        const insertSudoCode = document.querySelector("#insert-sudo-code")
        if (this.sudoCodeContainer?.innerHTML && insertSudoCode?.innerHTML) {
            this.sudoCodeContainer.innerHTML = insertSudoCode?.innerHTML
        }

        let targetNode: bPlusTreeNode
        if (this.bPlusTreeRoot.keys.length == 0) {
            //targetNode = new bPlusTreeNode(true)
            targetNode = this.bPlusTreeRoot

            // create a new svg element for the root node for animation
            //const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(targetNode, (node) => { return node.pointers }))
            // const nodeSelection = select("#main-svg")
            //     .selectAll<SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>>("g.node")
            //     .data(rootHierarchyNode, (d) => d.data.id)
            // const newSVGGElement = this.createNodeSvgElements(nodeSelection.enter())

            //this.addHighlightTextAnimation(timeline, 2)
            // create animation that reveals new node
            // timeline.add(newSVGGElement, { opacity: 1, duration: 0.1 })
            //timeline.add({
            //    targets: newSVGGElement,
            //    opacity: 1
            //}, "-=" + String(this.animationDuration))
        } else {
            const { found, node } = this.find(value)

            //this.addHighlightTextAnimation(timeline, 3)
            if (found) {
                // Do not allow duplicates
                //this.animations.push(timeline)
                return
            } else {
                targetNode = node
            }
        }

        //this.addHighlightTextAnimation(timeline, 4)

        // targetNode is ready to have the value inserted into it.
        if (targetNode == null || targetNode.keys.filter(element => typeof element == "number").length < (this.n - 1)) {
            //insert in leaf
            //this.addHighlightTextAnimation(timeline, 5)

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
        // create svg elements for the new bplus tree nodes created by splits.
        const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(this.bPlusTreeRoot, (node) => {
            if (node.isLeaf) {
                return []
            } else {
                return node.pointers
            }
        }))

        //enter/new section
        const nodeSelection = select("#main-svg")
            .selectAll<SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>>("g.node")
            .data(rootHierarchyNode, (d) => (d).data.id)
        const newSVGGElements = this.createNodeSvgElements(nodeSelection.enter())

        //create svg elements for the new edges created by the split
        const edgeSelection = select("#main-svg")
            .selectAll<SVGPathElement, d3.HierarchyPointLink<bPlusTreeNode>>("path.edge")
            .data(rootHierarchyNode.links(), (d) => (d).source.data.id + "-" + (d).target.data.id)
        const newEdges = this.createNewEdgeSvgElements(edgeSelection)

        const leafNodeLinks = this.getLeafNodeLinks(rootHierarchyNode)
        const leafNodeEdgeSelection = select("#main-svg")
            .selectAll<SVGPathElement, d3.HierarchyPointLink<bPlusTreeNode>>("path.leaf-node-edge")
            .data(leafNodeLinks, (d) => (d).source.data.id + "-" + (d).target.data.id)
        const newLeafEdges = this.createNewEdgeSvgElements(leafNodeEdgeSelection, true)

        const textSelection = nodeSelection.selectAll<SVGTextElement, number>("text.node-key-text")
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


        // exit section
        const textExitSelection = textSelection.exit()
        const edgeExitSelection = edgeSelection.exit()

        this.exitSelections.push(textExitSelection)
        this.exitSelections.push(edgeExitSelection)

        // @ts-expect-error
        timeline.add(
            [...textExitSelection.nodes(), ...edgeExitSelection.nodes()],
            { opacity: 0 }
        )

        this.currentAnimation = timeline
        const promiseResult = await timelineCompletePromise
        if(promiseResult){
            console.debug("animation complete")
        }
        
        return
    }

    /**
     * A sub procedure for the insert method
     *
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

            const textSelection = select("#node-id-" + String(targetNode.id))
                .selectAll("text")
                .data(targetNode.keys)
            const textElementSelection = this.createNewNodeText(textSelection.enter(), true)

            // This function call does not need a third argument. Beta problem I think.
            //returnTimeline.add(textElementSelection.nodes(), { opacity: 1, duration: 0.1 })
            //returnTimeline.add({
            //    targets: textElementSelection.nodes(),
            //    opacity: 1
            //}, "-=" + String(this.animationDuration))
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
            // const textSelection = select("#node-id-" + String(targetNode.id))
            //     .selectAll("text")
            //     .data(targetNode.keys)
            // const textElementSelection = this.createNewNodeText(textSelection.enter(), true)

            // This function call does not need a third argument. Beta problem I think.
            //returnTimeline.add(textElementSelection.nodes(), { opacity: 1, duration: 0.1 })
            // returnTimeline.add({
            //     targets: textElementSelection.nodes(),
            //     opacity: 1
            // }, "-=" + String(this.animationDuration))
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
        return 1
    }



    // Undoable Methods Section //
    /**
     * Inserts a value into the BPlus Tree and animates it. Also allows for the
     * redoing undoing of that insert. Making sure that state is remembered for
     * proper restoring.
     * @param value the number to insert, duplicates can't be added to the tree.
     * @dependency this.bPlusTreeRoot used to insert the value
     * @dependency reads this.previousBPlusTreeRoot to set the closure for the
     * created algo step.
     * @dependency this.previousInsertValue to set the closure for the created algo step.
     * @sideEffect adds an AlgoStep object corresponding to this insert to this.algoStepHistory
     * @sideEffect any currently animating algorithm step will be interrupted
     * and a new one corresponding to this method will begin.
     * @sideEffect sets the this.previousBPlusTreeRoot to the state of the tree before the last insert.
     * @sideEffect sets the this.previousInsertValue to the value of the last insert.
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

            const edgeSelection = select("#main-svg")
                .selectAll<SVGPathElement, d3.HierarchyPointLink<bPlusTreeNode>>("path.edge")
                .data(rootHierarchyNode.links())
            edgeSelection.exit().remove()

            const leafNodeLinks = this.getLeafNodeLinks(rootHierarchyNode)
            const leafNodeEdgeSelection = select("#main-svg")
                .selectAll<SVGPathElement, d3.HierarchyPointLink<bPlusTreeNode>>("path.leaf-node-edge")
                .data(leafNodeLinks)
            leafNodeEdgeSelection.exit().remove()

            const nodeSelection = select("#main-svg")
                .selectAll<SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>>("g.node")
                .data(rootHierarchyNode, (d) => d.data.id)

            nodeSelection.exit().remove()
            //this.createNodeSvgElements(nodeSelection.enter(), false)
            nodeSelection.filter((d) => d.data.keys.length === 0).remove() //remove the root node if it is empty.
            //nodeSelection.attr("transform", this.getNodeTransformString)

            nodeSelection.attr("transform", this.getNodeTransformString)

            const textSelection = nodeSelection.selectAll("text.node-key-text")
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
         * Executes an insert that can be undone later so that all sate
         * including the DOM is returned to its sate from before the method call.
         * 
         * @returns indicates success or failure
         * @sideEffect all exit selections stored in this.exitSelection will
         * be removed from the DOM.
         * @sideEffect the global state this.previousBPlusTreeRoot will be set.
         * @sideEffect the global state this.previousInsertValue will be set.
         */
        const insertDo = async () => {
            // set the global state so that future undoable inserts can create
            // correct closures for undoing.
            this.previousBPlusTreeRoot = structuredClone(this.bPlusTreeRoot)
            this.previousInsertValue = value
            //remove all selection in this.exitSelections
            this.exitSelections.forEach(selection => {
                selection.remove()
            })
            await this.insert(value)

            return true
        }

        const insertAlgoStep: AlgoStep = {
            do: insertDo,
            undo: insertUndo
        }

        // Must execute the do method before it is added, because addAlgoStep
        // assumes that that algo step was the last algo step executed.
        await insertAlgoStep.do()
        this.algoStepHistory.addAlgoStep(insertAlgoStep)

        return

    }



    // Helper Methods Section //

    /**
     * Generates a list of links that represent a pair of leaf nodes that should
     * have a edge between them.
     * @param rootHierarchyNode A node that represents the DOM element of the
     * root node of the tree.
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
     *
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

        // let svgElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
        // svgElement.setAttribute("d", path.toString());

        // const defsElement: SVGElement | null = document.querySelector('#main-svg defs')
        // if(!defsElement){
        //     throw new Error("defs element not found")
        // }

        // defsElement.appendChild(svgElement);
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

        let svgElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
        svgElement.setAttribute("d", pathString);

        const defsElement: SVGElement | null = document.querySelector('#main-svg defs')
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
        let className = "edge"
        let edgePathFnGenerator = this.generateEdgePathFN

        if (areLeafNodeEdges) {
            edgePathFnGenerator = this.generateLeafEdgePathFN
            className = "leaf-node-edge"
        }

        const newEdges = edgeSelection.enter().append("path")
            .attr("class", className)
            .attr("d", edgePathFnGenerator)
            .attr("fill", "none")
            .attr("id", (d) => { return "edge-" + String(d.source.data.id) + "-" + String(d.target.data.id) })
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
            .attr("id", d => { return "node-id-" + String(d.data.id) })
            .attr("transform-origin", "center")
            .attr("transform", this.getNodeTransformString)
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