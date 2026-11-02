export const WHATSAPP_PHONE_DISPLAY = '0794406730';
const WHATSAPP_PHONE_INTERNATIONAL = '255794406730';

export const getWhatsAppUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_PHONE_INTERNATIONAL}?text=${encodeURIComponent(message)}`;
