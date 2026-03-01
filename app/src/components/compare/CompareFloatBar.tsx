import { useUserStore } from '@/store/userStore';
import { usePetStore } from '@/store/petStore';
import { Button } from '@/components/ui/button';
import { X, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompareFloatBar() {
    const { compareList, removeFromCompare, setCompareOpen } = useUserStore();
    const { pets } = usePetStore();

    if (compareList.length === 0) return null;

    const comparePets = compareList.map(id => pets.find(p => String(p.id) === String(id))).filter(Boolean);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-md shadow-2xl rounded-full px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between sm:justify-center gap-2 sm:gap-6 border border-orange-100 w-[95%] sm:w-auto overflow-hidden text-sm"
            >
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">已选 {compareList.length}/3</span>
                    <div className="flex -space-x-3">
                        {comparePets.map((pet, idx) => (
                            <div key={idx} className="relative group">
                                <img
                                    src={pet?.image || '/images/default-pet.jpg'}
                                    alt={pet?.name || '宠物'}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm transition-transform group-hover:scale-110"
                                />
                                {pet && (
                                    <button
                                        onClick={() => removeFromCompare(String(pet.id))}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-2.5 h-2.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-px h-8 bg-gray-200" />

                <Button
                    onClick={() => setCompareOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center gap-1 sm:gap-2 shadow-md shadow-orange-200 text-xs sm:text-sm px-3 sm:px-4 flex-shrink-0"
                >
                    <Scale className="w-4 h-4" />
                    开始对比
                </Button>
            </motion.div>
        </AnimatePresence>
    );
}
