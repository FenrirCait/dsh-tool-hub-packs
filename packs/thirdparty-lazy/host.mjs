/**
 * thirdparty-lazy — experimental API v2 pack.
 *
 * Hides model-facing tools registered by non-core plugins behind one meta tool. This is a
 * visibility mask, not an unload. Each agent gets a tiny scoped plugin that calls tools.restrict;
 * the effective view is read before the mask, so tools already hidden by another layer are skipped.
 */
const PROTECTED = new Set([
  'run_code', 'tool_switch', 'tool_list', 'hub_tools', 'thirdparty_lazy',
  'bash', 'bash_output', 'read', 'write', 'edit', 'glob', 'grep',
  'web_search', 'web_fetch', 'todo_write', 'ask_user', 'present', 'ui_card',
  'skill', 'task_brief', 'create_goal', 'get_goal', 'update_goal',
  'subagent', 'subagent_fork', 'subagent_audit', 'subagent_retrieval', 'subagent_strong',
  'schedule_create', 'schedule_edit', 'schedule_list', 'schedule_view',
  'session_search', 'session_trace', 'session_event_search', 'session_event_read', 'session_event_trace',
  'comfyui_workflow', 'comfyui_run', 'comfyui_object_info',
  'team_task_create', 'team_task_list', 'team_task_get', 'team_task_update',
  'job_output', 'job_list', 'job_kill', 'plugin_manager', 'pwsh', 'read_image',
  'ask_user_question', 'workflow', 'list_agents', 'wait_agent', 'send_message',
  'exit_plan_mode', 'list_subagent_models', 'list_mcp_resources',
  'list_mcp_resource_templates', 'read_mcp_resource', 'working_directory',
])
const EXCLUDED_PREFIXES = ['mcp__', 'computer_', 'cua_', 'windows_computer_use_', 'screen_', 'window_']

function isProtected(name) {
  return PROTECTED.has(name) || EXCLUDED_PREFIXES.some(prefix => name.startsWith(prefix))
}

function visibleNames(view) {
  const out = []
  const visible = view && view.visible
  if (visible && typeof visible.keys === 'function') for (const name of visible.keys()) out.push(name)
  return out
}

export default function activate(api) {
  const ctx = api.ctx
  if (!ctx || typeof ctx.on !== 'function' || typeof ctx.get !== 'function') {
    throw new Error('thirdparty-lazy requires the Tool Hub extension API v2 (host context)')
  }
  const rootTools = ctx.get('tools')
  const agents = ctx.get('agents')
  if (!rootTools || typeof rootTools.register !== 'function') throw new Error('thirdparty-lazy needs the tools service')

  const states = new Map()
  const enabled = new Map()
  let stopped = false
  const offs = []

  const sessionOf = agent => {
    const id = agent && agent.session && agent.session.id
    return typeof id === 'string' && id !== '' ? id : (agent && agent.id) || ''
  }
  const enabledFor = agent => {
    const key = sessionOf(agent)
    let set = enabled.get(key)
    if (!set) { set = new Set(); enabled.set(key, set) }
    return set
  }
  const stateFor = agent => {
    const id = agent && agent.id
    if (typeof id !== 'string' || id === '') return null
    let st = states.get(id)
    if (!st) { st = { agent, fiber: null, holder: null, candidates: [], deny: [] }; states.set(id, st) }
    else st.agent = agent
    return st
  }

  const mount = agent => {
    const st = stateFor(agent)
    if (!st || stopped || !agent.ctx || typeof agent.ctx.plugin !== 'function') return
    try { st.fiber?.dispose?.() } catch {}
    const holder = { sync: () => {} }
    const plugin = {
      name: 'thirdparty-lazy:mask',
      inject: ['tools'],
      apply(scope) {
        let undo
        let applied = ''
        let inside = false
        const sync = () => {
          if (inside) return
          inside = true
          try {
            // Lift this layer before reading: view() applies restrictions, so keeping our own
            // deny would make the next pass think every candidate is already hidden elsewhere.
            const previous = undo
            undo = undefined
            if (previous) {
              try { previous() } catch {}
            }
            applied = ''
            const view = scope.tools.view(agent)
            const visible = visibleNames(view)
            const restrictable = view && view.restrictableNames instanceof Set ? view.restrictableNames : new Set(visible)
            const allowed = enabledFor(agent)
            const candidates = visible.filter(name => !isProtected(name) && restrictable.has(name))
            const deny = candidates.filter(name => !allowed.has(name))
            st.candidates = candidates
            st.deny = deny
            const signature = deny.slice().sort().join('\u0000')
            if (signature === applied) return
            let next
            try {
              next = deny.length > 0 ? scope.tools.restrict({ deny }) : undefined
            }
            catch {
              return
            }
            undo = typeof next === 'function' ? next : undefined
            applied = signature
            try { st.after = visibleNames(scope.tools.view(agent)) } catch { st.after = null }
          }
          finally { inside = false }
        }
        holder.sync = sync
        try { scope.on?.('tools/change', sync) } catch {}
        try {
          const effect = scope.effect
          effect?.(() => () => {
            holder.sync = () => {}
            try { undo?.() } catch {}
          })
        } catch {}
        sync()
      },
    }
    try { st.fiber = agent.ctx.plugin(plugin) } catch { st.fiber = null }
    st.holder = holder
  }

  const onCreated = payload => {
    const agent = payload && payload.agent
    if (agent) mount(agent)
  }
  const onDisposed = payload => {
    const agent = payload && payload.agent
    const id = agent && agent.id
    if (typeof id !== 'string') return
    const st = states.get(id)
    if (!st) return
    try { st.fiber?.dispose?.() } catch {}
    states.delete(id)
  }
  const onToolsChange = () => {
    for (const st of states.values()) {
      try { st.holder?.sync() } catch {}
    }
  }
  offs.push(ctx.on('agent/created', onCreated))
  offs.push(ctx.on('agent/disposed', onDisposed))
  offs.push(ctx.on('tools/change', onToolsChange))

  const tool = {
    name: 'thirdparty_lazy',
    description: 'List and enable third-party tools hidden by the experimental auto-lazy layer for this session.',
    parameters: {
      action: { type: 'string', required: true, enum: ['list', 'enable', 'disable'], description: 'list hidden tools, or enable/disable exact names for this session' },
      names: { type: 'array', items: { type: 'string' }, description: 'exact tool names' },
    },
    output: {
      schema: { type: 'object', properties: {} },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    execute: async (args, exec) => {
      const agent = exec && exec.agent
      if (!agent) return { error: 'this tool needs an agent session' }
      const st = stateFor(agent)
      if (!st) return { error: 'agent is not tracked yet' }
      if (!st.holder) mount(agent)
      if (args.action === 'list') {
        const allowed = enabledFor(agent)
        return {
          total: st.candidates.length,
          hidden: st.candidates.filter(name => !allowed.has(name)),
          enabled: st.candidates.filter(name => allowed.has(name)),
          note: 'Enable is session-scoped and resets when the process restarts.',
        }
      }
      const names = Array.isArray(args.names) ? args.names.filter(name => typeof name === 'string') : []
      if (names.length === 0) return { error: 'names is required for enable/disable' }
      const allowed = enabledFor(agent)
      if (args.action === 'enable') for (const name of names) allowed.add(name)
      else for (const name of names) allowed.delete(name)
      try { st.holder?.sync() } catch {}
      return {
        action: args.action,
        names,
        hidden: st.candidates.filter(name => !allowed.has(name)),
        enabled: st.candidates.filter(name => allowed.has(name)),
      }
    },
  }
  let unregister = null
  try { unregister = rootTools.register(tool) } catch (error) { throw new Error('cannot register thirdparty_lazy: ' + String(error && error.message || error)) }

  const dispose = () => {
    if (stopped) return
    stopped = true
    for (const off of offs.reverse()) { try { off?.() } catch {} }
    for (const st of states.values()) { try { st.fiber?.dispose?.() } catch {} }
    states.clear()
    try { unregister?.() } catch {}
  }
  api.onDispose(dispose)

  try {
    const list = agents && typeof agents.list === 'function' ? agents.list() : []
    for (const agent of list) mount(agent)
  } catch {}

  api.log('info', '[thirdparty-lazy] experimental auto-lazy active')
  return {
    module: {
      id: 'thirdparty-lazy',
      title: { zh: '第三方工具自动懒加载（实验）', en: 'Third-party tool auto-lazy (experimental)' },
      ops: [{ id: 'thirdparty-lazy.status', write: false, audit: false, note: 'Reports the experimental auto-lazy state for live agents.' }],
    },
    handlers: {
      'thirdparty-lazy.status': async () => ({
        agents: [...states.values()].map(st => ({
          agentId: st.agent && st.agent.id,
          sessionId: sessionOf(st.agent),
          candidates: st.candidates,
          deny: st.deny,
          after: st.after,
          enabled: [...enabledFor(st.agent)],
        })),
      }),
    },
  }
}