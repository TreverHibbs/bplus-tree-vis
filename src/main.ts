import './style.css'
import { AlgoVisualizer } from './algoVisualizer'

window.onload = () => {
  console.debug("window loaded")
  const algoVisualizer = new AlgoVisualizer(4)
  console.debug("insertion return", algoVisualizer.insert(42))
  console.debug("find return", algoVisualizer.find(42))
}
