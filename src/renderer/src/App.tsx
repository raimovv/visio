import { DashboardPage } from './routes/DashboardPage'
import { OverlayRoot } from './components/overlay/OverlayRoot'

function isOverlayRoute(hash: string) {
  const normalized = hash.replace(/^#/, '')
  return normalized === '/overlay' || normalized === 'overlay'
}

export default function App() {
  if (isOverlayRoute(window.location.hash)) {
    return <OverlayRoot />
  }

  return <DashboardPage />
}
