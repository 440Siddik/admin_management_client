// src/main.jsx
import React from 'react'; // React is needed for JSX
import ReactDOM from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import router from './Routes/Routes'; // Your router setup
import { AuthProvider } from './Context/AuthContext'; // <--- IMPORTANT: IMPORT AuthProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* <--- WRAP YOUR APP WITH AuthProvider */}
      {/* Your existing layout div */}
      <div className='max-w-screen-xl mx-auto'>
        <RouterProvider router={router} />
      </div>
    </AuthProvider>
  </React.StrictMode>,
);
