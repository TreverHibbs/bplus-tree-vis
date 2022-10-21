//TODO add new property that contains SVG element
export class bPlusTreeNode {
    pointers: bPlusTreeNode[] = []
    keys: number[] = []
    isLeaf: boolean
    parent: bPlusTreeNode | null = null
    svgElement: SVGGElement | null = null

    constructor(initIsLeaf: boolean, initPointers?: bPlusTreeNode[], initKeys?: number[], initParent?: bPlusTreeNode, initSvgElement?: SVGGElement) {
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
        if (initSvgElement) {
            this.svgElement = initSvgElement
        }
    }
}