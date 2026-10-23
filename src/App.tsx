import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { BackgroundAtmosphere } from './components/BackgroundAtmosphere'
import { CursorLaser } from './components/CursorLaser'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'
import { WalletProvider } from './hooks/useWallet'
import { AdminPage } from './pages/AdminPage'
import { CreateJobPage } from './pages/CreateJobPage'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { HowItWorksPage } from './pages/HowItWorksPage'
import { JobDetailsPage } from './pages/JobDetailsPage'
import { MarketplacePage } from './pages/MarketplacePage'
import { NotFoundPage } from './pages/NotFoundPage'

function AppFrame() {
  const location = useLocation()
  const routeName = location.pathname.split('/')[1] || 'home'
  return <BackgroundAtmosphere pointerParallax className={`route-atmosphere route-${routeName}`}><CursorLaser /><div className="app-shell"><Navbar /><div className="app-content route-content" key={location.pathname}><Routes><Route path="/" element={<HomePage />} /><Route path="/marketplace" element={<MarketplacePage />} /><Route path="/jobs/:id" element={<JobDetailsPage />} /><Route path="/create-job" element={<CreateJobPage />} /><Route path="/dashboard" element={<DashboardPage />} /><Route path="/how-it-works" element={<HowItWorksPage />} /><Route path="/admin" element={<AdminPage />} /><Route path="*" element={<NotFoundPage />} /></Routes></div><Footer /></div></BackgroundAtmosphere>
}

function App() {
  return <BrowserRouter><WalletProvider><AppFrame /></WalletProvider></BrowserRouter>
}

export default App
