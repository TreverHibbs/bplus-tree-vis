export interface bPlusTreeNode {
    pointers: bPlusTreeNode[]
    keys: number[]
    isLeaf: boolean
}