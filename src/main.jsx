import { render } from 'preact'
import './index.css'
import { App } from './app.jsx'
import { initTheme } from './theme.js'

initTheme()
render(<App />, document.getElementById('app'))
