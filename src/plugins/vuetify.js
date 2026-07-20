import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1E63E9',
          secondary: '#0B2545',
          success: '#2E7D32',
          warning: '#ED6C02',
          error: '#D32F2F',
        },
      },
      // Paleta "neón" del catálogo público, reutilizada en el panel de administración.
      neon: {
        dark: true,
        colors: {
          background: '#150c26',
          surface: '#20162f',
          'surface-variant': '#2b2043',
          primary: '#39ff8a',
          'on-primary': '#0a0a0f',
          secondary: '#2b2043',
          success: '#39ff8a',
          'on-success': '#0a0a0f',
          warning: '#ffb84d',
          error: '#ff5c7a',
        },
      },
    },
  },
})
