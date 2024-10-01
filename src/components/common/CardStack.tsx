'use client';

import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import cn from 'classnames';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  cards: ReactElement[]
}

export default function CardStack({ cards, className, ...props }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + cards.length) % cards.length);
  }, [cards.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
  }, [cards.length]);

  const handlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrevious,
    onSwiping: (event) => {
      setDragDistance(event.deltaX);
      setIsDragging(true);
    },
    onSwiped: () => {
      setDragDistance(0);
      setIsDragging(false);
    },
    trackMouse: true,
    trackTouch: true,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

  return (
    <div
      className={cn('relative w-full max-w-md mx-auto', className)}
      role="region"
      aria-label="Card Stack"
      {...props}
    >
      <div
        {...handlers}
        className="relative w-full overflow-hidden"
      >
        {cards.map((card, index) => {
          const offset = (index - currentIndex + cards.length) % cards.length;
          const isCurrentCard = offset === 0;
          const isPreviousCard = offset === cards.length - 1;
          const isNextCard = offset === 1;

          return (
            <div
              key={index}
              className={cn(
                'w-full transition-all duration-300 ease-in-out',
                {
                  'relative': isCurrentCard,
                  'absolute top-0 left-0': !isCurrentCard,
                  'z-30': isCurrentCard,
                  'z-20': isPreviousCard || isNextCard,
                  'z-10': !isCurrentCard && !isPreviousCard && !isNextCard,
                  'opacity-0': offset > 2 && offset < cards.length - 1,
                }
              )}
              style={{
                transform: `
                  translateX(${isCurrentCard ? dragDistance : 0}px)
                  translateY(${offset * 8}px)
                  scale(${1 - offset * 0.05})
                  translateX(${isPreviousCard ? '-100%' : isNextCard ? '100%' : '0%'})
                `,
                opacity: offset <= 2 || offset === cards.length - 1 ? 1 - offset * 0.3 : 0,
                transition: isDragging ? 'none' : undefined,
              }}
            >
              {card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
