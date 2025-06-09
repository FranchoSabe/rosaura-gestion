import React from 'react';

const ClientLayout = ({ BACKGROUND_IMAGE_URL, children }) => (
  <div className="min-h-screen bg-cover bg-center text-white relative" style={{ backgroundImage: `url(${BACKGROUND_IMAGE_URL})` }}>
    <div className="absolute inset-0 bg-black bg-opacity-60"></div>
    <div className="relative z-10 flex justify-center items-center min-h-screen px-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  </div>
);

export default ClientLayout; 