import { useState } from 'react'

const FAQS = [
  {
    q: 'What services do you offer?',
    a: 'We offer hair, makeup, skin and nail services. You can see the full menu in the Services section.'
  },
  {
    q: 'How can I book an appointment?',
    a: 'Click on any “Book Now” or “Enquiry Now” button and fill the quick booking form. You can also call or WhatsApp us from the Contact section.'
  },
  {
    q: 'Do you provide bridal makeup?',
    a: 'Yes, we specialise in bridal and party makeup. Share your date and time and we will confirm availability.'
  },
  {
    q: 'Where are you located?',
    a: 'You can see our exact location on the embedded Google Map in the Contact section, along with directions.'
  }
]

function findAnswer(message) {
  const text = message.toLowerCase()
  if (text.includes('price') || text.includes('cost') || text.includes('rate')) {
    return 'Our prices are shown under each service in the Services section. For custom packages, please send your requirements and we will share a quote.'
  }
  if (text.includes('time') || text.includes('open') || text.includes('timing') || text.includes('hours')) {
    return 'Our standard timings are 10:00 AM to 8:00 PM. For early-morning bridal bookings, contact us directly.'
  }
  if (text.includes('bridal') || text.includes('wedding')) {
    return 'Yes, we provide full bridal packages including makeup, hair and draping. Share your date and preferred time and we will get back to you.'
  }
  if (text.includes('address') || text.includes('location')) {
    return 'You can find our address and live Google Map in the Contact section at the bottom of the page.'
  }

  const matched = FAQS.find(item => text.includes(item.q.split(' ')[0].toLowerCase()))
  if (matched) return matched.a

  return 'Thanks for your message. For exact pricing or special requests, please share your name, service and preferred date/time and our team will contact you.'
}

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I am your salon assistant. Ask me about services, bookings or timings.' }
  ])

  const sendMessage = (e) => {
    e?.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    const userMsg = { from: 'user', text: trimmed }
    const botReply = { from: 'bot', text: findAnswer(trimmed) }
    setMessages(prev => [...prev, userMsg, botReply])
    setInput('')
  }

  return (
    <>
      {/* Floating chat button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-pink-600 hover:bg-pink-700 text-white rounded-full shadow-xl px-5 py-3 font-bold text-sm"
      >
        {isOpen ? 'Close Chat' : 'Chat with us'}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-violet-100 flex flex-col overflow-hidden">
          <div className="bg-violet-600 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Salon Assistant</p>
              <p className="text-xs text-pink-100">Typically replies in a few minutes</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
          <div className="flex-1 max-h-80 overflow-y-auto px-3 py-2 space-y-2 text-sm bg-violet-50/60">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl max-w-[80%] ${
                    m.from === 'user'
                      ? 'bg-violet-600 text-white rounded-br-sm'
                      : 'bg-white text-slate-900 border border-violet-100 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="border-t border-violet-100 flex items-center px-2 py-2 bg-white">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 text-xs border-none outline-none px-2 py-1 bg-transparent text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="text-xs font-semibold text-pink-600 px-2 py-1 rounded hover:text-pink-700"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default ChatBot

