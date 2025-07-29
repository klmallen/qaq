import DefaultTheme from 'vitepress/theme'
import QaqLogo from '../components/QaqLogo.vue'
import CodeExample from '../components/CodeExample.vue'
import ApiReference from '../components/ApiReference.vue'
import NodeDiagram from '../components/NodeDiagram.vue'
import './custom.css'

export default {
  ...DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    // Register custom components
    app.component('QaqLogo', QaqLogo)
    app.component('CodeExample', CodeExample)
    app.component('ApiReference', ApiReference)
    app.component('NodeDiagram', NodeDiagram)

    // Add loading animation
    if (typeof document !== 'undefined') {
      router.onBeforeRouteChange = () => {
        document.body.classList.add('loading')
      }
      
      router.onAfterRouteChanged = () => {
        document.body.classList.add('done')
        setTimeout(() => document.body.classList.remove('loading', 'done'), 200)
      }
    }
  }
}
