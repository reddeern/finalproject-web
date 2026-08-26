import { useEffect, useRef, useState } from 'react';

export const useActionMenuPosition = () => {
  const menuRef = useRef(null);
  const [position, setPosition] = useState('bottom');

  useEffect(() => {
    if (!menuRef.current) return;

    const checkPosition = () => {
      const rect = menuRef.current.getBoundingClientRect();
      const menuHeight = menuRef.current.offsetHeight;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < menuHeight + 10 && spaceAbove > menuHeight + 10) {
        setPosition('top');
      } else {
        setPosition('bottom');
      }
    };

    checkPosition();
    window.addEventListener('scroll', checkPosition);
    return () => window.removeEventListener('scroll', checkPosition);
  }, []);

  return { menuRef, position };
};
