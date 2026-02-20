export interface QuizQuestion {
  id: number;
  question: string;
  options: {
    id: string;
    text: string;
    scores: {
      dog: number;
      cat: number;
    };
  }[];
}

export interface QuizResult {
  type: 'dog' | 'cat' | 'both';
  title: string;
  description: string;
  recommendedBreeds: string[];
  tips: string[];
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: '你每天有多少时间可以陪伴宠物？',
    options: [
      { id: 'a', text: '少于1小时', scores: { dog: 0, cat: 3 } },
      { id: 'b', text: '1-2小时', scores: { dog: 2, cat: 3 } },
      { id: 'c', text: '2-3小时', scores: { dog: 3, cat: 2 } },
      { id: 'd', text: '3小时以上', scores: { dog: 3, cat: 1 } },
    ],
  },
  {
    id: 2,
    question: '你的居住环境是？',
    options: [
      { id: 'a', text: '小公寓（无阳台）', scores: { dog: 0, cat: 3 } },
      { id: 'b', text: '公寓（有阳台）', scores: { dog: 1, cat: 3 } },
      { id: 'c', text: '大公寓/小房子', scores: { dog: 2, cat: 2 } },
      { id: 'd', text: '独栋房屋（有院子）', scores: { dog: 3, cat: 1 } },
    ],
  },
  {
    id: 3,
    question: '你喜欢什么样的互动方式？',
    options: [
      { id: 'a', text: '安静陪伴，偶尔互动', scores: { dog: 0, cat: 3 } },
      { id: 'b', text: '适度互动，各自独立', scores: { dog: 1, cat: 2 } },
      { id: 'c', text: '经常玩耍，喜欢被关注', scores: { dog: 3, cat: 1 } },
      { id: 'd', text: '全天候互动，形影不离', scores: { dog: 3, cat: 0 } },
    ],
  },
  {
    id: 4,
    question: '你能接受的噪音水平是？',
    options: [
      { id: 'a', text: '非常安静，几乎无声', scores: { dog: 0, cat: 3 } },
      { id: 'b', text: '偶尔有声音', scores: { dog: 2, cat: 2 } },
      { id: 'c', text: '可以有一定噪音', scores: { dog: 3, cat: 1 } },
      { id: 'd', text: '不介意吵闹', scores: { dog: 3, cat: 0 } },
    ],
  },
  {
    id: 5,
    question: '你的运动习惯是？',
    options: [
      { id: 'a', text: '几乎不运动', scores: { dog: 0, cat: 3 } },
      { id: 'b', text: '偶尔散步', scores: { dog: 2, cat: 2 } },
      { id: 'c', text: '经常户外活动', scores: { dog: 3, cat: 1 } },
      { id: 'd', text: '运动达人', scores: { dog: 3, cat: 0 } },
    ],
  },
  {
    id: 6,
    question: '你家里是否有小孩？',
    options: [
      { id: 'a', text: '有5岁以下小孩', scores: { dog: 2, cat: 1 } },
      { id: 'b', text: '有5-12岁小孩', scores: { dog: 3, cat: 2 } },
      { id: 'c', text: '有12岁以上小孩', scores: { dog: 3, cat: 3 } },
      { id: 'd', text: '没有小孩', scores: { dog: 2, cat: 2 } },
    ],
  },
  {
    id: 7,
    question: '你的养宠经验是？',
    options: [
      { id: 'a', text: '完全没有经验', scores: { dog: 1, cat: 2 } },
      { id: 'b', text: '养过猫', scores: { dog: 2, cat: 3 } },
      { id: 'c', text: '养过狗', scores: { dog: 3, cat: 2 } },
      { id: 'd', text: '猫狗都养过', scores: { dog: 3, cat: 3 } },
    ],
  },
  {
    id: 8,
    question: '你能接受的清洁工作量是？',
    options: [
      { id: 'a', text: '越少越好', scores: { dog: 1, cat: 3 } },
      { id: 'b', text: '可以接受适度清洁', scores: { dog: 2, cat: 2 } },
      { id: 'c', text: '不介意经常打扫', scores: { dog: 3, cat: 1 } },
      { id: 'd', text: '非常勤快，喜欢打扫', scores: { dog: 3, cat: 1 } },
    ],
  },
];

export const getQuizResult = (dogScore: number, catScore: number): QuizResult => {
  if (dogScore > catScore + 3) {
    return {
      type: 'dog',
      title: '你更适合养狗！',
      description: '根据你的回答，狗狗会是更适合你的宠物伙伴。狗狗热情、忠诚，喜欢与人互动，能为你的生活带来更多活力和欢乐。',
      recommendedBreeds: ['金毛寻回犬', '拉布拉多', '柯基', '边境牧羊犬'],
      tips: [
        '每天保证至少1小时的遛狗时间',
        '准备好处理掉毛问题',
        '定期训练和社交化',
        '考虑邻居对噪音的接受程度',
      ],
    };
  } else if (catScore > dogScore + 3) {
    return {
      type: 'cat',
      title: '你更适合养猫！',
      description: '根据你的回答，猫咪会是更适合你的宠物伙伴。猫咪独立、优雅，不需要太多照顾，是忙碌生活的完美伴侣。',
      recommendedBreeds: ['英短', '美短', '布偶猫', '橘猫'],
      tips: [
        '准备好猫砂盆和优质猫粮',
        '提供攀爬和磨爪的空间',
        '定期梳理毛发',
        '尊重猫咪的独立性格',
      ],
    };
  } else {
    return {
      type: 'both',
      title: '猫狗都适合！',
      description: '根据你的回答，你的生活方式既适合养狗也适合养猫！你有足够的爱心和耐心，可以为任何宠物提供温暖的家。',
      recommendedBreeds: ['金毛寻回犬', '布偶猫', '柯基', '英短'],
      tips: [
        '可以先考虑领养成年宠物，性格更稳定',
        '如果同时养猫狗，需要逐步引导它们相处',
        '确保有足够的空间和资源',
        '根据你的日常安排选择更合适的类型',
      ],
    };
  }
};
