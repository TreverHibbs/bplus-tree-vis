import './style.css'
import { BPlusTreeAlgo } from './bPlusTreeAlgo'

const bPlusTreeAlgo = new BPlusTreeAlgo(4)
console.debug("insertion return", bPlusTreeAlgo.insert(42))

console.debug("find return", bPlusTreeAlgo.find(42))

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <h1>hello mom!</h1>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`
