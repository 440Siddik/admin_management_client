// const Footer = () => {
//   return (
//     <div>
//       <footer className="footer footer-horizontal footer-center bg-base-200 text-base-content rounded p-10">
//         <aside>
//           <p className="font-bold">
//             Copyright © {new Date().getFullYear()} - All right reserved by <span className="text-red-600">EFOOTBALL HELP LINE BD & DYNAMIC ZONE ADMIN PANEL</span>

//           </p>
//         <p className="font-extrabold text-green-500">DESIGN & DEVELOPED BY AFRAAZ</p>
//         </aside>
//       </footer>
//     </div>
//   );
// };

// export default Footer;
import React from 'react';

const Footer = () => {
  return (
    // Outer container with gradient background, shadow, and top border
    <footer className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-inner mt-8 py-8 md:py-10">
      <div className="container mx-auto px-4 flex flex-col items-center text-center space-y-4">
        {/* Optional: Add a subtle icon or separator */}
        <div className="w-24 h-1 bg-blue-400 rounded-full mb-2"></div>

        {/* Copyright Information */}
        <p className="text-lg font-semibold leading-relaxed">
          Copyright &copy; {new Date().getFullYear()} - All rights reserved by{' '}
          <span className="text-red-400 font-extrabold">EFOOTBALL HELP LINE BD</span> &amp;{' '}
          <span className="text-red-400 font-extrabold">DYNAMIC ZONE ADMIN PANEL</span>
        </p>

        {/* Developer Credit */}
        <p className="text-sm text-blue-200 font-medium mt-2">
          DESIGN &amp; DEVELOPED BY{' '}
          <span className="font-extrabold text-green-300">AFRAAZ</span>
        </p>

        {/* Optional: Social Media or other links can go here */}
        {/*
        <div className="flex space-x-4 mt-4">
          <a href="#" className="text-blue-200 hover:text-white transition-colors duration-200">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33V22H12c5.523 0 10-4.477 10-10z" clipRule="evenodd" />
            </svg>
          </a>
          <a href="#" className="text-blue-200 hover:text-white transition-colors duration-200">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.001 2.002c-5.523 0-10 4.477-10 10 0 4.418 2.866 8.143 6.839 9.464.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.087.636-1.334-2.22-.253-4.555-1.119-4.555-4.95 0-1.091.39-1.984 1.029-2.682-.103-.253-.446-1.272.098-2.65 0 0 .84-.268 2.75 1.025A9.742 9.742 0 0112.001 6.87c.85 0 1.7.114 2.504.337 1.909-1.293 2.747-1.025 2.747-1.025.546 1.378.202 2.397.099 2.65.64.698 1.028 1.591 1.028 2.682 0 3.841-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.334-.012 2.41-.012 2.743 0 .267.18.577.688.48C19.137 20.146 22 16.421 22 12.002c0-5.523-4.477-10-10-10z" />
            </svg>
          </a>
        </div>
        */}
      </div>
    </footer>
  );
};

export default Footer;
