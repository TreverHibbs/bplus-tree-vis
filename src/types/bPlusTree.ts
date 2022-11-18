let nodeId = 0

/**
 * Using this class the algo visualizer class can represent bplus tree nodes.
 * Each instance of this class represents a Bplus Tree Node.
 */
export class bPlusTreeNode {
    public pointers: (bPlusTreeNode)[] = []
    public keys: (number)[] = []
    public isLeaf: boolean
    public parent: bPlusTreeNode | null = null
    id: number = nodeId++

    /**
     * Initialize properties in new B+ tree node
     * @param initIsLeaf sets isLeaf property
     * @param id sets id property
     */
    constructor(initIsLeaf: boolean) {
        this.isLeaf = initIsLeaf
    }
}