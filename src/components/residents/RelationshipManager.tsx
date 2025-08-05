import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ExternalLink } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

interface RelationshipManagerProps {
  residentId: string;
  residentName: string;
}

interface HouseholdMember {
  id: string;
  householdid: string;
  residentid: string;
  role: 'Head' | 'Spouse' | 'Child' | 'Other';
  residents: {
    id: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    suffix: string;
    gender: string;
  };
}

interface DerivedRelationship {
  id: string;
  relatedResident: HouseholdMember['residents'];
  relationshipType: string;
}

const RelationshipManager = ({ residentId, residentName }: RelationshipManagerProps) => {
  const navigate = useNavigate();

  // Function to derive relationship type based on roles and gender
  const deriveRelationshipType = (currentRole: string, relatedRole: string, relatedGender: string): string => {
    // If current resident is Head
    if (currentRole === 'Head') {
      if (relatedRole === 'Spouse') return relatedGender === 'Male' ? 'Husband' : 'Wife';
      if (relatedRole === 'Child') return relatedGender === 'Male' ? 'Son' : 'Daughter';
      if (relatedRole === 'Other') return 'Family Member';
    }
    
    // If current resident is Spouse
    if (currentRole === 'Spouse') {
      if (relatedRole === 'Head') return relatedGender === 'Male' ? 'Husband' : 'Wife';
      if (relatedRole === 'Child') return relatedGender === 'Male' ? 'Son' : 'Daughter';
      if (relatedRole === 'Other') return 'Family Member';
    }
    
    // If current resident is Child
    if (currentRole === 'Child') {
      if (relatedRole === 'Head') return relatedGender === 'Male' ? 'Father' : 'Mother';
      if (relatedRole === 'Spouse') return relatedGender === 'Male' ? 'Father' : 'Mother';
      if (relatedRole === 'Child') return relatedGender === 'Male' ? 'Brother' : 'Sister';
      if (relatedRole === 'Other') return 'Family Member';
    }
    
    // If current resident is Other
    if (currentRole === 'Other') {
      if (relatedRole === 'Head') return relatedGender === 'Male' ? 'Male Relative' : 'Female Relative';
      if (relatedRole === 'Spouse') return relatedGender === 'Male' ? 'Male Relative' : 'Female Relative';
      if (relatedRole === 'Child') return relatedGender === 'Male' ? 'Male Relative' : 'Female Relative';
      if (relatedRole === 'Other') return 'Family Member';
    }
    
    return 'Family Member';
  };

  // Fetch household members and derive relationships
  const { data: familyData, isLoading: relationshipsLoading } = useQuery({
    queryKey: ['family-relationships', residentId],
    queryFn: async () => {
      try {
        // Use raw SQL query to get household membership and family relationships
        const { data: familyMembersData, error } = await supabase
          .rpc('sql', {
            query: `
              WITH current_member AS (
                SELECT householdid, role 
                FROM householdmembers 
                WHERE residentid = $1
              )
              SELECT 
                hm.id,
                hm.householdid,
                hm.residentid,
                hm.role,
                r.id as resident_id,
                r.first_name,
                r.middle_name,
                r.last_name,
                r.suffix,
                r.gender,
                cm.role as current_role
              FROM householdmembers hm
              JOIN residents r ON hm.residentid = r.id
              JOIN current_member cm ON hm.householdid = cm.householdid
              WHERE hm.residentid != $1
              AND hm.householdid = cm.householdid
            `,
            args: [residentId]
          });

        if (error) {
          console.error('SQL Error:', error);
          return { currentMember: null, relationships: [] };
        }

        if (!familyMembersData || familyMembersData.length === 0) {
          return { currentMember: null, relationships: [] };
        }

        const currentRole = familyMembersData[0]?.current_role;
        
        // Derive relationships
        const relationships: DerivedRelationship[] = familyMembersData.map((member: any) => ({
          id: member.id,
          relatedResident: {
            id: member.resident_id,
            first_name: member.first_name,
            middle_name: member.middle_name,
            last_name: member.last_name,
            suffix: member.suffix,
            gender: member.gender
          },
          relationshipType: deriveRelationshipType(
            currentRole,
            member.role,
            member.gender || ''
          )
        }));

        return { 
          currentMember: { role: currentRole }, 
          relationships 
        };
      } catch (error) {
        console.error('Error fetching family relationships:', error);
        return { currentMember: null, relationships: [] };
      }
    },
  });

  const handleNavigateToResident = (relatedResidentId: string) => {
    navigate(`/residents/${relatedResidentId}`);
  };

  const getRelationshipColor = (type: string) => {
    const lowercaseType = type.toLowerCase();
    if (['father', 'mother'].includes(lowercaseType)) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (['son', 'daughter'].includes(lowercaseType)) return 'bg-green-100 text-green-800 border-green-200';
    if (['brother', 'sister'].includes(lowercaseType)) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (['husband', 'wife'].includes(lowercaseType)) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const relationships = familyData?.relationships || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Family Relationships
          {familyData?.currentMember && (
            <Badge variant="outline" className="ml-2">
              {familyData.currentMember.role}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {relationshipsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading family relationships...</div>
          </div>
        ) : !familyData?.currentMember ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Not part of any household</h3>
            <p className="mt-1 text-sm text-gray-500">
              This resident is not registered as a member of any household yet.
            </p>
          </div>
        ) : relationships.length > 0 ? (
          <div className="space-y-3">
            {relationships.map((relationship) => (
              <div key={relationship.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className={getRelationshipColor(relationship.relationshipType)}>
                    {relationship.relationshipType}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleNavigateToResident(relationship.relatedResident.id)}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors flex items-center gap-1"
                      >
                        {relationship.relatedResident.first_name} {relationship.relatedResident.middle_name && `${relationship.relatedResident.middle_name} `}{relationship.relatedResident.last_name} {relationship.relatedResident.suffix || ''}
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {residentName}'s {relationship.relationshipType.toLowerCase()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No family members found</h3>
            <p className="mt-1 text-sm text-gray-500">
              This resident is the only member in their household, or other members haven't been registered yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RelationshipManager;