let nodeId = 0

/**
 * Using this class the algo visualizer class can represent bplus tree nodes.
 * Each instance of this class represents a Bplus Tree Node.
 */
export class bPlusTreeNode {
    /** initialized to empty array */
    public pointers: (bPlusTreeNode)[] = []
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

    /**
     * Initialize properties in new B+ tree node
     *
     * @param initIsLeaf sets isLeaf property
     */
    constructor(initIsLeaf: boolean) {
        this.isLeaf = initIsLeaf
    }
}