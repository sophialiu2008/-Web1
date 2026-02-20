import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const faqResponses: Record<string, string> = {
  '领养': '领养流程很简单：1. 浏览宠物 2. 提交申请 3. 家访评估 4. 正式领养。您可以在"领养流程"页面查看详细信息。',
  '费用': '领养费用包括：疫苗费（¥200-400）、绝育费（¥300-600）、体检费（¥100-200）、押金（¥500可退）。',
  '条件': '领养需要：年满18岁、有固定住所、稳定收入、同意接受回访。',
  '预约': '您可以在宠物详情页点击"预约看宠"按钮，选择合适的时间到店参观。',
  '疫苗': '我们所有的宠物都已完成基础疫苗接种，会提供疫苗接种证明。',
  '绝育': '大部分宠物已完成绝育手术，未绝育的我们会提供优惠的绝育服务。',
  '回访': '我们会在领养后第1、3、6、12个月进行回访，确保宠物适应良好。',
  '地址': '我们的地址是：北京市朝阳区宠物街88号，营业时间：周一至周五 9:00-18:00。',
};

const getBotResponse = (message: string): string => {
  const lowerMsg = message.toLowerCase();
  
  for (const [keyword, response] of Object.entries(faqResponses)) {
    if (lowerMsg.includes(keyword)) {
      return response;
    }
  }
  
  if (lowerMsg.includes('你好') || lowerMsg.includes('您好')) {
    return '您好！欢迎来到宠物领养中心，有什么可以帮助您的吗？';
  }
  
  if (lowerMsg.includes('谢谢') || lowerMsg.includes('感谢')) {
    return '不客气！如果还有其他问题，随时问我哦。';
  }
  
  if (lowerMsg.includes('再见') || lowerMsg.includes('拜拜')) {
    return '再见！祝您找到心仪的宠物伙伴！';
  }
  
  return '抱歉，我可能没有完全理解您的问题。您可以咨询：领养流程、费用、条件、预约、疫苗、绝育、回访、地址等。或者拨打我们的热线：400-888-9999';
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'bot',
      content: '您好！我是宠物领养中心的小助手，有什么可以帮助您的吗？',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot typing
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: getBotResponse(userMessage.content),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 right-8 z-50 w-14 h-14 rounded-full shadow-warm-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700 rotate-90'
            : 'bg-orange-500 hover:bg-orange-600 hover:scale-110'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-40 right-8 z-50 w-80 md:w-96 bg-white rounded-2xl shadow-warm-lg overflow-hidden transition-all duration-300 ${
          isOpen
            ? 'opacity-100 translate-y-0 visible'
            : 'opacity-0 translate-y-10 invisible'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">在线客服</h3>
            <p className="text-xs text-white/80">AI小助手为您服务</p>
          </div>
        </div>

        {/* Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${
                message.type === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user'
                    ? 'bg-orange-500'
                    : 'bg-gray-200'
                }`}
              >
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <div
                className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                  message.type === 'user'
                    ? 'bg-orange-500 text-white rounded-br-none'
                    : 'bg-white text-gray-700 shadow-sm rounded-bl-none'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入您的问题..."
              className="flex-1 rounded-full border-gray-200 focus:border-orange-300"
            />
            <Button
              onClick={handleSend}
              size="icon"
              className="rounded-full bg-orange-500 hover:bg-orange-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            工作时间可转人工客服
          </p>
        </div>
      </div>
    </>
  );
}
