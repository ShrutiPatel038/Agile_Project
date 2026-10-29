import { useEffect, useState, useRef } from 'react'
import api from '../services/api'

export default function SupportPage() {
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [submittingTicket, setSubmittingTicket] = useState(false)

  // Form states
  const [category, setCategory] = useState('booking')
  const [priority, setPriority] = useState('medium')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [newMsg, setNewMsg] = useState('')
  const [rating, setRating] = useState(5)
  const [submittingMessage, setSubmittingMessage] = useState(false)

  const messageEndRef = useRef(null)

  const fetchTickets = async () => {
    try {
      const { data } = await api.get('/support/my-tickets')
      setTickets(data || [])
      // If a ticket was previously selected, refresh its details
      if (selectedTicket) {
        const refreshed = data.find((t) => t._id === selectedTicket._id)
        if (refreshed) setSelectedTicket(refreshed)
      }
    } catch (err) {
      console.error('Failed to load support tickets', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    // Scroll chat window to bottom whenever messages or selected ticket changes
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedTicket?.messages])

  const handleSelectTicket = async (ticket) => {
    try {
      const { data } = await api.get(`/support/${ticket._id}`)
      setSelectedTicket(data)
      setShowCreateForm(false)
    } catch (err) {
      console.error('Failed to load ticket details', err)
    }
  }

  const handleCreateTicket = async (e) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    setSubmittingTicket(true)
    try {
      await api.post('/support/create', {
        category,
        priority,
        title,
        description
      })
      setTitle('')
      setDescription('')
      setShowCreateForm(false)
      fetchTickets()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create support ticket')
    } finally {
      setSubmittingTicket(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMsg.trim() || !selectedTicket) return

    setSubmittingMessage(true)
    try {
      const { data } = await api.post(`/support/${selectedTicket._id}/message`, {
        message: newMsg
      })
      setNewMsg('')
      // Refresh current ticket
      handleSelectTicket(selectedTicket)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message')
    } finally {
      setSubmittingMessage(false)
    }
  }

  const handleRateTicket = async () => {
    if (!selectedTicket) return
    try {
      await api.post(`/support/${selectedTicket._id}/rate`, { rating })
      alert('Thank you for rating your experience!')
      handleSelectTicket(selectedTicket)
    } catch (err) {
      alert('Failed to rate ticket')
    }
  }

  const getPriorityColor = (prio) => {
    switch (prio) {
      case 'urgent': return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
      case 'high': return 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-400'
      case 'medium': return 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
      case 'low':
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
      case 'in-progress': return 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-400 font-semibold'
      case 'resolved': return 'bg-primary-600 text-white'
      case 'closed':
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Support Tickets</h1>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm)
            setSelectedTicket(null)
          }}
          className="btn btn-primary px-5 py-2 text-xs font-bold"
        >
          {showCreateForm ? 'View My Tickets' : 'Create New Ticket'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List (Left Side) */}
        {!showCreateForm && (
          <div className="lg:col-span-1 card rounded-3xl p-5 h-[70vh] flex flex-col animate-slide-up">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Ticket List</h3>
            {tickets.length === 0 ? (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-12 flex-1">
                You have not created any support tickets yet.
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {tickets.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => handleSelectTicket(t)}
                    className={`w-full p-4 rounded-2xl text-left transition-all duration-200 shadow-sm border ${
                      selectedTicket?._id === t._id
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-800'
                        : 'bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <span className="font-bold text-xs text-gray-900 dark:text-white truncate flex-1">{t.title}</span>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase shrink-0 ${getStatusColor(t.status)}`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{t.description}</p>
                    <div className="flex gap-2 items-center">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${getPriorityColor(t.priority)}`}>
                        {t.priority}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto capitalize font-semibold">{t.category}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ticket Chat/Form (Right Side / Full width if form shown) */}
        <div className={`${showCreateForm ? 'lg:col-span-3' : 'lg:col-span-2'} min-h-[50vh]`}>
          {showCreateForm ? (
            /* CREATE TICKET FORM */
            <div className="card p-6 space-y-4 animate-slide-up">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Raise New Support Ticket</h3>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input"
                    >
                      <option value="booking">Booking Issue</option>
                      <option value="payment">Payment Issue</option>
                      <option value="vehicle">Vehicle Issue</option>
                      <option value="account">Account Management</option>
                      <option value="technical">Technical Glitch</option>
                      <option value="other">Other Query</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="input"
                    >
                      <option value="low">Low (General Query)</option>
                      <option value="medium">Medium (Standard Issue)</option>
                      <option value="high">High (Urgent Attention)</option>
                      <option value="urgent">Urgent (Immediate Fix Required)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Short summary of the issue"
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about the issue. Include vehicle, dates, or booking ID if applicable."
                    rows={6}
                    required
                    className="input"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn btn-ghost px-4 py-2 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTicket}
                    className="btn btn-primary px-5 py-2 text-xs font-bold"
                  >
                    {submittingTicket ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </div>
          ) : selectedTicket ? (
            /* ACTIVE TICKET CONVERSATION CHAT */
            <div className="card rounded-3xl h-[70vh] flex flex-col overflow-hidden animate-slide-up">
              {/* Chat Header */}
              <div className="p-4 flex items-center justify-between gap-3 bg-gray-100 dark:bg-gray-800 rounded-t-3xl border-b border-gray-200 dark:border-gray-800">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">{selectedTicket.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Category: <span className="capitalize">{selectedTicket.category}</span> • ID: {selectedTicket._id}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              {/* Message Display Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-950/40">
                {/* Initial Description from User */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] bg-white dark:bg-gray-900 p-4 rounded-3xl rounded-tl-none shadow-sm border border-gray-200 dark:border-gray-800">
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider block">Description</span>
                    <p className="text-xs text-gray-900 dark:text-white whitespace-pre-line mt-1">{selectedTicket.description}</p>
                    <span className="text-[10px] text-gray-400 mt-2 block text-right">
                      Opened {new Date(selectedTicket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Conversation Thread */}
                {selectedTicket.messages?.map((msg, index) => {
                  const isUser = msg.senderRole === 'user'
                  return (
                    <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-3.5 rounded-3xl shadow-sm ${
                        isUser
                          ? 'bg-primary-600 text-white rounded-tr-none'
                          : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-800'
                      }`}>
                        <span className={`text-[10px] font-bold block uppercase tracking-wider mb-1 ${
                          isUser ? 'text-primary-200' : 'text-gray-500'
                        }`}>
                          {msg.senderName} ({msg.senderRole === 'user' ? 'You' : 'Support Team'})
                        </span>
                        <p className="text-xs whitespace-pre-line">{msg.message}</p>
                        <span className={`text-[10px] mt-1 block text-right ${isUser ? 'text-primary-200' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div ref={messageEndRef} />
              </div>

              {/* Chat Input / Feedback */}
              {selectedTicket.status === 'resolved' ? (
                /* RATING COMPONENT FOR RESOLVED TICKET */
                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 text-center space-y-3">
                  <p className="text-xs font-bold text-gray-800 dark:text-primary-300">
                    This ticket has been marked as Resolved. Please rate our support service!
                  </p>
                  {selectedTicket.rating ? (
                    <div className="text-yellow-500 font-extrabold text-xs flex justify-center items-center gap-1.5">
                      <span>Rated: {selectedTicket.rating} / 5 ★</span>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`text-xl transition-colors duration-150 ${
                              rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-700'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleRateTicket}
                        className="btn btn-secondary px-4 py-2 text-xs font-bold"
                      >
                        Submit Feedback
                      </button>
                    </div>
                  )}
                </div>
              ) : selectedTicket.status === 'closed' ? (
                <div className="p-4 bg-gray-100 dark:bg-gray-800 text-center text-xs font-bold text-gray-500">
                  This ticket has been Closed.
                </div>
              ) : (
                /* CHAT BOX INPUT */
                <form onSubmit={handleSendMessage} className="p-4 flex gap-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Type your message here..."
                    className="input py-2 flex-1"
                  />
                  <button
                    type="submit"
                    disabled={submittingMessage || !newMsg.trim()}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 transition-all"
                  >
                    Send
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="card rounded-3xl h-[70vh] flex flex-col items-center justify-center text-center p-8 text-gray-500 dark:text-gray-400 animate-slide-up">
              <svg className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-300">No Ticket Selected</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mt-1">Select a ticket from the left panel to review messages or create a new support request.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
