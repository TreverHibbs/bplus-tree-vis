/**
 * Using this class the algo visualizer class can represent bplus tree nodes.
 * Each instance of this class represents a Bplus Tree Node.
 */
export class bPlusTreeNode {
    pointers: bPlusTreeNode[] = []
    keys: number[] = []
    isLeaf: boolean
    parent: bPlusTreeNode | null = null
    id: number

    constructor(initIsLeaf: boolean, id: number, initPointers?: bPlusTreeNode[], initKeys?: number[], initParent?: bPlusTreeNode) {
        this.isLeaf = initIsLeaf
        this.id = id
        if (initKeys) {
            this.keys = initKeys
        }
        if (initPointers) {
            this.pointers = initPointers
        }
        if (initParent) {
            this.parent = initParent
        }
    }
}