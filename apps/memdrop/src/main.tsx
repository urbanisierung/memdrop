import { render } from 'preact'
import { App } from './app.js'
import './styles/main.css'

const root = document.getElementById('app')
if (!root) throw new Error('Missing #app mount point')
render(<App />, root)
