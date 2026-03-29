import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Send, Bot, User, Loader2, MessageSquare } from 'lucide-react'
import Markdown from 'react-markdown'
import { api } from '../api/client'
import { useTenant } from '../context/TenantContext'
import { useToast } from '../components/ToastProvider'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ConversationSummary {
  id: string
  message_count: number
  created_at: string
  updated_at: string | null
}

interface ConversationDetail {
  id: string
  messages: ChatMessage[]
}

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const { tenantId, selectedDb, triggerRefresh } = useTenant()
  const { toast } = useToast()

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeId, setActiveId] = useState<string | null>(conversationId || null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadConversations() }, [tenantId, selectedDb])
  useEffect(() => { if (conversationId) loadConversation(conversationId) }, [conversationId])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadConversations() {
    if (!tenantId || !selectedDb) return
    const res = await api.get<{ conversations: ConversationSummary[] }>(
      `/ai/conversations?tenant_id=${tenantId}&database_id=${selectedDb.id}`
    )
    setConversations(res.conversations)
  }

  async function loadConversation(id: string) {
    const res = await api.get<ConversationDetail>(`/ai/conversations/${id}`)
    setMessages(res.messages)
    setActiveId(id)
  }

  function newChat() {
    setMessages([])
    setActiveId(null)
    setError('')
    navigate('/chat')
  }

  async function deleteConversation(id: string) {
    await api.delete(`/ai/conversations/${id}`)
    if (activeId === id) newChat()
    loadConversations()
  }

  async function handleSend() {
    if (!input.trim() || !tenantId || !selectedDb || loading) return
    const userMsg = input.trim()
    setInput('')
    setError('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await api.post<{
        conversation_id: string
        response: string
        actions_taken: { tool: string }[]
      }>('/ai/chat', {
        tenant_id: tenantId,
        database_id: selectedDb.id,
        message: userMsg,
        conversation_id: activeId,
      })

      setActiveId(res.conversation_id)
      setMessages(prev => [...prev, { role: 'assistant', content: res.response }])

      if (res.actions_taken?.length > 0) triggerRefresh()
      loadConversations()

      // Update URL
      if (!conversationId || conversationId !== res.conversation_id) {
        navigate(`/chat/${res.conversation_id}`, { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setLoading(false)
    }
  }

  function getTitle(c: ConversationSummary) {
    return `Chat ${new Date(c.created_at).toLocaleDateString()}`
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem-1.5rem)] -m-6">
      {/* Conversation sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col shrink-0">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <button onClick={newChat} className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50">
            <Plus size={16} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(c => (
            <div
              key={c.id}
              onClick={() => { loadConversation(c.id); navigate(`/chat/${c.id}`) }}
              className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer border-b border-gray-100 dark:border-gray-700 ${
                activeId === c.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="truncate flex-1">{getTitle(c)}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteConversation(c.id) }} className="text-gray-400 hover:text-red-600 shrink-0 ml-2">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">No conversations yet</p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <Bot size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium mb-2">AI Assistant</p>
              <p className="text-sm max-w-md mx-auto">Ask me to create tables, deploy templates, query data, build views, or set up dashboards.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {["Set up a CRM", "Create an inventory tracker", "What tables do I have?"].map(s => (
                  <button key={s} onClick={() => setInput(s)}
                    className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && <Bot size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-1" />}
              <div className={`max-w-[75%] rounded-lg px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
              }`}>
                <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 [&_code]:bg-gray-200/50 dark:[&_code]:bg-gray-700/50 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-gray-800 [&_pre]:text-gray-100 [&_pre]:p-2 [&_pre]:rounded [&_pre]:text-xs">
                  <Markdown>{msg.content}</Markdown>
                </div>
              </div>
              {msg.role === 'user' && <User size={20} className="text-gray-400 shrink-0 mt-1" />}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <Bot size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-1" />
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
                <Loader2 size={16} className="animate-spin text-gray-400" />
              </div>
            </div>
          )}

          {error && <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded">{error}</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ask me anything..."
              rows={1}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
            <button onClick={handleSend} disabled={!input.trim() || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
