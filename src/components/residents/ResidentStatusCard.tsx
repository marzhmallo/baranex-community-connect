
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, User, UserRound, UsersRound, CalendarDays, FileText, ShieldCheck } from "lucide-react";

interface ResidentStatusCardProps {
  status: string;
  count: number;
  totalCount: number;
  onClick?: () => void;
  isActive?: boolean;
}

const ResidentStatusCard = ({
  status,
  count,
  totalCount,
  onClick,
  isActive = false
}: ResidentStatusCardProps) => {
  // Determine which icon to use based on the status
  const renderIcon = () => {
    switch (status) {
      case 'Permanent':
        return <User className="h-5 w-5 text-green-600" />;
      case 'Temporary':
        return <User className="h-5 w-5 text-amber-600" />;
      case 'Deceased':
        return <User className="h-5 w-5 text-red-600" />;
      case 'Relocated':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'All':
        return <Users className="h-5 w-5 text-purple-600" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  // Determine colors based on status
  const getCardColors = () => {
    switch (status) {
      case 'Permanent':
        return {
          bg: 'bg-green-50',
          iconBg: 'bg-green-100',
          text: 'text-green-800'
        };
      case 'Temporary':
        return {
          bg: 'bg-amber-50',
          iconBg: 'bg-amber-100',
          text: 'text-amber-800'
        };
      case 'Deceased':
        return {
          bg: 'bg-red-50',
          iconBg: 'bg-red-100',
          text: 'text-red-800'
        };
      case 'Relocated':
        return {
          bg: 'bg-blue-50',
          iconBg: 'bg-blue-100',
          text: 'text-blue-800'
        };
      case 'All':
        return {
          bg: 'bg-purple-50',
          iconBg: 'bg-purple-100',
          text: 'text-purple-800'
        };
      default:
        return {
          bg: 'bg-gray-50',
          iconBg: 'bg-gray-100',
          text: 'text-gray-800'
        };
    }
  };

  const colors = getCardColors();

  return (
    <Card 
      className={`${colors.bg} border-transparent cursor-pointer transition-transform hover:scale-105 ${
        isActive ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 flex justify-between items-center">
        <div>
          <p className={`text-sm font-medium ${colors.text}`}>{status}</p>
          <p className={`text-2xl font-bold ${colors.text}`}>{count}</p>
        </div>
        <div className={`h-10 w-10 rounded-full ${colors.iconBg} flex items-center justify-center`}>
          {renderIcon()}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResidentStatusCard;
