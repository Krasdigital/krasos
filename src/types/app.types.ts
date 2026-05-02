import { KRAS_MODULES } from '../constants/modules';

export type UserRole = 'owner' | 'admin' | 'manager' | 'member' | 'client';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ModuleName = (typeof KRAS_MODULES)[number]['name'];

export type EntityStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
