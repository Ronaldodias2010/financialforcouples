import React, { useEffect, useState } from 'react';

export const ClientOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    if (isMounted) {
      setMounted(true);
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  if (!mounted) return null;
  return <>{children}</>;
};
