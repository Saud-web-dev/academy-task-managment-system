// import React from 'react';

// /**
//  * SSI PageLoader - Stylish & Next Gen Loading Screen
//  * Modern gradient spinner with animated text
//  */
// const SSIPageLoader = ({ message = "Loading..." }) => {
//   return (
//     <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-card)] to-[var(--bg-primary)]">
//       {/* Animated background gradient */}
//       <div className="absolute inset-0 opacity-30">
//         <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--accent-primary)] rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
//         <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-[var(--success)] rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
//       </div>

//       {/* Content */}
//       <div className="relative z-10 flex flex-col items-center justify-center gap-6">
//         {/* Premium Spinner */}
//         <div className="relative w-20 h-20">
//           {/* Outer rotating ring */}
//           <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--accent-primary)] border-r-[var(--accent-primary)] animate-spin"></div>
          
//           {/* Middle rotating ring (slower) */}
//           <div className="absolute inset-2 rounded-full border-3 border-transparent border-b-[var(--success)] border-l-[var(--success)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
          
//           {/* Inner static circle */}
//           <div className="absolute inset-4 rounded-full border-2 border-[var(--border-color)] bg-gradient-to-br from-[var(--accent-primary)]/10 to-[var(--success)]/10"></div>
          
//           {/* Center dot */}
//           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/50"></div>
//         </div>

//         {/* Loading Text */}
//         <div className="text-center">
//           <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{message}</h3>
//           <div className="flex items-center justify-center gap-1">
//             <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce"></span>
//             <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '0.1s' }}></span>
//             <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '0.2s' }}></span>
//           </div>
//         </div>

//         {/* Additional hint text */}
//         <p className="text-xs text-[var(--text-muted)] mt-2">Please wait...</p>
//       </div>

//       {/* Add animation delay CSS */}
//       <style>{`
//         @keyframes pulse-slow {
//           0%, 100% { opacity: 0.3; }
//           50% { opacity: 0.6; }
//         }
//         .animation-delay-2000 {
//           animation-delay: 2s;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default SSIPageLoader;




import React from 'react';

/**
 * SSI PageLoader - Stylish & Next Gen Loading Screen
 * Modern gradient spinner + animated "SSI" letter reveal
 */
const SSIPageLoader = ({ message = "Loading..." }) => {
  const letters = ['S', 'S', 'I'];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-card)] to-[var(--bg-primary)] overflow-hidden">
      {/* Animated background gradient blobs */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--accent-primary)] rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-[var(--success)] rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Faint grid overlay for a "next gen" tech feel */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8">
        {/* SSI Animated Letters */}
        <div className="relative flex items-center justify-center gap-2 sm:gap-4">
          {/* Glow behind letters */}
          <div className="absolute inset-0 blur-2xl opacity-40 bg-gradient-to-r from-[var(--accent-primary)] via-[var(--success)] to-[var(--accent-primary)] rounded-full scale-150"></div>

          {letters.map((letter, i) => (
            <div
              key={i}
              className="relative"
              style={{
                animation: `ssi-float 2.4s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            >
              {/* Rotating ring hugging each letter */}
              <div
                className="absolute -inset-3 rounded-2xl border border-[var(--border-color)] opacity-40"
                style={{
                  animation: `spin ${4 + i}s linear infinite`,
                }}
              ></div>

              <span
                className="relative text-6xl sm:text-8xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-[var(--accent-primary)] via-[var(--text-primary)] to-[var(--success)] drop-shadow-[0_0_25px_var(--accent-primary)]"
                style={{
                  backgroundSize: '200% 200%',
                  animation: `ssi-shimmer 3s ease-in-out infinite, ssi-float 2.4s ease-in-out infinite`,
                  animationDelay: `0s, ${i * 0.15}s`,
                  fontFamily: "'Segoe UI', system-ui, sans-serif",
                }}
              >
                {letter}
              </span>

              {/* Underline pulse */}
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--success)]"
                style={{
                  animation: 'ssi-underline 2.4s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }}
              ></div>
            </div>
          ))}
        </div>

        {/* Thin progress line */}
        <div className="relative w-48 h-1 rounded-full bg-[var(--border-color)] overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full w-1/3 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--success)]"
            style={{ animation: 'ssi-progress 1.6s ease-in-out infinite' }}
          ></div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{message}</h3>
          <div className="flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce"></span>
            <span
              className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce"
              style={{ animationDelay: '0.1s' }}
            ></span>
            <span
              className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce"
              style={{ animationDelay: '0.2s' }}
            ></span>
          </div>
        </div>

        <p className="text-xs text-[var(--text-muted)] -mt-4">Please wait...</p>
      </div>

      {/* Custom animation keyframes */}
      <style>{`
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        @keyframes ssi-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes ssi-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes ssi-underline {
          0%, 100% { width: 1.5rem; opacity: 0.5; }
          50% { width: 2.5rem; opacity: 1; }
        }
        @keyframes ssi-progress {
          0% { left: -33%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SSIPageLoader;