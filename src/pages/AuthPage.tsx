import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

interface Props {
  onRegister: (
    email: string,
    username: string,
    password: string,
  ) => { ok: true } | { ok: false; error: string }
  onLogin: (
    identifier: string,
    password: string,
  ) => { ok: true } | { ok: false; error: string }
}

export function AuthPage({ onRegister, onLogin }: Props) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const initialMode = params.get('mode') === 'login' ? 'login' : 'register'
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const title = useMemo(
    () => (mode === 'register' ? 'Créer un compte' : 'Connexion'),
    [mode],
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res =
        mode === 'register'
          ? onRegister(email, username, password)
          : onLogin(email || username, password)
      if (!res.ok) {
        setError(res.error)
        return
      }
      navigate('/caisses', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-6 sm:py-10">
      <div className="text-center space-y-2">
        <Link
          to="/"
          className="text-xs uppercase tracking-wide text-accent hover:underline"
        >
          ← Accueil
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted">
          Compte local (navigateur uniquement) — aucune donnée envoyée à un
          serveur.
        </p>
      </div>

      <div className="flex rounded-lg border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => {
            setMode('register')
            setError(null)
          }}
          className={`flex-1 py-2.5 text-sm font-semibold transition ${
            mode === 'register'
              ? 'bg-accent/20 text-accent'
              : 'bg-panel text-muted hover:text-text'
          }`}
        >
          Inscription
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('login')
            setError(null)
          }}
          className={`flex-1 py-2.5 text-sm font-semibold transition ${
            mode === 'login'
              ? 'bg-accent/20 text-accent'
              : 'bg-panel text-muted hover:text-text'
          }`}
        >
          Connexion
        </button>
      </div>

      <form
        onSubmit={submit}
        className="rounded-xl border border-border bg-panel p-5 sm:p-6 space-y-4 shadow-lg shadow-black/20"
      >
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">
            {mode === 'login' ? 'Email ou pseudo' : 'Email'}
          </span>
          <input
            type={mode === 'login' ? 'text' : 'email'}
            autoComplete={mode === 'login' ? 'username' : 'email'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required={mode === 'register'}
            placeholder={
              mode === 'login' ? 'email@exemple.com ou pseudo' : 'email@exemple.com'
            }
            className="w-full rounded-lg border border-border bg-panel-2 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </label>

        {mode === 'register' && (
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted">Pseudo</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="TonPseudo"
              className="w-full rounded-lg border border-border bg-panel-2 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </label>
        )}

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Mot de passe</span>
          <input
            type="password"
            autoComplete={
              mode === 'register' ? 'new-password' : 'current-password'
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-border bg-panel-2 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </label>

        {error && (
          <p className="text-sm text-covert bg-covert/10 border border-covert/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-accent text-bg font-bold py-3 text-sm hover:brightness-110 transition disabled:opacity-60"
        >
          {mode === 'register' ? 'Créer mon compte' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
