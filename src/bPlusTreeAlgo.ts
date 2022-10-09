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
    private bPlusTreeRoot: bPlusTreeNode | null

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
    find(keyToFind: number): number | null {
        if (this.bPlusTreeRoot == null) {
            return null;
        }

        let currentNode = this.bPlusTreeRoot
        while (currentNode && !currentNode.isLeaf) {
            const smallestValidNum = Math.min(...currentNode.keys.filter((element) => { return keyToFind <= element }));
            const smallestValidNumIndex = currentNode.keys.findIndex((element) => { smallestValidNum == element })
            if (smallestValidNum == Infinity) {
                for(let i = currentNode.pointers.length-1; i >= 0; i--){
                    if(currentNode.pointers[i]){
                        currentNode = currentNode.pointers[i]
                        break;
                    }
                }
            } else if (keyToFind == smallestValidNum) {
                currentNode = currentNode.pointers[smallestValidNumIndex + 1]
            } else {
                // keyToFind < smallestValidNum
                currentNode = currentNode.pointers[smallestValidNumIndex]
            }
        }
        if (currentNode.keys && currentNode.keys.includes(keyToFind)) {
            //TODO contemplate returning the node instead of just a number.
            return currentNode.keys[currentNode.keys.indexOf(keyToFind)]
        }else{
            return null
        }
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
            this.bPlusTreeRoot = new bPlusTreeNode(true, [], [value])
        }
        return 1
    }

    // private insert_in_leaf(node: BPlusTreeNode, value: number)
}