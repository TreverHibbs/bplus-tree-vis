import "./style.css"
import { userInterface } from "./userInterface"


window.onload = () => {
  console.debug("window loaded")

  //TODO test again if string doesnt work for path target
  //test
  // const targetPathArray: SVGPathElement[] = (utils.$("#edge-3-0") as unknown) as SVGPathElement[]
  // const targetPath = targetPathArray[0]
  // const goalPath = utils.$("#testPath")
  // const goalPath2 = utils.$("#testPath2")
  // const duration = 500
  // const t2 = createTimeline({
  //   autoplay: false,
  //   defaults: {
  //     duration: duration,
  //     ease: 'linear'
  //   }
  // })
  //@ts-ignore-error
  // t2.add(targetPath, {
  //   d: animeSvg.morphTo(goalPath2)
  // })
  // //@ts-ignore-error
  // t2.add(targetPath, {
  //   d: animeSvg.morphTo(goalPath)
  // }).init()
  // //TODO finish feedback
  // //targetPath.setAttribute("d", "M 1 1 L 118 27")
  // t2.play()

  userInterface()
}
