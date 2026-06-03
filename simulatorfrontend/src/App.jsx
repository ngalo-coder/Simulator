import { useState, useEffect, useRef, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Constants
const STEPS = {
  CATEGORY: 'category',
  SPECIALTY: 'specialty',
  CASES: 'cases',
  SIMULATION: 'simulation',
  ASSESSMENT: 'assessment',
}

const CATEGORIES = [
  { name: 'Basic', icon: '📘', desc: 'Fundamental clinical cases' },
  { name: 'Specialised', icon: '📚', desc: 'Advanced clinical scenarios' },
]

// Utility: API calls with consistent error handling
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

// Component: Loading spinner
function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  )
}

// Component: Error message
function ErrorMessage({ text }) {
  return <p className="error-message">{text}</p>
}

// Component: Message bubble in chat
function Message({ msg, patientName }) {
  if (msg.role === 'system') {
    return (
      <div className="message system">
        <span>{msg.content}</span>
      </div>
    )
  }

  const isUser = msg.role === 'user'
  const label = isUser ? '🧑‍⚕️ You (Doctor)' : `🤒 ${patientName || 'Patient'}`

  return (
    <div className={`message ${msg.role}`}>
      <span className="msg-label">{label}</span>
      <span>{msg.content}</span>
    </div>
  )
}

// Component: Typing indicator
function TypingIndicator({ patientName }) {
  return (
    <div className="message patient typing">
      <span className="msg-label">🤒 {patientName || 'Patient'}</span>
      <div className="typing-dots">
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
      </div>
    </div>
  )
}

// Component: Category selection step
function CategoryStep({ onSelect, loading }) {
  return (
    <div className="step active">
      <h2>Select Case Category</h2>
      <div className="card-grid">
        {CATEGORIES.map(cat => (
          <button
            key={cat.name}
            className="card"
            onClick={() => onSelect(cat.name)}
            disabled={loading}
          >
            <span className="card-icon">{cat.icon}</span>
            <span className="card-title">{cat.name}</span>
            <span className="card-desc">{cat.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Component: Specialty selection step
function SpecialtyStep({ specialties, loading, error, onSelect, onBack }) {
  return (
    <div className="step active">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2>Select Specialty</h2>
      {loading && <LoadingState message="Loading specialties..." />}
      {error && <ErrorMessage text={error} />}
      {!loading && !error && (
        <div className="card-grid">
          {specialties.map(specialty => (
            <button key={specialty} className="card" onClick={() => onSelect(specialty)}>
              <span className="card-icon">🏥</span>
              <span className="card-title">{specialty}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Component: Case selection step
function CasesStep({ cases, loading, error, onSelect, onBack }) {
  return (
    <div className="step active">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2>Select Case</h2>
      {loading && <LoadingState message="Loading cases..." />}
      {error && <ErrorMessage text={error} />}
      {!loading && !error && cases.length === 0 && (
        <ErrorMessage text="No cases found for this specialty." />
      )}
      {!loading && !error && cases.length > 0 && (
        <div className="card-grid">
          {cases.map(caseItem => (
            <button
              key={caseItem._id}
              className="card"
              onClick={() => onSelect(caseItem)}
            >
              <span className="card-icon">📋</span>
              <span className="card-title">{caseItem.patientName}</span>
              <span className="card-desc">{caseItem.patientProfile.chiefComplaint || ''}</span>
              <div className="case-meta">
                <span>{caseItem.patientProfile.age || '?'}y</span>
                <span>{caseItem.patientProfile.gender || '?'}</span>
                <span>{caseItem.specialty}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Component: Simulation step
function SimulationStep({
  patientName,
  patientAge,
  conversation,
  typing,
  ending,
  chatRef,
  inputRef,
  onSendMessage,
  onEndSimulation,
  onBack,
}) {
  const handleSubmit = e => {
    e.preventDefault()
    const val = inputRef.current?.value?.trim()
    if (!val) return
    inputRef.current.value = ''
    onSendMessage(val)
  }

  return (
    <div className="step active">
      <button className="back-btn" onClick={onBack}>← Back to Cases</button>
      <div className="sim-header">
        <h2>
          {patientName}
          {patientAge && `, ${patientAge}y`}
        </h2>
        <button
          className="btn btn-danger"
          onClick={() => {
            const diagnosis = prompt('Enter your diagnosis to end the simulation:')
            if (diagnosis !== null) onEndSimulation(diagnosis.trim())
          }}
          disabled={ending}
        >
          End Simulation
        </button>
      </div>

      <div id="chat-container" ref={chatRef}>
        <div id="chat-messages">
          {conversation.map((msg, i) => (
            <Message key={i} msg={msg} patientName={patientName} />
          ))}
          {typing && <TypingIndicator patientName={patientName} />}
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
        <button
          type="submit"
          className="btn btn-primary"
          id="send-btn"
          disabled={typing || ending}
        >
          Send
        </button>
      </form>
    </div>
  )
}

// Component: Assessment step
function AssessmentStep({ assessment, onStartNew }) {
  if (!assessment) {
    return (
      <div className="step active">
        <h2>Simulation Complete</h2>
        <div id="assessment-container">
          <ErrorMessage text="No assessment data available." />
        </div>
      </div>
    )
  }

  return (
    <div className="step active">
      <h2>Simulation Complete</h2>
      <div id="assessment-container">
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div className={`grade-badge grade-${(assessment.grade || 'Pass').replace(/\s+/g, '')}`}>
            {assessment.grade || 'N/A'}
          </div>
          <div className="score-text">{assessment.score ?? 'N/A'}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Score</div>
        </div>

        <div className="feedback-text">{assessment.feedback || 'No feedback provided.'}</div>

        <div className="lists-grid">
          <div>
            <h4>✅ Strengths</h4>
            <ul className="strengths">
              {(assessment.strengths || []).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
              {(!assessment.strengths || assessment.strengths.length === 0) && (
                <li>None listed</li>
              )}
            </ul>
          </div>
          <div>
            <h4>⚠️ Areas for Improvement</h4>
            <ul className="weaknesses">
              {(assessment.weaknesses || []).map((w, i) => (
                <li key={i}>{w}</li>
              ))}
              {(!assessment.weaknesses || assessment.weaknesses.length === 0) && (
                <li>None listed</li>
              )}
            </ul>
          </div>
        </div>
      </div>
      <button id="new-sim-btn" className="btn btn-primary" onClick={onStartNew}>
        Start New Simulation
      </button>
    </div>
  )
}

// Main App
export default function App() {
  const [step, setStep] = useState(STEPS.CATEGORY)
  const [category, setCategory] = useState(null)
  const [specialty, setSpecialty] = useState(null)
  const [specialties, setSpecialties] = useState([])
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

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [conversation, typing])

  // Helper: Set step and clear error
  const goToStep = useCallback(nextStep => {
    setStep(nextStep)
    setError(null)
  }, [])

  // Handler: Select category
  const handleSelectCategory = useCallback(async selectedCategory => {
    setCategory(selectedCategory)
    setSpecialty(null)
    setLoading(true)
    setError(null)

    try {
      const data = await apiFetch(
        `/cases/specialties?category=${encodeURIComponent(selectedCategory)}`
      )
      setSpecialties(data)
      goToStep(STEPS.SPECIALTY)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [goToStep])

  // Handler: Select specialty
  const handleSelectSpecialty = useCallback(
    async selectedSpecialty => {
      setSpecialty(selectedSpecialty)
      setLoading(true)
      setError(null)

      try {
        const data = await apiFetch(
          `/cases?${new URLSearchParams({ category, specialty: selectedSpecialty })}`
        )
        setCases(data)
        goToStep(STEPS.CASES)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    },
    [category, goToStep]
  )

  // Handler: Select case and start simulation
  const handleSelectCase = useCallback(
    async caseItem => {
      setSelectedCase(caseItem)
      setPatientName(caseItem.patientName)
      setConversation([])
      setSessionId(null)
      setAssessment(null)
      setEnding(false)
      goToStep(STEPS.SIMULATION)

      try {
        const data = await apiFetch('/simulate/start', {
          method: 'POST',
          body: JSON.stringify({ caseId: caseItem._id }),
        })
        setSessionId(data.sessionId)
        if (data.greeting) {
          setConversation([{ role: 'patient', content: data.greeting }])
        }
      } catch (err) {
        setConversation([{ role: 'system', content: `Failed to start: ${err.message}` }])
      }
    },
    [goToStep]
  )

  // Handler: Send message in chat
  const handleSendMessage = useCallback(
    async question => {
      if (!question || typing || ending) return

      const userMsg = { role: 'user', content: question }
      setConversation(prev => [...prev, userMsg])
      setTyping(true)

      try {
        const data = await apiFetch('/simulate/chat', {
          method: 'POST',
          body: JSON.stringify({ sessionId, question }),
        })
        if (data.reply) {
          setConversation(prev => [...prev, { role: 'patient', content: data.reply }])
        }
        inputRef.current?.focus()
      } catch (err) {
        setConversation(prev => [...prev, { role: 'system', content: `⚠️ ${err.message}` }])
      } finally {
        setTyping(false)
      }
    },
    [sessionId, typing, ending]
  )

  // Handler: End simulation
  const handleEndSimulation = useCallback(
    async diagnosis => {
      if (ending) return

      setEnding(true)
      setConversation(prev => [...prev, { role: 'system', content: '⏳ Ending simulation...' }])

      try {
        const data = await apiFetch('/simulate/end', {
          method: 'POST',
          body: JSON.stringify({ sessionId, diagnosis, endedManually: true }),
        })
        setAssessment(data.assessment)
        goToStep(STEPS.ASSESSMENT)
      } catch (err) {
        setEnding(false)
        setConversation(prev => [...prev, { role: 'system', content: `⚠️ ${err.message}` }])
      }
    },
    [ending, sessionId, goToStep]
  )

  // Handler: Reset to start new simulation
  const handleReset = useCallback(() => {
    setStep(STEPS.CATEGORY)
    setCategory(null)
    setSpecialty(null)
    setSpecialties([])
    setCases([])
    setSelectedCase(null)
    setPatientName('')
    setSessionId(null)
    setConversation([])
    setTyping(false)
    setEnding(false)
    setAssessment(null)
    setError(null)
  }, [])

  return (
    <div>
      <header>
        <h1>🩺 Simuatech</h1>
        <p className="subtitle">Clinical Case Simulator</p>
      </header>

      <main>
        {step === STEPS.CATEGORY && (
          <CategoryStep onSelect={handleSelectCategory} loading={loading} />
        )}

        {step === STEPS.SPECIALTY && (
          <SpecialtyStep
            specialties={specialties}
            loading={loading}
            error={error}
            onSelect={handleSelectSpecialty}
            onBack={() => goToStep(STEPS.CATEGORY)}
          />
        )}

        {step === STEPS.CASES && (
          <CasesStep
            cases={cases}
            loading={loading}
            error={error}
            onSelect={handleSelectCase}
            onBack={() => goToStep(STEPS.SPECIALTY)}
          />
        )}

        {step === STEPS.SIMULATION && (
          <SimulationStep
            patientName={patientName}
            patientAge={selectedCase?.patientProfile.age}
            conversation={conversation}
            typing={typing}
            ending={ending}
            chatRef={chatRef}
            inputRef={inputRef}
            onSendMessage={handleSendMessage}
            onEndSimulation={handleEndSimulation}
            onBack={() => goToStep(STEPS.CASES)}
          />
        )}

        {step === STEPS.ASSESSMENT && (
          <AssessmentStep assessment={assessment} onStartNew={handleReset} />
        )}
      </main>
    </div>
  )
}
