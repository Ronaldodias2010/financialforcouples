import { WhatsAppVerificationModal } from './WhatsAppVerificationModal';
import { useWhatsAppVerification } from '@/hooks/useWhatsAppVerification';
import { useAuth } from '@/hooks/useAuth';

export const WhatsAppVerificationWrapper = () => {
  try {
    const { user } = useAuth();
    const { shouldShowModal, onVerificationSuccess } = useWhatsAppVerification();

    if (!user?.id || !shouldShowModal) {
      return null;
    }

    return (
      <WhatsAppVerificationModal
        isOpen={shouldShowModal}
        onSuccess={onVerificationSuccess}
        userId={user.id}
      />
    );
  } catch (error) {
    console.error('WhatsAppVerificationWrapper error:', error);
    return null;
  }
};
