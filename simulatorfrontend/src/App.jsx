import { useState, useEffect, useRef, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const KENYAN_NAMES = {
  Male: [
    'Kevin Otieno','Brian Kamau','David Mwangi','Samuel Njoroge',
    'Daniel Ochieng','Joseph Wekesa','Patrick Kiprop','Peter Kiplagat',
    'James Mutua','John Kimani','Michael Nyambega','Stephen Omondi',
    'George Maina','Francis Ndung\'u','Paul Chege','Robert Kiprono',
    'Kennedy Ouko','Erick Omondi','Charles Kariuki','Tom Mboya'
  ],
  Female: [
    'Grace Wanjiku','Mary Atieno','Faith Njeri','Sarah Wambui',
    'Esther Nyambura','Jane Akinyi','Ruth Wairimu','Hannah Achieng',
    'Susan Kemunto','Margaret Nekesa','Nancy Nduta','Diana Wangechi',
    'Catherine Muthoni','Joyce Wagithi','Elizabeth Nyawira','Rose Jerono',
    'Priscah Chebet','Ann Wanjugu','Brenda Owuor','Dorothy Kamene'
  ]
}

function pickName(gender, seed) {
  const list = KENYAN_NAMES[gender] || KENYAN_NAMES.Male
  return list[(seed ?? 0) % list.length]
}

function hashId(id) {
  return id ? parseInt(id.toString().slice(-4), 16) : 0
}

async function apiFetch(path, opts) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export default function App() {
  const [step, setStep] = useState('category') // category | specialty | cases | simulation | assessment
  const [category, setCategory] = useState(null)
  const [specialties, setSpecialties] = useState([])
  const [specialty, setSpecialty] = useState(null)
  const [cases, setCases] = useState([])
  const [selectedCase, setSelectedCase] = useState(null)
  const [patientName, setPatientName] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [conversation, setConversation] = useState([])
  const [typing, setTyping] = useState(false)
  const [ending, setEnding] = useState(false)
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const chatRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [conversation, typing])

  const go = s => { setStep(s); setError(null) }

  const pickCategory = async cat => {
    setCategory(cat)
    setSpecialty(null)
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch(`/cases/specialties?category=${encodeURIComponent(cat)}`)
      setSpecialties(data)
      go('specialty')
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const pickSpecialty = async s => {
    setSpecialty(s)
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch(`/cases?${new URLSearchParams({ category, specialty: s })}`)
      setCases(data)
      go('cases')
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const pickCase = async c => {
    setSelectedCase(c)
    const seed = hashId(c._id)
    const name = pickName(c.patientProfile.gender, seed)
    setPatientName(name)
    setConversation([])
    setSessionId(null)
    setAssessment(null)
    setEnding(false)
    go('simulation')

    try {
      const data = await apiFetch('/simulate/start', {
        method: 'POST',
        body: JSON.stringify({ caseId: c._id }),
      })
      setSessionId(data.sessionId)
      if (data.greeting) {
        setConversation([{ role: 'patient', content: data.greeting }])
      }
    } catch (e) {
      setConversation([{ role: 'system', content: `Failed to start: ${e.message}` }])
    }
  }

  const sendMessage = useCallback(async question => {
    if (!question.trim() || typing || ending) return

    const userMsg = { role: 'user', content: question.trim() }
    setConversation(c => [...c, userMsg])
    setTyping(true)

    try {
      const data = await apiFetch('/simulate/chat', {
        method: 'POST',
        body: JSON.stringify({ sessionId, question: question.trim() }),
      })
      if (data.reply) {
        setConversation(c => [...c, { role: 'patient', content: data.reply }])
      }
      inputRef.current?.focus()
    } catch (e) {
      setConversation(c => [...c, { role: 'system', content: `⚠️ ${e.message}` }])
    }
    setTyping(false)
  }, [sessionId, typing, ending])

  const handleSubmit = e => {
    e.preventDefault()
    const val = inputRef.current?.value
    if (!val) return
    inputRef.current.value = ''
    sendMessage(val)
  }

  const endSimulation = async diagnosis => {
    if (ending) return
    setEnding(true)
    setConversation(c => [...c, { role: 'system', content: '⏳ Ending simulation...' }])

    try {
      const data = await apiFetch('/simulate/end', {
        method: 'POST',
        body: JSON.stringify({ sessionId, diagnosis, endedManually: true }),
      })
      setAssessment(data.assessment)
      go('assessment')
    } catch (e) {
      setEnding(false)
      setConversation(c => [...c, { role: 'system', content: `⚠️ ${e.message}` }])
    }
  }

  const reset = () => {
    setStep('category')
    setCategory(null)
    setSpecialties([])
    setSpecialty(null)
    setCases([])
    setSelectedCase(null)
    setPatientName('')
    setSessionId(null)
    setConversation([])
    setTyping(false)
    setEnding(false)
    setAssessment(null)
    setError(null)
  }

  const msgLabel = (role) => {
    if (role === 'user') return '🧑‍⚕️ You (Doctor)'
    if (role === 'patient') return `🤒 ${patientName || 'Patient'}`
    return ''
  }

  return (
    <div>
      <header>
        <h1>🩺 SimuaMed</h1>
        <p className="subtitle">Clinical Case Simulator</p>
      </header>

      <main>
        {/* Step: Category */}
        <div className={`step ${step === 'category' ? 'active' : ''}`}>
          <h2>Select Case Category</h2>
          <div className="card-grid">
            {['Basic', 'Specialised'].map(cat => (
              <button key={cat} className="card" onClick={() => pickCategory(cat)} disabled={loading}>
                <span className="card-icon">{cat === 'Basic' ? '📘' : '📚'}</span>
                <span className="card-title">{cat}</span>
                <span className="card-desc">{cat === 'Basic' ? 'Fundamental clinical cases' : 'Advanced clinical scenarios'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step: Specialty */}
        <div className={`step ${step === 'specialty' ? 'active' : ''}`}>
          <button className="back-btn" onClick={() => go('category')}>← Back</button>
          <h2>Select Specialty</h2>
          {loading ? (
            <div className="loading"><div className="spinner"></div><p>Loading specialties...</p></div>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            <div className="card-grid">
              {specialties.map(s => (
                <button key={s} className="card" onClick={() => pickSpecialty(s)}>
                  <span className="card-icon">🏥</span>
                  <span className="card-title">{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step: Cases */}
        <div className={`step ${step === 'cases' ? 'active' : ''}`}>
          <button className="back-btn" onClick={() => go('specialty')}>← Back</button>
          <h2>Select Case</h2>
          {loading ? (
            <div className="loading"><div className="spinner"></div><p>Loading cases...</p></div>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : cases.length === 0 ? (
            <p className="error-message">No cases found for this specialty.</p>
          ) : (
            <div className="card-grid">
              {cases.map(c => {
                const name = pickName(c.patientProfile.gender, hashId(c._id))
                return (
                  <button key={c._id} className="card" onClick={() => pickCase(c)}>
                    <span className="card-icon">📋</span>
                    <span className="card-title">{c.title}</span>
                    <span className="card-desc">{c.patientProfile.chiefComplaint || ''}</span>
                    <div className="case-meta">
                      <span>{name}</span>
                      <span>{c.patientProfile.age || '?'}y</span>
                      <span>{c.patientProfile.gender || '?'}</span>
                      <span>{c.specialty}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Step: Simulation */}
        <div className={`step ${step === 'simulation' ? 'active' : ''}`}>
          <button className="back-btn" onClick={() => go('cases')}>← Back to Cases</button>
          <div className="sim-header">
            <h2>{selectedCase?.title}{patientName ? ` — Patient: ${patientName}` : ''}</h2>
            <button className="btn btn-danger" onClick={() => {
              const d = prompt('Enter your diagnosis to end the simulation:')
              if (d !== null) endSimulation(d.trim())
            }} disabled={ending}>
              End Simulation
            </button>
          </div>

          <div id="chat-container" ref={chatRef}>
            <div id="chat-messages">
              {conversation.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  {msg.role !== 'system' && <span className="msg-label">{msgLabel(msg.role)}</span>}
                  <span>{msg.content}</span>
                </div>
              ))}
              {typing && (
                <div className="message patient typing">
                  <span className="msg-label">🤒 {patientName || 'Patient'}</span>
                  <div style={{display:'flex',gap:4}}>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <form id="chat-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              id="question-input"
              placeholder="Ask the patient a question..."
              disabled={typing || ending}
              autoComplete="off"
            />
            <button type="submit" className="btn btn-primary" id="send-btn" disabled={typing || ending}>
              Send
            </button>
          </form>
        </div>

        {/* Step: Assessment */}
        <div className={`step ${step === 'assessment' ? 'active' : ''}`}>
          <h2>Simulation Complete</h2>
          <div id="assessment-container">
            {assessment ? (
              <>
                <div style={{textAlign:'center',marginBottom:'1rem'}}>
                  <div className={`grade-badge grade-${(assessment.grade || 'Pass').replace(/\s+/g, '')}`}>
                    {assessment.grade || 'N/A'}
                  </div>
                  <div className="score-text">{assessment.score ?? 'N/A'}</div>
                  <div style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>Score</div>
                </div>

                <div className="feedback-text">{assessment.feedback || 'No feedback provided.'}</div>

                <div className="lists-grid">
                  <div>
                    <h4>✅ Strengths</h4>
                    <ul className="strengths">
                      {(assessment.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
                      {(!assessment.strengths || assessment.strengths.length === 0) && <li>None listed</li>}
                    </ul>
                  </div>
                  <div>
                    <h4>⚠️ Areas for Improvement</h4>
                    <ul className="weaknesses">
                      {(assessment.weaknesses || []).map((w, i) => <li key={i}>{w}</li>)}
                      {(!assessment.weaknesses || assessment.weaknesses.length === 0) && <li>None listed</li>}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <p className="error-message">No assessment data available.</p>
            )}
          </div>
          <button id="new-sim-btn" className="btn btn-primary" onClick={reset}>Start New Simulation</button>
        </div>
      </main>
    </div>
  )
}
