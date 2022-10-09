export class bPlusTreeNode {
    pointers: bPlusTreeNode[] = []
    keys: number[] = []
    isLeaf: boolean

    constructor(initIsLeaf: boolean, initPointers?: bPlusTreeNode[], initKeys?: number[]) {
        this.isLeaf = initIsLeaf
        if (initKeys) {
            this.keys = initKeys
        }
        if (initPointers) {
            this.pointers = initPointers
        }
    }
}