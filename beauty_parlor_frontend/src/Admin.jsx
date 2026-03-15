import { useState, useEffect } from 'react'
import { apiFetch, login } from './lib/api'

function Admin() {
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState('appointments')

  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])
  const [works, setWorks] = useState([])
  const [dashboard, setDashboard] = useState({
    totalAppointments: 0,
    todaysAppointments: 0,
    upcomingAppointments: 0,
    servicesCount: 0,
    portfolioCount: 0,
  })

  const [settings, setSettings] = useState({ salon_name: '', hero_title: '', hero_subtitle: '', about_text: '', phone: '', email: '', address: '', hero_image_url: '', about_image_url: '' })

  const [newService, setNewService] = useState({ name: '', description: '', price: '', original_price: '', duration_mins: '', image_url: '' })
  const [newWork, setNewWork] = useState({ image_url: '', caption: '' })

  const isVideoUrl = (url) => {
    if (!url) return false
    const lower = url.toLowerCase()
    return (
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm') ||
      lower.endsWith('.ogg') ||
      lower.includes('youtube.com') ||
      lower.includes('youtu.be') ||
      lower.includes('vimeo.com')
    )
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const data = await login(phone, password)
      localStorage.setItem("token", data.access_token)
      setToken(data.access_token)
    } catch (error) { alert("Could not connect to the server.") }
  }

  const handleLogout = () => { localStorage.removeItem("token"); setToken(null) }

  const fetchData = async () => {
    try {
      const [apptsData, servicesData, settingsData, worksData] = await Promise.all([
        apiFetch('/appointments/', { token }),
        apiFetch('/services/'),
        apiFetch('/settings/'),
        apiFetch('/portfolio/'),
      ])

      const safeAppointments = apptsData || []
      const safeServices = servicesData || []
      const safeWorks = worksData || []

      setAppointments(safeAppointments)
      setServices(safeServices)
      setSettings(settingsData)
      setWorks(safeWorks)

      const now = new Date()
      const todayStr = new Date().toISOString().slice(0, 10)

      const totalAppointments = safeAppointments.length
      const todaysAppointments = safeAppointments.filter(a => a.appointment_time?.startsWith(todayStr)).length
      const upcomingAppointments = safeAppointments.filter(a => {
        if (!a.appointment_time) return false
        return new Date(a.appointment_time) > now
      }).length

      setDashboard({
        totalAppointments,
        todaysAppointments,
        upcomingAppointments,
        servicesCount: safeServices.length,
        portfolioCount: safeWorks.length,
      })
    } catch (err) { console.error("Fetch error", err) }
  }

  useEffect(() => { if (token) fetchData() }, [token])

  const handleAddService = async (e) => {
    e.preventDefault()
    await apiFetch('/services/', { method: 'POST', token, body: JSON.stringify(newService) })
    alert("Service Added!")
    setNewService({ name: '', description: '', price: '', original_price: '', duration_mins: '', image_url: '' })
    fetchData()
  }

  const handleDeleteService = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    await apiFetch(`/services/${id}`, { method: 'DELETE', token })
    fetchData()
  }

  const handleUpdateSettings = async (e) => {
    e.preventDefault()
    await apiFetch('/settings/', { method: 'PUT', token, body: JSON.stringify(settings) })
    alert("Website Updated Successfully!")
  }

  const handleAddWork = async (e) => {
    e.preventDefault()
    const imageUrl = (newWork.image_url || '').trim()
    if (!imageUrl) {
      alert('Please enter a media URL (photo or video).')
      return
    }
    try {
      await apiFetch('/portfolio/', {
        method: 'POST',
        token,
        body: JSON.stringify({
          image_url: imageUrl,
          caption: (newWork.caption || '').trim() || null,
        }),
      })
      alert('Portfolio item added!')
      setNewWork({ image_url: '', caption: '' })
      fetchData()
    } catch (err) {
      const msg = err?.body?.detail || err?.message || 'Failed to add work. Try again.'
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg))
    }
  }

  const handleDeleteWork = async (id) => {
    if (!window.confirm("Delete this portfolio image?")) return;
    await apiFetch(`/portfolio/${id}`, { method: 'DELETE', token })
    fetchData()
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 via-fuchsia-50 to-white flex flex-col justify-center items-center p-4 text-slate-900">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border-t-8 border-violet-600">
          <h2 className="text-3xl font-black text-slate-900 mb-6 text-center">Admin Access</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="text" placeholder="Phone Number (Admin)" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full border-b-2 border-violet-200 p-3 outline-none bg-white text-slate-900" />
            <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border-b-2 border-violet-200 p-3 outline-none bg-white text-slate-900" />
            <button type="submit" className="w-full bg-violet-600 text-white font-black text-lg py-4 rounded-xl mt-4 hover:bg-violet-700 transition">Secure Login</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md border-b border-slate-800">
        <h1 className="text-xl font-black tracking-wider uppercase">Salon Command Center</h1>
        <div className="flex gap-4 items-center">
          <a href="/" target="_blank" rel="noreferrer" className="text-pink-400 font-semibold hover:text-white transition">View Live Site</a>
          <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded font-bold hover:bg-red-600 transition">Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto py-10 px-4">
        {/* Quick dashboard summary cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-violet-500">
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Appointments</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{dashboard.totalAppointments}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-emerald-500">
            <p className="text-xs font-semibold text-slate-500 uppercase">Today&apos;s Bookings</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{dashboard.todaysAppointments}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
            <p className="text-xs font-semibold text-slate-500 uppercase">Upcoming Appointments</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{dashboard.upcomingAppointments}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-amber-500">
            <p className="text-xs font-semibold text-slate-500 uppercase">Services &amp; Gallery</p>
            <p className="text-sm text-slate-600 mt-1">
              <span className="font-bold">{dashboard.servicesCount}</span> services •{' '}
              <span className="font-bold">{dashboard.portfolioCount}</span> works
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-8 border-b-2 border-slate-200 pb-2 items-center justify-between">
          {/* REVIEWS TAB REMOVED - FULLY AUTOMATED NOW */}
          <div className="flex flex-wrap gap-4">
            {['appointments', 'services', 'portfolio', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xl font-bold px-4 py-2 capitalize ${
                  activeTab === tab ? 'text-violet-600 border-b-4 border-violet-500' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="text-sm font-semibold px-4 py-2 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Refresh Data
          </button>
        </div>

        {activeTab === 'appointments' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-slate-900">Recent Bookings</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-sm uppercase">
                    <th className="p-4">Appt ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Service ID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map(appt => (
                    <tr key={appt.id}>
                      <td className="p-4 font-bold text-slate-900">#{appt.id}</td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-50">
                          {appt.customer_name || `User ${appt.customer_id}`}
                        </div>
                        {appt.customer_phone && (
                          <div className="text-xs text-slate-400">
                            {appt.customer_phone}
                          </div>
                        )}
                      </td>
                      <td className="p-4">Service {appt.service_id}</td>
                      <td className="p-4 text-pink-600 font-semibold">
                        {new Date(appt.appointment_time).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className="bg-green-100 text-green-800 text-xs font-black px-3 py-1 rounded-full uppercase">
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-slate-900">Add New Service</h3>
              <form onSubmit={handleAddService} className="flex flex-col gap-4">
                <input required type="text" placeholder="Service Name" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="border border-slate-200 p-2 rounded w-full bg-white text-slate-900" />
                <textarea required placeholder="Description" value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} className="border border-slate-200 p-2 rounded w-full bg-white text-slate-900" rows="3"></textarea>
                <input type="text" placeholder="Image URL (Optional)" value={newService.image_url} onChange={e => setNewService({...newService, image_url: e.target.value})} className="border border-slate-200 p-2 rounded w-full bg-white text-slate-900" />
                <div className="grid grid-cols-2 gap-4">
                  <input required type="number" placeholder="Offer Price (₹)" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} className="border border-slate-200 p-2 rounded w-full bg-white text-slate-900" />
                  <input type="number" placeholder="Original MRP (₹)" value={newService.original_price} onChange={e => setNewService({...newService, original_price: e.target.value})} className="border border-slate-200 p-2 rounded w-full bg-white text-slate-900" />
                </div>
                <input required type="number" placeholder="Duration (Minutes)" value={newService.duration_mins} onChange={e => setNewService({...newService, duration_mins: e.target.value})} className="border border-slate-200 p-2 rounded w-full bg-white text-slate-900" />
                <button type="submit" className="bg-violet-600 text-white font-bold py-3 rounded hover:bg-violet-700 transition">Save Service</button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 max-h-[500px] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 text-slate-900">Current Menu</h3>
              {services.map(s => (
                <div key={s.id} className="border-b py-3 flex justify-between items-center group">
                  <div className="flex gap-4 items-center">
                    <img src={s.image_url} className="w-12 h-12 object-cover rounded shadow" alt="thumb"/>
                    <div><p className="font-bold text-slate-900">{s.name}</p><p className="text-sm text-slate-600">₹{s.price}</p></div>
                  </div>
                  <button onClick={() => handleDeleteService(s.id)} className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-600 hover:text-white transition">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-2 text-slate-900">Add Recent Work</h3>
              <p className="text-xs text-slate-500 mb-4">
                Paste a **photo URL** (Unsplash / Instagram / CDN) or a **direct video URL** (MP4, WebM, etc.). YouTube/Vimeo links will show as videos.
              </p>
              <form onSubmit={handleAddWork} className="flex flex-col gap-4">
                <input
                  required
                  type="text"
                  placeholder="Media URL (photo or video)"
                  value={newWork.image_url}
                  onChange={e => setNewWork({...newWork, image_url: e.target.value})}
                  className="border border-slate-200 p-2 rounded w-full bg-white text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Caption (e.g. Bridal Makeup for Priya)"
                  value={newWork.caption}
                  onChange={e => setNewWork({...newWork, caption: e.target.value})}
                  className="border border-slate-200 p-2 rounded w-full bg-white text-slate-900"
                />
                <button type="submit" className="bg-violet-600 text-white font-bold py-3 rounded hover:bg-violet-700 transition">Add to Gallery</button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 max-h-[500px] overflow-y-auto grid grid-cols-2 gap-4">
              {works.map(w => (
                <div key={w.id} className="relative group rounded overflow-hidden bg-black">
                  {isVideoUrl(w.image_url) ? (
                    <video src={w.image_url} className="w-full h-32 object-cover" muted loop controls />
                  ) : (
                    <img src={w.image_url} className="w-full h-32 object-cover rounded shadow" alt="work" />
                  )}
                  <button
                    onClick={() => handleDeleteWork(w.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
             <form onSubmit={handleUpdateSettings} className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Salon Name</label>
                <input required type="text" value={settings.salon_name} onChange={e => setSettings({...settings, salon_name: e.target.value})} className="border border-slate-200 p-2 rounded w-full bg-white text-slate-900 mb-4" />
                <label className="block text-sm font-bold text-slate-800 mb-1">Hero Title</label>
                <input required type="text" value={settings.hero_title} onChange={e => setSettings({...settings, hero_title: e.target.value})} className="border border-slate-200 p-2 rounded w-full bg-white text-slate-900 mb-4" />
                <label className="block text-sm font-bold text-slate-800 mb-1">Hero Subtitle</label>
                <textarea required value={settings.hero_subtitle} onChange={e => setSettings({...settings, hero_subtitle: e.target.value})} className="border border-slate-200 p-2 rounded w-full bg-white text-slate-900 mb-4" rows="2"></textarea>
                <label className="block text-sm font-bold text-slate-800 mb-1">About Us Text</label>
                <textarea required value={settings.about_text} onChange={e => setSettings({...settings, about_text: e.target.value})} className="border border-slate-200 p-2 rounded w-full bg-white text-slate-900" rows="3"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Phone Number</label>
                <input required type="text" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} className="border border-slate-200 p-2 rounded w-full bg-white text-slate-900 mb-4" />
                <label className="block text-sm font-bold text-slate-800 mb-1">Email</label>
                <input required type="email" value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} className="border border-slate-200 p-2 rounded w-full bg-white text-slate-900 mb-4" />
                <label className="block text-sm font-bold text-slate-800 mb-1">Address</label>
                <input required type="text" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} className="border border-slate-200 p-2 rounded w-full bg-white text-slate-900 mb-4" />
                <label className="block text-sm font-bold text-slate-800 mb-1">Hero BG Image URL</label>
                <input required type="text" value={settings.hero_image_url} onChange={e => setSettings({...settings, hero_image_url: e.target.value})} className="border border-slate-200 p-2 rounded w-full bg-white text-slate-900 mb-4" />
                <label className="block text-sm font-bold text-slate-800 mb-1">About Image URL</label>
                <input required type="text" value={settings.about_image_url} onChange={e => setSettings({...settings, about_image_url: e.target.value})} className="border border-slate-200 p-2 rounded w-full bg-white text-slate-900" />
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="w-full bg-violet-600 text-white font-bold py-4 rounded-lg hover:bg-violet-700 transition">Publish Changes</button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  )
}

export default Admin