
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface ResidentStatusCardProps {
  label: string;
  count: number;
  bgColor: string;
  textColor: string;
  iconBgColor: string;
  iconColor: string;
  onClick?: () => void;
}

const ResidentStatusCard = ({
  label,
  count,
  bgColor,
  textColor,
  iconBgColor,
  iconColor,
  onClick
}: ResidentStatusCardProps) => {
  return (
    <Card 
      className={`${bgColor} border-transparent cursor-pointer transition-transform hover:scale-105`}
      onClick={onClick}
    >
      <CardContent className="p-4 flex justify-between items-center">
        <div>
          <p className={`text-sm font-medium ${textColor}`}>{label}</p>
          <p className={`text-2xl font-bold ${textColor}`}>{count}</p>
        </div>
        <div className={`h-10 w-10 rounded-full ${iconBgColor} flex items-center justify-center`}>
          <Users className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ResidentStatusCard;
