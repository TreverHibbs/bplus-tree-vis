let nodeId = 0

/**
 * Using this class the algo visualizer class can represent bplus tree nodes.
 * Each instance of this class represents a Bplus Tree Node.
 */
export class bPlusTreeNode {
    /** initialized to empty array */
    public readonly pointers: (bPlusTreeNode | null)[] = []
    /** initialized to empty array */
    public keys: (number)[] = []
    /** initialized by constructor parameter */
    public isLeaf: boolean
    /** initialized to null */
    public parent: bPlusTreeNode | null = null
    // This id needs to be prefixed by n because the id
    // is used as a DOM id. And DOM ids cannot start with a number.
    /** incrementing id */
    public id: string = "n" + nodeId++
    /** The id of the internal edges SVGPathElement that
     * points to this node instance. If no such edge exists
     * then set to null*/
    public edgeId: string | null = null

    /**
     * Initialize properties in new B+ tree node
     *
     * @param initIsLeaf sets isLeaf property
     */
    constructor(initIsLeaf: boolean) {
        this.isLeaf = initIsLeaf
    }

    /**
     * add a node to the array of nodes that this node points to
     *
     * @param node the node to add to the pointers array. If null adds null to the array.
     * @param index the index at which to place the input node in the pointers array. If not
     * specified adds node to end of pointers array.
     * @dependency the pointers array
     * @sideEffect the inserted nodes parent property is updated to point to this node
     * @sideEffect set parent property of a node already stored at the specified index of the pointer array to null
     */
    public addNodeToPointers(node: bPlusTreeNode | null, index: number = -1) {
        if (this.pointers === null) {
            throw new Error("pointers was null, this should not happen, bad state")
        }
        if (index === -1) {
            for (let i = 0; i <= this.pointers.length; i++) {
                if (this.pointers[i] === null || this.pointers.length === i) {
                    this.pointers[i] = node
                    return
                }
            }
        } else {
            this.pointers[index] = node
            if (node != null) {
                node.parent = this
            }
        }
    }

    //TODO make this get rid of nulls at end of array if they are there on insert
    /**
     * remove a node from the array of nodes that this node points to. If the element at the provided index
     * is null then this is a no op.
     *
     * @param index the index of the node to remove
     * @dependency the pointers array
     * @sideEffect updates the removed nodes parent property to null
     * @sideEffect updates the pointers array
     */
    public removeNodeFromPointers(index: number) {
        const targetNode = this.pointers[index]
        if (targetNode === null) {
            return
        } else {
            targetNode.parent = null
            this.pointers[index] = null
            //don't have nulls at end of an array of pointers
            if (index == this.pointers.length - 1) {
                for (let j = index; j >= 0; j--) {
                    if (this.pointers[j] === null) {
                        this.pointers.length = j
                    } else {
                        return
                    }
                }
            }
        }
    }
}
