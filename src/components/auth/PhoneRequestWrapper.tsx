import { PhoneNumberRequestModal } from './PhoneNumberRequestModal';
import { usePhoneRequest } from '@/hooks/usePhoneRequest';
import { useAuth } from '@/hooks/useAuth';

export const PhoneRequestWrapper = () => {
  const { user } = useAuth();
  const { shouldShow, closeModal } = usePhoneRequest();

  if (!user?.id || !shouldShow) {
    return null;
  }

  return (
    <PhoneNumberRequestModal
      isOpen={shouldShow}
      onClose={closeModal}
      userId={user.id}
    />
  );
};
