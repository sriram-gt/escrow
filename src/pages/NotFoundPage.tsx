import { Link } from 'react-router-dom'

export function NotFoundPage() { return <main className="page-shell"><div className="container dashboard-gate"><div className="eyebrow">404</div><h1>This page took a wrong turn.</h1><p>Return to the marketplace and pick up where you left off.</p><Link className="button button-primary" to="/marketplace">Go to marketplace</Link></div></main> }
