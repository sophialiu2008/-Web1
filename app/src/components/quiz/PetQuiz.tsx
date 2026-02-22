import { useState } from 'react';
import { quizQuestions, getQuizResult } from '@/data/quiz';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dog, Cat, Heart, CheckCircle2, RefreshCw, Share2 } from 'lucide-react';

interface PetQuizProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PetQuiz({ isOpen, onClose }: PetQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);

  if (!isOpen) return null;

  const handleAnswer = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: optionId }));
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResult(false);
  };

  const calculateResult = () => {
    let dogScore = 0;
    let catScore = 0;

    quizQuestions.forEach((q, index) => {
      const answerId = answers[index];
      const option = q.options.find(o => o.id === answerId);
      if (option) {
        dogScore += option.scores.dog;
        catScore += option.scores.cat;
      }
    });

    return getQuizResult(dogScore, catScore);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '宠物匹配测试结果',
          text: `我测试了适合养什么宠物，快来看看你的结果吧！`,
          url: window.location.href,
        });
      } catch {
        console.log('分享取消');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;
  const currentQ = quizQuestions[currentQuestion];
  const hasAnswer = answers[currentQuestion] !== undefined;
  const result = showResult ? calculateResult() : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-warm-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Heart className="w-6 h-6 text-orange-500" />
            宠物匹配测试
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        {!showResult ? (
          <div className="p-6">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>问题 {currentQuestion + 1} / {quizQuestions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question */}
            <div className="mb-8">
              <h3 className="text-xl font-medium text-gray-800 mb-6">
                {currentQ.question}
              </h3>

              <div className="space-y-3">
                {currentQ.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      answers[currentQuestion] === option.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        answers[currentQuestion] === option.id
                          ? 'border-orange-500'
                          : 'border-gray-300'
                      }`}>
                        {answers[currentQuestion] === option.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        )}
                      </div>
                      <span className="text-gray-700">{option.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentQuestion === 0}
                className="rounded-full"
              >
                上一题
              </Button>
              <Button
                onClick={handleNext}
                disabled={!hasAnswer}
                className="rounded-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {currentQuestion === quizQuestions.length - 1 ? '查看结果' : '下一题'}
              </Button>
            </div>
          </div>
        ) : (
          /* Result */
          <div className="p-6 text-center">
            <div className="mb-6">
              {result?.type === 'dog' && (
                <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Dog className="w-12 h-12 text-blue-500" />
                </div>
              )}
              {result?.type === 'cat' && (
                <div className="w-24 h-24 mx-auto bg-pink-100 rounded-full flex items-center justify-center mb-4">
                  <Cat className="w-12 h-12 text-pink-500" />
                </div>
              )}
              {result?.type === 'both' && (
                <div className="w-24 h-24 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-12 h-12 text-orange-500" />
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {result?.title}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {result?.description}
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-left">
              <h4 className="font-bold text-gray-800 mb-3">推荐品种</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {result?.recommendedBreeds.map((breed, i) => (
                  <span key={i} className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 shadow-sm">
                    {breed}
                  </span>
                ))}
              </div>
              
              <h4 className="font-bold text-gray-800 mb-3">养宠小贴士</h4>
              <ul className="space-y-2">
                {result?.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={handleRestart}
                className="rounded-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                重新测试
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="rounded-full"
              >
                <Share2 className="w-4 h-4 mr-2" />
                分享结果
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  document.getElementById('pets')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="rounded-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                去选宠物
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
