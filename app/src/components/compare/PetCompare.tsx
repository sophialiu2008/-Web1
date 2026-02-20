import { useUserStore } from '@/store/userStore';
import { pets } from '@/data/pets';
import { Button } from '@/components/ui/button';
import { X, Check, AlertCircle } from 'lucide-react';

interface PetCompareProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PetCompare({ isOpen, onClose }: PetCompareProps) {
  const { compareList, removeFromCompare, clearCompare } = useUserStore();
  
  const comparePets = pets.filter(pet => compareList.includes(pet.id));

  if (!isOpen || comparePets.length === 0) return null;

  const attributes = [
    { key: 'breed', label: '品种' },
    { key: 'age', label: '年龄' },
    { key: 'gender', label: '性别', render: (v: string) => v === 'male' ? '公' : '母' },
    { key: 'location', label: '位置' },
    { key: 'vaccinated', label: '疫苗接种', render: (v: boolean) => v ? <Check className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-gray-400" /> },
    { key: 'neutered', label: '绝育状态', render: (v: boolean) => v ? <Check className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-gray-400" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-warm-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">宠物对比</h2>
            <p className="text-gray-500 text-sm mt-1">
              对比 {comparePets.length} 只宠物
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCompare}
              className="text-gray-600"
            >
              清空对比
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Compare Content */}
        <div className="overflow-auto max-h-[60vh] p-6">
          <div className={`grid gap-4 ${
            comparePets.length === 2 ? 'grid-cols-3' : 
            comparePets.length === 3 ? 'grid-cols-4' : 'grid-cols-2'
          }`}>
            {/* Attribute Labels Column */}
            <div className="space-y-4">
              <div className="h-32" /> {/* Image placeholder */}
              {attributes.map(attr => (
                <div key={attr.key} className="h-12 flex items-center text-sm font-medium text-gray-600">
                  {attr.label}
                </div>
              ))}
              <div className="h-12 flex items-center text-sm font-medium text-gray-600">
                性格特点
              </div>
              <div className="h-12 flex items-center text-sm font-medium text-gray-600">
                适合人群
              </div>
            </div>

            {/* Pet Columns */}
            {comparePets.map(pet => (
              <div key={pet.id} className="space-y-4">
                {/* Pet Image & Name */}
                <div className="h-32 relative">
                  <img
                    src={pet.image}
                    alt={pet.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    onClick={() => removeFromCompare(pet.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 rounded-b-xl">
                    <h3 className="font-bold text-white">{pet.name}</h3>
                  </div>
                </div>

                {/* Attributes */}
                {attributes.map(attr => (
                  <div key={attr.key} className="h-12 flex items-center justify-center text-sm text-gray-700">
                    {attr.render 
                      ? attr.render(pet[attr.key as keyof typeof pet] as never)
                      : pet[attr.key as keyof typeof pet] as string
                    }
                  </div>
                ))}

                {/* Personality */}
                <div className="h-12 flex items-center justify-center">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {pet.personality.slice(0, 2).map((p, i) => (
                      <span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Suitable For */}
                <div className="h-12 flex items-center justify-center">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {pet.suitableFor.slice(0, 2).map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-center gap-4">
          {comparePets.map(pet => (
            <Button
              key={pet.id}
              onClick={() => {
                onClose();
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
            >
              申请领养 {pet.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
