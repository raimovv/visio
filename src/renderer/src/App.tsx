import { DashboardPage } from './routes/DashboardPage'
import { OverlayRoot } from './components/overlay/OverlayRoot'

export default function App() {
  if (window.location.hash === '#/overlay') {
    return <OverlayRoot />
  }

  return <DashboardPage />
}
