const BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "")

async function parseJsonSafe(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function apiFetch(path, options = {}) {
  const {
    token,
    headers,
    ...rest
  } = options

  const url = path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`

  const res = await fetch(url, {
    ...rest,
    headers: {
      ...(rest.body ? { "Content-Type": "application/json" } : null),
      ...(token ? { Authorization: `Bearer ${token}` } : null),
      ...headers,
    },
  })

  if (!res.ok) {
    const body = await parseJsonSafe(res)
    const detail = body?.detail || body?.message || (typeof body === "string" ? body : null)
    const err = new Error(detail || `Request failed (${res.status})`)
    err.status = res.status
    err.body = body
    throw err
  }

  return await parseJsonSafe(res)
}

export async function login(phone, password) {
  const formData = new URLSearchParams()
  formData.append("username", phone)
  formData.append("password", password)

  return await apiFetch("/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  })
}
