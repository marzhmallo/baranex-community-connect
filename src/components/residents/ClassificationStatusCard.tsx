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
  isActive?: boolean;
}

// Helper function to capitalize the label if it's a direct classification name
const getDisplayLabel = (label: string): string => {
  // Check if the label contains "Residents" - if so, it's a display name not a direct classification
  if (label.includes("Residents")) {
    return label;
  }
  // Otherwise, capitalize the first letter
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const ClassificationStatusCard: React.FC<ClassificationStatusCardProps> = ({
  label,
  count,
  bgColor,
  textColor,
  iconBgColor,
  iconColor,
  onClick,
  isActive = false,
}) => {
  return (
    <div
      className={`${bgColor} ${textColor} rounded-lg shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
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
