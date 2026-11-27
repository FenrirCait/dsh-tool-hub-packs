// Read-only bridge from Deep PTC's public skill route into Tool Hub's SkillVisibilityProvider.
// It never reads or writes $DSH_HOME/storages/deep-ptc-skills/skills.json.

const SERVICE = 'toolHub.skillVisibility'
const PATH = '/deep-ptc/skills/list'

function errorText(error) {
  return error instanceof Error ? error.message : String(error)
}

function baseUrl(api) {
  let web
  try { web = api.services?.get?.('webServer') } catch { web = undefined }
  if (web === null || typeof web !== 'object') return ''
  const direct = Number(web.listenedPort)
  if (Number.isInteger(direct) && direct > 0 && direct < 65536) return 'http://127.0.0.1:' + direct
  const fromConfig = Number(web.config?.port)
  if (Number.isInteger(fromConfig) && fromConfig > 0 && fromConfig < 65536) return 'http://127.0.0.1:' + fromConfig
  try {
    const address = web.server?.address?.()
    const port = Number(address?.port)
    if (Number.isInteger(port) && port > 0 && port < 65536) return 'http://127.0.0.1:' + port
  } catch { /* fall through */ }
  return ''
}

export default function activate(api) {
  let error = ''
  let origin = ''
  const provider = {
    id: 'deep-ptc',
    async list() {
      const base = baseUrl(api)
      origin = base
      if (base === '') throw new Error('Deep PTC web server port is unavailable')
      const response = await fetch(base + PATH, { signal: AbortSignal.timeout(2500) })
      if (!response.ok) throw new Error('Deep PTC skill route answered ' + response.status)
      const data = await response.json()
      if (data === null || typeof data !== 'object' || !Array.isArray(data.skills)) throw new Error('Deep PTC skill route returned no skills array')
      const hiddenNames = new Set(Array.isArray(data.hidden) ? data.hidden.filter(name => typeof name === 'string') : [])
      error = ''
      return data.skills
        .filter(skill => skill !== null && typeof skill === 'object' && typeof skill.name === 'string' && skill.name !== '')
        .map(skill => ({
          name: skill.name,
          hidden: hiddenNames.has(skill.name) || skill.hidden === true,
          modelInvocable: skill.modelInvocable !== false,
          ...(typeof skill.source === 'string' && skill.source !== '' ? { source: skill.source } : {}),
          ...(typeof skill.provider === 'string' && skill.provider !== '' ? { provider: skill.provider } : {}),
        }))
    },
  }

  let dispose
  let registered = false
  try {
    const registry = api.services?.get?.(SERVICE)
    if (registry !== null && typeof registry === 'object' && typeof registry.register === 'function') {
      dispose = registry.register(provider)
      registered = true
      if (typeof api.onDispose === 'function' && typeof dispose === 'function') api.onDispose(dispose)
    } else {
      error = 'Tool Hub skill visibility service is unavailable (Tool Hub 2.5.0+ required)'
    }
  } catch (failure) {
    error = errorText(failure)
  }

  return {
    module: {
      id: api.id,
      title: { zh: 'Deep PTC 技能可见性', en: 'Deep PTC skill visibility' },
      ops: [{ id: 'deep-ptc-skill-compat.status', write: false, note: 'Read-only Deep PTC route bridge' }],
    },
    handlers: {
      'deep-ptc-skill-compat.status': async () => {
        try {
          const rows = await provider.list()
          error = ''
          return { ok: true, provider: provider.id, origin, registered, count: rows.length, hidden: rows.filter(row => row.hidden).length, error: null }
        } catch (failure) {
          error = errorText(failure)
          return { ok: false, provider: provider.id, origin, registered, count: 0, hidden: 0, error }
        }
      },
    },
  }
}