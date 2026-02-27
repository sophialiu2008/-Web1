import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, FileText, Home, Heart, CheckCircle2, Play, Pause, ChevronRight, HelpCircle, Clock, Phone } from 'lucide-react';

const steps = [
  {
    id: 1,
    icon: Search,
    title: '寻找伙伴',
    description: '浏览我们的宠物库，找到与你心灵相通的那个它。可以按品种、年龄、性格等条件筛选。',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    duration: '1-3天',
  },
  {
    id: 2,
    icon: FileText,
    title: '提交申请',
    description: '填写领养申请表，告诉我们你的家庭情况、养宠经验等，帮助我们了解你是否适合领养。',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    duration: '10-15分钟',
  },
  {
    id: 3,
    icon: Home,
    title: '家访评估',
    description: '我们会安排工作人员进行家访，确认你的居住环境适合养宠物，并提供养宠建议。',
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    duration: '1-2天',
  },
  {
    id: 4,
    icon: Heart,
    title: '正式领养',
    description: '通过审核后，签署领养协议，支付相关费用，就可以带你的新伙伴回家了！',
    color: 'bg-pink-500',
    lightColor: 'bg-pink-50',
    duration: '当天完成',
  },
];

const requirements = [
  '年满18周岁，有稳定收入',
  '有固定住所，允许养宠物',
  '有足够的时间和精力照顾宠物',
  '同意接受定期回访',
  '承诺不遗弃、不转卖宠物',
];

const faqs = [
  {
    question: '领养宠物需要支付哪些费用？',
    answer: '领养费用主要包括：疫苗接种费（¥200-400）、绝育手术费（¥300-600）、体检费用（¥100-200）以及可退还的领养押金（¥500）。押金在领养满一年后，经确认宠物状况良好即可全额退还。',
  },
  {
    question: '领养流程需要多长时间？',
    answer: '整个领养流程通常需要3-7个工作日。包括：寻找宠物（1-3天）、提交申请（当天）、审核与家访（1-2天）、正式领养（当天）。我们会尽快处理每一份申请。',
  },
  {
    question: '如果领养后发现问题怎么办？',
    answer: '我们提供7天适应期，如果在此期间发现宠物与家庭不适应，可以联系我们协商解决。同时，我们提供终身咨询服务，有任何养宠问题都可以随时联系我们。',
  },
  {
    question: '可以领养多只宠物吗？',
    answer: '可以，但需要根据您的居住条件、经济能力和时间精力来综合评估。我们会确保您有能力为每一只宠物提供良好的照顾。',
  },
  {
    question: '领养后需要接受回访吗？',
    answer: '是的，我们会在领养后的第1个月、第3个月、第6个月和第12个月进行回访，了解宠物的适应情况，并提供必要的养宠指导。',
  },
];

export default function AdoptionProcess() {
  const [activeStep, setActiveStep] = useState(1);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 自动播放步骤
  useEffect(() => {
    if (isAutoPlay) {
      autoPlayRef.current = setInterval(() => {
        setActiveStep((prev) => (prev >= steps.length ? 1 : prev + 1));
      }, 3000);
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlay]);

  const scrollToForm = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="process" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 mb-4">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            简单四步
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            领养
            <span className="text-gradient"> 流程</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            我们致力于确保每一只宠物都能找到最适合的家庭，
            整个领养流程简单透明，让我们一起来看看如何开始吧。
          </p>

          {/* Auto Play Control */}
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
          >
            {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAutoPlay ? '暂停演示' : '自动演示'}
          </button>
        </div>

        {/* Process Steps - Desktop */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-24 left-0 right-0 h-1 bg-gray-100">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 via-orange-500 to-pink-500 transition-all duration-500"
                style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {/* Steps */}
            <div className="grid grid-cols-4 gap-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index + 1 <= activeStep;
                const isCurrent = index + 1 === activeStep;

                return (
                  <div
                    key={step.id}
                    className="relative text-center cursor-pointer group"
                    onClick={() => {
                      setActiveStep(index + 1);
                      setIsAutoPlay(false);
                    }}
                  >
                    {/* Icon Circle */}
                    <div className={`
                      relative z-10 w-20 h-20 mx-auto rounded-2xl flex items-center justify-center
                      transition-all duration-500 mb-6
                      ${isActive ? step.color : 'bg-gray-100'}
                      ${isCurrent ? 'scale-110 shadow-warm-lg animate-pulse-soft' : 'scale-100'}
                    `}>
                      <Icon className={`w-8 h-8 ${isActive ? 'text-white' : 'text-gray-400'}`} />

                      {/* Step Number */}
                      <div className={`
                        absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center
                        text-sm font-bold transition-all duration-300
                        ${isActive ? 'bg-white text-gray-800 shadow-md' : 'bg-gray-200 text-gray-400'}
                      `}>
                        {step.id}
                      </div>
                    </div>

                    {/* Duration Badge */}
                    <div className={`
                      inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs mb-3
                      ${isActive ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-400'}
                    `}>
                      <Clock className="w-3 h-3" />
                      {step.duration}
                    </div>

                    {/* Content */}
                    <h3 className={`
                      text-lg font-bold mb-2 transition-colors duration-300
                      ${isActive ? 'text-gray-800' : 'text-gray-400'}
                    `}>
                      {step.title}
                    </h3>
                    <p className={`
                      text-sm leading-relaxed transition-colors duration-300
                      ${isActive ? 'text-gray-600' : 'text-gray-400'}
                    `}>
                      {step.description}
                    </p>

                    {/* Next Arrow */}
                    {index < steps.length - 1 && isActive && (
                      <div className="absolute top-20 -right-4 text-gray-300">
                        <ChevronRight className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Process Steps - Mobile */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index + 1 <= activeStep;

            return (
              <Card
                key={step.id}
                className={`
                  p-6 border-0 shadow-warm transition-all duration-300 cursor-pointer
                  ${isActive ? 'bg-white' : 'bg-gray-50'}
                  ${index + 1 === activeStep ? 'ring-2 ring-orange-200' : ''}
                `}
                onClick={() => {
                  setActiveStep(index + 1);
                  setIsAutoPlay(false);
                }}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0
                    transition-all duration-300 ${isActive ? step.color : 'bg-gray-200'}
                  `}>
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${isActive ? step.color + ' text-white' : 'bg-gray-200 text-gray-400'}
                      `}>
                        {step.id}
                      </span>
                      <h3 className={`text-lg font-bold ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                        {step.title}
                      </h3>
                    </div>
                    <div className={`
                      inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs mb-2
                      ${isActive ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-400'}
                    `}>
                      <Clock className="w-3 h-3" />
                      {step.duration}
                    </div>
                    <p className={`text-sm leading-relaxed ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            onClick={scrollToForm}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 shadow-warm-lg hover:shadow-warm transition-all hover:-translate-y-1"
          >
            开始领养申请
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Requirements Section */}
        <div className="mt-20">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  领养前需要准备什么？
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  领养宠物是一项长期的责任，我们希望每一位领养人都做好了充分的准备。
                  以下是领养前需要满足的基本条件：
                </p>
                <ul className="space-y-3">
                  {requirements.map((req, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-orange-500" />
                      </div>
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-warm">
                <h4 className="text-lg font-bold text-gray-800 mb-4">
                  领养费用说明
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">疫苗接种费</span>
                    <span className="font-medium text-gray-800">¥200-400</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">绝育手术费</span>
                    <span className="font-medium text-gray-800">¥300-600</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">体检费用</span>
                    <span className="font-medium text-gray-800">¥100-200</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-600">领养押金</span>
                    <span className="font-medium text-orange-500">¥500（可退）</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  * 具体费用根据宠物情况而定，押金在领养满一年后退还
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100 mb-4">
              <HelpCircle className="w-3 h-3 mr-1" />
              常见问题
            </Badge>
            <h3 className="text-2xl font-bold text-gray-800">
              关于领养的疑问
            </h3>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white rounded-xl border-0 shadow-warm px-6 data-[state=open]:shadow-warm-lg"
                >
                  <AccordionTrigger className="text-left font-medium text-gray-800 hover:text-orange-500 hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact CTA */}
          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">还有其他问题？</p>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full border-orange-200 text-orange-500 hover:bg-orange-50"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  联系我们
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="rounded-t-3xl border-t bg-white flex flex-col"
                style={{ maxHeight: '90vh' }}
              >
                {/* ── 固定头部 ── */}
                <SheetHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
                  <SheetTitle className="text-2xl font-bold text-center">联系我们的团队</SheetTitle>
                  <p className="text-center text-gray-500 text-sm mt-2">
                    如有任何领养相关问题，请留言给我们，我们会尽快与您联系。
                  </p>
                </SheetHeader>

                {/* ── 可滚动内容区 ── */}
                <div className="flex-1 overflow-y-auto px-6 py-5 max-w-md mx-auto w-full space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">您的称呼</label>
                    <Input placeholder="请输入您的姓名" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">联系方式</label>
                    <Input placeholder="手机号码或微信号" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">留言内容</label>
                    <Textarea rows={4} placeholder="请详细描述您的问题..." />
                  </div>
                </div>

                {/* ── 固定底部按钮 ── */}
                <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white max-w-md mx-auto w-full">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full h-11">
                    提交留言
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
}
