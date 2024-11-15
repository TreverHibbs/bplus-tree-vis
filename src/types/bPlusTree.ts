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
     * @param node the node to add to the pointers array
     * @param index the index at which to place the input node in the pointers array
     * @dependency the pointers array
     * @sideEffect the inserted nodes parent property is updated to point to this node
     * @sideEffect set parent property of a node already stored at the specified index of the pointer array to null
     */
    public addNodeToPointers(node: bPlusTreeNode, index: number) {
        if (this.pointers[index]) {
            this.pointers[index].parent = null
        }
        this.pointers[index] = node
        node.parent = this
    }

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
        if (this.pointers[index]) {
            this.pointers[index].parent = null
            this.pointers[index] = null
        }
    }
}
