
import React from 'react';
import { UserIcon } from 'lucide-react';

interface ClassificationStatusCardProps {
  label: string;
  count: number;
  bgColor: string;
  textColor: string;
  iconBgColor: string;
  iconColor: string;
  onClick: () => void;
}

const ClassificationStatusCard: React.FC<ClassificationStatusCardProps> = ({
  label,
  count,
  bgColor,
  textColor,
  iconBgColor,
  iconColor,
  onClick,
}) => {
  return (
    <div
      className={`${bgColor} ${textColor} rounded-lg shadow-sm p-4 cursor-pointer transition-all hover:shadow-md`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={`${iconBgColor} ${iconColor} p-2 rounded-md mr-3`}>
          <UserIcon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold">{count}</p>
        </div>
      </div>
    </div>
  );
};

export default ClassificationStatusCard;
