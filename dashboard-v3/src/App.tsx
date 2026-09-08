import { FormEvent, useEffect, useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, LogOut, Play, RefreshCw, RotateCcw, Square, Wifi } from 'lucide-react'
import { api, type Instance, type User } from './api'
import { RealtimeClient, type RealtimeEnvelope } from './realtime'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } })

function Login({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const login = useMutation({ mutationFn: () => api.login(username, password), onSuccess: (data) => onAuthenticated(data.user) })
  const submit = (event: FormEvent) => { event.preventDefault(); login.mutate() }
  return <main className="min-h-screen grid place-items-center p-4 bg-slate-950">
    <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
      <div className="mb-6"><p className="text-xs uppercase tracking-[.2em] text-emerald-400">WhatsApp Bot V3</p><h1 className="mt-2 text-2xl font-semibold">Operations dashboard</h1><p className="mt-2 text-sm text-slate-400">Sign in with your V3 dashboard account.</p></div>
      <label className="block text-sm mb-2">Username</label><input className="field" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
      <label className="block text-sm mt-4 mb-2">Password</label><input className="field" value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required />
      {login.error && <p className="mt-4 text-sm text-red-400">{login.error.message}</p>}
      <button disabled={login.isPending} className="btn-primary mt-5 w-full">{login.isPending ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </main>
}

function InstanceCard({ instance, onAction }: { instance: Instance; onAction: (id: string, action: 'start'|'stop'|'restart'|'reconnect') => void }) {
  const connected = instance.status === 'CONNECTED'
  return <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
    <div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{instance.name}</h3><p className="text-xs text-slate-500 mt-1">{instance.slug}</p></div><span className={`badge ${connected ? 'text-emerald-300 border-emerald-800' : 'text-amber-300 border-amber-800'}`}>{instance.status}</span></div>
    <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
      <button className="btn" onClick={() => onAction(instance.id,'start')}><Play size={15}/>Start</button>
      <button className="btn" onClick={() => onAction(instance.id,'stop')}><Square size={15}/>Stop</button>
      <button className="btn" onClick={() => onAction(instance.id,'restart')}><RotateCcw size={15}/>Restart</button>
      <button className="btn" onClick={() => onAction(instance.id,'reconnect')}><Wifi size={15}/>Reconnect</button>
    </div>
  </article>
}

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const client = useQueryClient()
  const instances = useQuery({ queryKey: ['instances'], queryFn: api.instances, refetchInterval: 30000 })
  const lifecycle = useMutation({ mutationFn: ({id,action}:{id:string;action:'start'|'stop'|'restart'|'reconnect'}) => api.lifecycle(id,action), onSuccess: () => client.invalidateQueries({queryKey:['instances']}) })
  const realtime = useMemo(() => new RealtimeClient(), [])

  useEffect(() => {
    realtime.connect()
    const off = realtime.onEvent((event: RealtimeEnvelope) => {
      if (event.type === 'event' && event.instanceId) client.invalidateQueries({ queryKey: ['instances'] })
    })
    return () => { off(); realtime.close() }
  }, [client, realtime])

  useEffect(() => {
    const ids = instances.data?.items.map((item) => item.id) ?? []
    ids.forEach((id) => realtime.subscribe(id))
    return () => ids.forEach((id) => realtime.unsubscribe(id))
  }, [instances.data, realtime])

  const connected = instances.data?.items.filter((i) => i.status === 'CONNECTED').length ?? 0
  return <div className="min-h-screen bg-slate-950">
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur"><div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between"><div><p className="text-xs text-emerald-400 uppercase tracking-[.2em]">V3 control plane</p><h1 className="font-semibold">WhatsApp Operations</h1></div><button className="btn" onClick={onLogout}><LogOut size={15}/>Sign out</button></div></header>
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Instances" value={instances.data?.items.length ?? 0} icon={<Activity size={18}/>} />
        <Stat label="Connected" value={connected} icon={<Wifi size={18}/>} />
        <Stat label="Role" value={user.roles[0] ?? 'User'} />
        <Stat label="Realtime" value="WS" icon={<RefreshCw size={18}/>} />
      </section>
      <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-semibold">Bot instances</h2><button className="btn" onClick={() => instances.refetch()}><RefreshCw size={15}/>Refresh</button></div>
      {instances.isLoading && <p className="text-slate-400">Loading instances…</p>}
      {instances.error && <p className="text-red-400">{instances.error.message}</p>}
      {lifecycle.error && <p className="mb-3 text-red-400">{lifecycle.error.message}</p>}
      <section className="grid gap-3 md:grid-cols-2">{instances.data?.items.map((instance) => <InstanceCard key={instance.id} instance={instance} onAction={(id,action) => lifecycle.mutate({id,action})} />)}</section>
    </main>
  </div>
}

function Stat({ label, value, icon }: { label:string; value:string|number; icon?:React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wide"><span>{label}</span>{icon}</div><div className="mt-3 text-xl font-semibold truncate">{value}</div></div>
}

function Root() {
  const me = useQuery({ queryKey: ['me'], queryFn: api.me, retry: false })
  if (me.isLoading) return <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-400">Loading…</div>
  if (!me.data) return <Login onAuthenticated={(user) => queryClient.setQueryData(['me'], {user})} />
  return <Dashboard user={me.data.user} onLogout={async () => { await api.logout(); queryClient.clear(); window.location.reload() }} />
}

export default function App() { return <QueryClientProvider client={queryClient}><Root /></QueryClientProvider> }
