import "./style.css"
import { userInterface } from "./userInterface"
// import { tree, hierarchy } from "d3-hierarchy"
// import { select } from "d3-selection"


// const myTree = tree()

// myTree.nodeSize([100, 100])
// myTree.size()
// console.debug("myTree", myTree)
// console.debug("myTree node size", myTree.nodeSize())
// console.debug("myTree size", myTree.size())

// const rootNode = {
//   children: [{ children: [] }, { children: [] }]
// }

// TODO experiment with how d3 selection can be use to manage binding svg
// elements to data
// const myNode = hierarchy(rootNode, (node) => { return node.children })
// const posNode = myTree(myNode)
// console.debug("position node", posNode)

window.onload = () => {
  console.debug("window loaded")

  // const nodeSize = myTree.nodeSize()
  // let nodeWidth = 0
  // let nodeHeight = 0
  // if (nodeSize) {
  //   nodeWidth = nodeSize[0]
  //   nodeHeight = nodeSize[1]
  // }

  // select("#main-svg").selectAll("g").data(posNode).join(
  //   enter => {
  //     const returnSelection = enter.append("rect")
  //       .attr("x", (d) => d.x)
  //       .attr("y", (d) => d.y)
  //       .attr("width", nodeWidth)
  //       .attr("height", nodeHeight)
  //       .attr("background", "black")
        
  //     console.debug("next line")
        
  //     return returnSelection
  //   }
  // )

  userInterface()
}
