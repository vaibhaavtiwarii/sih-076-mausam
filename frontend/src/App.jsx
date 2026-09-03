import { useEffect, useState } from 'react'
import Icon from './components/Icon'
import SectionHeader from './components/SectionHeader'
import {
  activities,
  alerts,
  assistantResponses,
  hourlyForecast,
  personas,
  quickPrompts,
  weather,
} from './data/mockData'
import './App.css'

const personaNames = Object.keys(personas)

function App() {
  const [weatherData, setWeatherData] = useState(null)
  const [persona, setPersona] = useState('Fitness')
  const [activity, setActivity] = useState('Running')
  const [showReasons, setShowReasons] = useState(false)
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState([
    { from: 'assistant', text: 'Hi Vaibhav. I’m looking at the weather through the lens of your plans. Ask me anything.' },
  ])
  const [menuOpen, setMenuOpen] = useState(false)
   
  useEffect(() => {
    fetch('http://localhost:5000/api/weather')
      .then((response) => response.json())
      .then((data) => {
        setWeatherData(data)
      })
      .catch((error) => {
        console.error('Failed to fetch weather:', error)
      })
  }
  , [])
    const displayedWeather = weatherData || weather

  const currentPersona = personas[persona]
  const changePersona = (name) => {
    setPersona(name)
    setActivity(name === 'Fitness' ? 'Running' : personas[name].activity)
  }

  const sendMessage = (question = message) => {
    const cleaned = question.trim()
    if (!cleaned) return
    setChat((items) => [...items, { from: 'user', text: cleaned }, { from: 'assistant', text: responseFor(cleaned) }])
    setMessage('')
  }

  const responseFor = (question) => {
    const lower = question.toLowerCase()
    if (lower.includes('event')) return assistantResponses.event
    if (lower.includes('cycle')) return assistantResponses.cycle
    if (lower.includes('tomorrow') || lower.includes('prepare')) return assistantResponses.prepare
    return assistantResponses.default
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Icon name="cloud-sun" size={20} /></div>
          <div>
            <strong>MAUSAM</strong>
            <span>AI</span>
          </div>
        </div>

        <nav className="side-nav" aria-label="Primary navigation">
          <a className="active" href="#dashboard"><span><Icon name="activity" size={19} />Overview</span></a>
          <a href="#recommendations"><span><Icon name="sparkle" size={19} />Recommendations</span><b>3</b></a>
          <a href="#alerts"><span><Icon name="alert" size={19} />Smart Alerts</span><b className="alert-count">2</b></a>
          <a href="#assistant"><span><Icon name="chat" size={19} />Ask MAUSAM AI</span></a>
          <a href="#personas"><span><Icon name="users" size={19} />Personas</span></a>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-mini">
            <div className="avatar">V</div>
            <div><strong>Vaibhav</strong><span>Fitness profile</span></div>
            <Icon name="settings" size={18} />
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <button className="mobile-menu" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation"><span></span><span></span><span></span></button>
          <div className="topbar-copy">
            <span className="status-dot"></span>
            <span>Live weather intelligence</span>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Settings"><Icon name="settings" size={18} /></button>
            <div className="top-avatar">V</div>
          </div>
        </header>

        <div className="dashboard-wrap">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">PERSONAL WEATHER INTELLIGENCE</p>
              <h1>Good morning, Vaibhav</h1>
              <p className="lead">Here’s what the weather means for you today.</p>
            </div>
            <div className="date-chip"><Icon name="clock" size={16} /> {weather.date} · {weather.time}</div>
          </section>

          <section className="hero-grid">
            <article className="card current-card">
              <div className="card-topline">
                <div className="location"><Icon name="pin" size={18} /><span>{weather.location}</span></div>
                <span className="live-pill"><span></span> Live</span>
              </div>
              <div className="current-main">
                <div>
                  <div className="temp">{displayedWeather.temperature}<sup>°</sup><span>C</span>
                  <h3>{displayedWeather.condition}</h3>
                  <p>Feels like {displayedWeather.feelsLike}°</p>
                  </div>
                </div>
                <div className="big-weather-icon"><Icon name="cloud-sun" size={88} strokeWidth={1.35} /></div>
              </div>
              <div className="weather-stats">
                <Stat icon="drop" label="Humidity" value={`${displayedWeather.humidity}%`} />
                <Stat icon="wind" label="Wind" value={`${displayedWeather.wind} km/h`} />
                <Stat icon="uv" label="UV Index" value={displayedWeather.uv} />
                <Stat icon="rain" label="Rain chance" value={`${displayedWeather.rain}%`} />
              </div>
            </article>

            <article className="card persona-card" id="personas">
              <SectionHeader eyebrow="YOUR CONTEXT" title="Personalization" subtitle="Recommendations adapt to who you are and what you’re doing." />
              <div className="persona-switcher">
                {personaNames.map((name) => (
                  <button key={name} className={persona === name ? 'selected' : ''} onClick={() => changePersona(name)} type="button">{name}</button>
                ))}
              </div>
              <div className="activity-switcher" aria-label="Choose activity">
                {['Running', 'Cycling', 'Travel', 'Commute', 'Outdoor Event', 'Farming'].map((item) => (
                  <button key={item} type="button" className={activity === item ? 'selected' : ''} onClick={() => setActivity(item)}>{item}</button>
                ))}
              </div>
              <div className="persona-profile">
                <div className="persona-icon"><Icon name={currentPersona.icon} size={21} /></div>
                <div className="persona-copy"><strong>{currentPersona.title}</strong><span>Current activity · <em>{activity}</em></span></div>
                <span className="change-label">Dynamic</span>
              </div>
              <div className="preference-row">
                {currentPersona.preferences.map((item) => <span key={item}>{item}</span>)}
              </div>
            </article>
          </section>

          <section className="decision-grid">
            <article className="card recommendation-card">
              <div className="recommendation-heading">
                <div>
                  <div className="ai-label"><Icon name="sparkle" size={15} /> AI RECOMMENDATION</div>
                  <h2>{persona === 'Fitness' ? 'Best time to run' : currentPersona.summary}</h2>
                  <p>Personalized for <strong>{activity}</strong> in Bengaluru.</p>
                </div>
                <div className="score-ring" aria-label={`${currentPersona.score} out of 100`}><strong>{currentPersona.score}</strong><span>/100</span></div>
              </div>
              <div className="recommendation-window"><Icon name="clock" size={17} /><strong>{persona === 'Fitness' ? '6:00 AM – 7:15 AM' : 'Best window adapts to context'}</strong><span>Excellent conditions</span></div>
              <div className="timeline" aria-label="Best activity window">
                <div className="timeline-line"><span className="window-fill"></span><span className="window-marker"></span></div>
                {['5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '12 PM', '5 PM'].map((time) => <span key={time}>{time}</span>)}
              </div>
              <button type="button" className="why-toggle" onClick={() => setShowReasons((show) => !show)} aria-expanded={showReasons}><span><Icon name="sparkle" size={16} /> Why this time?</span><Icon name="chevron" size={17} /></button>
              {showReasons && <div className="reason-list">{['Lower temperature', 'Moderate UV exposure', 'Low rain probability', 'Comfortable wind speed'].map((reason) => <div key={reason}><Icon name="check" size={16} />{reason}</div>)}</div>}
              <div className="decision-flow"><span>RAW WEATHER</span><Icon name="arrow" size={16} /><span>AI ANALYSIS</span><Icon name="arrow" size={16} /><strong>PERSONALIZED DECISION</strong></div>
            </article>

            <article className="card alerts-card" id="alerts">
              <SectionHeader eyebrow="SIGNAL, NOT NOISE" title="Smart Alerts" subtitle="Important, not noisy." />
              <div className="alerts-list">
                {alerts.map((alert) => <div className="alert-row" key={alert.title}><div className={`alert-icon ${alert.tone}`}><Icon name={alert.tone === 'safe' ? 'check' : 'alert'} size={17} /></div><div className="alert-copy"><span className={`priority ${alert.tone}`}>{alert.level}</span><strong>{alert.title}</strong><p>{alert.body}</p><button type="button">{alert.action}<Icon name="arrow" size={14} /></button></div></div>)}
              </div>
              <div className="formula">Weather change <b>×</b> impact <b>×</b> context <b>=</b> better notifications</div>
            </article>
          </section>

          <section className="card forecast-card">
            <SectionHeader eyebrow="LOOK AHEAD" title="Hourly forecast" subtitle="See the conditions before they affect your plans." action={<button className="ghost-action" type="button">Next 24 hours <Icon name="arrow" size={15} /></button>} />
            <div className="forecast-scroll">{hourlyForecast.map((item) => <div className="forecast-item" key={item.time}><span className="forecast-time">{item.time}</span><Icon name={item.icon} size={25} /><strong>{item.temp}°</strong><span className={`rain-chance ${item.rain > 50 ? 'high' : ''}`}>{item.rain}% rain</span></div>)}</div>
          </section>

          <section className="section-block" id="recommendations">
            <SectionHeader eyebrow="PERSONALIZED PICKS" title="Recommended for you" subtitle="The best windows for the things already on your mind." />
            <div className="recommendation-cards">{activities.map((item) => <article className="small-card" key={item.name}><div className="small-card-head"><div className="activity-icon"><Icon name={item.icon} size={20} /></div><span>{item.score}/100</span></div><h3>{item.name}</h3><p className="best-time">Best: {item.time}</p><p>{item.explanation}</p><div className="score-bar"><span style={{ width: `${item.score}%` }}></span></div></article>)}</div>
          </section>

          <section className="explain-grid">
            <article className="card explain-card">
              <SectionHeader eyebrow="TRANSPARENT AI" title="Why MAUSAM AI recommended this" />
              <div className="factor-grid"><Factor label="Temperature" value="Excellent" /><Factor label="UV" value="Moderate" /><Factor label="Rain probability" value="Low" /><Factor label="Wind" value="Comfortable" /></div>
              <div className="overall-score"><div><span>Overall suitability</span><strong>{currentPersona.score} / 100</strong></div><div className="mini-score"><span style={{ width: `${currentPersona.score}%` }}></span></div></div>
              <p className="explain-note">Every recommendation is explainable. MAUSAM AI shows the factors behind its decisions.</p>
            </article>

            <article className="card pipeline-card">
              <SectionHeader eyebrow="HOW IT THINKS" title="From weather to action" subtitle="The intelligence layer turns raw signals into a decision." />
              <div className="pipeline">{['WEATHER DATA', 'CONTEXT', 'USER INTELLIGENCE', 'AI PERSONALIZATION', 'DECISION'].map((step, index) => <div className="pipeline-step" key={step}><div className={index === 4 ? 'pipeline-dot active' : 'pipeline-dot'}></div><span>{step}</span>{index < 4 && <i></i>}</div>)}</div>
              <div className="pipeline-inputs"><span>IMD / Weather APIs</span><span>User profile</span><span>Activity</span><span>Location</span><span>Time</span><Icon name="arrow" size={16} /><strong>Personalized recommendation</strong></div>
            </article>
          </section>

          <section className="principles">
            {[
              ['Personalized', 'Different people see different priorities.', 'users'],
              ['Predictive', 'Finds the best time before you ask.', 'sparkle'],
              ['Automated', 'Sends only useful action-oriented alerts.', 'alert'],
              ['Explainable', 'Shows why each recommendation was made.', 'check'],
            ].map(([title, copy, icon]) => <div className="principle" key={title}><div className="principle-icon"><Icon name={icon} size={20} /></div><div><h3>{title}</h3><p>{copy}</p></div></div>)}
          </section>

          <section className="card assistant-card" id="assistant">
            <div className="assistant-main">
              <SectionHeader eyebrow="CONVERSATIONAL WEATHER INTELLIGENCE" title="Ask MAUSAM AI" subtitle="Weather answers that understand your plans." />
              <div className="chat-window" aria-live="polite">{chat.map((item, index) => <div className={`chat-message ${item.from}`} key={`${item.text}-${index}`}><div className="chat-avatar">{item.from === 'assistant' ? <Icon name="sparkle" size={15} /> : 'V'}</div><div><span>{item.from === 'assistant' ? 'MAUSAM AI' : 'You'}</span><p>{item.text}</p></div></div>)}</div>
              <div className="quick-prompts">{quickPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => sendMessage(prompt)}>{prompt}</button>)}</div>
              <form className="chat-input" onSubmit={(event) => { event.preventDefault(); sendMessage() }}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask about weather and your plans…" aria-label="Ask MAUSAM AI" /><button type="submit" aria-label="Send message"><Icon name="send" size={18} /></button></form>
              <p className="mock-note">Demo mode: responses are local mock data until the real AI backend is connected.</p>
            </div>
          </section>

          <footer className="footer"><div><strong>MAUSAM AI</strong><span>Don’t just know the weather. Know what it means for you.</span></div><span>SIH 2026 · PS 26076</span></footer>
        </div>
      </main>
    </div>
  )
}

function Stat({ icon, label, value }) {
  return <div className="stat"><div className="stat-icon"><Icon name={icon} size={16} /></div><div><span>{label}</span><strong>{value}</strong></div></div>
}

function Factor({ label, value }) {
  return <div className="factor"><span>{label}</span><strong>{value}</strong></div>
}

export default App
