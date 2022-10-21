/**
 * Keeps track of svg animation state and provides building blocks for
 * animating a bplus tree.
 */
export class AnimeManager {
    private svgCanvas = document.querySelector('#main-svg')
    private nodeSize = 0

    constructor(initNodeSize: number) {
        this.nodeSize = initNodeSize
    }

    /**
     * Creates a svg representation of a bplus tree node
     */
    public createNode() {

        return 1
    }

    /**
     * Deletes a svg representation of a bplus tree node
     */
    public deleteNode() {
        return 1
    }

    /**
     * translates a bplus tree node from point A to B
     */
    public translateNode() {
        return 1
    }

    /**
     * creates a edge from one node to another
     */
    public createEdge() {
        return 1
    }
}