import type { User } from '@hh/domain';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: ((user: User) => void) | undefined;
  reason?: string | undefined;
  initialPhone?: string | undefined;
}

export type AuthModalStep = 'phone' | 'otp';
