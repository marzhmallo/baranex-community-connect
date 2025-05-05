
import React from 'react';

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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
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
