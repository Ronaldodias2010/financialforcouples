import React from 'react';
import TempApp from './TempApp';
import TempAuth from './TempAuth';

const SimpleRouter: React.FC = () => {
  const currentPath = window.location.pathname;
  
  if (currentPath === '/auth') {
    return <TempAuth />;
  }
  
  return <TempApp />;
};

export default SimpleRouter;