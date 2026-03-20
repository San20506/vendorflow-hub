import { getChannelLogo } from '@/utils/channelLogos';

interface ChannelIconProps {
  channelId: string;
  fallbackIcon?: string;
  className?: string;
  size?: number;
}

export function ChannelIcon({ channelId, fallbackIcon, className, size = 20 }: ChannelIconProps) {
  const logo = getChannelLogo(channelId);
  
  if (logo) {
    return (
      <img 
        src={logo} 
        alt={channelId} 
        className={className}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    );
  }
  
  if (fallbackIcon) {
    return <span className={className}>{fallbackIcon}</span>;
  }
  
  return null;
}
