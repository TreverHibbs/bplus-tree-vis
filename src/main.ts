import './style.css'
import { BPlusTreeAlgo } from './bPlusTreeAlgo'

const bPlusTreeAlgo = new BPlusTreeAlgo(4)
bPlusTreeAlgo.find()

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <h1>hello mom!</h1>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`
