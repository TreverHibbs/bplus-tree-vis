/**
 * Using this class the algo visualizer class can represent bplus tree nodes.
 * Each instance of this class represents a Bplus Tree Node.
 */
export class bPlusTreeNode {
    public pointers: bPlusTreeNode[] = []
    public keys: number[] = []
    public isLeaf: boolean
    public parent: bPlusTreeNode | null = null
    id: number

    constructor(initIsLeaf: boolean, id: number) {
        this.isLeaf = initIsLeaf
        this.id = id
    }
}