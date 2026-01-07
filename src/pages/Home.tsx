import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Send, MessageCircle, Mail, Phone, X, Loader2, HelpCircle, CheckCircle } from 'lucide-react'
import { callAIAgent } from '@/utils/aiAgent'

// Agent ID from orchestrator
const AGENT_ID = '695e4bc1e02ec0b2d8e56981'

// Types for messages
interface Message {
  id: string
  type: 'user' | 'agent'
  content: string
  timestamp: Date
}

interface AgentResponse {
  status: 'success' | 'error'
  result?: {
    response?: string
    action_taken?: string
    data?: any
    suggestions?: string[]
  }
  metadata?: {
    agent_name: string
    timestamp: string
  }
}

// Suggested questions component
function SuggestedQuestions({
  questions,
  onSelect,
  disabled,
}: {
  questions: string[]
  onSelect: (question: string) => void
  disabled: boolean
}) {
  return (
    <div className="space-y-2">
      {questions.map((question, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(question)}
          disabled={disabled}
          className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-700 hover:text-blue-700"
        >
          {question}
        </button>
      ))}
    </div>
  )
}

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center">
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

// Message bubble component
function MessageBubble({ message }: { message: Message }) {
  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const isAgent = message.type === 'agent'

  return (
    <div className={`flex gap-3 mb-4 ${isAgent ? 'justify-start' : 'justify-end'}`}>
      {isAgent && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
            <MessageCircle size={18} />
          </div>
        </div>
      )}

      <div className={`max-w-xs lg:max-w-md ${isAgent ? '' : 'lg:max-w-md'}`}>
        <div
          className={`px-4 py-3 rounded-lg ${
            isAgent
              ? 'bg-blue-500 text-white rounded-bl-none'
              : 'bg-gray-100 text-gray-900 rounded-br-none'
          }`}
        >
          <p className="text-sm break-words">{message.content}</p>
        </div>
        <p className={`text-xs mt-1 ${isAgent ? 'text-gray-500' : 'text-gray-500 text-right'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}

// Contact form modal component
function ContactModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate form submission
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setName('')
      setEmail('')
      setMessage('')
      onClose()
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Talk to Our Support Team</DialogTitle>
          <DialogDescription>
            Fill out the form below and we'll get back to you shortly.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <MessageCircle className="text-green-600" size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Thank you!</h3>
            <p className="text-sm text-gray-600">
              Your message has been sent. Our support team will contact you shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us how we can help..."
                rows={4}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">
              Send Message
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Email capture modal component
function EmailCaptureModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (email: string) => void
}) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      onSubmit(email)
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setEmail('')
        onClose()
      }, 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Email</DialogTitle>
          <DialogDescription>
            Provide your email address and I'll send you helpful information.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email Sent!</h3>
            <p className="text-sm text-gray-600">
              Check your inbox for the information we've sent you.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">
              <Mail size={16} className="mr-2" />
              Send to Email
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Main chat interface component
function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [lastAgentMessage, setLastAgentMessage] = useState<string>('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestedQuestions = [
    'How do I get started?',
    'What are your pricing plans?',
    'How do I reset my password?',
  ]

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
      }, 0)
    }
  }, [messages, isLoading])

  // Send a message
  const sendMessage = async (text: string) => {
    if (!text.trim()) return

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setShowSuggestions(false)
    setIsLoading(true)

    try {
      // Call the agent
      const result = await callAIAgent(text, AGENT_ID)

      if (result.success && result.response) {
        const agentResponse = result.response as AgentResponse
        const responseText =
          agentResponse.result?.response ||
          agentResponse.result?.action_taken ||
          'I understand your message. How else can I help?'

        setLastAgentMessage(responseText)

        const agentMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          type: 'agent',
          content: responseText,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, agentMessage])
      } else {
        // Error fallback
        const errorMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          type: 'agent',
          content:
            result.error ||
            'I apologize, but I encountered an issue processing your request. Please try again.',
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        type: 'agent',
        content:
          'I apologize, but I encountered a network error. Please try again in a moment.',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle email submission
  const handleEmailSubmit = async (email: string) => {
    const emailMessage = `Please send the information we discussed to ${email}`
    await sendMessage(emailMessage)
  }

  // Handle suggested question click
  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  // Handle input change with auto-expand for long messages
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value.substring(0, 500) // Max 500 chars
    setInput(text)
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              S
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Support Chat</h1>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-600" />
                We're online
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-2xl mx-auto w-full"
      >
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="text-blue-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Hi! How can I help you today?</h2>
            <p className="text-gray-600 mb-6">
              Choose a question below or ask me anything
            </p>

            <SuggestedQuestions
              questions={suggestedQuestions}
              onSelect={handleSuggestedQuestion}
              disabled={isLoading}
            />
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex gap-3 mb-4 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                <MessageCircle size={18} />
              </div>
            </div>
            <div className="max-w-xs lg:max-w-md">
              <div className="px-4 py-3 rounded-lg bg-blue-500 text-white rounded-bl-none">
                <TypingIndicator />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Type your question..."
              disabled={isLoading}
              maxLength={500}
              className="text-sm"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </Button>
          </form>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setEmailModalOpen(true)}
              disabled={isLoading || messages.length === 0}
              className="flex-1 flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail size={16} />
              <span>Email Info</span>
            </button>

            <button
              onClick={() => setContactModalOpen(true)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Phone size={16} />
              <span>Talk to Human</span>
            </button>
          </div>

          {/* Character count */}
          {input.length > 400 && (
            <p className="text-xs text-gray-500 text-right">
              {input.length}/500
            </p>
          )}
        </div>
      </div>

      {/* Contact modal */}
      <ContactModal open={contactModalOpen} onClose={() => setContactModalOpen(false)} />

      {/* Email capture modal */}
      <EmailCaptureModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSubmit={handleEmailSubmit}
      />
    </div>
  )
}

// Main export
export default function Home() {
  return <ChatInterface />
}
