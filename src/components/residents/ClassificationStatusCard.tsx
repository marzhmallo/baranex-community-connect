
import React from 'react';
import { Users, User, UserRound, UsersRound, CalendarDays, FileText, ShieldCheck } from 'lucide-react';

interface ClassificationStatusCardProps {
  classification: string;
  count: number;
  totalCount: number;
  onClick: () => void;
  isActive?: boolean;
}

const ClassificationStatusCard: React.FC<ClassificationStatusCardProps> = ({
  classification,
  count,
  totalCount,
  onClick,
  isActive = false,
}) => {
  // Determine which icon to use based on the classification
  const renderIcon = () => {
    switch (classification) {
      case 'Student':
        return <UserRound className="h-6 w-6" />;
      case 'Senior Citizen':
        return <User className="h-6 w-6" />;
      case 'PWD':
        return <ShieldCheck className="h-6 w-6" />;
      case 'Solo Parent':
        return <UsersRound className="h-6 w-6" />;
      case 'Indigent':
        return <User className="h-6 w-6" />;
      case '4Ps':
        return <Users className="h-6 w-6" />;
      default:
        return <User className="h-6 w-6" />;
    }
  };

  // Determine colors based on classification
  const getCardColors = () => {
    switch (classification) {
      case 'Student':
        return {
          bg: 'bg-blue-50',
          iconBg: 'bg-blue-100',
          text: 'text-blue-800',
          icon: 'text-blue-600'
        };
      case 'Senior Citizen':
        return {
          bg: 'bg-purple-50',
          iconBg: 'bg-purple-100',
          text: 'text-purple-800',
          icon: 'text-purple-600'
        };
      case 'PWD':
        return {
          bg: 'bg-green-50',
          iconBg: 'bg-green-100',
          text: 'text-green-800',
          icon: 'text-green-600'
        };
      case 'Solo Parent':
        return {
          bg: 'bg-amber-50',
          iconBg: 'bg-amber-100',
          text: 'text-amber-800',
          icon: 'text-amber-600'
        };
      case 'Indigent':
        return {
          bg: 'bg-red-50',
          iconBg: 'bg-red-100',
          text: 'text-red-800',
          icon: 'text-red-600'
        };
      case '4Ps':
        return {
          bg: 'bg-teal-50',
          iconBg: 'bg-teal-100',
          text: 'text-teal-800',
          icon: 'text-teal-600'
        };
      default:
        return {
          bg: 'bg-gray-50',
          iconBg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: 'text-gray-600'
        };
    }
  };

  const colors = getCardColors();

  return (
    <div
      className={`${colors.bg} ${colors.text} rounded-lg shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={`${colors.iconBg} ${colors.icon} p-2 rounded-md mr-3`}>
          {renderIcon()}
        </div>
        <div>
          <p className="text-sm font-medium">{classification}</p>
          <p className="text-2xl font-bold">{count}</p>
        </div>
      </div>
    </div>
  );
};

export default ClassificationStatusCard;
