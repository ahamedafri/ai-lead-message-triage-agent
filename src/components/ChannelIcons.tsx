import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export const WhatsAppIcon: React.FC<IconProps> = ({ className = 'text-emerald-500', size = 20, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.945 9.945 0 0 0 4.81 1.233h.005c5.507 0 10-4.479 10.002-9.986A10.005 10.005 0 0 0 12.012 2zm5.72 13.916c-.244.685-1.2 1.254-1.653 1.304-.45.05-1.02.073-1.652-.128a8.312 8.312 0 0 1-3.614-2.14 9.176 9.176 0 0 1-2.434-3.526 3.653 3.653 0 0 1-.03-2.316c.15-.31.455-.664.71-.973.256-.31.341-.497.512-.828.17-.33.085-.618-.042-.876-.128-.258-1.124-2.709-1.543-3.714-.407-.98-.823-.847-1.124-.863-.285-.015-.611-.018-.938-.018a1.8 1.8 0 0 0-1.307.607c-.456.497-1.737 1.696-1.737 4.136s1.78 4.8 2.022 5.12c.243.32 3.5 5.34 8.477 7.485 1.185.51 2.11.815 2.83 1.043 1.19.38 2.274.325 3.13.197.954-.143 2.923-1.194 3.33-2.344.407-1.15.407-2.137.285-2.344-.122-.206-.455-.33-.954-.588z" />
  </svg>
);

export const InstagramIcon: React.FC<IconProps> = ({ className = 'text-pink-500', size = 20, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export const EmailIcon: React.FC<IconProps> = ({ className = 'text-blue-500', size = 20, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export const WebsiteIcon: React.FC<IconProps> = ({ className = 'text-purple-500', size = 20, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const ChannelIcon: React.FC<{ channel: string; size?: number; className?: string }> = ({
  channel,
  size = 20,
  className
}) => {
  switch (channel.toLowerCase()) {
    case 'whatsapp':
      return <WhatsAppIcon size={size} className={className} />;
    case 'instagram':
      return <InstagramIcon size={size} className={className} />;
    case 'email':
      return <EmailIcon size={size} className={className} />;
    case 'website':
    case 'web':
    default:
      return <WebsiteIcon size={size} className={className} />;
  }
};
