import "./style.css"
import { userInterface } from "./userInterface"
import { createTimeline, Timeline, svg as animeSvg, utils, animate } from "./lib/anime.esm"


window.onload = () => {
  console.debug("window loaded")

  //TODO test again if string doesnt work for path target
  //test
  // const targetPath = utils.$("#edge-3-0")
  // const goalPath = utils.$("#testPath")
  // animate(targetPath, {
  //   d: animeSvg.morphTo("M-84,14.5C-84,84.5,-200.20000000000002,29,-200.20000000000002,79"),
  //   autoplay: true
  // })

  userInterface()
}
