import{r as e}from"./chunk-QTnfLwEv.js";import{n as t,t as n}from"./jsx-runtime-BWRPWl8p.js";import{t as r}from"./briefcase-CPBGMINw.js";import{a as i,i as a,n as o,r as s,t as c}from"./square-user-round-bDficFFQ.js";import{t as l}from"./shield-BdYO0iXu.js";import{t as u}from"./x-BCEeWn1i.js";import{F as d,H as f,J as p,K as m,N as h,T as g,U as _,V as v,Y as y,m as b,s as x}from"./index-BPPzBwnp.js";var S=v(`clipboard-list`,[[`rect`,{width:`8`,height:`4`,x:`8`,y:`2`,rx:`1`,ry:`1`,key:`tgr4d6`}],[`path`,{d:`M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2`,key:`116196`}],[`path`,{d:`M12 11h4`,key:`1jrz19`}],[`path`,{d:`M12 16h4`,key:`n85exb`}],[`path`,{d:`M8 11h.01`,key:`1dfujw`}],[`path`,{d:`M8 16h.01`,key:`18s6g9`}]]),C=e(t(),1),w=n(),T=()=>{let e=y(),[t,n]=(0,C.useState)(!1),[v,T]=(0,C.useState)(null),[E,D]=(0,C.useState)(!1),[O,k]=(0,C.useState)(`Employee`),[A,j]=(0,C.useState)(null),[M,N]=(0,C.useState)(``);(0,C.useEffect)(()=>{(async()=>{try{let e=localStorage.getItem(`user`);if(e){let t=JSON.parse(e);t.name&&k(t.name),t.marks!==void 0&&j(t.marks),t.email&&N(t.email)}let t=await _();t&&(t.name&&k(t.name),t.marks!==void 0&&j(t.marks),t.email&&N(t.email))}catch{}})()},[]);let P=async()=>{try{await f.post(`/user/logout`)}catch{}finally{localStorage.removeItem(`token`),localStorage.removeItem(`role`),localStorage.removeItem(`user`),sessionStorage.clear(),e(`/login`,{replace:!0})}},F=[{path:`/layout/desboards`,icon:a,label:`Dashboard`,description:`Overview`},{path:`/layout/attendace`,icon:i,label:`Attendance`,description:`Track presence`},{path:`/layout/taskmanager`,icon:r,label:`Tasks`,description:`Manage tasks`},{path:`/layout/daily-updates`,icon:S,label:`Daily Updates`,description:`Submit daily progress`},{path:`/layout/my-documents`,icon:g,label:`My Documents`,description:`Deduction receipts`}],I=[{path:`/layout/profile`,icon:x,label:`My Profile`},{type:`divider`},{action:`logout`,icon:s,label:`Sign Out`,danger:!0}];return(0,w.jsxs)(`div`,{className:`flex min-h-screen bg-[#f5f0eb] text-[#2c1810] antialiased relative`,children:[t&&(0,w.jsx)(`div`,{className:`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden`,onClick:()=>n(!1)}),(0,w.jsxs)(`aside`,{className:`
        w-[280px] bg-[#faf7f3] border-r border-[#e5ddd5] flex flex-col fixed h-full z-50
        transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${t?`translate-x-0`:`-translate-x-full`}
      `,children:[(0,w.jsxs)(`div`,{className:`p-5 border-b border-[#e5ddd5] flex items-center justify-between lg:justify-start gap-3`,children:[(0,w.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,w.jsxs)(`div`,{className:`relative`,children:[(0,w.jsx)(`div`,{className:`bg-[#2c1810] p-2.5 rounded-xl text-white shadow-lg shadow-[#2c1810]/20`,children:(0,w.jsx)(c,{size:20,className:`relative z-10`})}),(0,w.jsx)(`div`,{className:`absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#4CAF50] rounded-full border-2 border-[#faf7f3] animate-pulse`})]}),(0,w.jsxs)(`div`,{children:[(0,w.jsx)(`h2`,{className:`text-base font-bold tracking-tight text-[#2c1810] leading-none`,children:`Employee`}),(0,w.jsxs)(`p`,{className:`text-[10px] text-[#8a7a6a] font-medium mt-1 tracking-widest uppercase flex items-center gap-1.5`,children:[(0,w.jsx)(b,{size:10}),`Portal`]})]})]}),(0,w.jsx)(`button`,{onClick:()=>n(!1),className:`lg:hidden p-2 rounded-xl text-[#8a7a6a] hover:bg-[#f0ebe5] hover:text-[#2c1810] transition`,children:(0,w.jsx)(u,{size:20})})]}),(0,w.jsxs)(`nav`,{className:`flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar`,children:[(0,w.jsxs)(`div`,{className:`px-3 mb-4`,children:[(0,w.jsx)(`p`,{className:`text-[11px] font-semibold text-[#8a7a6a] uppercase tracking-[0.2em]`,children:`Main Navigation`}),(0,w.jsx)(`div`,{className:`h-px bg-[#e5ddd5] mt-2`})]}),(0,w.jsx)(`ul`,{className:`space-y-1`,children:F.map(e=>(0,w.jsx)(`li`,{children:(0,w.jsxs)(m,{to:e.path,className:({isActive:e})=>`
                    ui-sidebar-item relative flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group
                    ${e?`active bg-[#e8e0d8] text-[#2c1810] border border-[#d4c8bc] shadow-md shadow-[#d4c8bc]/20`:`text-[#4a3f38] hover:text-[#2c1810] hover:bg-[#f0ebe5]`}
                  `,onClick:()=>n(!1),onMouseEnter:()=>T(e.path),onMouseLeave:()=>T(null),children:[(0,w.jsx)(`div`,{className:`
                    p-1.5 rounded-xl transition-all duration-300
                    ${({isActive:e})=>e?`bg-[#2c1810]/10 text-[#2c1810]`:`text-[#8a7a6a] group-hover:text-[#2c1810] group-hover:bg-[#2c1810]/10`}
                  `,children:(0,w.jsx)(e.icon,{size:20,className:`transition-transform group-hover:scale-110`})}),(0,w.jsxs)(`div`,{className:`flex flex-col flex-1`,children:[(0,w.jsx)(`span`,{className:`leading-tight text-sm font-semibold`,children:e.label}),(0,w.jsx)(`span`,{className:`text-[10px] text-[#8a7a6a] group-hover:text-[#4a3f38] transition-colors`,children:e.description})]}),v===e.path&&(0,w.jsx)(h,{size:16,className:`text-[#2c1810] animate-pulse`})]})},e.path))})]}),(0,w.jsx)(`div`,{className:`border-t border-[#e5ddd5] p-4 bg-[#f5f0eb]/50`,children:(0,w.jsxs)(`div`,{className:`relative`,children:[(0,w.jsxs)(`button`,{onClick:()=>D(!E),className:`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#f0ebe5] transition-all duration-200 group`,children:[(0,w.jsxs)(`div`,{className:`relative flex-shrink-0`,children:[(0,w.jsx)(`div`,{className:`w-11 h-11 rounded-full bg-gradient-to-br from-[#2c1810] to-[#4a3f38] flex items-center justify-center text-white text-sm font-bold shadow-md`,children:O.charAt(0)?.toUpperCase()||`E`}),(0,w.jsx)(`div`,{className:`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#4CAF50] rounded-full border-2 border-[#faf7f3] animate-pulse`})]}),(0,w.jsxs)(`div`,{className:`flex-1 min-w-0 text-left`,children:[(0,w.jsx)(`p`,{className:`text-sm font-semibold text-[#2c1810] truncate`,children:O}),(0,w.jsxs)(`p`,{className:`text-xs text-[#8a7a6a] flex items-center gap-1`,children:[(0,w.jsx)(l,{size:11,className:`text-[#8a7a6a] flex-shrink-0`}),(0,w.jsx)(`span`,{className:`truncate`,children:`Employee`})]})]}),(0,w.jsxs)(`div`,{className:`flex items-center gap-2 flex-shrink-0`,children:[A!==null&&(0,w.jsxs)(`div`,{className:`text-right pr-2 border-r border-[#e5ddd5]`,children:[(0,w.jsx)(`p`,{className:`text-sm font-bold text-[#2c1810]`,children:A}),(0,w.jsx)(`p`,{className:`text-[8px] text-[#8a7a6a] uppercase`,children:`marks`})]}),(0,w.jsx)(d,{size:16,className:`text-[#8a7a6a] transition-transform duration-200 ${E?`rotate-180`:``}`})]})]}),E&&(0,w.jsxs)(`div`,{className:`absolute left-0 right-0 bottom-full mb-2 bg-[#faf7f3] border border-[#e5ddd5] rounded-xl shadow-2xl shadow-black/10 py-1 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-hidden`,children:[(0,w.jsx)(`div`,{className:`px-4 py-3 border-b border-[#e5ddd5] bg-[#f5f0eb]`,children:(0,w.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,w.jsx)(`div`,{className:`w-10 h-10 rounded-full bg-gradient-to-br from-[#2c1810] to-[#4a3f38] flex items-center justify-center text-white text-sm font-bold shadow-md`,children:O.charAt(0)?.toUpperCase()||`E`}),(0,w.jsxs)(`div`,{children:[(0,w.jsx)(`p`,{className:`text-sm font-medium text-[#2c1810]`,children:O}),(0,w.jsxs)(`p`,{className:`text-xs text-[#8a7a6a] flex items-center gap-1`,children:[(0,w.jsx)(l,{size:12,className:`text-[#8a7a6a]`}),`Employee`]}),(0,w.jsx)(`p`,{className:`text-[10px] text-[#8a7a6a] truncate max-w-[150px]`,children:M})]})]})}),(0,w.jsx)(`div`,{className:`py-1`,children:I.map((e,t)=>e.type===`divider`?(0,w.jsx)(`div`,{className:`h-px bg-[#e5ddd5] my-1`},`divider-${t}`):e.action===`logout`?(0,w.jsxs)(`button`,{onClick:()=>{D(!1),P()},className:`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#c0392b] hover:bg-[#c0392b]/10 transition-colors`,children:[(0,w.jsx)(s,{size:16}),(0,w.jsx)(`span`,{children:e.label})]},e.label):(0,w.jsxs)(m,{to:e.path,onClick:()=>D(!1),className:({isActive:e})=>`
                          flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                          ${e?`bg-[#e8e0d8] text-[#2c1810]`:`text-[#4a3f38] hover:bg-[#f0ebe5] hover:text-[#2c1810]`}
                        `,children:[(0,w.jsx)(e.icon,{size:16}),(0,w.jsx)(`span`,{children:e.label})]},e.path))})]})]})})]}),(0,w.jsxs)(`div`,{className:`flex-1 flex flex-col lg:pl-[280px] min-w-0`,children:[(0,w.jsxs)(`header`,{className:`bg-[#faf7f3]/90 backdrop-blur-md border-b border-[#e5ddd5] h-[60px] px-4 sm:px-8 flex justify-between items-center sticky top-0 z-20`,children:[(0,w.jsxs)(`div`,{className:`flex items-center gap-4`,children:[(0,w.jsx)(`button`,{onClick:()=>n(!0),className:`p-2 -ml-2 text-[#8a7a6a] hover:bg-[#f0ebe5] rounded-xl lg:hidden transition-all duration-300 hover:scale-105`,children:(0,w.jsx)(o,{size:22})}),(0,w.jsxs)(`div`,{className:`hidden sm:flex items-center gap-3`,children:[(0,w.jsx)(`div`,{className:`w-9 h-9 rounded-xl bg-[#2c1810] flex items-center justify-center text-white text-sm font-bold shadow-md`,children:O.charAt(0)?.toUpperCase()||`E`}),(0,w.jsxs)(`div`,{children:[(0,w.jsxs)(`h1`,{className:`text-sm font-semibold text-[#2c1810]`,children:[`Welcome back, `,O]}),(0,w.jsx)(`p`,{className:`text-[11px] text-[#8a7a6a]`,children:new Date().toLocaleDateString(`en-US`,{weekday:`long`,month:`short`,day:`numeric`})})]})]})]}),(0,w.jsx)(`div`,{className:`flex items-center gap-3`,children:(0,w.jsxs)(`div`,{className:`hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-xl`,children:[(0,w.jsx)(`div`,{className:`w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse`}),(0,w.jsx)(`span`,{className:`text-[11px] text-[#4CAF50] font-medium`,children:`Live`})]})})]}),(0,w.jsx)(`main`,{className:`p-3 sm:p-4 bg-[#f5f0eb] flex-grow min-h-[calc(100vh-60px)] overflow-y-auto custom-scrollbar`,children:(0,w.jsx)(`div`,{className:`max-w-7xl mx-auto`,children:(0,w.jsx)(C.Suspense,{fallback:(0,w.jsx)(`div`,{className:`flex items-center justify-center min-h-[40vh]`,children:(0,w.jsx)(`div`,{className:`w-10 h-10 border-4 border-[#d4c8bc] border-t-[#8b7355] rounded-full animate-spin`})}),children:(0,w.jsx)(p,{})})})})]}),(0,w.jsx)(`style`,{jsx:!0,children:`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d4c8bc;
          border-radius: 8px;
          transition: background 0.2s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #b8a898;
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #d4c8bc transparent;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f5f0eb;
        }
        ::-webkit-scrollbar-thumb {
          background: #d4c8bc;
          border-radius: 10px;
          border: 2px solid #f5f0eb;
          transition: background 0.3s ease;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #b8a898;
        }
        ::-webkit-scrollbar-corner {
          background: #f5f0eb;
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: #d4c8bc #f5f0eb;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes slideInFromBottom {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-in-from-bottom-2 {
          animation: slideInFromBottom 0.2s ease-out;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `})]})};export{T as default};