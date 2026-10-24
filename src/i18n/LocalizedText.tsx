import { Text as NativeText } from 'react-native';
import type { TextProps } from 'react-native';
import type { ReactNode } from 'react';
import { useI18n } from '@/i18n/I18nProvider';

export interface LocalizedTextProps extends TextProps {
  raw?: boolean;
}

function localizeChildren(children: ReactNode, t: (source: string) => string): ReactNode {
  if (typeof children === 'string') {
    const trimmed = children.trim();
    if (!trimmed) return children;
    const start = children.indexOf(trimmed);
    const end = start + trimmed.length;
    return `${children.slice(0, start)}${t(trimmed)}${children.slice(end)}`;
  }
  if (Array.isArray(children)) return children.map((child) => localizeChildren(child, t));
  return children;
}

export function Text({ children, raw = false, ...props }: LocalizedTextProps) {
  const { t } = useI18n();
  const localizedChildren = raw ? children : localizeChildren(children, t);
  return <NativeText {...props}>{localizedChildren}</NativeText>;
}
