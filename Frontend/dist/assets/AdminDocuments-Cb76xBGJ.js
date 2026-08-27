import{r as e}from"./chunk-QTnfLwEv.js";import{n as t,t as n}from"./jsx-runtime-BWRPWl8p.js";import{t as r}from"./download-CCO41mdx.js";import{a as i,i as a,n as o,t as s}from"./jspdf.es.min-B_pqWIZ3.js";import{t as c}from"./refresh-cw-BPuWnXLx.js";import{t as l}from"./scissors-CzFaR8UP.js";import{t as u}from"./triangle-alert-vlsvs4FP.js";import{t as d}from"./user-x-ChEYUU3K.js";import{t as f}from"./x-BCEeWn1i.js";import{G as p,H as m,L as h,N as g,O as _,P as v,T as y,g as b,i as x,j as S,w as C,x as w}from"./index-BPPzBwnp.js";var T=e(t(),1),E=e(o(),1),D=n(),O={late_arrival:{label:`Late Arrival`,icon:_,cls:`bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20`},absent:{label:`Absent`,icon:d,cls:`bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20`},daily_update_miss:{label:`Update Miss`,icon:S,cls:`bg-purple-500/10 text-purple-500 border-purple-500/20`},deadline_missed:{label:`Deadline Missed`,icon:u,cls:`bg-red-500/10 text-red-500 border-red-500/20`},manual:{label:`Manual`,icon:l,cls:`bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--border-color)]`}},k=e=>e?new Date(e).toLocaleDateString(`en-PK`,{day:`2-digit`,month:`short`,year:`numeric`}):`—`,A=e=>{let t=new Date(e);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}-${String(t.getDate()).padStart(2,`0`)}`},j=({type:e})=>{let t=O[e]||O.manual,n=t.icon;return(0,D.jsxs)(`span`,{className:`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${t.cls}`,children:[(0,D.jsx)(n,{size:10}),t.label]})},M=e=>{let t={},n=[...e].sort((e,t)=>new Date(e.createdAt||e.date)-new Date(t.createdAt||t.date));for(let e of n){let n=`${A(e.date)}__${e.userName}`;t[n]||(t[n]={key:n,date:e.date,dateDisplay:k(e.date),userName:e.userName,userId:e.userId,items:[],totalCut:0,marksBefore:e.marksBefore,marksAfter:e.marksAfter}),t[n].items.push(e),t[n].totalCut=parseFloat((t[n].totalCut+e.marksDeducted).toFixed(2)),t[n].marksAfter=e.marksAfter}return Object.values(t).sort((e,t)=>new Date(t.date)-new Date(e.date))},N=({group:e,onClick:t})=>(0,D.jsxs)(`div`,{onClick:()=>t(e),className:`bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] cursor-pointer hover:border-[var(--accent-primary)]/40 hover:shadow-lg transition-all p-4 space-y-3`,children:[(0,D.jsxs)(`div`,{className:`flex items-start justify-between gap-3`,children:[(0,D.jsxs)(`div`,{children:[(0,D.jsx)(`p`,{className:`text-sm font-bold text-[var(--text-primary)]`,children:e.userName}),(0,D.jsxs)(`p`,{className:`text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5`,children:[(0,D.jsx)(h,{size:11}),e.dateDisplay]})]}),(0,D.jsxs)(`div`,{className:`text-right flex-shrink-0`,children:[(0,D.jsxs)(`p`,{className:`text-lg font-bold text-[var(--danger)]`,children:[`-`,e.totalCut]}),(0,D.jsx)(`p`,{className:`text-[9px] text-[var(--text-muted)] uppercase`,children:`total cut`})]})]}),(0,D.jsx)(`div`,{className:`flex flex-wrap gap-1`,children:e.items.map((e,t)=>(0,D.jsx)(j,{type:e.deductionType},t))}),(0,D.jsxs)(`div`,{className:`flex gap-4 text-xs text-[var(--text-muted)] border-t border-[var(--border-color)] pt-2`,children:[(0,D.jsxs)(`span`,{children:[`Before:`,` `,(0,D.jsx)(`strong`,{className:`text-[var(--text-primary)]`,children:e.marksBefore})]}),(0,D.jsxs)(`span`,{children:[`After:`,` `,(0,D.jsx)(`strong`,{className:`text-[var(--success)]`,children:e.marksAfter})]}),(0,D.jsxs)(`span`,{className:`ml-auto`,children:[e.items.length,` deduction`,e.items.length>1?`s`:``]})]})]}),P=({group:e})=>(0,D.jsxs)(`div`,{style:{backgroundColor:`#ffffff`,color:`#1a1a2e`,fontFamily:`Arial, sans-serif`,padding:`20px`,borderRadius:`8px`,maxWidth:`600px`,margin:`0 auto`},children:[(0,D.jsxs)(`div`,{style:{textAlign:`center`,padding:`16px`,borderBottom:`2px solid #e9ecef`},children:[(0,D.jsx)(`h1`,{style:{fontSize:`18px`,fontWeight:`bold`,margin:0,color:`#1a1a2e`},children:`MARK DEDUCTION RECEIPT`}),(0,D.jsx)(`p`,{style:{fontSize:`12px`,color:`#6c757d`,margin:`4px 0`},children:`Academy Management System`}),(0,D.jsx)(`p`,{style:{fontSize:`11px`,color:`#6c757d`,margin:`4px 0`},children:e.dateDisplay})]}),(0,D.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,padding:`12px 16px`,borderBottom:`1px solid #e9ecef`},children:[(0,D.jsx)(`span`,{style:{fontSize:`11px`,color:`#6c757d`},children:`Employee:`}),(0,D.jsx)(`span`,{style:{fontSize:`11px`,fontWeight:`bold`,color:`#1a1a2e`},children:e.userName})]}),(0,D.jsxs)(`div`,{style:{padding:`12px 16px`},children:[(0,D.jsx)(`p`,{style:{fontSize:`10px`,color:`#6c757d`,textTransform:`uppercase`,letterSpacing:`1px`,fontWeight:`bold`},children:`Deductions`}),e.items.map((e,t)=>(0,D.jsxs)(`div`,{style:{marginTop:`8px`,paddingBottom:`8px`,borderBottom:`1px solid #f0f0f0`},children:[(0,D.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`},children:[(0,D.jsx)(`span`,{style:{fontSize:`10px`,fontWeight:`bold`,color:`#dc3545`,backgroundColor:`rgba(220,53,69,0.1)`,padding:`2px 8px`,borderRadius:`4px`},children:(O[e.deductionType]||O.manual).label}),(0,D.jsxs)(`span`,{style:{fontSize:`11px`,fontWeight:`bold`,color:`#dc3545`},children:[`-`,e.marksDeducted]})]}),(0,D.jsx)(`p`,{style:{fontSize:`10px`,color:`#495057`,margin:`4px 0 0 0`},children:e.reason}),e.attendanceDetails?.arrivalTime&&(0,D.jsxs)(`p`,{style:{fontSize:`9px`,color:`#6c757d`,margin:`2px 0 0 0`},children:[`Arrived: `,e.attendanceDetails.arrivalTime,` · Expected:`,` `,e.attendanceDetails.expectedTime,` · Late:`,` `,e.attendanceDetails.lateByMinutes,` min`]}),e.notes&&(0,D.jsxs)(`p`,{style:{fontSize:`9px`,color:`#6c757d`,fontStyle:`italic`,margin:`2px 0 0 0`},children:[`Note: `,e.notes]})]},t))]}),(0,D.jsxs)(`div`,{style:{padding:`12px 16px`,borderTop:`2px solid #e9ecef`},children:[(0,D.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,fontSize:`11px`},children:[(0,D.jsx)(`span`,{style:{color:`#6c757d`},children:`Marks Before (day start):`}),(0,D.jsx)(`span`,{style:{fontWeight:`bold`,color:`#1a1a2e`},children:e.marksBefore})]}),(0,D.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,fontSize:`11px`,marginTop:`4px`},children:[(0,D.jsx)(`span`,{style:{color:`#6c757d`},children:`Total Deducted:`}),(0,D.jsxs)(`span`,{style:{fontWeight:`bold`,color:`#dc3545`},children:[`-`,e.totalCut]})]}),(0,D.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,fontSize:`12px`,marginTop:`8px`,paddingTop:`8px`,borderTop:`1px solid #e9ecef`},children:[(0,D.jsx)(`span`,{style:{color:`#6c757d`},children:`Marks After:`}),(0,D.jsx)(`span`,{style:{fontWeight:`bold`,color:`#28a745`},children:e.marksAfter})]})]}),(0,D.jsxs)(`div`,{style:{textAlign:`center`,padding:`12px 16px`,fontSize:`9px`,color:`#6c757d`,borderTop:`1px solid #e9ecef`},children:[e.items.length,` deduction(s) · Generated: `,k(new Date)]})]}),F=({group:e,onClose:t,onDeleteItem:n})=>{let r=(0,T.useRef)(null);return e?(0,D.jsx)(`div`,{className:`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm`,onClick:t,children:(0,D.jsxs)(`div`,{className:`bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg shadow-2xl max-h-[95vh] flex flex-col`,onClick:e=>e.stopPropagation(),children:[(0,D.jsxs)(`div`,{className:`bg-[var(--bg-secondary)] rounded-t-2xl px-6 py-4 border-b border-[var(--border-color)] flex-shrink-0`,children:[(0,D.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,D.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,D.jsx)(y,{className:`w-5 h-5 text-[var(--accent-primary)]`}),(0,D.jsxs)(`div`,{children:[(0,D.jsx)(`p`,{className:`text-sm font-bold text-[var(--text-primary)]`,children:`Daily Deduction Receipt`}),(0,D.jsxs)(`p`,{className:`text-xs text-[var(--text-muted)]`,children:[e.dateDisplay,` · `,e.userName]})]})]}),(0,D.jsx)(`button`,{onClick:t,className:`p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)]`,children:(0,D.jsx)(f,{size:16})})]}),(0,D.jsxs)(`div`,{className:`flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--border-color)]`,children:[(0,D.jsxs)(`button`,{onClick:async()=>{try{let t=r.current;if(!t)return;t.classList.add(`exporting`);let n=await(0,E.default)(t,{scale:2,backgroundColor:`#ffffff`,useCORS:!0,logging:!1,onclone:e=>{e.querySelectorAll(`*`).forEach(e=>{let t=window.getComputedStyle(e),n=t.color;n&&n.includes(`oklch`)&&(e.style.color=`#1a1a2e`);let r=t.backgroundColor;r&&r.includes(`oklch`)&&(e.style.backgroundColor=`#ffffff`);let i=t.borderColor;i&&i.includes(`oklch`)&&(e.style.borderColor=`#e9ecef`)})}});t.classList.remove(`exporting`);let i=n.toDataURL(`image/png`),a=new s(`p`,`mm`,`a4`),o=a.internal.pageSize.getWidth(),c=n.height*o/n.width;a.addImage(i,`PNG`,0,0,o,c),a.save(`deduction-receipt-${e.userName}-${e.dateDisplay.replace(/\s/g,`-`)}.pdf`),p.success(`PDF downloaded successfully!`)}catch(e){console.error(`PDF Export Error:`,e),p.error(`Failed to export PDF. Please try again.`)}},className:`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20 text-[var(--danger)] border border-[var(--danger)]/20 rounded-lg text-xs font-medium transition`,children:[(0,D.jsx)(y,{size:14}),`PDF`]}),(0,D.jsxs)(`button`,{onClick:async()=>{try{let t=r.current;if(!t)return;t.classList.add(`exporting`);let n=await(0,E.default)(t,{scale:3,backgroundColor:`#ffffff`,useCORS:!0,logging:!1,onclone:e=>{e.querySelectorAll(`*`).forEach(e=>{let t=window.getComputedStyle(e),n=t.color;n&&n.includes(`oklch`)&&(e.style.color=`#1a1a2e`);let r=t.backgroundColor;r&&r.includes(`oklch`)&&(e.style.backgroundColor=`#ffffff`);let i=t.borderColor;i&&i.includes(`oklch`)&&(e.style.borderColor=`#e9ecef`)})}});t.classList.remove(`exporting`);let i=document.createElement(`a`);i.download=`deduction-receipt-${e.userName}-${e.dateDisplay.replace(/\s/g,`-`)}.png`,i.href=n.toDataURL(`image/png`),i.click(),p.success(`PNG downloaded successfully!`)}catch(e){console.error(`PNG Export Error:`,e),p.error(`Failed to export PNG`)}},className:`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 rounded-lg text-xs font-medium transition`,children:[(0,D.jsx)(i,{size:14}),`PNG`]}),(0,D.jsxs)(`button`,{onClick:async()=>{try{let t=r.current;if(!t)return;t.classList.add(`exporting`);let n=await(0,E.default)(t,{scale:3,backgroundColor:`#ffffff`,useCORS:!0,logging:!1,onclone:e=>{e.querySelectorAll(`*`).forEach(e=>{let t=window.getComputedStyle(e),n=t.color;n&&n.includes(`oklch`)&&(e.style.color=`#1a1a2e`);let r=t.backgroundColor;r&&r.includes(`oklch`)&&(e.style.backgroundColor=`#ffffff`);let i=t.borderColor;i&&i.includes(`oklch`)&&(e.style.borderColor=`#e9ecef`)})}});t.classList.remove(`exporting`);let i=document.createElement(`a`);i.download=`deduction-receipt-${e.userName}-${e.dateDisplay.replace(/\s/g,`-`)}.jpg`,i.href=n.toDataURL(`image/jpeg`,.95),i.click(),p.success(`JPEG downloaded successfully!`)}catch(e){console.error(`JPEG Export Error:`,e),p.error(`Failed to export JPEG`)}},className:`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--success)]/10 hover:bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/20 rounded-lg text-xs font-medium transition`,children:[(0,D.jsx)(i,{size:14}),`JPG`]}),(0,D.jsxs)(`button`,{onClick:()=>{let t=r.current;if(!t)return;let n=window.open(``,`_blank`,`width=800,height=600`);if(!n){p.error(`Please allow popups for printing`);return}t.innerHTML,n.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Deduction Receipt - ${e.userName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              padding: 40px; 
              background: #ffffff; 
              color: #1a1a2e;
            }
            .receipt-print {
              max-width: 600px; 
              margin: 0 auto;
              background: #ffffff;
              border-radius: 8px;
              border: 1px solid #e9ecef;
              overflow: hidden;
            }
            .receipt-header { 
              text-align: center; 
              padding: 20px; 
              border-bottom: 2px solid #e9ecef;
              background: #f8f9fa;
            }
            .receipt-header h1 { 
              font-size: 18px; 
              font-weight: bold; 
              color: #1a1a2e;
              margin: 0;
            }
            .receipt-header p { 
              font-size: 12px; 
              color: #6c757d; 
              margin: 4px 0;
            }
            .receipt-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 10px 16px; 
              border-bottom: 1px solid #e9ecef;
              font-size: 11px;
            }
            .receipt-row .label { color: #6c757d; }
            .receipt-row .value { font-weight: bold; color: #1a1a2e; }
            .deduction-item {
              padding: 10px 16px;
              border-bottom: 1px solid #f0f0f0;
            }
            .deduction-item .badge {
              display: inline-block;
              font-size: 10px;
              font-weight: bold;
              color: #dc3545;
              background: rgba(220,53,69,0.1);
              padding: 2px 8px;
              border-radius: 4px;
            }
            .deduction-item .amount {
              font-size: 11px;
              font-weight: bold;
              color: #dc3545;
            }
            .deduction-item .reason {
              font-size: 10px;
              color: #495057;
              margin-top: 4px;
            }
            .deduction-item .details {
              font-size: 9px;
              color: #6c757d;
              margin-top: 2px;
            }
            .totals-section {
              padding: 12px 16px;
              border-top: 2px solid #e9ecef;
              background: #f8f9fa;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              padding: 4px 0;
            }
            .totals-row .label { color: #6c757d; }
            .totals-row .value { font-weight: bold; }
            .totals-row.total { 
              border-top: 1px solid #e9ecef; 
              padding-top: 8px;
              margin-top: 4px;
              font-size: 12px;
            }
            .receipt-footer {
              text-align: center;
              padding: 12px 16px;
              font-size: 9px;
              color: #6c757d;
              border-top: 1px solid #e9ecef;
            }
            .text-danger { color: #dc3545; }
            .text-success { color: #28a745; }
          </style>
        </head>
        <body>
          <div class="receipt-print">
            <!-- Receipt Header -->
            <div class="receipt-header">
              <h1>MARK DEDUCTION RECEIPT</h1>
              <p>Academy Management System</p>
              <p>${e.dateDisplay}</p>
            </div>

            <!-- Employee -->
            <div class="receipt-row">
              <span class="label">Employee:</span>
              <span class="value">${e.userName}</span>
            </div>

            <!-- Deductions -->
            <div style="padding: 8px 16px;">
              <p style="font-size: 10px; color: #6c757d; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Deductions</p>
              ${e.items.map(e=>`
                <div class="deduction-item">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge">${O[e.deductionType]?.label||`Manual`}</span>
                    <span class="amount">-${e.marksDeducted}</span>
                  </div>
                  <div class="reason">${e.reason}</div>
                  ${e.attendanceDetails?.arrivalTime?`
                    <div class="details">Arrived: ${e.attendanceDetails.arrivalTime} · Expected: ${e.attendanceDetails.expectedTime} · Late: ${e.attendanceDetails.lateByMinutes} min</div>
                  `:``}
                  ${e.notes?`<div class="details">Note: ${e.notes}</div>`:``}
                </div>
              `).join(``)}
            </div>

            <!-- Totals -->
            <div class="totals-section">
              <div class="totals-row">
                <span class="label">Marks Before (day start):</span>
                <span class="value">${e.marksBefore}</span>
              </div>
              <div class="totals-row">
                <span class="label">Total Deducted:</span>
                <span class="value text-danger">-${e.totalCut}</span>
              </div>
              <div class="totals-row total">
                <span class="label">Marks After:</span>
                <span class="value text-success">${e.marksAfter}</span>
              </div>
            </div>

            <!-- Footer -->
            <div class="receipt-footer">
              ${e.items.length} deduction(s) · Generated: ${k(new Date)}
            </div>
          </div>
          <script>
            window.onload = function() { 
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          <\/script>
        </body>
      </html>
    `),n.document.close()},className:`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--text-muted)]/10 hover:bg-[var(--text-muted)]/20 text-[var(--text-muted)] border border-[var(--text-muted)]/20 rounded-lg text-xs font-medium transition`,children:[(0,D.jsx)(a,{size:14}),`Print`]})]})]}),(0,D.jsx)(`div`,{className:`overflow-y-auto flex-1 p-6`,ref:r,children:(0,D.jsx)(P,{group:e})}),(0,D.jsx)(`div`,{className:`px-6 pb-5 flex-shrink-0 flex gap-3`,children:(0,D.jsx)(`button`,{onClick:t,className:`flex-1 px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-lg text-sm font-medium transition hover:bg-[var(--bg-hover)]`,children:`Close`})})]})}):null},I=()=>{let[e,t]=(0,T.useState)([]),[n,i]=(0,T.useState)([]),[a,o]=(0,T.useState)(!0),[s,l]=(0,T.useState)(0),[u,d]=(0,T.useState)(1),[f,h]=(0,T.useState)(1),[_,S]=(0,T.useState)(0),[E,k]=(0,T.useState)(null),[A,j]=(0,T.useState)({search:``,deductionType:`all`,startDate:``,endDate:``}),P=(0,T.useCallback)(async(e=1)=>{o(!0);try{let n={page:e,limit:50};A.search&&(n.search=A.search),A.deductionType!==`all`&&(n.deductionType=A.deductionType),A.startDate&&(n.startDate=A.startDate),A.endDate&&(n.endDate=A.endDate);let r=await m.get(`/score-deductions/all`,{params:n});if(r.data.success){let n=r.data.data||[],a=M(n);t(n),i(a),l(r.data.total||0),h(r.data.totalPages||1),S(r.data.totalDeducted||0),d(e)}}catch{p.error(`Failed to load deductions`)}finally{o(!1)}},[A]);if((0,T.useEffect)(()=>{P(1)},[]),a)return(0,D.jsx)(x,{message:`Loading documents...`});let I=async(e,t)=>{try{await m.delete(`/score-deductions/${e}`),p.success(`Entry deleted and marks restored!`),await P(u),k(null)}catch(e){p.error(e.response?.data?.message||`Delete failed`)}},L=async()=>{try{let e=await m.get(`/score-deductions/all`,{params:{page:1,limit:9999,...A}}),t=M(e.data.data||[]),n=new Blob([JSON.stringify({grouped:t,raw:e.data.data},null,2)],{type:`application/json`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=`deductions-${new Date().toISOString().split(`T`)[0]}.json`,i.click(),URL.revokeObjectURL(r),p.success(`Receipts exported!`)}catch{p.error(`Export failed`)}},R=Object.keys(O).reduce((t,n)=>({...t,[n]:e.filter(e=>e.deductionType===n).length}),{});return(0,D.jsxs)(D.Fragment,{children:[(0,D.jsxs)(`div`,{className:`space-y-6 max-w-7xl mx-auto`,children:[(0,D.jsx)(`div`,{className:`bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] px-6 py-5`,children:(0,D.jsxs)(`div`,{className:`flex items-center justify-between flex-wrap gap-4`,children:[(0,D.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,D.jsx)(`div`,{className:`bg-[var(--accent-primary)]/10 p-2.5 rounded-lg`,children:(0,D.jsx)(y,{className:`w-5 h-5 text-[var(--accent-primary)]`})}),(0,D.jsxs)(`div`,{children:[(0,D.jsx)(`h1`,{className:`text-xl font-semibold text-[var(--text-primary)]`,children:`Deduction Documents`}),(0,D.jsxs)(`p`,{className:`text-sm text-[var(--text-secondary)]`,children:[n.length,` daily receipt`,n.length===1?``:`s`,` · `,s,` total deduction entries`]})]})]}),(0,D.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,D.jsxs)(`button`,{onClick:()=>P(u),className:`inline-flex items-center gap-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] px-4 py-2 rounded-lg text-sm font-medium transition`,children:[(0,D.jsx)(c,{size:16}),` Refresh`]}),(0,D.jsxs)(`button`,{onClick:L,className:`inline-flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-[var(--accent-primary)]/20`,children:[(0,D.jsx)(r,{size:16}),` Export JSON`]})]})]})}),(0,D.jsx)(`div`,{className:`grid grid-cols-2 sm:grid-cols-5 gap-3`,children:Object.entries(O).map(([e,t])=>{let n=t.icon,r=A.deductionType===e;return(0,D.jsxs)(`button`,{onClick:()=>j({...A,deductionType:r?`all`:e}),className:`bg-[var(--bg-card)] rounded-xl border p-3 flex items-center gap-3 transition hover:shadow ${r?`border-[var(--accent-primary)]`:`border-[var(--border-color)]`}`,children:[(0,D.jsx)(`div`,{className:`p-2 rounded-lg flex-shrink-0 ${t.cls}`,children:(0,D.jsx)(n,{size:15})}),(0,D.jsxs)(`div`,{className:`text-left`,children:[(0,D.jsx)(`p`,{className:`text-base font-bold text-[var(--text-primary)]`,children:R[e]||0}),(0,D.jsx)(`p`,{className:`text-[9px] text-[var(--text-muted)] uppercase leading-tight`,children:t.label})]})]},e)})}),(0,D.jsxs)(`div`,{className:`bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] px-6 py-4 flex flex-wrap gap-3 items-center`,children:[(0,D.jsxs)(`div`,{className:`flex items-center gap-2 flex-1 min-w-[180px] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-3 py-2`,children:[(0,D.jsx)(b,{size:14,className:`text-[var(--text-muted)] flex-shrink-0`}),(0,D.jsx)(`input`,{type:`text`,placeholder:`Search by employee name...`,value:A.search,onChange:e=>j({...A,search:e.target.value}),className:`flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]`})]}),(0,D.jsxs)(`select`,{value:A.deductionType,onChange:e=>j({...A,deductionType:e.target.value}),className:`bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none`,children:[(0,D.jsx)(`option`,{value:`all`,children:`All Types`}),Object.entries(O).map(([e,t])=>(0,D.jsx)(`option`,{value:e,children:t.label},e))]}),(0,D.jsx)(`input`,{type:`date`,value:A.startDate,onChange:e=>j({...A,startDate:e.target.value}),className:`bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none`}),(0,D.jsx)(`input`,{type:`date`,value:A.endDate,onChange:e=>j({...A,endDate:e.target.value}),className:`bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none`}),(0,D.jsxs)(`button`,{onClick:()=>P(1),className:`px-4 py-2 bg-[var(--accent-primary)] text-[var(--text-inverse)] rounded-lg text-sm font-medium flex items-center gap-2 transition`,children:[(0,D.jsx)(C,{size:14}),` Apply`]}),(0,D.jsxs)(`span`,{className:`text-xs text-[var(--text-muted)] ml-auto`,children:[`Total deducted:`,` `,(0,D.jsxs)(`strong`,{className:`text-[var(--danger)]`,children:[_,` marks`]})]})]}),a?(0,D.jsx)(`div`,{className:`flex items-center justify-center min-h-[40vh]`,children:(0,D.jsx)(w,{className:`w-8 h-8 text-[var(--accent-primary)] animate-spin`})}):n.length===0?(0,D.jsxs)(`div`,{className:`bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-12 text-center`,children:[(0,D.jsx)(y,{className:`w-12 h-12 text-[var(--text-muted)] mx-auto mb-3`}),(0,D.jsx)(`p`,{className:`text-sm text-[var(--text-secondary)]`,children:`No deduction records found`})]}):(0,D.jsxs)(D.Fragment,{children:[(0,D.jsx)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`,children:n.map(e=>(0,D.jsx)(N,{group:e,onClick:k},e.key))}),f>1&&(0,D.jsxs)(`div`,{className:`flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-4 py-3`,children:[(0,D.jsxs)(`p`,{className:`text-xs text-[var(--text-muted)]`,children:[`Page `,u,` of `,f,` · `,s,` records`]}),(0,D.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,D.jsx)(`button`,{disabled:u<=1,onClick:()=>P(u-1),className:`p-1.5 rounded-lg border border-[var(--border-color)] disabled:opacity-40 hover:bg-[var(--bg-hover)]`,children:(0,D.jsx)(v,{size:16})}),(0,D.jsx)(`button`,{disabled:u>=f,onClick:()=>P(u+1),className:`p-1.5 rounded-lg border border-[var(--border-color)] disabled:opacity-40 hover:bg-[var(--bg-hover)]`,children:(0,D.jsx)(g,{size:16})})]})]})]})]}),E&&(0,D.jsx)(F,{group:E,onClose:()=>k(null),onDeleteItem:I})]})};export{I as default};