import { Icon as IconifyIcon, IconProps as IconifyIconProps } from '@iconify/react';
import { cn } from '@/lib/format';

interface Props extends Omit<IconifyIconProps, 'icon'> {
    name: string;
    className?: string;
}

/**
 * Wrapper fino sobre @iconify/react.
 * Uso: <Icon name="mdi:cart-outline" className="h-5 w-5" />
 * Procure ícones em https://icon-sets.iconify.design/
 */
export default function Icon({ name, className, ...rest }: Props) {
    return <IconifyIcon icon={name} className={cn('inline-block shrink-0', className)} {...rest} />;
}
