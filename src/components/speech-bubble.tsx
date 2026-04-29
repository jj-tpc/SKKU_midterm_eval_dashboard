'use client';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Which side the tail points to (where the chatbot is). */
  tail?: 'left' | 'right' | 'bottom' | 'top';
  className?: string;
};

export function SpeechBubble({ children, tail = 'bottom', className = '' }: Props) {
  return (
    <div
      data-component="speech-bubble"
      data-tail={tail}
      className={
        'relative max-w-xl rounded-2xl border-2 border-(--color-ink) bg-(--color-paper) px-5 py-4 ' +
        'text-base text-(--color-ink) ' +
        'shadow-[6px_6px_0_0_var(--color-magenta)] ' +
        className
      }
    >
      {children}
      <span
        aria-hidden="true"
        className={
          tail === 'bottom'
            ? 'absolute -bottom-[7px] left-10 h-3.5 w-3.5 rotate-45 border-b-2 border-r-2 border-(--color-ink) bg-(--color-paper)'
            : tail === 'top'
              ? 'absolute -top-[7px] left-10 h-3.5 w-3.5 rotate-45 border-t-2 border-l-2 border-(--color-ink) bg-(--color-paper)'
              : tail === 'left'
                ? 'absolute -left-[7px] top-1/2 -translate-y-1/2 h-3.5 w-3.5 rotate-45 border-b-2 border-l-2 border-(--color-ink) bg-(--color-paper)'
                : 'absolute -right-[7px] top-1/2 -translate-y-1/2 h-3.5 w-3.5 rotate-45 border-t-2 border-r-2 border-(--color-ink) bg-(--color-paper)'
        }
      />
    </div>
  );
}
