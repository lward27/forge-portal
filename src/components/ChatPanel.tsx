import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, Send, MessageSquare, Bot, User, Loader2 } from 'lucide-react'
import Markdown from 'react-markdown'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  actions?: { tool: string; args: Record<string, unknown>; result: string }[]
}

interface Props {
  open: boolean
  onClose: () => void
}

export function ChatPanel({ open, onClose }: Props) {
  const { tenantId, selectedDb, triggerRefresh } = useTenant()
  const navigate = useNavigate()
  const location = useLocation()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(userMsg: string) {
    if (!tenantId || !selectedDb || loading) return
    setError('')
    setLoading(true)

    try {
      const res = await api.post<{
        conversation_id: string
        response: string
        actions_taken: { tool: string; args: Record<string, unknown>; result: string }[]
      }>('/ai/chat', {
        tenant_id: tenantId,
        database_id: selectedDb.id,
        message: userMsg,
        conversation_id: conversationId,
        page_context: location.pathname,
      })

      setConversationId(res.conversation_id)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.response,
        actions: res.actions_taken,
      }])
      if (res.actions_taken && res.actions_taken.length > 0) {
        triggerRefresh()
      }

      const navAction = res.actions_taken?.find(a => a.tool === 'navigate')
      if (navAction && navAction.args?.path) {
        navigate(navAction.args.path as string)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  function handleSend() {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    sendMessage(userMsg)
  }

  function handleContinue() {
    const continueMsg = 'Please continue where you left off.'
    setMessages(prev => [...prev, { role: 'user', content: continueMsg }])
    sendMessage(continueMsg)
  }

  function handleStop() {
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function newConversation() {
    setMessages([])
    setConversationId(null)
    setError('')
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/20 z-30" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white shadow-xl border-l border-gray-200 z-40 transform transition-transform duration-200 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-2">
            <Bot size={20} className="text-blue-600" />
            <span className="font-semibold text-gray-900">AI Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={newConversation} className="text-xs text-blue-600 hover:text-blue-700">New chat</button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <MessageSquare size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Ask me to create tables, add fields, query data, build views, or create dashboards.</p>
              <div className="mt-4 space-y-2">
                {[
                  "Create a table for tracking invoices",
                  "Show me all pending orders",
                  "Build a sales dashboard",
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); }}
                    className="block mx-auto text-xs text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && <Bot size={18} className="text-blue-600 shrink-0 mt-1" />}
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 [&_code]:bg-gray-200/50 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-gray-800 [&_pre]:text-gray-100 [&_pre]:p-2 [&_pre]:rounded [&_pre]:text-xs [&_pre]:overflow-x-auto">
                  <Markdown>{msg.content}</Markdown>
                </div>
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200/50 space-y-1">
                    {msg.actions.map((a, j) => (
                      <div key={j} className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="font-mono bg-gray-200/50 px-1 rounded">{a.tool}</span>
                        <span className={a.result === 'success' ? 'text-green-600' : 'text-red-500'}>{a.result}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === 'user' && <User size={18} className="text-gray-400 shrink-0 mt-1" />}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2">
              <Bot size={18} className="text-blue-600 shrink-0 mt-1" />
              <div className="bg-gray-100 rounded-lg px-3 py-2">
                <Loader2 size={16} className="animate-spin text-gray-400" />
              </div>
            </div>
          )}

          {error && (
            <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 shrink-0">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
