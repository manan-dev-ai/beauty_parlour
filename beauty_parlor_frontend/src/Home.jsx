import { useState, useEffect } from 'react'
import { apiFetch } from './lib/api'
import ChatBot from './ChatBot'

function Home() {
  const [services, setServices] = useState([])
  const [settings, setSettings] = useState(null)
  const [works, setWorks] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const [isBooking, setIsBooking] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '', date: '', time: '', service_id: '' })
  const [availableSlots, setAvailableSlots] = useState([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [activeCategory, setActiveCategory] = useState("All")
  const categories = ["All", "Hair", "Makeup", "Skin", "Nails"]
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const [servicesData, settingsData, worksData, reviewsData] = await Promise.all([
          apiFetch('/services/'),
          apiFetch('/settings/'),
          apiFetch('/portfolio/'),
          apiFetch('/reviews/google'),
        ])
        setServices(servicesData || [])
        setSettings(settingsData)
        setWorks(worksData || [])
        setReviews(reviewsData || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const openBookingModal = (service = null) => { setFormData({ name: '', phone: '', date: '', time: '', service_id: service ? service.id : '' }); setAvailableSlots([]); setIsBooking(true) }

  const handleDateChange = async (e) => {
    const selectedDate = e.target.value
    setFormData({ ...formData, date: selectedDate, time: '' })
    if (!selectedDate) { setAvailableSlots([]); return }
    setIsLoadingSlots(true)
    try {
      const data = await apiFetch(`/appointments/available-slots?date=${encodeURIComponent(selectedDate)}`)
      setAvailableSlots(data || [])
    } catch (error) { console.error(error) }
    setIsLoadingSlots(false)
  }

  const submitBooking = async (e) => {
    e.preventDefault()
    if (!formData.time) { alert("Please select a time slot."); return }
    try {
      let customerId = null
      const users = await apiFetch('/users/')
      const existingUser = users.find(u => u.phone === formData.phone)

      if (existingUser) customerId = existingUser.id
      else {
        const newUser = await apiFetch('/users/', { method: 'POST', body: JSON.stringify({ name: formData.name, phone: formData.phone, password: "auto" }) })
        customerId = newUser.id
      }
      
      await apiFetch('/appointments/', { method: 'POST', body: JSON.stringify({ customer_id: customerId, service_id: formData.service_id, appointment_time: new Date(`${formData.date}T${formData.time}`).toISOString() }) })
      alert("🎉 Slot booked successfully!")
      setIsBooking(false)
    } catch (error) { alert("Error connecting to server.") }
  }

  const filteredServices = activeCategory === "All"
    ? services
    : services.filter(
        s =>
          s.name.toLowerCase().includes(activeCategory.toLowerCase()) ||
          s.description.toLowerCase().includes(activeCategory.toLowerCase())
      )

  const selectedService =
    formData.service_id && services.length
      ? services.find(s => String(s.id) === String(formData.service_id))
      : null

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

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-gradient-to-b from-violet-50 via-fuchsia-50/40 to-white scroll-smooth">
      {/* Top navigation */}
      <nav className="bg-white/90 backdrop-blur shadow-sm px-4 md:px-8 py-3 sticky top-0 z-40 border-b border-violet-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center text-white font-black text-lg shadow-md">
                {settings?.salon_name?.[0]?.toUpperCase() || 'G'}
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
                  {settings?.salon_name || 'Glow Salon'}
                </h1>
                <p className="hidden md:block text-[11px] uppercase tracking-[0.18em] text-violet-600 font-semibold">
                  Beauty • Bridal • Hair Studio
                </p>
              </div>
            </div>
            <div className="hidden md:flex gap-6 font-medium text-slate-700 text-sm">
              <a href="#services" className="hover:text-violet-600 transition-colors">Services</a>
              <a href="#portfolio" className="hover:text-violet-600 transition-colors">Recent Works</a>
              <a href="#reviews" className="hover:text-violet-600 transition-colors">Reviews</a>
              <a href="#about" className="hover:text-violet-600 transition-colors">About</a>
              <a href="#contact" className="hover:text-violet-600 transition-colors">Contact</a>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => openBookingModal()}
                className="hidden md:inline-flex items-center bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-lg shadow-violet-400/30 hover:from-violet-700 hover:to-fuchsia-600 transition-all"
              >
                Book Appointment
              </button>
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-full border border-violet-200 text-slate-800 hover:bg-violet-50/60 transition"
                onClick={() => setNavOpen(open => !open)}
                aria-label="Toggle navigation menu"
              >
                <span className="block w-4 border-t border-current mb-1" />
                <span className="block w-4 border-t border-current mb-1" />
                <span className="block w-4 border-t border-current" />
              </button>
            </div>
          </div>
          {navOpen && (
            <div className="mt-3 flex flex-col gap-2 text-sm font-medium text-slate-800 md:hidden">
              {[
                { href: '#services', label: 'Services' },
                { href: '#portfolio', label: 'Recent Works' },
                { href: '#reviews', label: 'Reviews' },
                { href: '#about', label: 'About' },
                { href: '#contact', label: 'Contact' },
              ].map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setNavOpen(false)}
                  className="px-2 py-1 rounded hover:bg-violet-50/80"
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setNavOpen(false)
                  openBookingModal()
                }}
                className="mt-1 inline-flex items-center justify-center bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md shadow-violet-400/30"
              >
                Book Appointment
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero section */}
      <header className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center px-4 md:px-8 pt-12 pb-16 md:pb-20">
          <div className="relative z-10 text-left">
            <p className="inline-flex items-center rounded-full border border-violet-300 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700 mb-4">
              Glow. Relax. Transform.
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
              {settings?.hero_title || 'Style has no gender, only confidence.'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-xl">
              {settings?.hero_subtitle ||
                'Premium salon experience for hair, makeup, skin and nails with easy online booking and real Google reviews.'}
            </p>
            <div className="flex flex-wrap gap-3 items-center mb-6">
              <button
                onClick={() => openBookingModal()}
                className="inline-flex items-center bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg shadow-violet-400/30 hover:from-violet-700 hover:to-fuchsia-600 transition-all"
              >
                Enquiry &amp; Booking
              </button>
              <a
                href="#services"
                className="inline-flex items-center px-4 py-3 rounded-full border border-violet-200 text-sm font-semibold text-violet-700 bg-white/80 hover:bg-violet-50 transition-all"
              >
                View Services
              </a>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Online booking available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-400"></span>
                <span>Trusted by real Google reviewers</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-pink-200/60 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-rose-200/60 blur-3xl" />
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/50 bg-gray-900/90">
              <div
                className="h-64 sm:h-80 bg-cover bg-center"
                style={{ backgroundImage: `url(${settings?.hero_image_url})` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* --- SERVICES SECTION --- */}
      <main id="services" className="max-w-6xl mx-auto py-16 px-4 md:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-violet-600 mb-2">Services</p>
          <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">Our Popular Treatments</h3>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">
            Carefully curated services for hair, makeup, skin and nails to match every occasion and mood.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide border transition-colors ${
                activeCategory === cat
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white/80 text-slate-700 hover:text-violet-700 hover:border-violet-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-sm text-slate-500">Loading menu...</p>
        ) : filteredServices.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            Services will appear here soon. Please contact us for custom enquiries.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map(service => (
              <div
                key={service.id}
                className="bg-white/90 backdrop-blur rounded-2xl shadow-md border border-violet-100 overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-violet-400 transition-all"
              >
                <div className="relative">
                  <img
                    src={service.image_url}
                    className="w-full h-44 object-cover"
                    alt={service.name}
                  />
                  <div className="absolute top-3 left-3 bg-black/60 text-white text-[11px] px-2 py-1 rounded-full uppercase tracking-[0.16em]">
                    {service.duration_mins} mins
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-bold text-slate-900">{service.name}</h4>
                    <span className="bg-violet-50 text-violet-700 font-black px-3 py-1 rounded-md text-xs border border-violet-200">
                      ₹{service.price}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3">{service.description}</p>
                  <button
                    onClick={() => openBookingModal(service)}
                    className="mt-2 w-full text-xs font-semibold text-violet-700 border border-violet-500/60 py-2 rounded-full hover:bg-violet-600 hover:text-white transition-colors"
                  >
                    Book This Service
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- RECENT WORKS SECTION --- */}
      {works.length > 0 && (
        <section id="portfolio" className="bg-slate-900 py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-extrabold text-slate-50 mb-2">Our Recent Work</h3>
              <div className="w-24 h-1 bg-pink-500 mx-auto"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {works.map(w => (
                <div key={w.id} className="relative group overflow-hidden rounded-xl bg-black">
                  {isVideoUrl(w.image_url) ? (
                    <div className="w-full h-64">
                      <video
                        src={w.image_url}
                        className="w-full h-full object-cover"
                        controls
                        muted
                        loop
                      />
                    </div>
                  ) : (
                    <img
                      src={w.image_url}
                      className="w-full h-64 object-cover transform group-hover:scale-110 transition duration-500"
                      alt="work"
                    />
                  )}
                  {w.caption && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-end p-4">
                      <p className="text-white font-bold text-sm">{w.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- LIVE GOOGLE REVIEWS SECTION --- */}
      {reviews.length > 0 && (
        <section id="reviews" className="bg-violet-50 py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-extrabold text-slate-900 mb-2">What Our Clients Say</h3>
              <div className="w-24 h-1 bg-violet-500 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {reviews.map((r, index) => (
                <div key={index} className="bg-white p-6 rounded-2xl shadow-md relative border border-violet-100">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="absolute top-4 right-4 w-6 h-6 opacity-40" />
                  <div className="flex items-center gap-4 mb-4">
                    <img src={r.profile_photo_url} alt={r.author_name} className="w-12 h-12 rounded-full shadow-sm" />
                    <div>
                      <p className="font-bold text-slate-900">{r.author_name}</p>
                      <div className="text-yellow-400 text-sm">{"★".repeat(r.rating)}</div>
                    </div>
                  </div>
                  <p className="text-slate-600 italic text-sm line-clamp-4">"{r.text}"</p>
                  <p className="text-xs text-slate-400 mt-4 font-semibold">{r.relative_time_description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- ABOUT SECTION --- */}
      <section id="about" className="py-16 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-1/2">
            <img src={settings?.about_image_url} alt="Salon" className="rounded-2xl shadow-xl w-full object-cover" />
          </div>
          <div className="md:w-1/2">
            <h3 className="text-3xl font-extrabold text-slate-900 mb-4">More Than Just a Salon</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">{settings?.about_text}</p>
          </div>
        </div>
      </section>

      {/* --- CONTACT & MAP SECTION --- */}
      <section id="contact" className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h3 className="text-3xl font-extrabold text-slate-900 mb-4">Contact Us</h3>
            <div className="w-24 h-1 bg-violet-500 mb-6"></div>
            <p className="text-slate-600 mb-6">
              Have a question or want to plan your makeover? Reach out to us anytime and we&apos;ll help you pick the perfect service and timing.
            </p>
            <div className="space-y-3 text-slate-700 text-sm">
              <p><span className="font-bold text-slate-900">Phone:</span> {settings?.phone}</p>
              <p><span className="font-bold text-slate-900">Email:</span> {settings?.email}</p>
              <p><span className="font-bold text-slate-900">Address:</span> {settings?.address}</p>
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              {settings?.phone && (
                <a
                  href={`tel:${settings.phone.replace(/\\s+/g, '')}`}
                  className="bg-violet-600 text-white px-5 py-2 rounded-full font-bold text-sm shadow hover:bg-violet-700 transition"
                >
                  Call Now
                </a>
              )}
              {settings?.phone && (
                <a
                  href={`https://wa.me/${settings.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-violet-600 text-violet-700 px-5 py-2 rounded-full font-bold text-sm hover:bg-violet-50 transition"
                >
                  Chat on WhatsApp
                </a>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-lg border border-violet-100">
              <iframe
                title="Salon location on Google Maps"
                src={
                  settings?.address
                    ? `https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`
                    : 'https://www.google.com/maps?q=salon&output=embed'
                }
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            {settings?.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm font-semibold text-violet-700 hover:text-violet-800"
              >
                View on Google Maps →
              </a>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-center text-slate-300 text-sm py-8">
        &copy; 2026 {settings?.salon_name}.
      </footer>

      {isBooking && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full border-t-8 border-pink-600 relative">
            <button onClick={() => setIsBooking(false)} className="absolute top-4 right-4 text-2xl">✕</button>
            <h3 className="text-2xl font-black mb-2">Book Visit</h3>
            <p className="text-xs text-gray-500 mb-4">
              We&apos;ll confirm your booking on call or WhatsApp. No online payment needed right now.
            </p>
            {selectedService && (
              <div className="mb-4 p-3 rounded-xl bg-pink-50 border border-pink-100 text-sm flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{selectedService.name}</p>
                  <p className="text-xs text-gray-600">{selectedService.duration_mins} mins</p>
                </div>
                <span className="text-sm font-bold text-pink-700 bg-white px-3 py-1 rounded-full border border-pink-100">
                  ₹{selectedService.price}
                </span>
              </div>
            )}
            <form onSubmit={submitBooking} className="flex flex-col gap-4">
              <select
                required
                value={formData.service_id}
                onChange={e => setFormData({ ...formData, service_id: e.target.value })}
                className="border p-2 rounded"
              >
                <option value="" disabled>Select Service</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                required
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="border p-2 rounded"
              />
              <div>
                <input
                  required
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="border p-2 rounded w-full"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  We&apos;ll only use this to confirm your booking.
                </p>
              </div>
              <input
                required
                type="date"
                value={formData.date}
                onChange={handleDateChange}
                className="border p-2 rounded"
              />
              {formData.date && (
                <div className="space-y-2">
                  {isLoadingSlots && (
                    <p className="text-xs text-gray-500">Checking available slots...</p>
                  )}
                  {!isLoadingSlots && availableSlots.length === 0 && (
                    <p className="text-xs text-gray-500">
                      No free slots left for this date. Please pick another day or call us directly.
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-1">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setFormData({ ...formData, time: slot })}
                        className={`py-1 border rounded text-sm transition ${
                          formData.time === slot
                            ? 'bg-pink-600 text-white border-pink-600'
                            : 'bg-white text-gray-700 hover:bg-pink-50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={!formData.time || isLoadingSlots}
                className={`w-full font-bold py-3 rounded ${
                  !formData.time || isLoadingSlots
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-pink-600 text-white hover:bg-pink-700'
                }`}
              >
                {isLoadingSlots ? 'Checking availability…' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Floating chat bot */}
      <ChatBot />
    </div>
  )
}

export default Home