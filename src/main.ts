import "./style.css"
import { userInterface } from "./userInterface"
import { createTimeline, Timeline, svg as animeSvg, utils, animate} from "./lib/anime.esm"
import { svg } from "d3"


window.onload = () => {
  console.debug("window loaded")

  //TODO use what I learned here to do the real thing
  //test
  // const targetPath = utils.$("#edge-3-0")
  // const goalPath = utils.$("#testPath")
  // animate(targetPath, {
  //   d: animeSvg.morphTo(goalPath),
  //   autoplay: true
  // })

  userInterface()
}
