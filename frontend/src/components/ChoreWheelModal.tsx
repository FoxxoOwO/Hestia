import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Trophy, Users } from 'lucide-react';
import { User, Chore } from '../types';
import { useTranslation } from '../i18n';

interface ChoreWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  chores: Chore[];
  onAssignChore?: (choreId: number, userId: number) => Promise<void>;
}

export const ChoreWheelModal: React.FC<ChoreWheelModalProps> = ({
  isOpen,
  onClose,
  users,
  chores,
  onAssignChore
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [targetChore, setTargetChore] = useState<Chore | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Set default chore to pick for
  useEffect(() => {
    if (chores.length > 0 && !targetChore) {
      setTargetChore(chores[0]);
    }
  }, [chores, targetChore]);

  // Draw wheel on canvas
  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas || users.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    const numSegments = users.length;
    const sliceAngle = (2 * Math.PI) / numSegments;

    ctx.clearRect(0, 0, size, size);

    // Save context for rotation
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(angle);

    for (let i = 0; i < numSegments; i++) {
      const user = users[i];
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // Slice background
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = user.avatar_color || '#f97316';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Text label
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 4;
      ctx.fillText(user.display_name, radius - 20, 5);
      ctx.restore();
    }

    ctx.restore();

    // Center pin circle
    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Small star inside center
    ctx.fillStyle = '#fbbf24';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', center, center);
  };

  useEffect(() => {
    if (isOpen) {
      drawWheel(rotationAngle);
    }
  }, [isOpen, rotationAngle, users]);

  const spin = () => {
    if (isSpinning || users.length === 0) return;
    setIsSpinning(true);
    setSelectedUser(null);

    const extraSpins = 5 + Math.random() * 5; // 5-10 full spins
    const totalRotation = extraSpins * 2 * Math.PI;
    const duration = 4000; // ms
    const startTime = performance.now();
    const startAngle = rotationAngle;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + totalRotation * easeOut;

      setRotationAngle(currentAngle);
      drawWheel(currentAngle);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);

        // Calculate winner
        // Arrow is at the top (angle -Math.PI / 2 or 3*PI/2)
        const normalizedAngle = (currentAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const pointerAngle = (3 * Math.PI / 2 - normalizedAngle + 2 * Math.PI) % (2 * Math.PI);
        const sliceAngle = (2 * Math.PI) / users.length;
        const winnerIndex = Math.floor(pointerAngle / sliceAngle) % users.length;
        setSelectedUser(users[winnerIndex]);
      }
    };

    requestAnimationFrame(animate);
  };

  const handleAssign = async () => {
    if (targetChore && selectedUser && onAssignChore) {
      await onAssignChore(targetChore.id, selectedUser.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-200 dark:border-gray-700">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('chores.wheel_modal.title')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('chores.wheel_modal.subtitle')}
          </p>
        </div>

        {/* Target chore selector */}
        {chores.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vyberte úkol k vylosování:
            </label>
            <select
              value={targetChore?.id || ''}
              onChange={(e) => {
                const found = chores.find(c => c.id === Number(e.target.value));
                if (found) setTargetChore(found);
              }}
              className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {chores.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} (+{c.points} b., {c.room})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Wheel Canvas Container with Pointer */}
        <div className="relative flex justify-center items-center my-4">
          {/* Arrow Pointer on Top */}
          <div className="absolute top-0 z-20 -mt-2">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-red-600 drop-shadow-md" />
          </div>

          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="rounded-full shadow-inner"
          />
        </div>

        {/* Result banner if chosen */}
        {selectedUser && (
          <div className="p-3 mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-center animate-in zoom-in-95">
            <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
              {t('chores.wheel_modal.selected_user', { name: selectedUser.display_name })}
            </p>
            {targetChore && onAssignChore && (
              <button
                onClick={handleAssign}
                className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors"
              >
                {t('chores.wheel_modal.assign_to_winner')}
              </button>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-2">
          <button
            onClick={spin}
            disabled={isSpinning || users.length === 0}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-md shadow-orange-500/20 disabled:opacity-50 transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isSpinning ? t('chores.wheel_modal.spinning') : t('chores.wheel_modal.spin_btn')}
          </button>
        </div>

      </div>
    </div>
  );
};
