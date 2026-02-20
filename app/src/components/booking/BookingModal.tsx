import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Phone, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useUserStore } from '@/store/userStore';
import { submitBooking } from '@/services/api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  petId: number;
  petName: string;
}

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];

export default function BookingModal({ isOpen, onClose, petId, petName }: BookingModalProps) {
  const { user, addBooking } = useUserStore();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!date || !time || !name || !phone) return;

    const booking = {
      id: `BK${Date.now()}`,
      petId,
      petName,
      date: format(date, 'yyyy-MM-dd'),
      time,
      status: 'pending' as const,
    };

    addBooking(booking);
    try {
      await submitBooking({
        user_id: user?.id,
        pet_id: petId,
        pet_name: petName,
        date: booking.date,
        time: booking.time
      });
    } catch {}
    setStep(3);
  };

  const handleClose = () => {
    setStep(1);
    setDate(undefined);
    setTime('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            预约看宠 - {petName}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              请选择您方便的日期和时间段到店参观
            </p>

            {/* Calendar */}
            <div>
              <Label className="mb-2 block">选择日期</Label>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date < new Date() || date.getDay() === 0}
                className="rounded-md border"
              />
            </div>

            {/* Time Slots */}
            {date && (
              <div>
                <Label className="mb-2 block">选择时间</Label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setTime(slot)}
                      className={`p-2 rounded-lg text-sm transition-all ${
                        time === slot
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => setStep(2)}
              disabled={!date || !time}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
            >
              下一步
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-xl mb-4">
              <p className="text-sm text-gray-600">
                预约时间：
                <span className="font-medium text-gray-800">
                  {date && format(date, 'yyyy年MM月dd日', { locale: zhCN })} {time}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">姓名 *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入您的姓名"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">联系电话 *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入联系电话"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">备注（选填）</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="如有特殊需求请说明"
                className="w-full p-3 rounded-lg border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 rounded-full"
              >
                返回
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!name || !phone}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full"
              >
                确认预约
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              预约成功！
            </h3>
            <p className="text-gray-600 mb-4">
              我们会通过短信确认您的预约信息
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-gray-600">
                <span className="font-medium">宠物：</span>{petName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">日期：</span>
                {date && format(date, 'yyyy年MM月dd日', { locale: zhCN })}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">时间：</span>{time}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">地点：</span>北京市朝阳区宠物街88号
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
            >
              完成
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
