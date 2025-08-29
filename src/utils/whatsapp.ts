export const openWhatsApp = (message?: string) => {
  const phoneNumber = "5511988066403";
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const encodedMessage = message ? encodeURIComponent(message) : "";
  const messageParam = encodedMessage ? `&text=${encodedMessage}` : "";
  
  if (isMobile) {
    // Open native WhatsApp app on mobile
    window.open(`whatsapp://send?phone=${phoneNumber}${messageParam}`, '_blank');
  } else {
    // Open WhatsApp Web on desktop
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  }
};