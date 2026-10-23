import { AlertCircle, ArrowLeft, ArrowRight, CircleHelp, Info, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createJob, getBrowserProvider, parseEscrowLogs } from '../services/escrowService'
import { useWallet } from '../hooks/useWallet'
import { useTransaction } from '../hooks/useTransaction'
import { TransactionStatus } from '../components/TransactionStatus'
import { BackLink } from '../components/Primitives'
import { EscrowMascot } from '../components/EscrowMascot'

type CreateStep = 1 | 2 | 3

export function CreateJobPage() {
  const { address, isWrongNetwork, connect, sessionId } = useWallet()
  const navigate = useNavigate()
  const transaction = useTransaction(sessionId)
  const [step, setStep] = useState<CreateStep>(1)
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [validation, setValidation] = useState<string | null>(null)

  const validateBrief = () => {
    if (!description.trim()) return 'Add a clear description so freelancers know what good work looks like.'
    if (description.trim().length > 1000) return 'Keep the description under 1,000 characters.'
    return null
  }

  const validateBudget = () => {
    if (!budget || Number(budget) <= 0 || !/^\d+(\.\d{1,18})?$/.test(budget)) return 'Enter a positive ETH amount with up to 18 decimal places.'
    return null
  }

  const nextStep = () => {
    const error = step === 1 ? validateBrief() : validateBudget()
    setValidation(error)
    if (!error) setStep((current) => Math.min(3, current + 1) as CreateStep)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setValidation(null)
    if (!address) { await connect(); return }
    if (isWrongNetwork) { setValidation('Switch your wallet to Ethereum Sepolia before creating a job.'); return }
    const briefError = validateBrief()
    const budgetError = validateBudget()
    if (briefError || budgetError) { setValidation(briefError ?? budgetError); return }
    const fullDescription = [category.trim() ? `[${category.trim()}]` : '', tags.trim() ? `Tags: ${tags.trim()}` : '', description.trim()].filter(Boolean).join('\n')
    try {
      const tx = await transaction.run(() => createJob(fullDescription, budget))
      const provider = await getBrowserProvider()
      const receipt = await provider.getTransactionReceipt(tx.hash)
      const createdEvent = receipt ? parseEscrowLogs(receipt.logs).find((event) => event.name === 'JobCreated') : undefined
      const createdId = createdEvent && createdEvent.name === 'JobCreated' ? Number(createdEvent.jobId) : null
      navigate(createdId ? `/jobs/${createdId}` : '/marketplace')
    } catch { /* TransactionStatus owns the actionable error. */ }
  }

  const mascotState = transaction.isBusy ? 'pending' : transaction.state.phase === 'failed' ? 'failed' : !address ? 'disconnected' : 'welcome'

  return <main className="page-shell"><div className="container narrow-container"><BackLink /><div className="form-header"><div><div className="eyebrow">Create an agreement</div><h1>Give good work a clear brief.</h1><p>Describe the outcome, set the agreed ETH amount, review the intent, and publish. Creating a job does <strong>not</strong> fund it.</p></div><div className="form-trust"><ShieldCheck size={17} /><span>Sepolia testnet only</span></div></div><div className="mascot-dock"><EscrowMascot state={mascotState} /></div><form className="surface-form" onSubmit={(event) => void submit(event)}><div className="form-stepper" aria-label="Job creation progress">{[['01', 'Describe'], ['02', 'Budget'], ['03', 'Review']].map(([number, label], index) => { const current = index + 1; return <div className={`form-stepper-item ${step === current ? 'is-active' : ''} ${step > current ? 'is-done' : ''}`} key={number}><span className="form-stepper-dot">{step > current ? '✓' : number}</span>{label}</div> })}</div>{step === 1 && <section className="form-section form-step-panel"><div className="form-section-heading"><span className="form-number">01</span><div><h2>Describe the work</h2><p>Good briefs name the outcome, constraints, and what “done” looks like. Category and tags stay frontend-only context and are folded into the stored description.</p></div></div><label className="form-label">Job description <span>Required</span><textarea autoFocus value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What should be true when this work is done? Include constraints, references, and a definition of done." rows={7} maxLength={1000} /><div className="input-footer"><span>Clear briefs attract better matches.</span><span>{description.length}/1,000</span></div></label><div className="form-two-col"><label className="form-label">Category <span>Optional</span><input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="e.g. Product design" /></label><label className="form-label">Tags <span>Optional</span><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="e.g. Figma, mobile, motion" /></label></div><div className="form-actions"><Link className="button button-ghost" to="/marketplace">Cancel</Link><button className="button button-primary" type="button" onClick={nextStep}>Continue to budget <ArrowRight size={16} /></button></div></section>}{step === 2 && <section className="form-section form-step-panel"><div className="form-section-heading"><span className="form-number">02</span><div><h2>Set the commitment</h2><p>This is the intended escrow budget. It is stored in wei now, but no ETH moves until you later fund an accepted job.</p></div></div><label className="form-label budget-label">Budget in ETH <span>Required</span><div className="budget-input"><input autoFocus value={budget} onChange={(event) => setBudget(event.target.value)} inputMode="decimal" placeholder="0.00" aria-describedby="budget-help" /><span>ETH</span></div><div className="input-help" id="budget-help"><Info size={14} /> Creating the job costs gas. Funding is a separate payable transaction for exactly this amount.</div></label><div className="form-actions"><button className="button button-ghost" type="button" onClick={() => { setValidation(null); setStep(1) }}><ArrowLeft size={16} /> Back</button><button className="button button-primary" type="button" onClick={nextStep}>Review agreement <ArrowRight size={16} /></button></div></section>}{step === 3 && <section className="form-section form-step-panel"><div className="form-section-heading"><span className="form-number">03</span><div><h2>Review before publishing</h2><p>MetaMask will ask you to confirm a job-creation transaction. The job price is not transferred in this step; only network gas is charged.</p></div></div><div className="review-card"><div className="review-row"><span>Brief stored in contract</span><p>{[category.trim() ? `[${category.trim()}]` : '', tags.trim() ? `Tags: ${tags.trim()}` : '', description.trim()].filter(Boolean).join('\n')}</p></div><div className="review-row"><span>Intended escrow budget</span><strong>{budget} ETH</strong></div><div className="review-row"><span>Next step after confirmation</span><p>Open the real job page and explicitly fund escrow once a freelancer accepts.</p></div></div><div className="form-actions"><button className="button button-ghost" type="button" onClick={() => { setValidation(null); setStep(2) }}><ArrowLeft size={16} /> Edit budget</button><button className="button button-primary" type="submit" disabled={transaction.isBusy}>{address ? 'Create job in wallet' : 'Connect wallet to continue'} <ArrowRight size={16} /></button></div></section>}{validation && <div className="form-alert"><AlertCircle size={17} /><span>{validation}</span></div>}<TransactionStatus state={transaction.state} explorerUrl={transaction.explorerUrl} /></form><div className="below-note"><CircleHelp size={15} /> Need test ETH? Use a Sepolia faucet, then return here. Never use mainnet funds.</div></div></main>
}
