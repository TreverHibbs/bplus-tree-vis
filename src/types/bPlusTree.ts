export class bPlusTreeNode {
    pointers: bPlusTreeNode[] = []
    keys: number[] = []
    isLeaf: boolean
    parent: bPlusTreeNode | null = null

    constructor(initIsLeaf: boolean, initPointers?: bPlusTreeNode[], initKeys?: number[], initParent?: bPlusTreeNode) {
        this.isLeaf = initIsLeaf
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