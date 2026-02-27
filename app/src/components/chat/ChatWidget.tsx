import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react'
import { API_BASE } from '@/services/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '您好！我是宠物领养中心的小助手萌萌 🐾 有什么可以帮助您的吗？',
}

// Quick-action suggestions shown above the input
const SUGGESTIONS = ['如何领养宠物？', '猫咪需要打什么疫苗？', '审核需要多久？']

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, loading, scrollToBottom])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed }
    const next = [...messages, userMsg]
    setMessages(next)
    setInputValue('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Send last 10 messages for context (exclude welcome to save tokens)
          messages: next.slice(-10).map(m => ({ role: m.role, content: m.content }))
        })
      })
      const data = await res.json()
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply || '抱歉，暂时无法回答，请稍后再试 😅'
        }
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: '网络异常，请稍后重试 😅' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? '关闭客服' : '打开在线客服'}
        className={`fixed bottom-24 right-8 z-50 w-14 h-14 rounded-full shadow-warm-lg flex items-center justify-center transition-all duration-300 ${isOpen
            ? 'bg-gray-600 hover:bg-gray-700 rotate-90'
            : 'bg-orange-500 hover:bg-orange-600 hover:scale-110'
          }`}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-40 right-8 z-50 w-80 md:w-96 bg-white rounded-2xl shadow-warm-lg overflow-hidden flex flex-col transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-10 invisible pointer-events-none'
          }`}
        style={{ maxHeight: '520px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white leading-tight">萌萌 · AI 客服</h3>
            <p className="text-xs text-white/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 通义千问驱动
            </p>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-orange-500' : 'bg-white border border-orange-100 shadow-sm'
                }`}>
                {msg.role === 'user'
                  ? <User className="w-4 h-4 text-white" />
                  : <Bot className="w-4 h-4 text-orange-500" />}
              </div>
              <div className={`max-w-[78%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                  ? 'bg-orange-500 text-white rounded-br-none'
                  : 'bg-white text-gray-700 shadow-sm rounded-bl-none border border-gray-100'
                }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-white border border-orange-100 shadow-sm flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-orange-500" />
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions (only show when just welcome message) */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 bg-gray-50 flex flex-wrap gap-1.5 flex-shrink-0">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-3 py-1 hover:bg-orange-100 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入您的问题..."
              disabled={loading}
              className="flex-1 rounded-full border-gray-200 focus:border-orange-300 text-sm"
            />
            <Button
              onClick={() => sendMessage(inputValue)}
              size="icon"
              disabled={loading || !inputValue.trim()}
              className="rounded-full bg-orange-500 hover:bg-orange-600 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            遇到复杂问题可联系人工客服协助
          </p>
        </div>
      </div>
    </>
  )
}
