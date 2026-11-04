import { CONFIG } from '../../config';

export interface WhatsAppFloatingButtonProps {
  isHidden?: boolean;
  hasToastOffset?: boolean;
  customMessage?: string;
}

export default function WhatsAppFloatingButton({
  isHidden = false,
  hasToastOffset = false,
  customMessage = 'Hola Bella Forever, me gustaría recibir asesoría sobre sus productos del catálogo.',
}: WhatsAppFloatingButtonProps) {
  const cleanPhone = CONFIG.whatsappNumber.replace(/[^0-9]/g, '') || '573117887806';
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMessage)}`;

  const classNames = [
    'whatsapp-floating-btn',
    isHidden ? 'is-hidden' : '',
    hasToastOffset ? 'has-toast-offset' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Atención al cliente por WhatsApp al 311 788 7806"
      title="Atención al cliente por WhatsApp"
      className={classNames}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.359 4.984L2 22l5.188-1.359c1.453.797 3.109 1.234 4.843 1.234 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.828 14.125c-.25.703-1.438 1.344-2.016 1.422-.531.078-1.203.109-1.938-.125-.453-.141-1.031-.328-1.766-.641-3.109-1.344-5.141-4.469-5.297-4.672-.156-.203-1.266-1.688-1.266-3.219s.797-2.281 1.078-2.594c.281-.312.609-.391.812-.391.203 0 .406.008.578.016.188.008.438-.07.688.531.25.609.859 2.094.938 2.25.078.156.125.344.031.547-.094.203-.141.328-.297.5-.156.172-.328.391-.469.531-.156.156-.312.328-.141.625.172.297.766 1.266 1.641 2.047 1.125 1 2.078 1.312 2.375 1.469.297.156.469.125.641-.078.172-.203.734-.859.938-1.156.203-.297.406-.25.672-.156.266.094 1.703.805 1.984.945.281.141.469.219.547.344.078.125.078.719-.172 1.422z" />
      </svg>
      <span className="whatsapp-floating-btn__label">Asesoría WhatsApp</span>
    </a>
  );
}
