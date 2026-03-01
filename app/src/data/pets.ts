export interface Pet {
  id: number;
  name: string;
  type: 'dog' | 'cat';
  breed: string;
  age: string;
  gender: 'male' | 'female';
  location: string;
  image: string;
  images: string[];
  tags: string[];
  description: string;
  fullDescription: string;
  vaccinated: boolean;
  neutered: boolean;
  healthRecords: HealthRecord[];
  status?: string;
  personality: string[];
  suitableFor: string[];
  videoUrl?: string;
  views: number;
  isFeatured?: boolean;
  arrivalDate: string;
  latitude?: number | null;
  longitude?: number | null;
  distance?: number | null;
}

export interface HealthRecord {
  date: string;
  type: 'vaccine' | 'deworm' | 'checkup' | 'surgery';
  name: string;
  description: string;
  vet?: string;
}

export const pets: Pet[] = [
  {
    id: 1,
    name: '金毛',
    type: 'dog',
    breed: '金毛寻回犬',
    age: '2岁',
    gender: 'male',
    location: '北京市朝阳区',
    image: '/images/dog-golden.jpg',
    images: ['/images/dog-golden.jpg', '/images/story1.jpg'],
    tags: ['温顺', '友好', '适合家庭', '已训练'],
    description: '金毛是一只非常温顺友善的狗狗，喜欢和人亲近，特别适合有小孩的家庭。',
    fullDescription: '金毛是一只非常温顺友善的狗狗，喜欢和人亲近，特别适合有小孩的家庭。已经完成所有疫苗接种，健康状况良好。它喜欢户外活动，每天需要至少1小时的散步时间。金毛很聪明，已经学会了基本的指令如坐下、握手、等待等。它对陌生人也很友好，是一只非常理想的家庭伴侣犬。',
    vaccinated: true,
    neutered: true,
    healthRecords: [
      { date: '2024-01-15', type: 'vaccine', name: '狂犬疫苗', description: '完成年度狂犬疫苗接种' },
      { date: '2024-01-15', type: 'vaccine', name: '六联疫苗', description: '完成六联疫苗加强针' },
      { date: '2023-12-10', type: 'checkup', name: '年度体检', description: '健康状况良好，体重正常', vet: '李医生' },
      { date: '2023-06-20', type: 'surgery', name: '绝育手术', description: '手术顺利，恢复良好', vet: '王医生' },
    ],
    personality: ['温顺', '聪明', '活泼', '亲人'],
    suitableFor: ['有小孩的家庭', '初次养狗者', '喜欢户外运动的人'],
    views: 328,
    isFeatured: true,
    arrivalDate: '2023-11-01',
  },
  {
    id: 2,
    name: '橘子',
    type: 'cat',
    breed: '橘猫',
    age: '1岁',
    gender: 'female',
    location: '上海市浦东新区',
    image: '/images/cat-orange.jpg',
    images: ['/images/cat-orange.jpg', '/images/story2.jpg'],
    tags: ['活泼', '亲人', '好养', '可爱'],
    description: '橘子是一只活泼可爱的橘猫，性格亲人，喜欢被抚摸。',
    fullDescription: '橘子是一只活泼可爱的橘猫，性格亲人，喜欢被抚摸。已经绝育并完成疫苗接种，是非常理想的伴侣宠物。它喜欢玩耍，特别是逗猫棒和激光笔。橘子也很独立，当你忙碌时它会自己找乐子，但当你空闲时它会主动来寻求关注。',
    vaccinated: true,
    neutered: true,
    healthRecords: [
      { date: '2024-02-01', type: 'vaccine', name: '猫三联', description: '完成猫三联疫苗接种' },
      { date: '2024-02-01', type: 'vaccine', name: '狂犬疫苗', description: '完成狂犬疫苗接种' },
      { date: '2023-12-15', type: 'deworm', name: '体内驱虫', description: '常规体内驱虫' },
      { date: '2023-09-10', type: 'surgery', name: '绝育手术', description: '手术顺利，恢复良好', vet: '张医生' },
    ],
    personality: ['活泼', '亲人', '好奇', '独立'],
    suitableFor: ['公寓居住', '上班族', '初次养猫者'],
    views: 256,
    arrivalDate: '2023-12-01',
  },
  {
    id: 3,
    name: '柯基',
    type: 'dog',
    breed: '威尔士柯基犬',
    age: '3岁',
    gender: 'male',
    location: '广州市天河区',
    image: '/images/dog-corgi.jpg',
    images: ['/images/dog-corgi.jpg', '/images/story3.jpg'],
    tags: ['聪明', '忠诚', '短腿', '可爱'],
    description: '柯基是一只聪明忠诚的狗狗，虽然腿短但精力充沛。',
    fullDescription: '柯基是一只聪明忠诚的狗狗，虽然腿短但精力充沛。已经接受过基本训练，会握手、坐下、等待等指令。柯基非常喜欢和人互动，特别是喜欢被摸摸头。它的短腿和大屁股是它最大的萌点，走起路来一摇一摆非常可爱。',
    vaccinated: true,
    neutered: false,
    healthRecords: [
      { date: '2024-01-20', type: 'vaccine', name: '狂犬疫苗', description: '完成年度狂犬疫苗接种' },
      { date: '2023-11-15', type: 'checkup', name: '健康体检', description: '脊椎健康，体重正常', vet: '陈医生' },
      { date: '2023-08-10', type: 'deworm', name: '体内外驱虫', description: '常规驱虫' },
    ],
    personality: ['聪明', '忠诚', '活泼', '警觉'],
    suitableFor: ['有院子的家庭', '喜欢遛狗的人', '有经验的养狗者'],
    views: 412,
    isFeatured: true,
    arrivalDate: '2023-10-15',
  },
  {
    id: 4,
    name: '雪球',
    type: 'cat',
    breed: '布偶猫',
    age: '2岁',
    gender: 'female',
    location: '深圳市南山区',
    image: '/images/cat-ragdoll.jpg',
    images: ['/images/cat-ragdoll.jpg'],
    tags: ['优雅', '安静', '长毛', '美丽'],
    description: '雪球是一只优雅的布偶猫，拥有美丽的蓝色眼睛和柔软的长毛。',
    fullDescription: '雪球是一只优雅的布偶猫，拥有美丽的蓝色眼睛和柔软的长毛。性格安静温顺，喜欢陪伴在主人身边。布偶猫被称为"小狗猫"，因为它们会像小狗一样跟随主人。雪球需要定期梳理毛发，适合有耐心照顾它的主人。',
    vaccinated: true,
    neutered: true,
    healthRecords: [
      { date: '2024-01-10', type: 'vaccine', name: '猫三联', description: '完成年度加强针' },
      { date: '2023-12-20', type: 'checkup', name: '全面体检', description: '心脏健康，毛发状况良好', vet: '刘医生' },
      { date: '2023-07-15', type: 'surgery', name: '绝育手术', description: '手术顺利', vet: '赵医生' },
    ],
    personality: ['优雅', '温顺', '安静', '粘人'],
    suitableFor: ['喜欢安静的人', '有耐心的主人', '室内饲养'],
    views: 189,
    arrivalDate: '2023-09-20',
  },
  {
    id: 5,
    name: '边牧',
    type: 'dog',
    breed: '边境牧羊犬',
    age: '1岁',
    gender: 'male',
    location: '杭州市西湖区',
    image: '/images/dog-border.jpg',
    images: ['/images/dog-border.jpg'],
    tags: ['聪明', '活跃', '需要运动', '敏捷'],
    description: '边牧是一只非常聪明的狗狗，学习能力极强，需要较多的运动和智力游戏。',
    fullDescription: '边牧是一只非常聪明的狗狗，学习能力极强，需要较多的运动和智力游戏。适合有经验的养犬人士。边牧是智商排名第一的犬种，可以学会复杂的指令和技巧。如果你能提供足够的运动和智力刺激，边牧会成为你最忠诚的伙伴。',
    vaccinated: true,
    neutered: false,
    healthRecords: [
      { date: '2024-02-05', type: 'vaccine', name: '狂犬疫苗', description: '完成狂犬疫苗接种' },
      { date: '2024-02-05', type: 'vaccine', name: '八联疫苗', description: '完成八联疫苗接种' },
      { date: '2024-01-20', type: 'checkup', name: '幼犬体检', description: '发育正常，髋关节健康', vet: '孙医生' },
    ],
    personality: ['聪明', '活跃', '敏捷', '好学'],
    suitableFor: ['有经验的养狗者', '喜欢运动的人', '有大院子的家庭'],
    views: 367,
    arrivalDate: '2024-01-10',
  },
  {
    id: 6,
    name: '灰灰',
    type: 'cat',
    breed: '英国短毛猫',
    age: '2岁',
    gender: 'male',
    location: '成都市锦江区',
    image: '/images/cat-british.jpg',
    images: ['/images/cat-british.jpg'],
    tags: ['稳重', '独立', '圆脸', '好养'],
    description: '灰灰是一只稳重的英短，圆圆的脸蛋非常可爱。',
    fullDescription: '灰灰是一只稳重的英短，圆圆的脸蛋非常可爱。性格独立但也会主动亲近主人，是理想的公寓宠物。英短适应力强，不容易生病，是初次养猫者的理想选择。灰灰喜欢安静的环境，但也会在你需要陪伴时出现在你身边。',
    vaccinated: true,
    neutered: true,
    healthRecords: [
      { date: '2024-01-25', type: 'vaccine', name: '猫三联', description: '完成年度加强针' },
      { date: '2023-11-30', type: 'checkup', name: '健康体检', description: '体重正常，牙齿健康', vet: '周医生' },
      { date: '2023-05-20', type: 'surgery', name: '绝育手术', description: '手术顺利', vet: '吴医生' },
    ],
    personality: ['稳重', '独立', '温和', '适应力强'],
    suitableFor: ['上班族', '公寓居住', '初次养猫者'],
    views: 234,
    arrivalDate: '2023-08-15',
  },
];

export const getPetById = (id: number): Pet | undefined => {
  return pets.find(pet => pet.id === id);
};

export const getRelatedPets = (currentPet: Pet, limit = 3): Pet[] => {
  return pets
    .filter(pet => pet.id !== currentPet.id && pet.type === currentPet.type)
    .slice(0, limit);
};

export const getFeaturedPets = (): Pet[] => {
  return pets.filter(pet => pet.isFeatured);
};

export const getPopularPets = (limit = 5): Pet[] => {
  return [...pets].sort((a, b) => b.views - a.views).slice(0, limit);
};
