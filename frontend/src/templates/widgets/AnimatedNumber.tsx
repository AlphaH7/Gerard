/* eslint-disable consistent-return */
import type { ReactElement } from 'react';
import React, { cloneElement, useEffect, useState } from 'react';

interface AnimatedNumberProps {
  children: ReactElement;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ children }) => {
  const finalNumber = parseInt(
    React.Children.only(children).props.children,
    10
  );
  const [currentNumber, setCurrentNumber] = useState(0);

  const animationDuration = 3000; // Total duration in milliseconds
  const frameRate = 16; // Approximate frame rate (60 frames per second)
  const totalFrames = animationDuration / frameRate;
  const incrementPerFrame = finalNumber / totalFrames;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentNumber < finalNumber) {
      timer = setTimeout(() => {
        setCurrentNumber((current) =>
          Math.min(current + incrementPerFrame, finalNumber)
        );
      }, frameRate);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentNumber, finalNumber, incrementPerFrame]);

  return cloneElement(children, {
    ...children.props,
    children: Math.round(currentNumber),
  });
};

export default AnimatedNumber;
