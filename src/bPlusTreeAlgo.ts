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

    /**
     * 
     * @param node_size Determines how many pointers are contained
     * in each node of the B+tree.
     */
    constructor(node_size: number) {
        this.n = node_size
    }

    find() {
        console.log(this.n)
    }

}