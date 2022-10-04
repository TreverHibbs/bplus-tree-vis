import { bPlusTreeNode } from "./types/bPlusTree"

/**
 * 
 * This class implements a B+tree algorithm (as described in the Database System
 * Concepts 7th edition) and generates functions that can animate that
 * algorithm. By using this class a web UI can animate a B+tree. Each instance of
 * this class corresponds to a rendered B+tree algorithm.   
 */
export class BPlusTreeAlgo {
    // Number of pointers in a node.
    readonly n: number
    private bPlusTreeRoot: bPlusTreeNode|null

    /**
     * 
     * @param nodeSize Determines how many pointers are contained
     * in each node of the B+tree.
     */
    constructor(nodeSize: number) {
        this.n = nodeSize
        this.bPlusTreeRoot = null
    }

    /**
     * 
     * Find a numeric key in the B+Tree. Assumes that there are no duplicates.
     * 
     * @param keyToFind A number to locate in the B+Tree.
     * 
     * @returns A pointer to the record of the given search key or null if
     * record does not exist.
     */
    find(keyToFind: number): number|null {
        console.log(this.n, keyToFind)
        return null
    }

    /**
     *
     * Insert a number into the B+Tree if it is not already in the tree.
     * 
     * @param value A number to insert into the B+Tree.
     * @returns 1 if insertion was successful and 0 otherwise.
     */
    insert(value: number): number {
        if (this.bPlusTreeRoot == null) {
            this.bPlusTreeRoot = [value] 
        }
        return 1
    }
    
    // private insert_in_leaf(node: BPlusTreeNode, value: number)
}