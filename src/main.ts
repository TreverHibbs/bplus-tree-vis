import './style.css'
import { AlgoVisualizer } from './algoVisualizer'

window.onload = () => {
  console.debug("window loaded")
  const algoVisualizer = new AlgoVisualizer(4)
  console.debug("insertion return", algoVisualizer.insert(42))
  console.debug("find return", algoVisualizer.find(42))

  const sudoCodeContainer = document.querySelector("#sudo-code")
  const insertSudoCode = document.querySelector("#insert-sudo-code")
  if (sudoCodeContainer?.innerHTML && insertSudoCode?.innerHTML) {
    sudoCodeContainer.innerHTML = insertSudoCode?.innerHTML
  }
}
