//TODO add edges pointing between leaf nodes
//TODO make sure that the back and forward feature works completely. right now it breaks for at least one test case that
//I tried. start with simplest breaking test case and go from there.
//test strings
// 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21
// 1,2,3,4,5,6,7,8,9,10,11,12
// 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100
// 12, 7, 29, 45, 2, 33, 18, 51, 9, 37, 24, 6, 42, 15, 30
// 57, 91, 26, 73, 17, 45, 67, 89, 34, 12, 78, 23, 56, 38, 81, 29, 64, 92, 15, 48, 71, 33, 86, 20, 52, 75, 28, 61, 94, 7, 40, 83, 16, 49, 72, 35, 58, 11, 44, 77, 30, 53, 76, 19, 42, 65, 88, 21, 54, 87, 10, 43, 66, 39, 62, 95, 18, 51, 74, 37, 60, 93, 6, 79, 22, 55, 88, 31, 64, 97, 8, 41, 74, 27, 50, 73, 36, 59, 82, 5, 78, 21, 44, 67, 90, 13, 46, 69, 32, 55, 78, 1, 24, 47, 70, 93, 16, 39, 62, 85, 8, 31, 54, 77, 100
//TODO I think inserting 51 at the end of this string has a broken animation
// 57, 91, 26, 73, 17, 45, 67, 89, 34, 12, 78, 23, 56, 38, 81, 29, 64, 92, 15, 48, 71, 33, 86, 20, 52, 75, 28, 61, 94, 7, 40, 83, 16, 49, 72, 35, 58, 11, 44, 77, 30, 53, 76, 19, 42, 65, 88, 21, 54, 87, 10, 43, 66, 39, 62, 95, 18, 51
// 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1

import { bPlusTreeNode } from "./types/bPlusTree"
import { AlgoStepHistory, AlgoStep } from "./algoStepHistory"
//anime.esm file must have the .ts extension in order for the ts
//compiler to find its declaration file.
import { createTimeline, svg as animeSvg, Timeline } from "animejs"
import { tree, hierarchy, HierarchyPointNode } from "d3-hierarchy"
import { select } from "d3-selection"
import { path as d3Path, zoom, ZoomTransform, zoomTransform } from "d3"
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
    // The next three variables are used in the undoable operation methods to
    // restore the previous state of the tree data structure and DOM from before a
    // operation was executed.
    private previousBPlusTreeRoot: bPlusTreeNode = this.bPlusTreeRoot
    private previousValue: number | null = null //represents a value that was inserted or deleted
    private previousOperationType: OperationType | null = null
    // used to store d3 selections that will be removed at the start of a new animation.
    // this will get rid of the DOM elements corresponding to the old animation.
    private exitSelections: d3.Selection<any, any, any, any>[] = []
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
    private readonly nodeSiblingsGap = 1.5
    private readonly nodeParentsGap = 2
    //added to the node size height to create a gap between parents and children.
    private readonly nodeChildrenGap = 200
    private readonly lightBlue
    private readonly lightGreen
    private readonly textColor = "#000000"
    // The following constants are used to control the style of the animations
    // in milliseconds
    private readonly animationDuration = 1000
    // in pixels
    private readonly translateYDist = 40
    //determines how far the nodes involved in a split move
    private readonly splitXDist: number
    private readonly splitYDist = this.nodeHeight * 1.5
    private readonly opacityEaseType = "outQuad"
    // end of style constants
    // The following constants are here to help the programmer to keep track of the
    // class and id names of the relevant elements in the DOM. This names are defined
    // in the index.html and style.css files of this project.
    private readonly leafNodeEdgeClassName = "leaf-node-edge"
    private readonly edgeClassName = "edge"
    private readonly nodeClassName = "node"
    // All nodes are g elements so you can use this along with the d3 selection
    // function to select nodes.
    private readonly nodeSelector = "g.node"
    private readonly edgeSelector = "path." + this.edgeClassName
    private readonly keyTextClassName = "node-key-text"
    private readonly nodeTextSelector = "text." + this.keyTextClassName
    private readonly mainSvgId = "#main-svg"
    private readonly mainSvg: SVGSVGElement
    // end of class and id names constants
    /** used to get the x y coordinates of the trees nodes on the canvas */
    private readonly d3TreeLayout = tree<bPlusTreeNode>()
    // ** DESIGN NOTE ** //
    // A d3 link is associated with and id stored in its target node.
    // This field is present in the bPlusTreeNode object. This is done
    // so that SVGPathElements can be associated with d3 link objects.
    // this variable is used as an incrementing id for new edge
    // SVGPathElements.
    private edgeIdCount = 0
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
        this.splitXDist = this.nodeWidth
        //move the origin of the SVG canvas to the left by half the node width
        //so that the tree is centered on the canvas. It must be done like this because the
        //nodes must keep there origin in the top left corner. Otherwise animejs will not work correctly
        //because it overrides transforms in order to animate svg movement.
        const mainSvgTmp: SVGSVGElement | null = document.querySelector(this.mainSvgId)
        if (mainSvgTmp == null) throw new Error("main-svg element not found invalid html structure")
        this.mainSvg = mainSvgTmp
        this.mainSvg.viewBox
        this.mainSvg.setAttribute('viewBox',
            `${this.mainSvg.viewBox.baseVal.x + (this.nodeWidth / 2)} ${this.mainSvg.viewBox.baseVal.y} ${this.mainSvg.viewBox.baseVal.width} ${this.mainSvg.viewBox.baseVal.height}`);
        //SVG pan and zoom feature section
        //TODO add cursor visually changing to reflect this feature
        const viewBoxVal = this.mainSvg.viewBox.baseVal
        // these points are important. They represent the location of the view box that is considered
        // to be it's standard default position. This standard position then has a matrix transformation
        // applied to it to get its zoomed position. The pan feature ignores these points and
        // simply moves the view box origin. However after a pan stops the previously mentions matrix transform
        // should be set to reflect the view boxes new position. This means that you need to get the transform
        // that when applied to these points will give you the resulting view box position after a pan. This is done
        // so that the zoom feature and the pan feature can stay in sink even thought the pan feature does not use the
        // transform matrix to transform these points.
        let viewBoxOriginPoint = new DOMPoint(viewBoxVal.x, viewBoxVal.y, 1)
        let viewBoxBottomRightPoint = new DOMPoint(viewBoxVal.width + viewBoxVal.x,
            viewBoxVal.height + viewBoxVal.y, 1)
        const mainSvgSelection = select(this.mainSvg)
        const zoomInstance = zoom<SVGSVGElement, unknown>().filter(function filter(event) {
            return (event.type === 'wheel');
        })
        mainSvgSelection.call(zoomInstance.on("zoom", (event: d3.D3ZoomEvent<typeof this.mainSvg, null>) => {
            const [transformedViewBoxOriginX, transformedViewBoxOriginY] = event.transform.apply([viewBoxOriginPoint.x, viewBoxOriginPoint.y])
            const [transformedViewBoxBottomRightPointX, transformedViewBoxBottomRightPointY] =
                event.transform.apply([viewBoxBottomRightPoint.x, viewBoxBottomRightPoint.y])
            viewBoxVal.x = transformedViewBoxOriginX
            viewBoxVal.y = transformedViewBoxOriginY
            viewBoxVal.width = transformedViewBoxBottomRightPointX - transformedViewBoxOriginX
            viewBoxVal.height = transformedViewBoxBottomRightPointY - transformedViewBoxOriginY
        }))
        // need this so that the delta can be found between the point where the drag
        // was initiated and where the drag is currently. This delta is used
        // to determine how far the viewbox should move
        let isPointerDown = false
        // this will record that point mentioned above
        let initialPanPoint = new DOMPoint(0, 0)
        /**
         * A sub procedure for the svg pan feature. This function translates the
         * given xy coordinates to the SVG's coordinates for panning.
         * @param x The x coordinate of the pointer
         * @param y The y coordinate of the pointer
         * @dependency depends of access to the main SVG's data
         * @return DOMPoint the pointer coordinates translated into the SVG's coordinates
         * */
        const getPanningPointerPoint = (x: number, y: number): DOMPoint => {
            const svgScreenCTM = this.mainSvg.getScreenCTM()
            if (svgScreenCTM == null) throw new Error("svg had null screen ctm, bad state")
            var invertedSVGMatrix = svgScreenCTM.inverse();
            let point = new DOMPoint(x, y)
            //need to invert because we are moving the viewbox in the opposite direction from
            //the pointer.
            return point.matrixTransform(invertedSVGMatrix);
        }
        this.mainSvg.onpointerdown = (event) => {
            isPointerDown = true
            const point = getPanningPointerPoint(event.x, event.y)
            initialPanPoint.x = point.x
            initialPanPoint.y = point.y
        }
        this.mainSvg.onpointerup = (event) => {
            isPointerDown = false
            const point = getPanningPointerPoint(event.x, event.y)
            viewBoxVal.x -= (point.x - initialPanPoint.x)
            viewBoxVal.y -= (point.y - initialPanPoint.y)
            //derive the transform matrix that when applied to the view box origin points
            //will give you the resulting viewbox position after the pan that corresponds to
            //the current instance of this event.
            //Also set the zoomInstance transform to the obtained transform
            //this is done so that the pan and zoom feature stay in sync
            const currentTransform = zoomTransform(this.mainSvg)
            zoomInstance.transform(mainSvgSelection, new ZoomTransform(
                currentTransform.k, viewBoxVal.x - currentTransform.k * viewBoxOriginPoint.x,
                viewBoxVal.y - currentTransform.k * viewBoxOriginPoint.y
            ))
        }
        this.mainSvg.onpointermove = (event) => {
            // Only run this function if the pointer is down
            if (!isPointerDown) {
                return;
            }
            // This prevent user to do a selection on the page
            event.preventDefault();
            const point = getPanningPointerPoint(event.x, event.y)
            // Update the viewBox variable with the distance from origin and current position
            viewBoxVal.x -= (point.x - initialPanPoint.x)
            viewBoxVal.y -= (point.y - initialPanPoint.y)
        }
        //end of SVG pan and zoom feature section
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
                const node = currentNode.pointers[smallestValidNumIndex + 1]
                if (node == null) throw new Error("bad dom state, child node is null")
                currentNode = node
            } else {
                // keyToFind < smallestValidNum
                const node = currentNode.pointers[smallestValidNumIndex]
                if (node == null) throw new Error("bad dom state, child node is null")
                currentNode = node
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

        /**
         *
         * A sub procedure for the insert method
         * @param targetNode The node to insert the key value into
         * @param value The key value to insert
         * @param targetNodeElement The SVG element that corresponds to the targetNode
         * @sideEffect Adds the value to the keys array of the targetNode
         * @sideEffect adds animation to the timeline
         * @sideEffect Manipulates the DOM
         * @return SVGTextElement | null The text element created for
         * the inserted value or null if the value was not inserted
         */
        const insertInLeaf = (targetNode: bPlusTreeNode, value: number, targetNodeElement: SVGGElement): SVGTextElement | null => {
            const targetNodeSelection = select<SVGGElement, HierarchyPointNode<bPlusTreeNode>>(targetNodeElement)
            const targetNodeTextSelection = targetNodeSelection.selectAll<SVGTextElement, number>("text." + this.keyTextClassName)
                //see the createNewNodeText method for an explanation of why t is appended to get the id of the
                //text element. Using the text elements value as id because we are not allowing duplicates.
                .data(targetNode.keys, function(d) { return d ? "t" + d : (this as SVGTextElement).id })
            //generate animations for adding new text to the leaf node
            if (value < targetNode.keys[0] || targetNode.keys.length == 0) {
                //animate shifting keys to the right
                let animePos = "<<"
                targetNodeTextSelection.nodes().forEach((element, i) => {
                    if (i == 0) {
                        animePos = "<"
                    } else {
                        animePos = "<<"
                    }
                    timeline.add(element,
                        {
                            x: String(Number(element.getAttribute("x")) + this.keyRectWidth + this.pointerRectWidth)
                        }, animePos
                    )
                })

                // shift all values in keys to the right one spot.
                for (let i = (targetNode.keys.length - 1); i >= 0; i--) {
                    if (targetNode.keys[i]) {
                        targetNode.keys[i + 1] = targetNode.keys[i]
                    }
                }
                targetNode.keys[0] = value

                const newSVGTextElement = this.createNewNodeText(value, 0)
                targetNodeSelection.nodes()[0].appendChild(newSVGTextElement)
                timeline.set(newSVGTextElement,
                    {
                        opacity: 1
                    }
                ).add(newSVGTextElement,
                    {
                        translateY: { from: "-" + this.translateYDist },
                        duration: this.animationDuration * 2
                    }).set(newSVGTextElement,
                        {
                            fill: this.textColor
                        }
                    )
                return newSVGTextElement
            } else {
                // insert value into targetNode.keys just after the 
                // highest number that is less than or equal to value.
                const highestNumberIndex = targetNode.keys.findIndex(element => element >= value)
                // if find Index returns -1 then the last number in keys must be the
                // greatest number that is less than or equal to value.
                if (highestNumberIndex < 0) {
                    targetNode.keys.push(value)

                    const newSVGTextElement = this.createNewNodeText(value, targetNode.keys.length - 1)
                    targetNodeSelection.nodes()[0].appendChild(newSVGTextElement)
                    timeline.set(newSVGTextElement,
                        {
                            opacity: 1
                        }
                    ).add(newSVGTextElement,
                        {
                            translateY: { from: "-" + this.translateYDist },
                            duration: this.animationDuration * 2
                        }).set(newSVGTextElement,
                            {
                                fill: this.textColor
                            }
                        )
                    return newSVGTextElement
                } else {
                    //animate shifting keys to the right
                    targetNodeTextSelection.nodes().slice(highestNumberIndex).forEach((element, i) => {
                        let position = "<<"
                        if (i == 0) {
                            position = "<"
                        }
                        timeline.add(element,
                            {
                                x: String(Number(element.getAttribute("x")) + this.keyRectWidth + this.pointerRectWidth)
                            }, position
                        )
                    })

                    targetNode.keys.splice(highestNumberIndex, 0, value);

                    //animate adding the new key value to the leaf node
                    const newSVGTextElement = this.createNewNodeText(value, highestNumberIndex)
                    targetNodeSelection.nodes()[0].appendChild(newSVGTextElement)
                    timeline.set(newSVGTextElement,
                        {
                            opacity: 1
                        }
                    ).add(newSVGTextElement,
                        {
                            translateY: { from: "-" + this.translateYDist },
                            duration: this.animationDuration * 2
                        }).set(newSVGTextElement,
                            {
                                fill: this.textColor
                            }
                        )
                    return newSVGTextElement
                }
            }
        }

        //TODO there is a broken animation somewhere in here. Edges won't align with nodes mid animation
        //sometimes.
        /**
         * A subsidiary procedure for the insert method
         * @param leftNode A bPlusTreeNode to be placed to the left of the key value
         * @param value The key value to insert into parent node
         * @param rightNode A bPlusTreeNode to be placed to the right of the key value
         * @dependency bPlusTreeChildrenDefinition
         * @sideEffect potentially splits the parent node of leftNode and rightNode
         * @sideEffects edits the contents of the pointers and keys arrays of
         * the parent node, leftNode and rightNode.
         * @sideEffect adds animation to timeline
         */
        const insertInParent = (leftNode: bPlusTreeNode, value: number, rightNode: bPlusTreeNode) => {
            if (leftNode.parent == null) { //case where left node is the root of the tree
                const self = this

                this.bPlusTreeRoot = new bPlusTreeNode(false)
                this.bPlusTreeRoot.isLeaf = false
                this.bPlusTreeRoot.addNodeToPointers(leftNode)
                this.bPlusTreeRoot.addNodeToPointers(rightNode)
                this.bPlusTreeRoot.keys = [value]

                leftNode.parent = this.bPlusTreeRoot
                rightNode.parent = this.bPlusTreeRoot

                //get the positions of the left and right node so that they can
                //be moved to their new correct positions.
                const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(this.bPlusTreeRoot, this.bPlusTreeChildrenDefinition))
                const nodeSelection = select(this.mainSvgId)
                    .selectAll<SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>>(this.nodeSelector)
                    .data(rootHierarchyNode, function(d) { return d ? d.data.id : (this as SVGGElement).id })

                //animate adding a new root node to the tree.
                const newRootElement = this.createNodeElement(this.bPlusTreeRoot)
                timeline.set(newRootElement,
                    {
                        transform: `translate(0,${-this.translateYDist})`
                    }, "<"
                )
                timeline.add(
                    newRootElement,
                    {
                        opacity: { to: 1, ease: this.opacityEaseType },
                        transform: "translate(0,0)"
                    }, "<"
                )
                const rootElementRectElements: ChildNode[] = []
                newRootElement.childNodes.forEach((child) => {
                    if (child.nodeName == "rect") {
                        rootElementRectElements.push(child)
                    }
                })
                timeline.set(rootElementRectElements,
                    {
                        fill: this.lightBlue
                    }, "<"
                )

                if (leftNode.isLeaf) {
                    const leafEdge = document.querySelector(`#${leftNode.id}-${rightNode.id}`)
                    if (!leafEdge) {
                        throw new Error("Could not get leaf edge element for leaf node siblings, bad DOM state")
                    }
                    //animate moving the leaf edge to it's new correct place
                    const leafEdgePath = d3Path()
                    const leftHeirarchyNode = nodeSelection.filter(`#${leftNode.id}`).data()[0]
                    const rightHeirarchyNode = nodeSelection.filter(`#${rightNode.id}`).data()[0]
                    leafEdgePath.moveTo(leftHeirarchyNode.x + this.nodeWidth - this.pointerRectWidth / 2,
                        leftHeirarchyNode.y + this.nodeHeight / 2)
                    leafEdgePath.lineTo(rightHeirarchyNode.x, rightHeirarchyNode.y + this.nodeHeight / 2)
                    const newLeafEdgePathPosition = document.createElementNS(SVG_NS, "path")
                    newLeafEdgePathPosition.setAttribute("d", leafEdgePath.toString())
                    const defsElement: SVGElement | null = document.querySelector(this.mainSvgId + " defs")
                    if (!defsElement) {
                        throw new Error("defs element not found")
                    }
                    defsElement.appendChild(newLeafEdgePathPosition);
                    timeline.add(leafEdge,
                        {
                            d: animeSvg.morphTo(newLeafEdgePathPosition)
                        }, "<")
                }

                //animate moving every node to its right spot.
                nodeSelection.each(function(nodeData, i) {
                    let timelinePos = "<<"
                    if (i == 0) {
                        timelinePos = "<"
                    }

                    timeline.add(this,
                        {
                            transform: `translate( ${String(nodeData.x)} , ${String(nodeData.y)} )`
                        }, timelinePos)
                })

                let edgeSelection = select(this.mainSvgId)
                    .selectAll<SVGPathElement, d3.HierarchyPointLink<bPlusTreeNode>>("path." + this.edgeClassName)
                    .data(rootHierarchyNode.links(), function(d) {
                        if (d) {
                            // when this is true it must be a new link hence bind a new id to that link.
                            if (d.target.data.edgeId == null) d.target.data.edgeId = `${self.edgeIdCount++}`
                            return d.target.data.edgeId
                        } else {
                            return (this as SVGPathElement).id
                        }
                    })
                edgeSelection.each(function(edgeData, i) {
                    let timelinePos = "<<"
                    if (i == 0) {
                        timelinePos = "<"
                    }
                    const targetIndex = edgeData.source.data.pointers.indexOf(edgeData.target.data)
                    timeline.add(this,
                        {
                            d: animeSvg.morphTo(self.generateMorphToPath(edgeData.source.x,
                                edgeData.source.y, edgeData.target.x, edgeData.target.y, targetIndex))
                        }, timelinePos)
                })

                //remove no longer needed edges
                edgeSelection.exit().each(function() {
                    timeline.set(this, { opacity: 0 }, "<<")
                })
                this.exitSelections.push(edgeSelection.exit())

                //animate adding number value to the new root node
                const newTextElement = this.createNewNodeText(this.bPlusTreeRoot.keys[0], 0)
                newRootElement.appendChild(newTextElement)
                timeline.add(newTextElement,
                    {
                        opacity: { to: 1, ease: this.opacityEaseType },
                        translateY: { from: `-${this.translateYDist}` },
                    }, "<")
                timeline.set(newTextElement,
                    { fill: this.textColor }, "<")

                //animate adding new link edges to root node
                //first find out which links are the new links
                edgeSelection = select(this.mainSvgId)
                    .selectAll<SVGPathElement, d3.HierarchyPointLink<bPlusTreeNode>>("path." + this.edgeClassName)
                    .data(rootHierarchyNode.links(), function(d) {
                        if (d) {
                            if (d.target.data.edgeId == null) d.target.data.edgeId = `${self.edgeIdCount++}`
                            return d.target.data.edgeId
                        } else {
                            return (this as SVGPathElement).id
                        }
                    })
                const newLinks = edgeSelection.enter().data()
                const newPathElements: SVGPathElement[] = []
                newLinks.forEach((link) => {
                    newPathElements.push(this.createNewEdgeSvgElement(link, false))
                })
                newPathElements.forEach((pathElement) => {
                    this.mainSvg.appendChild(pathElement)
                })
                // this set statement needs to be here so that the timeline
                // knows that I want mark-end and marker-start to be none
                // before the end of the animation. Otherwise when rewinding
                // their values will remain what they were set to at the end.
                timeline.set(newPathElements,
                    {
                        "marker-end": "none",
                        "marker-start": "none",
                    }, "<")
                timeline.add(animeSvg.createDrawable(newPathElements),
                    {
                        draw: "0 1",
                    }
                    , "<")
                timeline.set(newPathElements,
                    {
                        "marker-end": "url(#arrow)",
                        "marker-start": "url(#circle)",
                    }, "<")

                return
            }

            const parentNode = leftNode.parent
            const leftNodeIndex = parentNode.pointers.findIndex(element => element === leftNode)
            if (parentNode.pointers.filter(element => element).length < this.n) { //case where neither left or right node is the root
                const self = this

                parentNode.pointers.splice(leftNodeIndex + 1, 0, rightNode)
                parentNode.keys.splice(leftNodeIndex, 0, value)

                // ** Animate Insert Parent No Split Section ** //
                //get the positions of the left and right node so that they can
                //be moved to their new correct positions.
                const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(this.bPlusTreeRoot, this.bPlusTreeChildrenDefinition))
                const nodeSelection = select(this.mainSvgId)
                    .selectAll<SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>>(this.nodeSelector)
                    .data(rootHierarchyNode, function(d) { return d ? d.data.id : (this as SVGGElement).id })

                //get edge selection so their position can be updated
                const edgeSelection = select(this.mainSvgId)
                    .selectAll<SVGPathElement, d3.HierarchyPointLink<bPlusTreeNode>>("path." + this.edgeClassName)
                    .data(rootHierarchyNode.links(), function(d) {
                        if (d) {
                            if (d.target.data.edgeId == null) d.target.data.edgeId = `${self.edgeIdCount++}`
                            return d.target.data.edgeId
                        } else {
                            return (this as SVGPathElement).id
                        }
                    })

                //TODO debug this solution
                //TODO also add moving all other leaf nodes when moving this stuff around
                if (leftNode.isLeaf) {
                    //get all the leaf nodes pairs that have an edge between them
                    const leafNodeSelection = nodeSelection.filter((pointNode) => pointNode.data.isLeaf)
                    const leafPointerNodePairs = leafNodeSelection.data().map((pointNode) => {
                        if (pointNode.data.pointers[this.n - 1]) {
                            return ([pointNode,
                                leafNodeSelection.filter((pointNode2) => {
                                    const lastPointer = pointNode.data.pointers[this.n - 1]
                                    if (!lastPointer) return false
                                    return pointNode2.data.id === lastPointer.id
                                }).data()[0]])
                        }
                        return null
                    }).filter(pointNode => pointNode !== null)
                    leafPointerNodePairs.forEach((leafPointerNodePair, i) => {
                        if (leafPointerNodePair === null) return
                        const leafEdge = document.querySelector(`#${leafPointerNodePair[0].data.id}-${leafPointerNodePair[1].data.id}`)
                        if (!leafEdge) {
                            throw new Error("Could not get leaf edge element for leaf node siblings, bad DOM state")
                        }
                        //animate moving the leaf edge to it's new correct place
                        const leafEdgePath = d3Path()
                        const leftHeirarchyNode = leafPointerNodePair[0]
                        const rightHeirarchyNode = leafPointerNodePair[1]
                        leafEdgePath.moveTo(leftHeirarchyNode.x + this.nodeWidth - this.pointerRectWidth / 2,
                            leftHeirarchyNode.y + this.nodeHeight / 2)
                        leafEdgePath.lineTo(rightHeirarchyNode.x, rightHeirarchyNode.y + this.nodeHeight / 2)
                        const newLeafEdgePathPosition = document.createElementNS(SVG_NS, "path")
                        newLeafEdgePathPosition.setAttribute("d", leafEdgePath.toString())
                        const defsElement: SVGElement | null = document.querySelector(this.mainSvgId + " defs")
                        if (!defsElement) {
                            throw new Error("defs element not found")
                        }
                        defsElement.appendChild(newLeafEdgePathPosition);
                        let animationPos = "<"
                        if (i > 0) {
                            animationPos = "<<"
                        }
                        timeline.add(leafEdge,
                            {
                                d: animeSvg.morphTo(newLeafEdgePathPosition)
                            }, animationPos)
                    })
                }

                //animate moving every node and edge to its new correct place
                nodeSelection.each(function(hierarchyNode) {
                    timeline.add(this,
                        {
                            transform: `translate(${hierarchyNode.x},${hierarchyNode.y})`
                        }, "<<")
                })

                edgeSelection.each(function(link) {
                    const animationPos = "<<"
                    //get targetIndex for link
                    const targetIndex = link.source.data.pointers.indexOf(link.target.data)
                    timeline.add(this,
                        {
                            d: animeSvg.morphTo(self.generateMorphToPath(link.source.x,
                                link.source.y, link.target.x, link.target.y, targetIndex))
                        }, animationPos)
                })

                //TODO add animation for moving existing key text to make room for new text
                //animate adding key value to parent node
                const parentNodeElement: SVGGElement | null = document.querySelector(`#${parentNode.id}`)
                if (parentNodeElement == null) throw new Error("parent node SVG element not found bad DOM state")
                const newTextElement = this.createNewNodeText(value, leftNodeIndex)
                parentNodeElement.appendChild(newTextElement)
                const parentNodeSelection = select<SVGGElement, HierarchyPointNode<bPlusTreeNode>>(parentNodeElement)
                const parentNodeTextSelection = parentNodeSelection.selectAll<SVGTextElement, number>("text." + this.keyTextClassName)
                    //see the createNewNodeText method for an explanation of why t is appended to get the id of the
                    //text element. Using the text elements value as id because we are not allowing duplicates.
                    .data(parentNode.keys, function(d) { return d ? "t" + d : (this as SVGTextElement).id })
                //generate animations for adding new text to the parent node
                parentNodeTextSelection.nodes().slice(parentNode.keys.indexOf(value) + 1).forEach((element, i) => {
                    let position = "<<"
                    if (i == 0) {
                        position = "<"
                    }
                    timeline.add(element,
                        {
                            x: String(Number(element.getAttribute("x")) + this.keyRectWidth + this.pointerRectWidth)
                        }, position
                    )
                })
                timeline.add(newTextElement,
                    {
                        opacity: { to: 1, ease: this.opacityEaseType },
                        translateY: { from: `-${this.translateYDist}` },
                    }, "<")
                timeline.set(newTextElement,
                    { fill: this.textColor }, "<")

                //animate adding new edge to parent node
                //first find out which links are the new links
                const newLinks = edgeSelection.enter().data()
                const newPathElements: SVGPathElement[] = []
                newLinks.forEach((link) => {
                    newPathElements.push(this.createNewEdgeSvgElement(link, false))
                })
                newPathElements.forEach((pathElement) => {
                    this.mainSvg.appendChild(pathElement)
                })
                // this set statement needs to be here so that the timeline
                // knows that I want mark-end and marker-start to be none
                // before the end of the animation. Otherwise when rewinding
                // their values will remain what they were set to at the end.
                timeline.set(newPathElements,
                    {
                        "marker-end": "none",
                        "marker-start": "none",
                    }, "<")
                timeline.add(animeSvg.createDrawable(newPathElements),
                    {
                        draw: "0 1",
                    }
                    , "<")
                timeline.set(newPathElements,
                    {
                        "marker-end": "url(#arrow)",
                        "marker-start": "url(#circle)",
                    }, "<")

            } else { // split
                // set this for d3 callback functions
                const self = this

                const tempNode = new bPlusTreeNode(true)
                tempNode.keys = parentNode.keys.slice()
                const parentNodePointersToMove = parentNode.pointers.slice()
                parentNodePointersToMove.forEach((node) => {
                    tempNode.addNodeToPointers(node)
                })

                const newNode = new bPlusTreeNode(false)

                // ** animation section ** //
                //get the necessary data and elements for the following animation
                let rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(this.bPlusTreeRoot, this.bPlusTreeChildrenDefinition))
                let edgeSelectionEnterUpdate = select(this.mainSvgId)
                    .selectAll<SVGPathElement, d3.HierarchyPointLink<bPlusTreeNode>>("path." + this.edgeClassName)
                    .data(rootHierarchyNode.links(), function(d) {
                        if (d) {
                            if (d.target.data.edgeId == null) d.target.data.edgeId = `${self.edgeIdCount++}`
                            return d.target.data.edgeId
                        } else {
                            return (this as SVGPathElement).id
                        }
                    })
                const parentNodeSelection = select(`#${parentNode.id}`)
                const parentNodeElement = (parentNodeSelection.node() as SVGGElement | null)
                if (parentNodeElement == null) throw new Error("bad state")
                const parentNodeData = parentNodeSelection.data()[0] as d3.HierarchyPointNode<bPlusTreeNode>
                const tempNodeElement = this.createNodeElement(tempNode, parentNodeData.x,
                    parentNodeData.y, true, true)
                const parentNodePointerEdges = edgeSelectionEnterUpdate.filter(function(edgeData) {
                    return (edgeData.source.data.id == parentNode.id)
                })

                // generate animations for adding the temp node and new node
                // and moving the parent nodes text into the temp node
                //first animate moving the parent node down and to the left in order
                //to make room for the temp node coming in.
                timeline.add(
                    parentNodeElement,
                    {
                        transform: () => {
                            return `translate( ${parentNodeData.x - this.nodeWidth} , ${parentNodeData.y + this.nodeHeight * 1.5})`
                        }
                    }, "<"
                )

                //also animate edges moving with parent node down and to the left
                parentNodePointerEdges.each(function(edgeData) {
                    const targetIndex = edgeData.source.data.pointers.indexOf(edgeData.target.data)
                    timeline.add(this,
                        {
                            d: animeSvg.morphTo(self.generateMorphToPath(edgeData.source.x - self.splitXDist,
                                edgeData.source.y + self.splitYDist, edgeData.target.x, edgeData.target.y, targetIndex))
                        }, "<<")
                })

                //animate adding the temp node to the visualization
                //we have to get the temp node elements rect children so that we can animate
                //the change of the nodes color. This can't be done by editing the parent g elment
                //like when changing its position.
                const tempNodeRectChildNodes: ChildNode[] = []
                tempNodeElement.childNodes.forEach((child) => {
                    if (child.nodeName == "rect") {
                        tempNodeRectChildNodes.push(child)
                    }
                })
                const tempNodeElementX = parentNodeData.x
                const tempNodeElementY = parentNodeData.y
                timeline.label('addTempNode')
                timeline.set(tempNodeElement,
                    {
                        transform: `translate(${tempNodeElementX} ,${tempNodeElementY - this.translateYDist})`
                    }, "<"
                )
                timeline.add(
                    tempNodeElement,
                    {
                        opacity: { to: 1, ease: this.opacityEaseType },
                        transform: `translate(${tempNodeElementX},${tempNodeElementY})`
                    }, "<"
                )
                timeline.set(
                    tempNodeRectChildNodes,
                    {
                        fill: this.lightBlue
                    }
                )

                // animate adding the new node to the tree
                const newNodeElement = this.createNodeElement(newNode,
                    parentNodeData.x + this.nodeWidth,
                    parentNodeData.y + this.nodeHeight * 1.5)
                timeline.add(
                    newNodeElement,
                    {
                        opacity: { to: 1, ease: this.opacityEaseType },
                    }, "addTempNode"
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
                            translateY: { from: "-" + this.translateYDist }
                        },
                        "<<"
                    )
                    timeline.set(rectChildNodes,
                        {
                            fill: this.lightBlue
                        }
                    )
                }

                //animate moving numbers to the temp node
                const mainSvg = document.querySelector(this.mainSvgId)
                if (mainSvg == null) throw new Error("main-svg element not found invalid html structure")
                let parentNodeTextSelection = parentNodeSelection.selectAll(this.nodeTextSelector).data(parentNode.keys,
                    function(d) { return d ? "t" + d : (this as SVGTextElement).id })
                const tempNodeTextElements: SVGTextElement[] = []
                tempNode.keys.forEach((key: number, i: number) => {
                    tempNodeTextElements.push(this.createNewNodeText(key, i))
                    tempNodeElement.appendChild(tempNodeTextElements[i])
                })
                // place the temp node before the new node so that when the numbers
                // are animated from the temp node to the new node they don't get
                // placed behind the node element.
                newNodeElement.insertAdjacentElement("afterend", tempNodeElement)

                //place the text elements of the temp node on their corresponding
                //test elements in the parent node element.
                timeline.set(tempNodeTextElements, {
                    opacity: 1,
                    fill: this.textColor,
                    translateX: { to: "-" + this.nodeWidth },
                    translateY: { to: "+" + this.nodeHeight * 1.5 },
                })
                timeline.set(parentNodeTextSelection.nodes(), { opacity: 0 })

                // animate moving the text elements from parent node to temp node
                timeline.add(
                    tempNodeTextElements,
                    {
                        translateY: { to: 0 },
                        translateX: { to: 0 }
                    }
                )

                //Animate moving the pointer edges from parent node to temp node
                parentNodePointerEdges.each(
                    function(edgeData) {
                        const targetIndex = edgeData.source.data.pointers.indexOf(edgeData.target.data)
                        timeline.add(this,
                            {
                                d: animeSvg.morphTo(self.generateMorphToPath(edgeData.source.x,
                                    edgeData.source.y, edgeData.target.x, edgeData.target.y, targetIndex))
                            }, "<<"
                        )
                    }
                )

                //animate adding new value to temp node
                const newTempNodeTextElement = insertInLeaf(tempNode, value, tempNodeElement)
                if (newTempNodeTextElement == null) throw new Error("bad state")
                tempNodeTextElements.push(newTempNodeTextElement)

                // ** End Of Animation Section ** //
                parentNode.keys = []
                parentNode.pointers.forEach((_, i) => {
                    parentNode.removeNodeFromPointers(i)
                })

                tempNode.pointers.splice(leftNodeIndex + 1, 0, rightNode)

                tempNode.pointers.slice(0, Math.ceil((this.n + 1) / 2)).forEach(node => {
                    parentNode.addNodeToPointers(node)
                })
                parentNode.keys = tempNode.keys.slice(0, Math.ceil((this.n + 1) / 2) - 1)

                const middleKey = tempNode.keys[Math.ceil(((this.n + 1) / 2) - 1)]

                tempNode.pointers.slice(Math.ceil(((this.n + 1) / 2)), this.n + 1).forEach(node => {
                    newNode.addNodeToPointers(node)
                })
                newNode.keys = tempNode.keys.slice(Math.ceil(((this.n + 1) / 2)), this.n)

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

                // ** Animation Section ** //
                //animate adding a leaf edge that points from the parent node
                //to the new node

                // get the text elements from the temp node element that
                //should be moved to the parent node
                const toParentNodeText: SVGTextElement[] = []
                tempNode.keys.slice(0, Math.ceil((this.n + 1) / 2) - 1).forEach((key: number) => {
                    const textElement: SVGTextElement | null = document.querySelector("#" + tempNode.id + " #t" + key)
                    if (textElement == null) throw new Error("Bad dom state")
                    toParentNodeText.push(textElement)
                })

                //animate moving the correct temp node text elements to parent node
                timeline.add(toParentNodeText,
                    {
                        translateY: { to: "+" + this.nodeHeight * 1.5 },
                        translateX: { to: "-" + this.nodeWidth },
                    }
                )

                // get the D3 selections of the edge elements that correspond to
                // the text elements that should be moved from the temp node to the parent node.
                // Also get the selection of edges that should be moved to the new node.
                let edgeSelection = select(this.mainSvgId)
                    .selectAll<SVGPathElement, d3.HierarchyPointLink<bPlusTreeNode>>("path." + this.edgeClassName)
                    .data(rootHierarchyNode.links(), function(d) {
                        if (d) {
                            // when this is true it must be a new link hence bind a new id to that link.
                            if (d.target.data.edgeId == null) d.target.data.edgeId = `${self.edgeIdCount++}`
                            return d.target.data.edgeId
                        } else {
                            return (this as SVGPathElement).id
                        }
                    })
                const toParentNodes = tempNode.pointers.slice(0, Math.ceil((this.n + 1) / 2))
                const toParentEdgeSelection = edgeSelection.filter(pointLink => {
                    if (toParentNodes.find((node) => {
                        return (node != null && node.id === pointLink.target.data.id)
                    })) {
                        return true;
                    } else {
                        return false;
                    }
                });
                const toNewNodeNodes = tempNode.pointers.slice(Math.ceil((this.n + 1) / 2))
                const toNewNodeEdgeSelection = edgeSelection.filter(pointLink => {
                    if (toNewNodeNodes.find((node) => {
                        return (node != null && node.id === pointLink.target.data.id)
                    })) {
                        return true;
                    } else {
                        return false;
                    }
                });

                //animate moving edges from the temp node to the parent node.
                toParentEdgeSelection.each(function(edgeData) {
                    const targetIndex = edgeData.source.data.pointers.indexOf(edgeData.target.data)
                    timeline.add(this,
                        {
                            d: animeSvg.morphTo(self.generateMorphToPath(edgeData.source.x - self.nodeWidth,
                                edgeData.source.y + self.nodeHeight * 1.5, edgeData.target.x, edgeData.target.y, targetIndex))
                        }, "<<")
                })

                //get the text elements from the temp node that should go to the new node
                //and animate them going to the new node.
                const toNewNodeText: SVGTextElement[] = []
                tempNode.keys.slice(Math.ceil(this.n / 2) + 1).forEach((key: number) => {
                    const textElement: SVGTextElement | null = document.querySelector("#" + tempNode.id + " #t" + key)
                    if (textElement == null) throw new Error("Bad dom state")
                    toNewNodeText.push(textElement)
                })
                timeline.add(toNewNodeText,
                    {
                        translateY: { to: "-" + this.nodeHeight * 1.5 },
                    }
                )
                timeline.add(toNewNodeText,
                    {
                        translateX: { to: "+" + this.pointerRectWidth },
                    }
                )
                timeline.add(toNewNodeText,
                    {
                        translateY: { to: `+${this.nodeHeight * 1.5}` },
                    }
                )

                //animate moving edges from the temp node to the new node.
                toNewNodeEdgeSelection.each(function(edgeData) {
                    const targetIndex = newNode.pointers.indexOf(edgeData.target.data)
                    timeline.add(this,
                        {
                            d: animeSvg.morphTo(self.generateMorphToPath(edgeData.source.x + self.nodeWidth,
                                edgeData.source.y + self.nodeHeight * 1.5, edgeData.target.x, edgeData.target.y, targetIndex))
                        }, "<<")
                })

                //replace the temp node text elements with their corresponding new node and
                //parent node text elements. Also animate the removal of the temp node.
                newNode.keys.forEach((key: number, i: number) => {
                    newNodeElement.appendChild(this.createNewNodeText(key, i))
                })
                const newNodeTextElements = Array.from(newNodeElement.childNodes).filter((child) => {
                    return child.nodeName == "text"
                })
                //update the keys of the parent node
                parentNodeTextSelection = parentNodeSelection.selectAll(this.nodeTextSelector).data(parentNode.keys,
                    function(d) { return d ? "t" + d : (this as SVGTextElement).id })
                this.exitSelections.push(parentNodeTextSelection.exit())
                //reposition the text elements that already existed in the parent node
                //and remain to their right position in the node.
                parentNodeTextSelection.nodes().forEach((nodeElement) => {
                    const indexInKeyArray = parentNode.keys.findIndex(
                        (keyElement) => {
                            if (nodeElement == null) throw new Error("bad dom state")
                            return keyElement == Number((nodeElement as Element).textContent)
                        }
                    )
                    timeline.set(nodeElement as HTMLElement, {
                        x: String(this.pointerRectWidth +
                            (this.keyRectWidth / 2) +
                            indexInKeyArray * (this.keyRectWidth + this.pointerRectWidth))
                    })
                })
                //create the new nodes in the parent node.
                const parentNodeNewTextElements: SVGTextElement[] = []
                parentNodeTextSelection.enter().data().forEach((enterKey: number) => {
                    const indexInKeyArray = parentNode.keys.findIndex(
                        (keyElement) => { return keyElement == enterKey }
                    )
                    const newTextElement = this.createNewNodeText(enterKey, indexInKeyArray)
                    parentNodeElement.appendChild(newTextElement)
                    parentNodeNewTextElements.push(newTextElement)
                })
                timeline.set([...parentNodeTextSelection.nodes(),
                ...newNodeTextElements, ...parentNodeNewTextElements],
                    { opacity: 1, fill: this.textColor })
                timeline.set(tempNodeTextElements, { opacity: 0 })

                //animate the removal of the temp node
                timeline.set(Array.from(tempNodeElement.childNodes).filter((child) => { return child.nodeName == "rect" }), {
                    fill: "#F97287"
                })
                timeline.add(
                    tempNodeElement,
                    {
                        opacity: { to: 0, ease: this.opacityEaseType },
                        transform: `translate(${tempNodeElementX},${tempNodeElementY + this.translateYDist})`
                    }, "<"
                )
                // ** End of animation section ** //

                insertInParent(parentNode, middleKey, newNode)
            }
            return
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
                this.bPlusTreeChildrenDefinition))
            const nodeSelection = select(this.mainSvgId)
                .selectAll<SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>>(this.nodeSelector)
                .data(rootHierarchyNode, function(d) { return d ? d.data.id : (this as SVGGElement).id })
            const newNodes = nodeSelection.enter().data().map((node) => {
                return this.createNodeElement(node.data)
            })
            timeline.add(
                [...newNodes],
                {
                    opacity: { to: 1, ease: this.opacityEaseType },
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
                        translateY: { from: "-" + this.translateYDist }
                    },
                    '<<'
                )
            }
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
            //get the HTML element that corresponds to the targetNode
            const targetNodeElement = select<SVGGElement, HierarchyPointNode<bPlusTreeNode>>("#" + targetNode.id).node()
            if (targetNodeElement === null) throw new Error("target node element was null, bad state")
            insertInLeaf(targetNode, value, targetNodeElement)
        } else { //leaf node targetNode has n - 1 key values already, split it
            moveSudoCodeRectangle(7)
            const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(this.bPlusTreeRoot, this.bPlusTreeChildrenDefinition))
            const nodeSelection = select(this.mainSvgId)
                .selectAll<SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>>(this.nodeSelector)
                .data(rootHierarchyNode, function(d) { return d ? d.data.id : (this as SVGGElement).id })
            const targetNodeSelection = nodeSelection.filter((d) => d.data === targetNode)

            //animate target node moving to the left and down to make room for tmp and new node
            /**
             * Used to store the coordinates of the target node while the split animation is ongoing
             */
            const targetNodeTmpCoordinates = {
                x: targetNodeSelection.data()[0].x - this.nodeWidth,
                y: targetNodeSelection.data()[0].y + this.nodeHeight * 1.5
            }
            timeline.add(
                targetNodeSelection.nodes(),
                {
                    transform: () => {
                        return `translate( ${targetNodeTmpCoordinates.x} , ${targetNodeTmpCoordinates.y} )`
                    }
                }
            )

            const newNode = new bPlusTreeNode(true)
            const tempNode = new bPlusTreeNode(true)
            targetNode.pointers.slice(0, this.n - 1).forEach(node => {
                tempNode.addNodeToPointers(node)
            })
            tempNode.keys = targetNode.keys.slice(0, this.n - 1)

            //animate adding the temp node to the visualization
            //we have to get the temp node elements rect children so that we can animate
            //the change of the nodes color.
            const tempNodeElement = this.createNodeElement(tempNode, targetNodeSelection.data()[0].x,
                targetNodeSelection.data()[0].y, true, true)
            const tempNodeRectChildNodes: ChildNode[] = []
            tempNodeElement.childNodes.forEach((child) => {
                if (child.nodeName == "rect") {
                    tempNodeRectChildNodes.push(child)
                }
            })
            const tempNodeElementX = targetNodeSelection.data()[0].x
            const tempNodeElementY = targetNodeSelection.data()[0].y
            timeline.label('addTempNode')
            timeline.set(tempNodeElement,
                {
                    transform: `translate(${tempNodeElementX} ,${tempNodeElementY - this.translateYDist})`
                }, "<"
            )
            timeline.add(
                tempNodeElement,
                {
                    opacity: { to: 1, ease: this.opacityEaseType },
                    transform: `translate(${tempNodeElementX},${tempNodeElementY})`
                }, "<"
            )
            timeline.set(
                tempNodeRectChildNodes,
                {
                    fill: this.lightBlue
                }
            )

            // animate adding the new node to the tree
            /**
             * Used to store the coordinates of the new node while the split animation is ongoing
             */
            const newNodeTmpCoordinates = {
                x: targetNodeSelection.data()[0].x + this.nodeWidth,
                y: targetNodeSelection.data()[0].y + this.nodeHeight * 1.5
            }
            const newNodeElement = this.createNodeElement(newNode,
                newNodeTmpCoordinates.x,
                newNodeTmpCoordinates.y)
            timeline.add(
                newNodeElement,
                {
                    opacity: { to: 1, ease: this.opacityEaseType },
                }, "addTempNode"
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
                        translateY: { from: "-" + this.translateYDist }
                    },
                    "<<"
                )
                timeline.set(rectChildNodes,
                    {
                        fill: this.lightBlue
                    }
                )
            }

            //animate moving numbers to the temp node
            const mainSvg = document.querySelector(this.mainSvgId)
            if (mainSvg == null) throw new Error("main-svg element not found invalid html structure")
            let targetNodeTextSelection = targetNodeSelection.selectAll(this.nodeTextSelector).data(targetNode.keys,
                function(d) { return d ? "t" + d : (this as SVGTextElement).id })
            const tempNodeTextElements: SVGTextElement[] = []
            tempNode.keys.forEach((key: number, i: number) => {
                tempNodeTextElements.push(this.createNewNodeText(key, i))
                tempNodeElement.appendChild(tempNodeTextElements[i])
            })
            //place the tempNodeTextElements on top of the target node text elements
            //so that the animation can move them to the temp node.
            timeline.set(tempNodeTextElements, {
                opacity: 1,
                fill: this.textColor,
                translateX: { to: "-" + this.nodeWidth },
                translateY: { to: "+" + this.nodeHeight * 1.5 },
            })
            timeline.set(targetNodeTextSelection.nodes(), { opacity: 0 })
            //animate moving the text elements form target node to temp node
            timeline.add(
                tempNodeTextElements,
                {
                    translateY: { to: "-" + this.nodeHeight }
                }
            )
            timeline.add(
                tempNodeTextElements,
                {
                    translateX: { to: 0 }
                }
            )
            timeline.add(
                tempNodeTextElements,
                {
                    translateY: { to: 0 },
                }
            )

            //animate adding new value to temp node
            const newTempNodeTextElement = insertInLeaf(tempNode, value, tempNodeElement)
            if (newTempNodeTextElement == null) throw new Error("bad state")
            tempNodeTextElements.push(newTempNodeTextElement)

            const targetNodeOriginalLastNode = targetNode.pointers[this.n - 1]

            tempNode.pointers.slice(0, Math.ceil(this.n / 2)).forEach(node => {
                targetNode.addNodeToPointers(node)
            })
            targetNode.pointers[this.n - 1] = newNode
            targetNode.keys = tempNode.keys.slice(0, Math.ceil(this.n / 2))

            tempNode.pointers.slice(Math.ceil(this.n / 2), this.n).forEach(node => {
                newNode.addNodeToPointers(node)
            })
            if (targetNodeOriginalLastNode) {
                newNode.pointers[this.n - 1] = targetNodeOriginalLastNode
            }
            newNode.keys = tempNode.keys.slice(Math.ceil(this.n / 2), this.n)
            newNode.parent = targetNode.parent

            //animate inserting an edge between the target and new node
            const leafEdgePath = d3Path()
            leafEdgePath.moveTo(targetNodeTmpCoordinates.x + this.nodeWidth - this.pointerRectWidth / 2,
                targetNodeTmpCoordinates.y + this.nodeHeight / 2)
            leafEdgePath.lineTo(newNodeTmpCoordinates.x, newNodeTmpCoordinates.y + this.nodeHeight / 2)
            const newSVGPathElement = document.createElementNS(SVG_NS, "path")
            newSVGPathElement.setAttribute("class", this.leafNodeEdgeClassName)
            newSVGPathElement.setAttribute("d", leafEdgePath.toString())
            newSVGPathElement.setAttribute("fill", "none")
            newSVGPathElement.setAttribute("id", `${targetNode.id}-${newNode.id}`)
            newSVGPathElement.setAttribute("stroke", "black")
            newSVGPathElement.setAttribute("stroke-width", "2px")
            newSVGPathElement.setAttribute("opacity", "1")
            this.mainSvg.appendChild(newSVGPathElement)
            // this set statement needs to be here so that the timeline
            // knows that I want mark-end and marker-start to be none
            // before the end of the animation. Otherwise when rewinding
            // their values will remain what they were set to at the end.
            timeline.set(newSVGPathElement,
                {
                    "marker-end": "none",
                    "marker-start": "none",
                }, "<")
            timeline.add(animeSvg.createDrawable(newSVGPathElement),
                {
                    draw: "0 1",
                }
                , "<")
            timeline.set(newSVGPathElement,
                {
                    "marker-end": "url(#arrow)",
                    "marker-start": "url(#circle)",
                }, "<")

            // get the text elements from the temp node element that
            //should be move to the target node
            const toTargetNodeText: SVGTextElement[] = []
            tempNode.keys.slice(0, Math.ceil(this.n / 2)).forEach((key: number) => {
                const textElement: SVGTextElement | null = document.querySelector("#" + tempNode.id + " #t" + key)
                if (textElement == null) throw new Error("Bad dom state")
                toTargetNodeText.push(textElement)
            })
            //animate moving the correct temp node text elements to target node
            timeline.add(toTargetNodeText,
                {
                    translateY: { to: "-" + this.nodeHeight * 1.5 },
                }
            )
            timeline.add(toTargetNodeText,
                {
                    translateX: { to: "-" + this.nodeWidth },
                }
            )
            timeline.add(toTargetNodeText,
                {
                    translateY: { to: "+" + this.nodeHeight * 1.5 },
                }
            )
            //Make sure that the temp node will render on top of the target node element
            //and new node element
            if (tempNodeElement.parentNode != null) {
                tempNodeElement.parentNode.appendChild(tempNodeElement)
            } else {
                throw new Error("bad dom structure")
            }
            //get the text elements from the temp node that should go tot he new node
            //and animate them going to the new node.
            const toNewNodeText: SVGTextElement[] = []
            tempNode.keys.slice(Math.ceil(this.n / 2), this.n).forEach((key: number) => {
                const textElement: SVGTextElement | null = document.querySelector("#" + tempNode.id + " #t" + key)
                if (textElement == null) throw new Error("Bad dom state")
                toNewNodeText.push(textElement)
            })
            timeline.add(toNewNodeText,
                {
                    translateY: { to: "-" + this.nodeHeight * 1.5 },
                }
            )
            timeline.add(toNewNodeText,
                {
                    translateX: { to: "+" + (this.keyRectWidth + this.pointerRectWidth * 2) },
                }
            )
            timeline.add(toNewNodeText,
                {
                    translateY: { to: `+${this.nodeHeight * 1.5}` },
                }
            )
            //replace the temp node text elements with their corresponding new node and
            //target node text elements. Also animate the removal of the temp node.
            newNode.keys.forEach((key: number, i: number) => {
                newNodeElement.appendChild(this.createNewNodeText(key, i))
            })
            const newNodeTextElements = Array.from(newNodeElement.childNodes).filter((child) => {
                return child.nodeName == "text"
            })
            //update the keys of the target node
            targetNodeTextSelection = targetNodeSelection.selectAll(this.nodeTextSelector).data(targetNode.keys,
                function(d) { return d ? "t" + d : (this as SVGTextElement).id })
            this.exitSelections.push(targetNodeTextSelection.exit())
            //reposition the text elements that already existed in the target node
            //and remain to their right position in the node.
            targetNodeTextSelection.nodes().forEach((nodeElement) => {
                const indexInKeyArray = targetNode.keys.findIndex(
                    (keyElement) => {
                        if (nodeElement == null) throw new Error("bad dom state")
                        return keyElement == Number((nodeElement as Element).textContent)
                    }
                )
                timeline.set(nodeElement as HTMLElement, {
                    x: String(this.pointerRectWidth +
                        (this.keyRectWidth / 2) +
                        indexInKeyArray * (this.keyRectWidth + this.pointerRectWidth))
                })
            })
            //create the new nodes in the target node.
            const targetNodeNewTextElements: SVGTextElement[] = []
            const targetNodeElement = targetNodeSelection.nodes()[0]
            targetNodeTextSelection.enter().data().forEach((enterKey: number) => {
                const indexInKeyArray = targetNode.keys.findIndex(
                    (keyElement) => { return keyElement == enterKey }
                )
                const newTextElement = this.createNewNodeText(enterKey, indexInKeyArray)
                targetNodeElement.appendChild(newTextElement)
                targetNodeNewTextElements.push(newTextElement)
            })
            timeline.set([...targetNodeTextSelection.nodes(),
            ...newNodeTextElements, ...targetNodeNewTextElements],
                { opacity: 1, fill: this.textColor })
            timeline.set(tempNodeTextElements, { opacity: 0 })

            //animate the removal of the temp node
            timeline.set(Array.from(tempNodeElement.childNodes).filter((child) => { return child.nodeName == "rect" }), {
                fill: "#F97287"
            })
            timeline.add(
                tempNodeElement,
                {
                    opacity: { to: 0, ease: this.opacityEaseType },
                    transform: `translate(${tempNodeElementX},${tempNodeElementY + this.translateYDist})`
                }, "<"
            )

            insertInParent(targetNode, newNode.keys[0], newNode)
        }
        moveSudoCodeRectangle(10)
        moveSudoCodeRectangle(10, true)

        //bind the data to the DOM at the end just to get the proper exit selections for cleanup of temp nodes
        //old edges and text.
        const self = this
        const treeLayoutRootNode = this.d3TreeLayout(hierarchy(this.bPlusTreeRoot, this.bPlusTreeChildrenDefinition))
        const mainSvgSelection = select(this.mainSvg)
        const nodeSelection = mainSvgSelection
            .selectAll<SVGGElement, d3.HierarchyPointNode<bPlusTreeNode>>(this.nodeSelector)
            .data(treeLayoutRootNode, function(d) { return d ? d.data.id : (this as SVGGElement).id })
        const edgeSelection = mainSvgSelection
            .selectAll<SVGPathElement, d3.HierarchyPointLink<bPlusTreeNode>>(this.edgeSelector)
            .data(treeLayoutRootNode.links(), function(d) {
                if (d) {
                    // when this is true it must be a new link hence bind a new id to that link.
                    if (d.target.data.edgeId == null) d.target.data.edgeId = `${self.edgeIdCount++}`
                    return d.target.data.edgeId
                } else {
                    return (this as SVGPathElement).id
                }
            })
        this.exitSelections.push(nodeSelection.exit())
        this.exitSelections.push(edgeSelection.exit())

        // this is required because morphTo is used to animate edges.
        // it has the side effect of setting a starting position for
        // the timeline. This method call will prevent that from
        // moving edges to the wrong place before the animation is
        // played.
        timeline.init()

        return timeline
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
        // @ts-ignore
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
        return null
    }

    /**
     * 
     * A subsidiary procedure for the delete method
     * @param leftNode A bPlusTreeNode to delete the key value from
     * @param value The key value to delete
     * @param node A node to be deleted from target node pointers array
     * @sideEffects Edits the b+tree structure(this.bPlusTreeRoot) to remove the value from the tree
     */
    // private deleteEntry(targetNode: bPlusTreeNode, value: number, node: bPlusTreeNode | null = null) {
    //     //Attempt to delete the value from the targetNode
    //     //Algorithm found in Database System Concepts 7th edition ch.14 p.648
    //     //TODO decide if in the case of the last value in the tree being
    //     //deleted if the tree should be set to empty.
    //     targetNode.keys = targetNode.keys.filter(element => element != value)
    //     if (node != null) {
    //         targetNode.pointers = targetNode.pointers.filter(element => element !== node)
    //     }
    //
    //     let siblingNode: bPlusTreeNode | null = null;
    //     let betweenValue = null
    //     let isPreviousSibling = false
    //
    //     if (targetNode === this.bPlusTreeRoot && targetNode.pointers.length === 1) {
    //         // targetNode is the root and has only one child
    //         this.bPlusTreeRoot = targetNode.pointers.filter(element => element != null)[0];
    //         this.bPlusTreeRoot.parent = null
    //     } else if (!(targetNode === this.bPlusTreeRoot && targetNode.isLeaf) &&
    //         (targetNode.isLeaf && targetNode.keys.length < Math.ceil((this.n - 1) / 2) ||
    //             !targetNode.isLeaf && targetNode.pointers.length < Math.ceil(this.n / 2))) {
    //         // Find a sibling node to borrow from
    //         if (targetNode.parent) {
    //             const index = targetNode.parent.pointers.indexOf(targetNode);
    //
    //             if (index > 0) { // There is a previous sibling
    //                 siblingNode = targetNode.parent.pointers[index - 1];
    //                 betweenValue = targetNode.parent.keys[index - 1];
    //                 isPreviousSibling = true
    //             } else {
    //                 siblingNode = targetNode.parent.pointers[index + 1];
    //                 betweenValue = targetNode.parent.keys[index];
    //                 isPreviousSibling = false
    //             }
    //         }
    //
    //         if (siblingNode == null || betweenValue == null) {
    //             throw new Error("valid sibling node or between value not found")
    //         }
    //
    //         const totalKeys = siblingNode.keys.length + targetNode.keys.length;
    //
    //         if (targetNode.isLeaf && totalKeys <= this.n - 1 || !targetNode.isLeaf && totalKeys <= this.n - 2) {
    //             // The keys of siblingNode and targetNode can fit in a single node. Coalesce them.
    //             if (!isPreviousSibling) { // targetNode should always be the right sibling
    //                 const temp = siblingNode;
    //                 siblingNode = targetNode;
    //                 targetNode = temp;
    //             }
    //             if (!targetNode.isLeaf) {
    //                 siblingNode.keys.push(betweenValue)
    //                 siblingNode.keys.push(...targetNode.keys)
    //                 siblingNode.pointers.push(...targetNode.pointers)
    //                 targetNode.pointers.forEach(node => {
    //                     node.parent = siblingNode
    //                 })
    //             } else {
    //                 siblingNode.keys.push(...targetNode.keys)
    //                 const targetNodeLastPointer = targetNode.pointers[targetNode.pointers.length - 1]
    //                 if (targetNodeLastPointer) {
    //                     siblingNode.pointers[siblingNode.pointers.length - 1] = targetNodeLastPointer
    //                 } else {
    //                     siblingNode.pointers = []
    //                 }
    //             }
    //             if (targetNode.parent == null) {
    //                 throw new Error("target node parent is null")
    //             }
    //             this.deleteEntry(targetNode.parent, betweenValue, targetNode)
    //         } else {
    //             // Redistribution: borrow an entry from a sibling
    //             if (isPreviousSibling) {
    //                 if (!targetNode.isLeaf) {
    //                     const lastPointer = siblingNode.pointers.pop()
    //                     const lastKey = siblingNode.keys.pop()
    //                     if (lastPointer == undefined || lastKey == undefined) {
    //                         throw new Error("malformed data structure")
    //                     }
    //                     targetNode.pointers.unshift(lastPointer)
    //                     lastPointer.parent = targetNode
    //                     targetNode.keys.unshift(betweenValue)
    //                     if (targetNode.parent == null) {
    //                         throw new Error("target node parent is null")
    //                     }
    //                     targetNode.parent.keys[targetNode.parent.keys.indexOf(betweenValue)] = lastKey
    //                 } else {
    //                     const lastKey = siblingNode.keys.pop()
    //                     if (lastKey == undefined) {
    //                         throw new Error("malformed data structure")
    //                     }
    //                     targetNode.keys.unshift(lastKey)
    //                     if (targetNode.parent == null) {
    //                         throw new Error("target node parent is null")
    //                     }
    //                     targetNode.parent.keys[targetNode.parent.keys.indexOf(betweenValue)] = lastKey
    //                 }
    //             } else {
    //                 if (!targetNode.isLeaf) {
    //                     const firstPointer = siblingNode.pointers.shift()
    //                     const firstKey = siblingNode.keys.shift()
    //                     if (firstPointer == undefined || firstKey == undefined) {
    //                         throw new Error("malformed data structure")
    //                     }
    //                     targetNode.pointers.push(firstPointer)
    //                     firstPointer.parent = targetNode
    //                     targetNode.keys.push(betweenValue)
    //                     if (targetNode.parent == null) {
    //                         throw new Error("target node parent is null")
    //                     }
    //                     targetNode.parent.keys[targetNode.parent.keys.indexOf(betweenValue)] = firstKey
    //                 } else {
    //                     const firstKey = siblingNode.keys.shift()
    //                     if (firstKey == undefined) {
    //                         throw new Error("malformed data structure")
    //                     }
    //                     targetNode.keys.push(firstKey)
    //                     if (targetNode.parent == null) {
    //                         throw new Error("target node parent is null")
    //                     }
    //                     targetNode.parent.keys[targetNode.parent.keys.indexOf(betweenValue)] = firstKey
    //                 }
    //             }
    //         }
    //     }
    // }


    // Undoable Methods Section //
    /**
     * Inserts a value into the BPlus Tree and animates it. Also allows for the
     * redoing undoing of that insert.
     * @param value the number to insert, duplicates can't be added to the tree
     * @return The timeline of the generated animation or null if the value is not inserted.
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
     * @sideEffect calls the insert method to generate the animation. So all side effects of that
     * method are relevant here.
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
         * @sideEffect sets the global variables this.bPlusTreeRoot and this.previousValue
         * to the state they were in before the previous operation.
         * @sideEffect calls the operation method corresponding to the previousOperationType.
         * Therefore all side effects of that method are relevant here.
         */
        const insertUndo = () => {
            //TODO debug this. it seems like what I need to do is reset the dom to what it was before the
            //current insert was completed. Right now this does not seem to be happening right
            this.exitSelections.forEach(selection => {
                selection.remove()
            })
            const rootHierarchyNode = this.d3TreeLayout(hierarchy<bPlusTreeNode>(BPlusTreeBeforePreviousOperation, this.bPlusTreeChildrenDefinition))
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
            //TODO get this working
            //this.createNewNodeText(textSelection.enter(), false)
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
         * @sideEffect the global variables this.previousBPlusTreeRoot and
         * this.previousValue will be modified.
         * @sideEffect the insert method is called so all side effects of that method
         * are relevant here.
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

    //TODO when animating this update all comments
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
        //@ts-ignore
        const deleteUndo = () => {
            // return the global state to its state before the previous delete.
            this.bPlusTreeRoot = structuredClone(BPlusTreeRootStateBeforePreviousOperation)
            this.previousValue = valueBeforePreviousOperation
            this.previousOperationType = operationTypeBeforePreviousOperation

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
            this.previousOperationType = "delete"
            return this.delete(value)
        }

        const generatedTimeline = deleteDo()
        // we don't want to save the algo step if the value to be deleted is not in the tree.
        // Since nothing would happen and the undo and redo would be a noop.
        if (generatedTimeline != null) {
            const deleteAlgoStep: AlgoStep = {
                do: deleteDo,
                undo: () => null
            }
            this.algoStepHistory.addAlgoStep(deleteAlgoStep)
        }

        return generatedTimeline
    }


    // Helper Methods Section //

    /**
     * returns the ID that should be used to find corresponding bPlusTreeNode and
     * SVGPathElement. Intended to be used in a call to d3 data method call.
     * @param svgPathEl The element that is to be joined to the corresponding
     * link data.
     * @param d The link that contains the two node that are the end point and
     * starting point of the svgPathElement. The target node should contain the
     * ID of the SVGPathElement
     * @sideEffect May increment the edgeIdCount global variable.
     * @returns The id of a yet to be created or existing SVGPathElement
     */
    //@ts-ignore
    private linkDataFunc(svgPathEl: SVGPathElement, d: d3.HierarchyPointLink<bPlusTreeNode>) {
        if (d) {
            if (d.target.data.edgeId == null) d.target.data.edgeId = `${this.edgeIdCount++}`
            return d.target.data.edgeId
        } else {
            return svgPathEl.id
        }
    }

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
     * creates a svg text element for a B+ Tree node and gives it an
     * id of t followed by the value. eg. t1, t2, t3...ex
     * @param value A number that you want represented by a text element.
     * @param valuePosition Where the text element should be placed in a node.
     * eg. 0 is the first element in the node, 1 is the second element in the node...
     * @param isTransparent toggles wether or not text element is transparent
     * initially. This exists so that text reveal can be animated. Defaults to true.
     * @return SVGTextElement The text element that was created
     */
    private createNewNodeText(value: number, valuePosition: number,
        isTransparent = true): SVGTextElement {
        const newSVGTextElement = document.createElementNS(SVG_NS, "text")
        newSVGTextElement.setAttribute("class", "node-key-text")
        newSVGTextElement.setAttribute("x", String(this.pointerRectWidth +
            (this.keyRectWidth / 2) +
            valuePosition * (this.keyRectWidth + this.pointerRectWidth)))
        newSVGTextElement.setAttribute("y", String(this.nodeHeight / 2))
        //Since we won't be animating adding the text we need it to be black
        if (isTransparent) {
            newSVGTextElement.setAttribute("fill", "#48D016")
        } else {
            newSVGTextElement.setAttribute("fill", this.textColor)
        }
        //a text element needs an ID so that later the right key data can be
        //associated with it using d3 selection.
        newSVGTextElement.setAttribute("id", "t" + value)
        newSVGTextElement.textContent = String(value)

        if (isTransparent) {
            newSVGTextElement.setAttribute("opacity", "0")
        }

        return newSVGTextElement
    }

    /**
     * defines how D3 hierarchy should get the child nodes
     * @param node The node that you want to know the children of.
     * @return bPlusTreeNode[] an array to be treated as the children of the input node.
     */
    private bPlusTreeChildrenDefinition = (node: bPlusTreeNode) => {
        if (node.isLeaf) {
            return []
        } else {
            //Need to convert the pointers array to the type that will be excepted by the
            //d3 hierarchy generator.
            const pointerArrayNoNulls: bPlusTreeNode[] = []
            let j: number = 0
            node.pointers.forEach((node) => {
                if (node != null) {
                    pointerArrayNoNulls[j++] = node
                }
            })
            return pointerArrayNoNulls
        }
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
     * Create a svg path element and insert it into the DOM so that it can be used
     * in a call to the morphTo method of the animejs library.
     * @param sourceX the x coordinate of the source B+ Tree node SVG element.
     * @param sourceY the y coordinate of the source B+ Tree node SVG element.
     * @param targetX the x coordinate of the target B+ Tree node SVG element.
     * @param targetY the y coordinate of the target B+ Tree node SVG element.
     * @param targetIndex the index of the target node in the source nodes
     * pointer array. This determines the right offset of the source position
     * of the generated path element.
     * @param isLeaf Changes the path generator function to match the case of leaf edge vs node edge.
     * defaults to false
     * @sideEffect Adds a path element as a child of the defs element of the main svg element.
     * @sideEffect Throws error on failure to select the defs element.
     * @return The created path element
     */
    private generateMorphToPath = (sourceX: number, sourceY: number,
        targetX: number, targetY: number, targetIndex: number, isLeaf = false) => {
        let pathString = this.generateEdgePathFN(sourceX, sourceY, targetX, targetY, targetIndex)
        if (isLeaf) {
            // TODO refactor this function to not include these helper functions.
            // pathString = this.generateLeafEdgePathFN(d)
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
     * Creates a string that represents the svg path for a B+ Tree node edge.
     * Do not change interface createNewEdgeSvgElements depends on it.
     * @param sourceX the x coordinate of the source B+ Tree node SVG element.
     * @param sourceY the y coordinate of the source B+ Tree node SVG element.
     * @param targetX the x coordinate of the target B+ Tree node SVG element.
     * @param targetY the y coordinate of the target B+ Tree node SVG element.
     * @param targetIndex the index of the target node in the source nodes
     * pointer array. This determines the right offset of the source position
     * of the generated path string.
     * @return the string meant to be used as the d attribute of an svg path element
     */
    private generateEdgePathFN = (sourceX: number, sourceY: number,
        targetX: number, targetY: number, targetIndex: number) => {
        sourceX = (sourceX +
            (this.pointerRectWidth / 2) +
            ((this.pointerRectWidth + this.keyRectWidth) * targetIndex))
        sourceY = sourceY + this.nodeHeight / 2

        targetX = targetX + this.nodeWidth / 2

        const path = d3Path()
        path.moveTo(sourceX, sourceY)
        path.bezierCurveTo(sourceX, sourceY + 70, targetX, targetY - 50, targetX, targetY)

        return path.toString()
    }


    /**
     * Creates a string that represents the svg path for a B+ Tree leaf edge.
     * @param d A d3 datum that contains the source and target data for a B+ Tree leaf edge.
     * @return The string meant to be used as the d attribute of an svg path element.
     */
    // @ts-ignore
    private generateLeafEdgePathFN = (d: d3.HierarchyPointLink<bPlusTreeNode>) => {
        const path = d3Path()

        const x1 = (this.nodeWidth / 2) - (this.pointerRectWidth / 2)
        const x2 = (this.nodeWidth / 2)

        path.moveTo(d.source.x + x1, d.source.y + this.nodeHeight / 2)
        path.lineTo(d.target.x - x2, d.target.y + this.nodeHeight / 2)
        return path.toString()
    }

    /**
     * Creates a new svg element for B+ Tree edge.
     * @param link a d3 hierarchy node link
     * @param isTransparent toggles whether or not the edge is transparent
     * initially. This exists so that edge reveal can be animated. defaults
     * to true
     * @return the created svg path element
     */
    private createNewEdgeSvgElement(link: d3.HierarchyPointLink<bPlusTreeNode>,
        isTransparent = true): SVGPathElement {
        let className = this.edgeClassName
        let edgePathFnGenerator = this.generateEdgePathFN

        const newSVGPathElement = document.createElementNS(SVG_NS, "path")
        newSVGPathElement.setAttribute("class", className)
        const targetIndex = link.source.data.pointers.indexOf(link.target.data)
        newSVGPathElement.setAttribute("d", edgePathFnGenerator(link.source.x, link.source.y,
            link.target.x, link.target.y, targetIndex))
        newSVGPathElement.setAttribute("fill", "none")
        newSVGPathElement.setAttribute("id", `${link.target.data.edgeId}`)
        newSVGPathElement.setAttribute("stroke", "black")
        newSVGPathElement.setAttribute("stroke-width", "2px")
        newSVGPathElement.setAttribute("opacity", isTransparent ? "0" : "1")

        return newSVGPathElement
    }

    /**
     * Creates a new svg element for a B+ Tree leaf edge.
     * @param sourceNode the node that the edge should point from.
     * @param targetNode the node that the edge should point to.
     * @dependency if one or more of the inputed B+ tree nodes doesn't have a corresponding
     * DOM element with hierarchy node data attached to it by D3. Then this method will throw an
     * error
     * @return the created svg path element. The ID of this element is in
     * the format s-t. Where s is the id of the source node and t is the
     * id of the target node.
     */
    private createNewLeafEdgeSvgElement(sourceNode: bPlusTreeNode,
        targetNode: bPlusTreeNode): SVGPathElement {
        let className = this.leafNodeEdgeClassName
        const sourceNodeSelection = select<HTMLElement, HierarchyPointNode<bPlusTreeNode> | undefined>(sourceNode.id)
        const targetNodeSelection = select<HTMLElement, HierarchyPointNode<bPlusTreeNode> | undefined>(targetNode.id)
        const sourceHierarchyNode = sourceNodeSelection.data()[0]
        const targetHierarchyNode = targetNodeSelection.data()[0]
        if (!sourceHierarchyNode || !targetHierarchyNode) {
            throw new
                Error("bad state, expected input B+ tree nodes to have corresponding DOM elements but they do not.")
        }
        const newSVGPathElement = document.createElementNS(SVG_NS, "path")
        newSVGPathElement.setAttribute("class", className)
        newSVGPathElement.setAttribute("d", this.generateEdgePathFN(sourceHierarchyNode.x, sourceHierarchyNode.y,
            targetHierarchyNode.x, targetHierarchyNode.y, this.n - 1))
        newSVGPathElement.setAttribute("fill", "none")
        newSVGPathElement.setAttribute("id", `${sourceNode.id}-${targetNode.id}`)
        newSVGPathElement.setAttribute("stroke", "black")
        newSVGPathElement.setAttribute("stroke-width", "2px")
        newSVGPathElement.setAttribute("opacity", "1")
        return newSVGPathElement
    }

    /**
     * 
     * Creates a HTML element that represents one bplus tree node. This method
     * exists to keep all styling of bplus tree nodes in one spot. The origin of
     * the node is at its top left corner. By default all nodes are made invisible when created
     * so that they can later be revealed in an animation.
     * To animate a node created by this method using animejs v4 you must animate its transform
     * attribute as astring. This mean you can not use the animejs built in transform animation
     * syntax sugar. :(
     * @param node The bPlusTreeNode to create an svg element for.
     * @param x The x coordinate of the node. Defaults to 0.
     * @param y The y coordinate of the node. Defaults to 0.
     * @param isTransparent Toggles wether or not the node is transparent. Defaults to true.
     * @param isTempNode Toggle wether or not the node needs room for an extra
     * key. Defaults to false.
     *
     * @dependency this.n The size of a bplus tree node
     * @return SVGGElement The SVGGElement that was created
     */
    private createNodeElement(node: bPlusTreeNode, x = 0, y = 0,
        isTransparent = true, isTempNode = false): SVGGElement {
        let transparencyValue = 0
        if (isTransparent == false) {
            transparencyValue = 1
        }
        // new node elements are placed before all the edge path elements
        // because nodes must always be rendered below the edges to get the
        // desired visual results.
        const insertBeforeElement = this.mainSvg.querySelector(":scope > path")
        const newGElementsSelection = select(this.mainSvgId).insert("g",
            insertBeforeElement ? `:scope > ${insertBeforeElement?.tagName}` : undefined)
            .attr("class", "node")
            .attr("id", String(node.id))
            .attr("transform-origin", "center")
            .attr("transform", "translate(" + String(x) + "," + String(y) + ")")
            .attr("opacity", transparencyValue)

        for (let i = 0; i < (this.n - 1); i++) {
            const currentXCordOrigin = i * (this.pointerRectWidth + this.keyRectWidth)
            newGElementsSelection.append('rect')
                .attr("class", this.nodeClassName)
                .attr("width", this.pointerRectWidth)
                .attr("height", this.nodeHeight)
                .attr("x", currentXCordOrigin)
                .attr("y", 0)
                .attr("fill", this.lightGreen)
            newGElementsSelection.append('rect')
                .attr("class", this.nodeClassName)
                .attr("width", this.keyRectWidth)
                .attr("height", this.nodeHeight)
                .attr("x", currentXCordOrigin + this.pointerRectWidth)
                .attr("y", 0)
                .attr("fill", this.lightGreen)
        }
        newGElementsSelection.append('rect')
            .attr("class", this.nodeClassName)
            .attr("width", this.pointerRectWidth)
            .attr("height", this.nodeHeight)
            .attr("x", (this.n - 1) * (this.pointerRectWidth + this.keyRectWidth))
            .attr("y", 0)
            .attr("fill", this.lightGreen)

        if (isTempNode) {
            //add an extra key rectangle to the node
            newGElementsSelection.append('rect')
                .attr("class", this.nodeClassName)
                .attr("width", this.keyRectWidth)
                .attr("height", this.nodeHeight)
                //place the extra key rectangle at the end of the node
                .attr("x", (this.n - 1) * (this.pointerRectWidth + this.keyRectWidth) + this.pointerRectWidth)
                .attr("y", 0)
                .attr("fill", this.lightGreen)

        }

        return newGElementsSelection.nodes()[0]
    }

    /**
     *
     * Represents the sudo code rectangle that is used to provide a visual
     * indication of where the animation is currently at in the sudo code. And
     * displays the sudo code that corresponds to the operationType params value.
     * @param timeline the timeline to add the animations to
     * @param operationType the type of operation that the sudo code rectangle
     * is being used for.
     * @dependency The specific css and html sudo code divs located in the
     * index.html file and the style.css files.
     * @sideEffect edits the DOM structure of the sudo code div
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

        timeline.add(divToReveal, {
            opacity: 1,
        })
        // hide all the other sudo code that isn't being used
        divArray.forEach((div) => {
            if (div !== null) {
                timeline.set(div, {
                    opacity: 0
                }, "<<")
            }
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
                timeline.add(sudoCodeRectangle, {
                    width: sudoCodeRectWidth,
                }).add(sudoCodeRectangle, {
                    top: ((sudoCodeLineHeightFloat * 1) - 1) + "lh",
                })
            } else if (sudoCodeLineGoal == 1) {
                timeline.add(sudoCodeRectangle, {
                    width: widthToAnimate + "px",
                })
            } else {
                timeline.add(sudoCodeRectangle, {
                    width: sudoCodeRectWidth,
                }).add(sudoCodeRectangle, {
                    top: ((sudoCodeLineHeightFloat * sudoCodeLineGoal) - 1) + "lh",
                }).add(sudoCodeRectangle, {
                    width: widthToAnimate + "px",
                })
            }

            return timeline
        }

        return moveSudoCodeRectangle
    }
}
