export type FamilyRole = 'ADMIN' | 'MEMBER';

export type Member = {
  id: string;
  name: string;
  email: string;
  role: FamilyRole;
  isActive: boolean;
};

export type MembersResponse = {
  me: { id_user: string; role: FamilyRole };
  members: Member[];
};

export type PendingInvite = {
  id: string;
  email: string;
  role: FamilyRole;
  expires_at: string;
};

export type InvitePreview = {
  email: string;
  role: FamilyRole;
  familyName: string;
};
