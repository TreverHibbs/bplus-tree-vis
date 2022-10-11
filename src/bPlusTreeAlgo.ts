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
    private bPlusTreeRoot: bPlusTreeNode

    /**
     * 
     * @param nodeSize Determines how many pointers are contained
     * in each node of the B+tree.
     */
    constructor(nodeSize: number) {
        this.n = nodeSize
        this.bPlusTreeRoot = new bPlusTreeNode(true)
    }

    /**
     * 
     * Find a numeric key in the B+Tree. Assumes that there are no duplicates.
     * 
     * @param keyToFind A number to locate in the B+Tree.
     * 
     * @returns An object that contains a found boolean flag which indicates if
     * the key was found. The bPlusTreeNode that should contain the key if it
     * exists in the tree. And finally the index of the key if it has been found.
    */
    find(keyToFind: number): { found: boolean, node: bPlusTreeNode, index?: number } {
        let currentNode = this.bPlusTreeRoot
        while (currentNode && !currentNode.isLeaf) {
            const smallestValidNum = Math.min(...currentNode.keys.filter((element) => { return keyToFind <= element }));
            const smallestValidNumIndex = currentNode.keys.findIndex((element) => { smallestValidNum == element })
            if (smallestValidNum == Infinity) {
                for (let i = currentNode.pointers.length - 1; i >= 0; i--) {
                    if (currentNode.pointers[i]) {
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
            return { found: true, node: currentNode, index: currentNode.keys.indexOf(keyToFind) }
        } else {
            return { found: false, node: currentNode }
        }
    }

    /**
     *
     * Insert a number into the B+Tree if it is not already in the tree.
     * 
     * @param value A number to insert into the B+Tree.
     *
     * @returns 1 if insertion was successful and 0 otherwise.
     */
    insert(value: number): number {
        let targetNode: bPlusTreeNode | null = null
        if (this.bPlusTreeRoot.keys.length == 0) {
            targetNode = this.bPlusTreeRoot
        } else {
            const { found, node } = this.find(value)
            if (found) {
                // Do not allow duplicates
                return 0
            } else {
                targetNode = node
            }
        }
        if (targetNode.keys.filter(element => typeof element == "number").length < (this.n - 1)) {
            this.insertInLeaf(targetNode, value)
        }

        return 1
    }

    /**
     * 
     * A subsidiary procedure for the insert method
     * 
     * @param targetNode The node to insert they key value into
     * @param value The key value to insert
     * @returns 1 if successful and 0 otherwise
     */
    private insertInLeaf(targetNode: bPlusTreeNode, value: number) {
        if (value < targetNode.keys[0]) {
            // shift all values in keys to the right one spot.
            for (let i = (targetNode.keys.length - 1); i >= 0; i--) {
                if (targetNode.keys[i]) {
                    targetNode.keys[i + 1] = targetNode.keys[i]
                }
            }

            targetNode.keys[0] = value
        } else {
            // insert value into targetNode.keys just after the value in
            // targetNode.keys that is the highest value that is less than or
            // equal to value.
            for (let i = (targetNode.keys.length - 1); i >= 0; i--) {
                if (targetNode.keys[i] <= value) {
                    for (let j = (targetNode.keys.length - 1); j >= i; j--) {
                        if (targetNode.keys[j]) {
                            if (i == j) {
                                targetNode.keys[j] = value
                                break;
                            } else {
                                targetNode.keys[j + 1] = targetNode.keys[j]
                            }
                        }
                    }
                    break;
                }
            }
        }
        return 1
    }

    // private insert_in_leaf(node: BPlusTreeNode, value: number)
}