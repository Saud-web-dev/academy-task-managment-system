import{r as e}from"./chunk-QTnfLwEv.js";import{n as t,t as n}from"./jsx-runtime-BWRPWl8p.js";import{a as r,i,n as a,t as o}from"./jspdf.es.min-B_pqWIZ3.js";import{t as s}from"./scissors-CzFaR8UP.js";import{t as c}from"./triangle-alert-vlsvs4FP.js";import{t as l}from"./user-x-ChEYUU3K.js";import{t as u}from"./x-BCEeWn1i.js";import{G as d,H as f,L as p,N as m,O as h,P as g,T as _,i as v,j as y,x as b}from"./index-BPPzBwnp.js";var x=e(t(),1),S=e(a(),1),C=n(),w={late_arrival:{label:`Late Arrival`,icon:h,cls:`bg-[#f0a500]/10 text-[#f0a500] border-[#f0a500]/20`},absent:{label:`Absent`,icon:l,cls:`bg-[#c0392b]/10 text-[#c0392b] border-[#c0392b]/20`},daily_update_miss:{label:`Update Miss`,icon:y,cls:`bg-purple-500/10 text-purple-500 border-purple-500/20`},deadline_missed:{label:`Deadline Missed`,icon:c,cls:`bg-red-500/10 text-red-600 border-red-500/20`},manual:{label:`Manual Cut`,icon:s,cls:`bg-[#8a7a6a]/10 text-[#8a7a6a] border-[#e5ddd5]`}},T=e=>e?new Date(e).toLocaleDateString(`en-PK`,{day:`2-digit`,month:`short`,year:`numeric`}):`—`,E=e=>{let t=new Date(e);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}-${String(t.getDate()).padStart(2,`0`)}`},D=({type:e})=>{let t=w[e]||w.manual,n=t.icon;return(0,C.jsxs)(`span`,{className:`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${t.cls}`,children:[(0,C.jsx)(n,{size:10}),t.label]})},O=e=>{let t={},n=[...e].sort((e,t)=>new Date(e.createdAt||e.date)-new Date(t.createdAt||t.date));for(let e of n){let n=E(e.date);t[n]||(t[n]={key:n,date:e.date,dateDisplay:T(e.date),items:[],totalCut:0,marksBefore:e.marksBefore,marksAfter:e.marksAfter}),t[n].items.push(e),t[n].totalCut=parseFloat((t[n].totalCut+e.marksDeducted).toFixed(2)),t[n].marksAfter=e.marksAfter}return Object.values(t).sort((e,t)=>new Date(t.date)-new Date(e.date))},k=({group:e,onClick:t})=>(0,C.jsxs)(`div`,{onClick:()=>t(e),className:`bg-[#faf7f3] rounded-2xl border border-[#e5ddd5] p-4 cursor-pointer hover:border-[#2c1810]/30 hover:shadow transition space-y-3`,children:[(0,C.jsxs)(`div`,{className:`flex items-start justify-between gap-3`,children:[(0,C.jsxs)(`div`,{className:`space-y-1`,children:[(0,C.jsxs)(`p`,{className:`text-sm font-bold text-[#2c1810] flex items-center gap-1.5`,children:[(0,C.jsx)(p,{size:13,className:`text-[#8a7a6a]`}),e.dateDisplay]}),(0,C.jsxs)(`p`,{className:`text-[10px] text-[#8a7a6a]`,children:[e.items.length,` deduction`,e.items.length>1?`s`:``]})]}),(0,C.jsxs)(`div`,{className:`text-right flex-shrink-0`,children:[(0,C.jsxs)(`p`,{className:`text-xl font-bold text-[#c0392b]`,children:[`-`,e.totalCut]}),(0,C.jsx)(`p`,{className:`text-[9px] text-[#8a7a6a] uppercase`,children:`marks cut`})]})]}),(0,C.jsx)(`div`,{className:`flex flex-wrap gap-1`,children:e.items.map((e,t)=>(0,C.jsx)(D,{type:e.deductionType},t))}),(0,C.jsxs)(`div`,{className:`flex gap-4 text-xs text-[#8a7a6a] border-t border-[#e5ddd5] pt-2`,children:[(0,C.jsxs)(`span`,{children:[`Before: `,(0,C.jsx)(`strong`,{className:`text-[#2c1810]`,children:e.marksBefore})]}),(0,C.jsxs)(`span`,{children:[`After: `,(0,C.jsx)(`strong`,{className:`text-[#2c1810]`,children:e.marksAfter})]})]})]}),A=({group:e})=>(0,C.jsxs)(`div`,{style:{backgroundColor:`#ffffff`,color:`#2c1810`,fontFamily:`Arial, sans-serif`,padding:`24px`,borderRadius:`12px`,maxWidth:`500px`,margin:`0 auto`,border:`1px solid #e5ddd5`},children:[(0,C.jsxs)(`div`,{style:{textAlign:`center`,padding:`16px`,borderBottom:`2px solid #e5ddd5`},children:[(0,C.jsx)(`h1`,{style:{fontSize:`18px`,fontWeight:`bold`,margin:0,color:`#2c1810`},children:`MARK DEDUCTION RECEIPT`}),(0,C.jsx)(`p`,{style:{fontSize:`12px`,color:`#8a7a6a`,margin:`4px 0`},children:`Academy Management System`}),(0,C.jsx)(`p`,{style:{fontSize:`11px`,color:`#8a7a6a`,margin:`4px 0`},children:e.dateDisplay})]}),(0,C.jsxs)(`div`,{style:{padding:`16px`},children:[(0,C.jsx)(`p`,{style:{fontSize:`10px`,color:`#8a7a6a`,textTransform:`uppercase`,letterSpacing:`1px`,fontWeight:`bold`},children:`Deductions`}),e.items.map((e,t)=>(0,C.jsxs)(`div`,{style:{marginTop:`12px`,paddingBottom:`12px`,borderBottom:`1px solid #f0ebe5`},children:[(0,C.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,C.jsx)(`span`,{style:{fontSize:`10px`,fontWeight:`bold`,color:`#c0392b`,backgroundColor:`rgba(192,57,43,0.1)`,padding:`2px 10px`,borderRadius:`4px`},children:(w[e.deductionType]||w.manual).label}),(0,C.jsxs)(`span`,{style:{fontSize:`12px`,fontWeight:`bold`,color:`#c0392b`},children:[`-`,e.marksDeducted]})]}),(0,C.jsx)(`p`,{style:{fontSize:`11px`,color:`#4a3f38`,margin:`6px 0 0 0`},children:e.reason}),e.attendanceDetails?.arrivalTime&&(0,C.jsxs)(`p`,{style:{fontSize:`9px`,color:`#8a7a6a`,margin:`4px 0 0 0`},children:[`Arrived: `,e.attendanceDetails.arrivalTime,` · Expected:`,` `,e.attendanceDetails.expectedTime,` · Late:`,` `,e.attendanceDetails.lateByMinutes,` min`]}),e.notes&&(0,C.jsxs)(`p`,{style:{fontSize:`9px`,color:`#8a7a6a`,fontStyle:`italic`,margin:`2px 0 0 0`},children:[`Note: `,e.notes]})]},t))]}),(0,C.jsxs)(`div`,{style:{padding:`16px`,borderTop:`2px solid #e5ddd5`},children:[(0,C.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,fontSize:`11px`},children:[(0,C.jsx)(`span`,{style:{color:`#8a7a6a`},children:`Marks Before:`}),(0,C.jsx)(`span`,{style:{fontWeight:`bold`,color:`#2c1810`},children:e.marksBefore})]}),(0,C.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,fontSize:`11px`,marginTop:`4px`},children:[(0,C.jsx)(`span`,{style:{color:`#8a7a6a`},children:`Total Deducted:`}),(0,C.jsxs)(`span`,{style:{fontWeight:`bold`,color:`#c0392b`},children:[`-`,e.totalCut]})]}),(0,C.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,fontSize:`13px`,marginTop:`8px`,paddingTop:`8px`,borderTop:`1px solid #e5ddd5`},children:[(0,C.jsx)(`span`,{style:{color:`#8a7a6a`},children:`Marks After:`}),(0,C.jsx)(`span`,{style:{fontWeight:`bold`,color:`#4CAF50`},children:e.marksAfter})]})]}),(0,C.jsxs)(`div`,{style:{textAlign:`center`,padding:`12px`,fontSize:`9px`,color:`#8a7a6a`,borderTop:`1px solid #e5ddd5`},children:[e.items.length,` deduction(s) · Generated: `,T(new Date)]})]}),j=({group:e,onClose:t})=>{let n=(0,x.useRef)(null);return e?(0,C.jsx)(`div`,{className:`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm`,onClick:t,children:(0,C.jsxs)(`div`,{className:`bg-[#faf7f3] rounded-2xl border border-[#e5ddd5] w-full max-w-md shadow-2xl max-h-[95vh] flex flex-col`,onClick:e=>e.stopPropagation(),children:[(0,C.jsxs)(`div`,{className:`bg-[#f0ebe5] rounded-t-2xl px-6 py-4 border-b border-[#e5ddd5] flex-shrink-0`,children:[(0,C.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,C.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,C.jsx)(_,{className:`w-5 h-5 text-[#2c1810]`}),(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`p`,{className:`text-sm font-bold text-[#2c1810]`,children:`Daily Deduction Receipt`}),(0,C.jsx)(`p`,{className:`text-xs text-[#8a7a6a]`,children:e.dateDisplay})]})]}),(0,C.jsx)(`button`,{onClick:t,className:`p-1.5 rounded-lg hover:bg-[#e8e0d8] text-[#8a7a6a]`,children:(0,C.jsx)(u,{size:16})})]}),(0,C.jsxs)(`div`,{className:`flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#e5ddd5]`,children:[(0,C.jsxs)(`button`,{onClick:async()=>{try{let t=n.current;if(!t)return;d.loading(`Generating PDF...`,{id:`export`});let r=await(0,S.default)(t,{scale:2,backgroundColor:`#ffffff`,useCORS:!0,logging:!1,onclone:e=>{e.querySelectorAll(`*`).forEach(e=>{let t=window.getComputedStyle(e),n=t.color;n&&n.includes(`oklch`)&&(e.style.color=`#2c1810`);let r=t.backgroundColor;r&&r.includes(`oklch`)&&(e.style.backgroundColor=`#ffffff`);let i=t.borderColor;i&&i.includes(`oklch`)&&(e.style.borderColor=`#e5ddd5`)})}}),i=r.toDataURL(`image/png`),a=new o(`p`,`mm`,`a4`),s=a.internal.pageSize.getWidth(),c=r.height*s/r.width;a.addImage(i,`PNG`,0,0,s,c),a.save(`deduction-receipt-${e.dateDisplay.replace(/\s/g,`-`)}.pdf`),d.success(`PDF downloaded successfully!`,{id:`export`})}catch(e){console.error(`PDF Export Error:`,e),d.error(`Failed to export PDF`,{id:`export`})}},className:`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#c0392b]/10 hover:bg-[#c0392b]/20 text-[#c0392b] border border-[#c0392b]/20 rounded-lg text-xs font-medium transition`,children:[(0,C.jsx)(_,{size:14}),`PDF`]}),(0,C.jsxs)(`button`,{onClick:async()=>{try{let t=n.current;if(!t)return;d.loading(`Generating PNG...`,{id:`export`});let r=await(0,S.default)(t,{scale:3,backgroundColor:`#ffffff`,useCORS:!0,logging:!1,onclone:e=>{e.querySelectorAll(`*`).forEach(e=>{let t=window.getComputedStyle(e),n=t.color;n&&n.includes(`oklch`)&&(e.style.color=`#2c1810`);let r=t.backgroundColor;r&&r.includes(`oklch`)&&(e.style.backgroundColor=`#ffffff`);let i=t.borderColor;i&&i.includes(`oklch`)&&(e.style.borderColor=`#e5ddd5`)})}}),i=document.createElement(`a`);i.download=`deduction-receipt-${e.dateDisplay.replace(/\s/g,`-`)}.png`,i.href=r.toDataURL(`image/png`),i.click(),d.success(`PNG downloaded successfully!`,{id:`export`})}catch(e){console.error(`PNG Export Error:`,e),d.error(`Failed to export PNG`,{id:`export`})}},className:`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2c1810]/10 hover:bg-[#2c1810]/20 text-[#2c1810] border border-[#2c1810]/20 rounded-lg text-xs font-medium transition`,children:[(0,C.jsx)(r,{size:14}),`PNG`]}),(0,C.jsxs)(`button`,{onClick:async()=>{try{let t=n.current;if(!t)return;d.loading(`Generating JPEG...`,{id:`export`});let r=await(0,S.default)(t,{scale:3,backgroundColor:`#ffffff`,useCORS:!0,logging:!1,onclone:e=>{e.querySelectorAll(`*`).forEach(e=>{let t=window.getComputedStyle(e),n=t.color;n&&n.includes(`oklch`)&&(e.style.color=`#2c1810`);let r=t.backgroundColor;r&&r.includes(`oklch`)&&(e.style.backgroundColor=`#ffffff`);let i=t.borderColor;i&&i.includes(`oklch`)&&(e.style.borderColor=`#e5ddd5`)})}}),i=document.createElement(`a`);i.download=`deduction-receipt-${e.dateDisplay.replace(/\s/g,`-`)}.jpg`,i.href=r.toDataURL(`image/jpeg`,.95),i.click(),d.success(`JPEG downloaded successfully!`,{id:`export`})}catch(e){console.error(`JPEG Export Error:`,e),d.error(`Failed to export JPEG`,{id:`export`})}},className:`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4CAF50]/10 hover:bg-[#4CAF50]/20 text-[#4CAF50] border border-[#4CAF50]/20 rounded-lg text-xs font-medium transition`,children:[(0,C.jsx)(r,{size:14}),`JPG`]}),(0,C.jsxs)(`button`,{onClick:()=>{let t=n.current;if(!t)return;let r=window.open(``,`_blank`,`width=800,height=600`);if(!r){d.error(`Please allow popups for printing`);return}let i=t.innerHTML;r.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Deduction Receipt - ${e.dateDisplay}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              padding: 40px; 
              background: #ffffff; 
              color: #2c1810;
            }
            .receipt-print {
              max-width: 500px; 
              margin: 0 auto;
              background: #ffffff;
              border-radius: 12px;
              border: 1px solid #e5ddd5;
              overflow: hidden;
            }
            .receipt-header { 
              text-align: center; 
              padding: 20px; 
              border-bottom: 2px solid #e5ddd5;
            }
            .receipt-header h1 { 
              font-size: 18px; 
              font-weight: bold; 
              color: #2c1810;
              margin: 0;
            }
            .receipt-header p { 
              font-size: 12px; 
              color: #8a7a6a; 
              margin: 4px 0;
            }
            .deduction-item {
              padding: 12px 16px;
              border-bottom: 1px solid #f0ebe5;
            }
            .deduction-item .badge {
              display: inline-block;
              font-size: 10px;
              font-weight: bold;
              color: #c0392b;
              background: rgba(192,57,43,0.1);
              padding: 2px 10px;
              border-radius: 4px;
            }
            .deduction-item .amount {
              font-size: 12px;
              font-weight: bold;
              color: #c0392b;
            }
            .deduction-item .reason {
              font-size: 11px;
              color: #4a3f38;
              margin-top: 6px;
            }
            .deduction-item .details {
              font-size: 9px;
              color: #8a7a6a;
              margin-top: 4px;
            }
            .totals-section {
              padding: 16px;
              border-top: 2px solid #e5ddd5;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              padding: 4px 0;
            }
            .totals-row .label { color: #8a7a6a; }
            .totals-row .value { font-weight: bold; color: #2c1810; }
            .totals-row.total { 
              border-top: 1px solid #e5ddd5; 
              padding-top: 8px;
              margin-top: 4px;
              font-size: 13px;
            }
            .totals-row.total .value { color: #4CAF50; }
            .receipt-footer {
              text-align: center;
              padding: 12px;
              font-size: 9px;
              color: #8a7a6a;
              border-top: 1px solid #e5ddd5;
            }
            .text-danger { color: #c0392b; }
            .text-success { color: #4CAF50; }
          </style>
        </head>
        <body>
          <div class="receipt-print">
            ${i}
          </div>
          <script>
            window.onload = function() { 
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          <\/script>
        </body>
      </html>
    `),r.document.close()},className:`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8a7a6a]/10 hover:bg-[#8a7a6a]/20 text-[#8a7a6a] border border-[#8a7a6a]/20 rounded-lg text-xs font-medium transition`,children:[(0,C.jsx)(i,{size:14}),`Print`]})]})]}),(0,C.jsx)(`div`,{className:`overflow-y-auto flex-1 p-6`,ref:n,children:(0,C.jsx)(A,{group:e})}),(0,C.jsx)(`div`,{className:`px-6 pb-5 flex-shrink-0`,children:(0,C.jsx)(`button`,{onClick:t,className:`w-full px-4 py-2.5 bg-[#2c1810] hover:bg-[#4a3f38] text-white rounded-xl text-sm font-semibold transition`,children:`Close`})})]})}):null},M=()=>{let[e,t]=(0,x.useState)([]),[n,r]=(0,x.useState)([]),[i,a]=(0,x.useState)(!0),[o,s]=(0,x.useState)(0),[c,l]=(0,x.useState)(1),[u,p]=(0,x.useState)(1),[h,y]=(0,x.useState)(0),[S,T]=(0,x.useState)(null),[E,D]=(0,x.useState)(null),[A,M]=(0,x.useState)(`all`),N=(0,x.useCallback)(async(e=1)=>{a(!0);try{let n={page:e,limit:100};A!==`all`&&(n.deductionType=A);let i=await f.get(`/score-deductions/my`,{params:n});if(i.data.success){let n=i.data.data||[],a=O(n);t(n),r(a),s(i.data.total||0),l(i.data.totalPages||1),y(i.data.totalDeducted||0),T(i.data.user),p(e)}}catch{d.error(`Failed to load documents`)}finally{a(!1)}},[A]);(0,x.useEffect)(()=>{N(1)},[A]);let P=Object.keys(w).reduce((t,n)=>({...t,[n]:e.filter(e=>e.deductionType===n).length}),{});return i&&e.length===0?(0,C.jsx)(v,{message:`Loading documents...`}):(0,C.jsxs)(C.Fragment,{children:[(0,C.jsxs)(`div`,{className:`space-y-5`,children:[(0,C.jsx)(`div`,{className:`bg-[#faf7f3] rounded-2xl border border-[#e5ddd5] px-6 py-5`,children:(0,C.jsxs)(`div`,{className:`flex items-start justify-between gap-4 flex-wrap`,children:[(0,C.jsxs)(`div`,{children:[(0,C.jsxs)(`h1`,{className:`text-xl font-bold text-[#2c1810] flex items-center gap-2`,children:[(0,C.jsx)(_,{className:`w-6 h-6`}),` My Documents`]}),(0,C.jsxs)(`p`,{className:`text-sm text-[#8a7a6a] mt-0.5`,children:[n.length,` daily receipt`,n.length===1?``:`s`,` `,`· tap to view details`]})]}),S&&(0,C.jsxs)(`div`,{className:`text-right`,children:[(0,C.jsx)(`p`,{className:`text-3xl font-bold text-[#2c1810]`,children:S.marks??0}),(0,C.jsx)(`p`,{className:`text-xs text-[#8a7a6a] uppercase`,children:`current marks`}),(0,C.jsxs)(`p`,{className:`text-sm font-semibold text-[#c0392b] mt-1`,children:[`-`,Number(h).toFixed(1),` total deducted`]})]})]})}),(0,C.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,C.jsxs)(`button`,{onClick:()=>M(`all`),className:`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${A===`all`?`bg-[#2c1810] text-white border-[#2c1810]`:`bg-[#faf7f3] text-[#4a3f38] border-[#e5ddd5] hover:bg-[#f0ebe5]`}`,children:[`All (`,o,`)`]}),Object.entries(w).map(([e,t])=>{let n=t.icon;return(0,C.jsxs)(`button`,{onClick:()=>M(e),className:`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${A===e?`${t.cls} !border-current`:`bg-[#faf7f3] text-[#4a3f38] border-[#e5ddd5] hover:bg-[#f0ebe5]`}`,children:[(0,C.jsx)(n,{size:12}),` `,t.label,` (`,P[e]||0,`)`]},e)})]}),e.length>0&&(0,C.jsx)(`div`,{className:`grid grid-cols-2 sm:grid-cols-5 gap-3`,children:Object.entries(w).map(([t,n])=>{let r=P[t]||0,i=e.filter(e=>e.deductionType===t).reduce((e,t)=>e+t.marksDeducted,0),a=n.icon;return(0,C.jsxs)(`div`,{className:`bg-[#faf7f3] rounded-xl border border-[#e5ddd5] p-3 text-center`,children:[(0,C.jsx)(`div`,{className:`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1 ${n.cls}`,children:(0,C.jsx)(a,{size:16})}),(0,C.jsx)(`p`,{className:`text-lg font-bold text-[#2c1810]`,children:r}),(0,C.jsx)(`p`,{className:`text-[9px] text-[#8a7a6a] uppercase`,children:n.label}),i>0&&(0,C.jsxs)(`p`,{className:`text-xs text-[#c0392b] font-semibold mt-0.5`,children:[`-`,i.toFixed(1)]})]},t)})}),i?(0,C.jsx)(`div`,{className:`flex items-center justify-center min-h-[30vh]`,children:(0,C.jsx)(b,{className:`w-6 h-6 text-[#2c1810] animate-spin`})}):n.length===0?(0,C.jsxs)(`div`,{className:`bg-[#faf7f3] rounded-2xl border border-[#e5ddd5] p-12 text-center`,children:[(0,C.jsx)(_,{className:`w-12 h-12 text-[#d4c8bc] mx-auto mb-3`}),(0,C.jsx)(`p`,{className:`text-sm text-[#8a7a6a]`,children:`No deduction records found`}),(0,C.jsx)(`p`,{className:`text-xs text-[#d4c8bc] mt-1`,children:`Great! You have no mark deductions.`})]}):(0,C.jsxs)(C.Fragment,{children:[(0,C.jsx)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`,children:n.map(e=>(0,C.jsx)(k,{group:e,onClick:D},e.key))}),c>1&&(0,C.jsxs)(`div`,{className:`flex items-center justify-center gap-3`,children:[(0,C.jsx)(`button`,{disabled:u<=1,onClick:()=>N(u-1),className:`p-2 rounded-xl border border-[#e5ddd5] disabled:opacity-40 hover:bg-[#f0ebe5]`,children:(0,C.jsx)(g,{size:16})}),(0,C.jsxs)(`span`,{className:`text-xs text-[#8a7a6a]`,children:[`Page `,u,` of `,c]}),(0,C.jsx)(`button`,{disabled:u>=c,onClick:()=>N(u+1),className:`p-2 rounded-xl border border-[#e5ddd5] disabled:opacity-40 hover:bg-[#f0ebe5]`,children:(0,C.jsx)(m,{size:16})})]})]})]}),E&&(0,C.jsx)(j,{group:E,onClose:()=>D(null)})]})};export{M as default};