import { useState, useEffect, useCallback, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CATS_REC = [
  "Salário","Freelance","Investimentos","Aluguel Recebido","Bônus","Reembolso",
  "Pensão Recebida","Venda de Produtos","Comissão","Renda Extra","Dividendos",
  "Aposentadoria","Outros"
];
const CATS_DEP = [
  "Moradia","Alimentação","Transporte","Saúde","Educação","Lazer","Vestuário",
  "Assinaturas","Pets","Beleza e Cuidados","Eletrônicos","Presentes","Impostos",
  "Dívidas","Seguros","Academia","Farmácia","Outros"
];
const FORMAS_REC = ["PIX","Transferência","Depósito","TED","Dinheiro","Automático"];
const FORMAS_DEP = ["Cartão Crédito","Cartão Débito","PIX","Dinheiro","Débito Auto","Boleto","App"];
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const FREQ_OPTS = [
  { id:"mensal",    label:"Todo mês",      icon:"📅" },
  { id:"semanal",   label:"Toda semana",   icon:"📆" },
  { id:"quinzenal", label:"Quinzenal",     icon:"🗓" },
  { id:"anual",     label:"Todo ano",      icon:"📌" },
];

const CAT_COLORS = {
  "Moradia":"#60A5FA","Alimentação":"#FB923C","Transporte":"#A78BFA",
  "Saúde":"#34D399","Educação":"#FBBF24","Lazer":"#F472B6",
  "Vestuário":"#2DD4BF","Assinaturas":"#818CF8","Outros":"#94A3B8",
  "Pets":"#F97316","Beleza e Cuidados":"#E879F9","Eletrônicos":"#38BDF8",
  "Presentes":"#FB7185","Impostos":"#FCD34D","Dívidas":"#F87171",
  "Seguros":"#6EE7B7","Academia":"#67E8F9","Farmácia":"#86EFAC",
  "Salário":"#34D399","Freelance":"#60A5FA","Investimentos":"#FBBF24",
  "Aluguel Recebido":"#A78BFA","Bônus":"#F472B6","Reembolso":"#2DD4BF",
  "Pensão Recebida":"#FCA5A5","Venda de Produtos":"#FDE68A","Comissão":"#6EE7B7",
  "Renda Extra":"#93C5FD","Dividendos":"#C4B5FD","Aposentadoria":"#A7F3D0",
};

const SEED_LANCS = [
  {id:1,tipo:"Receita",data:"2026-02-01",desc:"Salário",cat:"Salário",forma:"Transferência",valor:5000},
  {id:2,tipo:"Receita",data:"2026-02-10",desc:"Freelance Design",cat:"Freelance",forma:"PIX",valor:800},
  {id:3,tipo:"Receita",data:"2026-02-15",desc:"Dividendos",cat:"Dividendos",forma:"Automático",valor:320},
  {id:4,tipo:"Despesa",data:"2026-02-02",desc:"Aluguel",cat:"Moradia",forma:"Débito Auto",valor:1800},
  {id:5,tipo:"Despesa",data:"2026-02-03",desc:"Mercado",cat:"Alimentação",forma:"Cartão Débito",valor:480},
  {id:6,tipo:"Despesa",data:"2026-02-05",desc:"Gasolina",cat:"Transporte",forma:"Dinheiro",valor:130},
  {id:7,tipo:"Despesa",data:"2026-02-07",desc:"Netflix+Spotify",cat:"Assinaturas",forma:"Cartão Crédito",valor:62},
  {id:8,tipo:"Despesa",data:"2026-02-08",desc:"Farmácia",cat:"Farmácia",forma:"Cartão Débito",valor:87},
  {id:9,tipo:"Despesa",data:"2026-02-12",desc:"Restaurante",cat:"Alimentação",forma:"Cartão Crédito",valor:95},
  {id:10,tipo:"Despesa",data:"2026-02-15",desc:"Curso Online",cat:"Educação",forma:"PIX",valor:199},
  {id:11,tipo:"Despesa",data:"2026-02-16",desc:"Academia",cat:"Academia",forma:"Débito Auto",valor:99},
  {id:12,tipo:"Despesa",data:"2026-02-22",desc:"Roupas",cat:"Vestuário",forma:"Cartão Crédito",valor:230},
  {id:13,tipo:"Receita",data:"2026-01-01",desc:"Salário",cat:"Salário",forma:"Transferência",valor:5000},
  {id:14,tipo:"Receita",data:"2026-01-12",desc:"Consultoria",cat:"Freelance",forma:"PIX",valor:1200},
  {id:15,tipo:"Despesa",data:"2026-01-02",desc:"Aluguel",cat:"Moradia",forma:"Débito Auto",valor:1800},
  {id:16,tipo:"Despesa",data:"2026-01-05",desc:"Supermercado",cat:"Alimentação",forma:"Cartão Débito",valor:520},
  {id:17,tipo:"Despesa",data:"2026-01-10",desc:"Internet+Luz",cat:"Moradia",forma:"Boleto",valor:220},
  {id:18,tipo:"Despesa",data:"2026-01-20",desc:"Cinema",cat:"Lazer",forma:"PIX",valor:60},
];

// Recorrentes de exemplo
const SEED_REC = [
  {id:"r1",tipo:"Receita",desc:"Salário Mensal",cat:"Salário",forma:"Transferência",valor:5000,freq:"mensal",dia:15,ativo:true},
  {id:"r2",tipo:"Despesa",desc:"Aluguel",cat:"Moradia",forma:"Débito Auto",valor:1800,freq:"mensal",dia:5,ativo:true},
  {id:"r3",tipo:"Despesa",desc:"Academia",cat:"Academia",forma:"Débito Auto",valor:99,freq:"mensal",dia:1,ativo:true},
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt    = v => "R$ "+Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtK   = v => v>=1000?`R$${(v/1000).toFixed(1).replace(".",",")}k`:`R$${Number(v).toFixed(0)}`;
const getMes = d => d?d.slice(0,7):"";
const fmtD   = d => { try{const[y,m,dd]=d.split("-");return`${dd}/${m}/${y}`;}catch{return d;} };
const today  = () => new Date().toISOString().slice(0,10);
const curMes = () => { const n=new Date(); return`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`; };
const mesLblFull = ma => { try{const[y,m]=ma.split("-");return`${MESES[+m-1]}/${y}`;}catch{return ma;} };

// Gera lançamentos do mês atual a partir dos recorrentes
function gerarRecorrentesDoMes(recorrentes, lancs) {
  const hoje = new Date();
  const mes = curMes();
  const novos = [];
  for (const rec of recorrentes) {
    if (!rec.ativo) continue;
    let dataAlvo = null;
    if (rec.freq === "mensal" || rec.freq === "quinzenal") {
      const dia = Math.min(rec.dia, new Date(hoje.getFullYear(), hoje.getMonth()+1, 0).getDate());
      dataAlvo = `${mes}-${String(dia).padStart(2,"0")}`;
      if (rec.freq === "quinzenal") {
        // dois lançamentos: dia e dia+15
        const dia2 = Math.min(rec.dia+15, new Date(hoje.getFullYear(), hoje.getMonth()+1, 0).getDate());
        const data2 = `${mes}-${String(dia2).padStart(2,"0")}`;
        [dataAlvo, data2].forEach(dt => {
          const jaExiste = lancs.some(l=>l.recId===rec.id && l.data===dt);
          if (!jaExiste) novos.push({id:Date.now()+Math.random(),recId:rec.id,tipo:rec.tipo,desc:rec.desc,cat:rec.cat,forma:rec.forma,valor:rec.valor,data:dt,auto:true});
        });
        continue;
      }
    } else if (rec.freq === "semanal") {
      // gera toda segunda do mês
      const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      while (d.getMonth() === hoje.getMonth()) {
        if (d.getDay() === 1) {
          const dt = d.toISOString().slice(0,10);
          if (!lancs.some(l=>l.recId===rec.id&&l.data===dt))
            novos.push({id:Date.now()+Math.random(),recId:rec.id,tipo:rec.tipo,desc:rec.desc,cat:rec.cat,forma:rec.forma,valor:rec.valor,data:dt,auto:true});
        }
        d.setDate(d.getDate()+1);
      }
      continue;
    } else if (rec.freq === "anual") {
      const ano = hoje.getFullYear();
      dataAlvo = `${ano}-${String(rec.mes||1).padStart(2,"0")}-${String(rec.dia||1).padStart(2,"0")}`;
    }
    if (dataAlvo) {
      const jaExiste = lancs.some(l=>l.recId===rec.id && l.data===dataAlvo);
      if (!jaExiste) novos.push({id:Date.now()+Math.random(),recId:rec.id,tipo:rec.tipo,desc:rec.desc,cat:rec.cat,forma:rec.forma,valor:rec.valor,data:dataAlvo,auto:true});
    }
  }
  return novos;
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const SKEY = "financas_v3";
function loadStorage() {
  try { const v=localStorage.getItem(SKEY); if(v) return JSON.parse(v); } catch {}
  return null;
}
function saveStorage(data) {
  try { localStorage.setItem(SKEY,JSON.stringify(data)); } catch {}
}

// ─── AI ───────────────────────────────────────────────────────────────────────
const AI_SYSTEM = `Você é assistente financeiro pessoal. Responda APENAS JSON válido.
Cats RECEITA: ${CATS_REC.join(", ")}.
Cats DESPESA: ${CATS_DEP.join(", ")}.
Formas: Cartão Crédito,Cartão Débito,PIX,Dinheiro,Débito Auto,Boleto,App,Transferência,TED.
1 lançamento: {"action":"lancamento","tipo":"Despesa","desc":"X","cat":"Y","forma":"PIX","valor":0,"data":"HOJE","confirmacao":"msg emoji"}
Múltiplos: {"action":"multiplos","itens":[{tipo,desc,cat,forma,valor,data}],"confirmacao":"msg"}
Outro: {"action":"conversa","resposta":"msg amigável"}`;

async function callAI(msg, lancs) {
  const mes=curMes(), dm=lancs.filter(l=>l.data?.startsWith(mes));
  const tR=dm.filter(l=>l.tipo==="Receita").reduce((s,l)=>s+l.valor,0);
  const tD=dm.filter(l=>l.tipo==="Despesa").reduce((s,l)=>s+l.valor,0);
  const ctx=`Hoje:${today()} Mês:Rec R$${tR.toFixed(0)},Dep R$${tD.toFixed(0)},Saldo R$${(tR-tD).toFixed(0)}`;
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:500,system:AI_SYSTEM+"\n"+ctx,messages:[{role:"user",content:msg}]})});
  const d=await r.json();
  const raw=d.content?.map(b=>b.text||"").join("").trim()||"{}";
  try{return JSON.parse(raw.replace(/```json|```/g,"").trim());}catch{return{action:"conversa",resposta:"Não entendi 😊"};}
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const G={bg:"#0A0A0F",card:"#111118",card2:"#16161F",border:"#1E1E2A",border2:"#2A2A3A",text:"#F0EEF8",muted:"#6B6880",accent:"#7C6AF7",accentL:"#7C6AF720",green:"#2ECC8E",greenL:"#2ECC8E18",red:"#FF5C6A",redL:"#FF5C6A18",yellow:"#F5C842",blue:"#4A9EFF"};
const NH=62,HH=52;

const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=Figtree:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0A0A0F;color:#F0EEF8;font-family:'Figtree',sans-serif;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased}
  input,select,button,textarea{font-family:inherit;-webkit-appearance:none;appearance:none}
  input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.55)}
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  *{scrollbar-width:none}*::-webkit-scrollbar{display:none}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  @keyframes popIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
  @keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
  @keyframes wavebar{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}
  .press:active{opacity:.7;transform:scale(.97)}
`;

// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────
const Tag=({children,color=G.muted})=>(
  <span style={{display:"inline-flex",alignItems:"center",padding:"1px 8px",borderRadius:20,fontSize:10,fontWeight:600,whiteSpace:"nowrap",background:color+"22",color,border:`1px solid ${color}33`}}>{children}</span>
);

function Sheet({open,onClose,title,children}){
  if(!open)return null;
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end"}}>
      <div style={{width:"100%",maxHeight:"93vh",background:G.card,borderRadius:"22px 22px 0 0",border:`1px solid ${G.border2}`,display:"flex",flexDirection:"column",animation:"slideUp .28s cubic-bezier(.32,.72,0,1)"}}>
        <div style={{display:"flex",justifyContent:"center",paddingTop:10,paddingBottom:2}}><div style={{width:36,height:4,borderRadius:2,background:G.border2}}/></div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 20px 14px"}}>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:700}}>{title}</div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:"none",background:G.card2,color:G.muted,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{overflowY:"auto",padding:"0 20px 32px",flex:1}}>{children}</div>
      </div>
    </div>
  );
}

function Nav({view,setView}){
  const items=[{id:"dashboard",icon:"⬡",l:"Início"},{id:"receitas",icon:"↑",l:"Receitas"},{id:"despesas",icon:"↓",l:"Despesas"},{id:"chat",icon:"✦",l:"IA"}];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:G.card,borderTop:`1px solid ${G.border}`,display:"flex",height:NH}}>
      {items.map(it=>(
        <button key={it.id} onClick={()=>setView(it.id)} className="press" style={{flex:1,padding:"8px 0",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:view===it.id?G.accent:G.muted,position:"relative"}}>
          {view===it.id&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:24,height:2,borderRadius:"0 0 2px 2px",background:G.accent}}/>}
          <span style={{fontSize:22,lineHeight:1}}>{it.icon}</span>
          <span style={{fontSize:10,fontWeight:600}}>{it.l}</span>
        </button>
      ))}
    </div>
  );
}

function Head({view,onRec,onDep}){
  const T={dashboard:"Início",receitas:"Receitas",despesas:"Despesas",chat:"Assistente IA"};
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,zIndex:200,height:HH,background:G.card,borderBottom:`1px solid ${G.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px"}}>
      <div style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:700,letterSpacing:-.5}}>
        fin<span style={{color:G.accent}}>ance</span>
        <span style={{fontFamily:"'Figtree',sans-serif",fontSize:12,fontWeight:400,color:G.muted,marginLeft:8}}>{T[view]}</span>
      </div>
      {view!=="chat"&&<div style={{display:"flex",gap:8}}>
        <button onClick={onRec} className="press" style={{padding:"6px 13px",borderRadius:20,border:`1px solid ${G.green}55`,background:G.greenL,color:G.green,fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Rec</button>
        <button onClick={onDep} className="press" style={{padding:"6px 13px",borderRadius:20,border:`1px solid ${G.red}55`,background:G.redL,color:G.red,fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Dep</button>
      </div>}
    </div>
  );
}

function TxRow({l,onDelete,full}){
  const isR=l.tipo==="Receita",c=isR?G.green:G.red;
  return(
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${G.border}`}}>
      <div style={{width:38,height:38,borderRadius:11,flexShrink:0,background:isR?G.greenL:G.redL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:c,position:"relative"}}>
        {isR?"↑":"↓"}
        {l.auto&&<div style={{position:"absolute",bottom:-2,right:-2,width:12,height:12,borderRadius:"50%",background:G.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7}}>🔄</div>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.desc||l.cat}</div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:G.muted}}>{fmtD(l.data)}</span>
          <Tag color={CAT_COLORS[l.cat]||G.muted}>{l.cat}</Tag>
          {full&&<span style={{fontSize:11,color:G.muted}}>{l.forma}</span>}
          {l.auto&&<Tag color={G.accent}>auto</Tag>}
        </div>
      </div>
      <div style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:700,color:c,flexShrink:0}}>{isR?"+":"-"}{fmtK(l.valor)}</div>
      <button onClick={()=>onDelete(l.id)} style={{background:"none",border:"none",color:G.border2,cursor:"pointer",fontSize:20,padding:"2px 4px",lineHeight:1}}
        onMouseEnter={e=>e.currentTarget.style.color=G.red} onMouseLeave={e=>e.currentTarget.style.color=G.border2}>×</button>
    </div>
  );
}

// ─── RECORRENTES ──────────────────────────────────────────────────────────────
function RecorrentesPanel({tipo, recorrentes, onAdd, onToggle, onDelete}){
  const isR=tipo==="Receita", ac=isR?G.green:G.red;
  const lista=recorrentes.filter(r=>r.tipo===tipo);
  const [open,setOpen]=useState(false);
  const [form,setForm]=useState({desc:"",cat:isR?CATS_REC[0]:CATS_DEP[0],forma:isR?FORMAS_REC[0]:FORMAS_DEP[0],valor:"",freq:"mensal",dia:1,mes:1});

  function salvar(){
    const v=parseFloat(form.valor);
    if(!v||v<=0){return;}
    onAdd({id:"r"+Date.now(),tipo,desc:form.desc,cat:form.cat,forma:form.forma,valor:v,freq:form.freq,dia:+form.dia,mes:+form.mes,ativo:true});
    setForm(f=>({...f,desc:"",valor:""}));
    setOpen(false);
  }

  const inp={width:"100%",padding:"10px 12px",background:G.bg,border:`1px solid ${G.border2}`,borderRadius:10,color:G.text,fontSize:14,outline:"none"};
  const lbl={fontSize:10,fontWeight:600,letterSpacing:.8,textTransform:"uppercase",color:G.muted,display:"block",marginBottom:5};
  const totalMensal=lista.filter(r=>r.ativo&&r.freq==="mensal").reduce((s,r)=>s+r.valor,0);

  return(
    <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:16,overflow:"hidden",marginBottom:16}}>
      {/* Header */}
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${G.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:G.muted,marginBottom:2}}>🔄 {isR?"Ganhos":"Custos"} Recorrentes</div>
          {totalMensal>0&&<div style={{fontSize:12,color:ac,fontFamily:"'Fraunces',serif",fontWeight:700}}>{fmtK(totalMensal)}/mês</div>}
        </div>
        <button onClick={()=>setOpen(v=>!v)} className="press" style={{padding:"7px 14px",borderRadius:20,border:`1px solid ${ac}55`,background:ac+"18",color:ac,fontSize:12,fontWeight:700,cursor:"pointer"}}>
          {open?"Fechar":"+ Novo"}
        </button>
      </div>

      {/* Form novo recorrente */}
      {open&&(
        <div style={{padding:"16px",borderBottom:`1px solid ${G.border}`,background:G.card2,animation:"fadeUp .15s ease"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div>
              <label style={lbl}>Valor (R$)</label>
              <input type="number" inputMode="decimal" placeholder="0,00" value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))} style={inp}/>
            </div>
            <div>
              <label style={lbl}>Categoria</label>
              <select value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))} style={inp}>
                {(isR?CATS_REC:CATS_DEP).map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:10}}>
            <label style={lbl}>Descrição (opcional)</label>
            <input type="text" placeholder={`Ex: ${isR?"Salário mensal":"Plano de saúde"}...`} value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} style={inp}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div>
              <label style={lbl}>Forma</label>
              <select value={form.forma} onChange={e=>setForm(f=>({...f,forma:e.target.value}))} style={inp}>
                {(isR?FORMAS_REC:FORMAS_DEP).map(f=><option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Dia do mês</label>
              <input type="number" min="1" max="31" value={form.dia} onChange={e=>setForm(f=>({...f,dia:e.target.value}))} style={inp}/>
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <label style={lbl}>Frequência</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {FREQ_OPTS.map(f=>(
                <div key={f.id} onClick={()=>setForm(fm=>({...fm,freq:f.id}))} className="press" style={{padding:"7px 13px",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:600,background:form.freq===f.id?ac+"22":G.bg,border:`1px solid ${form.freq===f.id?ac+"88":G.border}`,color:form.freq===f.id?ac:G.muted}}>
                  {f.icon} {f.label}
                </div>
              ))}
            </div>
          </div>
          <button onClick={salvar} className="press" style={{width:"100%",padding:"13px",borderRadius:12,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"inherit",background:ac,color:"#fff"}}>
            Salvar Recorrente
          </button>
        </div>
      )}

      {/* Lista */}
      {lista.length===0?(
        <div style={{padding:"24px 16px",textAlign:"center",color:G.muted,fontSize:13}}>
          Nenhum {isR?"ganho":"custo"} recorrente ainda
        </div>
      ):(
        <div style={{padding:"0 16px"}}>
          {lista.map(r=>(
            <div key={r.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${G.border}`}}>
              <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:r.ativo?(isR?G.greenL:G.redL):G.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
                {FREQ_OPTS.find(f=>f.id===r.freq)?.icon||"📅"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,opacity:r.ativo?1:.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.desc||r.cat}</div>
                <div style={{display:"flex",gap:6,marginTop:2,flexWrap:"wrap"}}>
                  <Tag color={CAT_COLORS[r.cat]||G.muted}>{r.cat}</Tag>
                  <span style={{fontSize:11,color:G.muted}}>{FREQ_OPTS.find(f=>f.id===r.freq)?.label} · dia {r.dia}</span>
                </div>
              </div>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:14,fontWeight:700,color:r.ativo?ac:G.muted,flexShrink:0}}>{fmtK(r.valor)}</div>
              {/* Toggle ativo */}
              <button onClick={()=>onToggle(r.id)} className="press" style={{width:34,height:20,borderRadius:10,border:"none",cursor:"pointer",background:r.ativo?ac:G.border2,position:"relative",flexShrink:0,transition:"background .2s"}}>
                <div style={{position:"absolute",top:2,left:r.ativo?16:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
              </button>
              <button onClick={()=>onDelete(r.id)} style={{background:"none",border:"none",color:G.border2,cursor:"pointer",fontSize:18,padding:"2px",lineHeight:1}}
                onMouseEnter={e=>e.currentTarget.style.color=G.red} onMouseLeave={e=>e.currentTarget.style.color=G.border2}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({lancs,onDelete}){
  const [mes,setMes]=useState(curMes());
  const md=[...new Set(lancs.map(l=>getMes(l.data)))].sort().reverse().slice(0,8);
  if(!md.includes(curMes()))md.unshift(curMes());
  const dm=lancs.filter(l=>getMes(l.data)===mes);
  const tR=dm.filter(l=>l.tipo==="Receita").reduce((s,l)=>s+l.valor,0);
  const tD=dm.filter(l=>l.tipo==="Despesa").reduce((s,l)=>s+l.valor,0);
  const sal=tR-tD,pou=tR>0?sal/tR:0;
  const now=new Date();
  const evo=Array.from({length:6},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);
    const ma=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    return{name:MESES[d.getMonth()],Rec:lancs.filter(l=>l.tipo==="Receita"&&getMes(l.data)===ma).reduce((s,l)=>s+l.valor,0),Dep:lancs.filter(l=>l.tipo==="Despesa"&&getMes(l.data)===ma).reduce((s,l)=>s+l.valor,0)};
  });
  const cats=CATS_DEP.map(c=>({name:c,v:dm.filter(l=>l.tipo==="Despesa"&&l.cat===c).reduce((s,l)=>s+l.valor,0),color:CAT_COLORS[c]||"#94A3B8"})).filter(c=>c.v>0).sort((a,b)=>b.v-a.v);
  return(
    <div style={{paddingBottom:8}}>
      <div style={{background:"linear-gradient(145deg,#14142A,#0d0d1a)",border:`1px solid ${G.border}`,borderRadius:20,padding:"24px 20px 20px",marginBottom:16,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-50,right:-50,width:180,height:180,borderRadius:"50%",background:`radial-gradient(circle,${G.accent}18,transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:1.2,textTransform:"uppercase",color:G.muted,marginBottom:4}}>Saldo do Mês</div>
        <div style={{fontFamily:"'Fraunces',serif",fontSize:38,fontWeight:700,letterSpacing:-2,color:sal>=0?G.green:G.red,marginBottom:16,lineHeight:1}}>{(sal<0?"-":"")+fmt(Math.abs(sal))}</div>
        <div style={{display:"flex"}}>
          {[{l:"Receitas",v:"+"+fmtK(tR),c:G.green},{l:"Despesas",v:"-"+fmtK(tD),c:G.red},{l:"Poupança",v:(pou*100).toFixed(0)+"%",c:G.yellow}].map((k,i)=>(
            <div key={i} style={{flex:1,borderRight:i<2?`1px solid ${G.border}`:"none",paddingRight:i<2?16:0,paddingLeft:i>0?16:0}}>
              <div style={{fontSize:10,color:G.muted,marginBottom:3}}>{k.l}</div>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:17,fontWeight:700,color:k.c}}>{k.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:16,paddingBottom:2}}>
        {md.map(m=><div key={m} onClick={()=>setMes(m)} className="press" style={{padding:"7px 16px",borderRadius:20,cursor:"pointer",flexShrink:0,fontSize:12,fontWeight:600,background:m===mes?G.accentL:G.card2,border:`1px solid ${m===mes?G.accent:G.border}`,color:m===mes?G.accent:G.muted}}>{mesLblFull(m)}</div>)}
      </div>

      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:16,padding:"16px 8px 8px",marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:G.muted,marginBottom:12,paddingLeft:10}}>Evolução Mensal</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={evo} barGap={3} barCategoryGap="28%" margin={{left:-18,right:8}}>
            <XAxis dataKey="name" tick={{fill:G.muted,fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:G.muted,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
            <Tooltip contentStyle={{background:G.card2,border:`1px solid ${G.border2}`,borderRadius:10,fontSize:11}} cursor={{fill:"#ffffff06"}}/>
            <Bar dataKey="Rec" name="Receitas" fill={G.green} radius={[4,4,0,0]} fillOpacity={.85}/>
            <Bar dataKey="Dep" name="Despesas" fill={G.red} radius={[4,4,0,0]} fillOpacity={.85}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {cats.length>0&&<div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:16,padding:16,marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:G.muted,marginBottom:12}}>Por Categoria</div>
        {cats.slice(0,6).map(c=>{
          const pct=tD>0?c.v/tD*100:0;
          return(<div key={c.name} style={{marginBottom:11}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:7,height:7,borderRadius:"50%",background:c.color}}/><span style={{fontSize:13}}>{c.name}</span></div>
              <span style={{fontFamily:"'Fraunces',serif",fontSize:13,fontWeight:700,color:c.color}}>{fmt(c.v)}</span>
            </div>
            <div style={{height:3,background:G.border,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:c.color,borderRadius:3}}/></div>
          </div>);
        })}
      </div>}

      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:16,padding:16}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:G.muted,marginBottom:12}}>Últimos Lançamentos</div>
        {lancs.length===0?<div style={{textAlign:"center",color:G.muted,padding:"24px 0",fontSize:13}}>Sem lançamentos</div>
          :[...lancs].sort((a,b)=>b.data.localeCompare(a.data)).slice(0,7).map(l=><TxRow key={l.id} l={l} onDelete={onDelete}/>)}
      </div>
    </div>
  );
}

// ─── LANÇAMENTOS VIEW ─────────────────────────────────────────────────────────
function LancsView({tipo,lancs,recorrentes,onDelete,onAddRec,onToggleRec,onDeleteRec}){
  const [mf,setMf]=useState(curMes());
  const [cf,setCf]=useState("");
  const [sc,setSc]=useState(false);
  const [tab,setTab]=useState("lancamentos"); // lancamentos | recorrentes
  const isR=tipo==="Receita",ac=isR?G.green:G.red,cats=isR?CATS_REC:CATS_DEP;
  const todos=lancs.filter(l=>l.tipo===tipo);
  const meses=[...new Set(todos.map(l=>getMes(l.data)))].sort().reverse();
  let data=todos;
  if(mf)data=data.filter(l=>getMes(l.data)===mf);
  if(cf)data=data.filter(l=>l.cat===cf);
  data=[...data].sort((a,b)=>b.data.localeCompare(a.data));
  const mt=todos.filter(l=>getMes(l.data)===curMes()).reduce((s,l)=>s+l.valor,0);
  const at=todos.filter(l=>l.data.startsWith(new Date().getFullYear())).reduce((s,l)=>s+l.valor,0);
  const recAtivos=recorrentes.filter(r=>r.tipo===tipo&&r.ativo).length;

  return(
    <div style={{paddingBottom:8}}>
      {/* KPIs */}
      <div style={{display:"flex",gap:10,overflowX:"auto",marginBottom:16,paddingBottom:2}}>
        {[{l:"Mês atual",v:fmtK(mt),c:ac},{l:`Ano ${new Date().getFullYear()}`,v:fmtK(at),c:G.blue},{l:"Registros",v:String(todos.length),c:G.yellow},{l:"Recorrentes",v:String(recAtivos),c:G.accent}].map((k,i)=>(
          <div key={i} style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:14,padding:"14px 18px",flexShrink:0,minWidth:120,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.c}}/>
            <div style={{fontSize:10,color:G.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{k.l}</div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:700,color:k.c}}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,marginBottom:16,background:G.card2,borderRadius:12,padding:4}}>
        {[{id:"lancamentos",label:"📋 Lançamentos"},{id:"recorrentes",label:"🔄 Recorrentes"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"9px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:13,background:tab===t.id?G.card:G.card2,color:tab===t.id?G.text:G.muted,transition:"all .15s"}}>
            {t.label}
          </button>
        ))}
      </div>

      {tab==="recorrentes"?(
        <RecorrentesPanel tipo={tipo} recorrentes={recorrentes} onAdd={onAddRec} onToggle={onToggleRec} onDelete={onDeleteRec}/>
      ):(
        <>
          {/* Filtro mês */}
          <div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:10,paddingBottom:2}}>
            <div onClick={()=>setMf("")} className="press" style={{padding:"7px 14px",borderRadius:20,cursor:"pointer",flexShrink:0,fontSize:12,fontWeight:600,background:!mf?G.accentL:G.card2,border:`1px solid ${!mf?G.accent:G.border}`,color:!mf?G.accent:G.muted}}>Todos</div>
            {meses.map(m=><div key={m} onClick={()=>setMf(mf===m?"":m)} className="press" style={{padding:"7px 14px",borderRadius:20,cursor:"pointer",flexShrink:0,fontSize:12,fontWeight:600,background:mf===m?G.accentL:G.card2,border:`1px solid ${mf===m?G.accent:G.border}`,color:mf===m?G.accent:G.muted}}>{mesLblFull(m)}</div>)}
          </div>

          {/* Filtro categoria */}
          <div style={{marginBottom:14}}>
            <div onClick={()=>setSc(v=>!v)} className="press" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:600,background:cf?ac+"22":G.card2,border:`1px solid ${cf?ac+"88":G.border}`,color:cf?ac:G.muted,marginBottom:sc?10:0}}>
              {cf||"Categoria"} {sc?"▴":"▾"}
            </div>
            {sc&&<div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
              <div onClick={()=>{setCf("");setSc(false);}} className="press" style={{padding:"6px 14px",borderRadius:20,cursor:"pointer",flexShrink:0,fontSize:12,fontWeight:600,background:!cf?G.accentL:G.card2,border:`1px solid ${!cf?G.accent:G.border}`,color:!cf?G.accent:G.muted}}>Todas</div>
              {cats.map(c=><div key={c} onClick={()=>{setCf(cf===c?"":c);setSc(false);}} className="press" style={{padding:"6px 14px",borderRadius:20,cursor:"pointer",flexShrink:0,fontSize:12,fontWeight:600,background:cf===c?(CAT_COLORS[c]||ac)+"22":G.card2,border:`1px solid ${cf===c?(CAT_COLORS[c]||ac)+"88":G.border}`,color:cf===c?(CAT_COLORS[c]||ac):G.muted}}>{c}</div>)}
            </div>}
          </div>

          {/* Lista */}
          <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:16,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${G.border}`}}>
              <span style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:G.muted}}>{data.length} registro{data.length!==1?"s":""}</span>
              <span style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:700,color:ac}}>{isR?"+":"-"}{fmtK(data.reduce((s,l)=>s+l.valor,0))}</span>
            </div>
            {data.length===0?<div style={{textAlign:"center",padding:"48px 20px",color:G.muted}}><div style={{fontSize:40,marginBottom:10}}>{isR?"💰":"💸"}</div><div style={{fontSize:14}}>Nenhum lançamento</div></div>
              :<div style={{padding:"0 16px"}}>{data.map(l=><TxRow key={l.id} l={l} onDelete={onDelete} full/>)}</div>}
          </div>
        </>
      )}
    </div>
  );
}

// ─── FORM LANÇAMENTO ──────────────────────────────────────────────────────────
function LancForm({tipo,setTipo,form,setForm,onSave}){
  const sw=t=>{setTipo(t);setForm(f=>({...f,cat:t==="Receita"?CATS_REC[0]:CATS_DEP[0],forma:t==="Receita"?FORMAS_REC[0]:FORMAS_DEP[0]}));};
  const ac=tipo==="Receita"?G.green:G.red;
  const inp={width:"100%",padding:"12px 14px",background:G.card2,border:`1px solid ${G.border2}`,borderRadius:12,color:G.text,fontSize:15,outline:"none"};
  const lbl={display:"block",fontSize:11,fontWeight:600,letterSpacing:.8,textTransform:"uppercase",color:G.muted,marginBottom:6};
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {["Receita","Despesa"].map(t=><button key={t} onClick={()=>sw(t)} className="press" style={{flex:1,padding:"12px",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"inherit",background:tipo===t?(t==="Receita"?G.greenL:G.redL):G.card2,color:tipo===t?(t==="Receita"?G.green:G.red):G.muted,border:`1px solid ${tipo===t?(t==="Receita"?G.green+"66":G.red+"66"):G.border}`}}>{t==="Receita"?"↑ Receita":"↓ Despesa"}</button>)}
      </div>
      <div style={{textAlign:"center",marginBottom:20}}>
        <label style={{...lbl,textAlign:"center",marginBottom:8}}>Valor (R$)</label>
        <input type="number" inputMode="decimal" placeholder="0,00" min="0" step="0.01" value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))} style={{...inp,textAlign:"center",fontFamily:"'Fraunces',serif",fontSize:36,fontWeight:700,color:ac,background:"transparent",border:"none",borderBottom:`2px solid ${ac}`,borderRadius:0,padding:"4px 0 10px"}}/>
      </div>
      <div style={{marginBottom:14}}>
        <label style={lbl}>Descrição <span style={{color:G.muted,fontWeight:400,textTransform:"none",letterSpacing:0,fontSize:11}}>(opcional)</span></label>
        <input type="text" placeholder="Ex: Salário, Mercado, Uber..." value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} style={inp}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div><label style={lbl}>Data</label><input type="date" value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))} style={inp}/></div>
        <div><label style={lbl}>Categoria</label>
          <select value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))} style={inp}>
            {(tipo==="Receita"?CATS_REC:CATS_DEP).map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div style={{marginBottom:24}}>
        <label style={lbl}>Forma de Pagamento</label>
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
          {(tipo==="Receita"?FORMAS_REC:FORMAS_DEP).map(f=><div key={f} onClick={()=>setForm(fm=>({...fm,forma:f}))} className="press" style={{padding:"8px 14px",borderRadius:20,cursor:"pointer",flexShrink:0,fontSize:12,fontWeight:600,background:form.forma===f?ac+"22":G.card2,border:`1px solid ${form.forma===f?ac+"88":G.border}`,color:form.forma===f?ac:G.muted}}>{f}</div>)}
        </div>
      </div>
      <button onClick={onSave} className="press" style={{width:"100%",padding:"16px",borderRadius:14,border:"none",cursor:"pointer",fontWeight:700,fontSize:16,fontFamily:"inherit",background:ac,color:"#fff"}}>Salvar {tipo}</button>
    </div>
  );
}

// ─── CHAT VIEW ────────────────────────────────────────────────────────────────
function ChatView({lancs,onAddLanc}){
  const SUGS=["Gastei 45 no Uber","Paguei 380 no mercado","Recebi salário de 5000","Quanto gastei esse mês?"];
  const [msgs,setMsgs]=useState([{id:0,from:"ai",ts:new Date(),text:"Oi! 👋 Me fale qualquer gasto ou receita.\n\nDigite normalmente ou grave um áudio!\n\nExemplos:\n• \"Gastei 45 no Uber agora\"\n• \"Recebi salário de 5 mil\"\n• \"Paguei 380 no mercado com débito\""}]);
  const [input,setInput]=useState("");
  const [busy,setBusy]=useState(false);
  const [pending,setPending]=useState(null);
  const [recSt,setRecSt]=useState("idle");
  const [recSec,setRecSec]=useState(0);
  const [recErr,setRecErr]=useState("");
  const botRef=useRef(),inpRef=useRef(),mrRef=useRef(null),chkRef=useRef([]),tmrRef=useRef(null);

  useEffect(()=>{botRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const push=(from,text,ex={})=>setMsgs(p=>[...p,{id:Date.now()+Math.random(),from,text,ts:new Date(),...ex}]);

  async function startRec(){
    setRecErr("");setRecSt("ask");
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      chkRef.current=[];
      const mime=["audio/webm;codecs=opus","audio/webm","audio/ogg","audio/mp4"].find(m=>MediaRecorder.isTypeSupported(m))||"";
      const mr=new MediaRecorder(stream,mime?{mimeType:mime}:{});
      mr.ondataavailable=e=>{if(e.data?.size>0)chkRef.current.push(e.data);};
      mr.onstop=()=>{stream.getTracks().forEach(t=>t.stop());processBlob(new Blob(chkRef.current,{type:mr.mimeType||"audio/webm"}));};
      mr.start(200);mrRef.current=mr;setRecSt("rec");setRecSec(0);
      tmrRef.current=setInterval(()=>setRecSec(s=>s+1),1000);
    }catch(e){
      setRecSt("idle");
      setRecErr(e.name==="NotAllowedError"?"Microfone bloqueado — libere nas configurações do navegador.":"Erro ao acessar microfone.");
    }
  }
  function stopRec(){clearInterval(tmrRef.current);setRecSt("proc");if(mrRef.current?.state==="recording")mrRef.current.stop();}
  function cancelRec(){clearInterval(tmrRef.current);if(mrRef.current?.state==="recording"){mrRef.current.onstop=null;mrRef.current.stop();}chkRef.current=[];setRecSt("idle");setRecSec(0);}

  async function processBlob(blob){
  try{
    push("ai","🎤 Transcrevendo áudio...");

    const formData = new FormData();
    formData.append("audio", blob, "audio.webm");

    const res = await fetch("http://localhost:3001/transcribe", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if(!data.text){
      push("ai","❌ Erro ao transcrever.");
      return;
    }

    push("user", data.text);

    // envia texto para IA normal
    await send(data.text);

  }catch(err){
    push("ai","❌ Erro ao enviar áudio.");
  }
}

  async function send(txt){
    const msg=(txt||input).trim();if(!msg||busy)return;
    setInput("");if(inpRef.current)inpRef.current.style.height="auto";
    push("user",msg);setBusy(true);setPending(null);
    try{
      const r=await callAI(msg,lancs);
      if(r.action==="lancamento"){push("ai",r.confirmacao||"Entendido!",{lanc:r});setPending(r);}
      else if(r.action==="multiplos"){
        push("ai",`${r.confirmacao}\n\n${r.itens.map(i=>`• ${i.tipo==="Receita"?"↑":"↓"} ${i.desc||i.cat} — R$${Number(i.valor).toFixed(2)}`).join("\n")}`,{multi:r.itens});
        setPending({action:"multiplos",itens:r.itens});
      }else push("ai",r.resposta||"Não entendi 😊");
    }catch{push("ai","Problema de conexão 🔌");}
    setBusy(false);
  }

  function confirmar(){
    if(!pending)return;
    if(pending.action==="multiplos"){pending.itens.forEach(i=>onAddLanc({tipo:i.tipo,desc:i.desc,cat:i.cat,forma:i.forma||"PIX",valor:i.valor,data:i.data||today()}));push("ai",`✅ ${pending.itens.length} lançamentos salvos!`);}
    else{onAddLanc({tipo:pending.tipo,desc:pending.desc,cat:pending.cat,forma:pending.forma||"PIX",valor:pending.valor,data:pending.data||today()});push("ai","✅ Salvo! 🚀");}
    setPending(null);
  }

  const fmtS=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const isRec=recSt==="rec",isProc=recSt==="proc"||recSt==="ask";

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
        {msgs.map(m=>(
          <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:m.from==="user"?"flex-end":"flex-start",animation:"fadeUp .18s ease"}}>
            <div style={{maxWidth:"84%",padding:"10px 14px",borderRadius:m.from==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",background:m.from==="user"?G.accent:G.card2,border:m.from==="ai"?`1px solid ${G.border2}`:"none",fontSize:14,lineHeight:1.55,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{m.text}</div>
            {m.lanc&&(
              <div style={{marginTop:6,maxWidth:"84%",background:G.card,border:`1px solid ${m.lanc.tipo==="Receita"?G.green:G.red}44`,borderRadius:14,padding:"12px 14px",animation:"popIn .2s ease"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20,background:m.lanc.tipo==="Receita"?G.greenL:G.redL,color:m.lanc.tipo==="Receita"?G.green:G.red}}>{m.lanc.tipo==="Receita"?"↑ Receita":"↓ Despesa"}</span>
                  <span style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:700,color:m.lanc.tipo==="Receita"?G.green:G.red}}>R${Number(m.lanc.valor).toFixed(2)}</span>
                </div>
                <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{m.lanc.desc||m.lanc.cat}</div>
                <div style={{fontSize:11,color:G.muted}}>{m.lanc.cat} · {m.lanc.forma} · {fmtD(m.lanc.data||today())}</div>
              </div>
            )}
            {m.multi&&(
              <div style={{marginTop:6,maxWidth:"84%",display:"flex",flexDirection:"column",gap:6}}>
                {m.multi.map((i,idx)=>(
                  <div key={idx} style={{background:G.card,border:`1px solid ${i.tipo==="Receita"?G.green:G.red}44`,borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:18,color:i.tipo==="Receita"?G.green:G.red}}>{i.tipo==="Receita"?"↑":"↓"}</span>
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{i.desc||i.cat}</div><div style={{fontSize:11,color:G.muted}}>{i.cat}</div></div>
                    <div style={{fontFamily:"'Fraunces',serif",fontSize:14,fontWeight:700,color:i.tipo==="Receita"?G.green:G.red}}>R${Number(i.valor).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{fontSize:10,color:G.muted,marginTop:3}}>{m.ts.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</div>
          </div>
        ))}
        {(busy||isProc)&&(
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{padding:"12px 16px",borderRadius:"18px 18px 18px 4px",background:G.card2,border:`1px solid ${G.border2}`,display:"flex",gap:5,alignItems:"center"}}>
              {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:G.muted,animation:`bounce .9s ${i*.15}s infinite`}}/>)}
            </div>
          </div>
        )}
        {pending&&!busy&&(
          <div style={{display:"flex",gap:8,animation:"fadeUp .2s ease"}}>
            <button onClick={confirmar} className="press" style={{flex:1,padding:"13px",borderRadius:12,border:"none",cursor:"pointer",background:G.green,color:"#fff",fontWeight:700,fontSize:14,fontFamily:"inherit"}}>✓ Confirmar e salvar</button>
            <button onClick={()=>{push("ai","Cancelei! 😊");setPending(null);}} className="press" style={{padding:"13px 18px",borderRadius:12,border:`1px solid ${G.border2}`,cursor:"pointer",background:"transparent",color:G.muted,fontWeight:600,fontSize:14,fontFamily:"inherit"}}>✕</button>
          </div>
        )}
        <div ref={botRef}/>
      </div>

      {recErr&&(
        <div style={{margin:"0 14px 8px",padding:"10px 14px",borderRadius:12,background:G.redL,border:`1px solid ${G.red}44`,fontSize:12,color:G.red,display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          ⚠️ <span style={{flex:1}}>{recErr}</span>
          <button onClick={()=>setRecErr("")} style={{background:"none",border:"none",color:G.red,cursor:"pointer",fontSize:16,lineHeight:1}}>×</button>
        </div>
      )}

      {msgs.length<=2&&!isRec&&(
        <div style={{display:"flex",gap:8,overflowX:"auto",padding:"4px 14px 8px",flexShrink:0}}>
          {SUGS.map(s=><div key={s} onClick={()=>send(s)} className="press" style={{padding:"7px 14px",borderRadius:20,cursor:"pointer",flexShrink:0,fontSize:12,background:G.card2,border:`1px solid ${G.border2}`,color:G.muted}}>{s}</div>)}
        </div>
      )}

      <div style={{padding:"10px 12px",background:G.card,borderTop:`1px solid ${G.border}`,flexShrink:0}}>
        {isRec?(
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:"50%",flexShrink:0,background:G.redL,border:`2px solid ${G.red}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:14,height:14,borderRadius:"50%",background:G.red,animation:"bounce .6s ease-in-out infinite alternate"}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:G.red}}>Gravando...</div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                <span style={{fontFamily:"'Fraunces',serif",fontSize:14,color:G.muted}}>{fmtS(recSec)}</span>
                <div style={{display:"flex",gap:2,alignItems:"flex-end",height:16}}>
                  {[4,8,5,10,6,9,4,7].map((h,i)=><div key={i} style={{width:3,borderRadius:2,background:G.red,opacity:.8,height:h,animation:`wavebar ${.4+i*.07}s ${i*.06}s ease-in-out infinite alternate`}}/>)}
                </div>
              </div>
            </div>
            <button onClick={stopRec} className="press" style={{padding:"10px 16px",borderRadius:22,border:"none",cursor:"pointer",background:G.red,color:"#fff",fontWeight:700,fontSize:13,fontFamily:"inherit",flexShrink:0}}>Enviar ✓</button>
            <button onClick={cancelRec} className="press" style={{width:36,height:36,borderRadius:"50%",border:`1px solid ${G.border2}`,cursor:"pointer",background:"transparent",color:G.muted,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
          </div>
        ):(
          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
            <button onClick={startRec} disabled={busy||isProc} className="press" title="Gravar áudio"
              style={{width:44,height:44,borderRadius:"50%",border:`1px solid ${G.border2}`,flexShrink:0,cursor:"pointer",background:G.card2,color:G.muted,fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"}}>🎤</button>
            <textarea ref={inpRef} value={input}
              onChange={e=>{setInput(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,110)+"px";}}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
              placeholder="Digite como no WhatsApp..." rows={1}
              style={{flex:1,padding:"11px 14px",background:G.card2,border:`1px solid ${G.border2}`,borderRadius:22,color:G.text,fontSize:15,outline:"none",resize:"none",lineHeight:1.4,maxHeight:110,overflowY:"auto"}}/>
            <button onClick={()=>send()} disabled={!input.trim()||busy} className="press"
              style={{width:44,height:44,borderRadius:"50%",border:"none",flexShrink:0,cursor:"pointer",background:input.trim()&&!busy?G.accent:G.border2,color:"#fff",fontSize:19,display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}>➤</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App(){
  const [rdy,setRdy]=useState(false);
  const [lancs,setLancs]=useState([]);
  const [recorrentes,setRecorrentes]=useState([]);
  const [view,setView]=useState("dashboard");
  const [modal,setModal]=useState(false);
  const [tipo,setTipo]=useState("Despesa");
  const [form,setForm]=useState({data:today(),desc:"",cat:CATS_DEP[0],forma:FORMAS_DEP[0],valor:""});
  const [toast,setToast]=useState(null);
  const tRef=useRef();

  useEffect(()=>{
    const stored=loadStorage();
    let l=stored?.lancs?.length?stored.lancs:SEED_LANCS;
    const r=stored?.recorrentes?.length?stored.recorrentes:SEED_REC;
    // Gera recorrentes do mês atual automaticamente
    const novos=gerarRecorrentesDoMes(r,l);
    if(novos.length>0) l=[...l,...novos];
    setLancs(l);
    setRecorrentes(r);
    setRdy(true);
  },[]);

  useEffect(()=>{
    if(!rdy)return;
    const t=setTimeout(()=>saveStorage({lancs,recorrentes}),800);
    return()=>clearTimeout(t);
  },[lancs,recorrentes,rdy]);

  const showT=useCallback((msg,type="success")=>{setToast({msg,type});clearTimeout(tRef.current);tRef.current=setTimeout(()=>setToast(null),2400);},[]);

  function openModal(t){setTipo(t);setForm({data:today(),desc:"",cat:t==="Receita"?CATS_REC[0]:CATS_DEP[0],forma:t==="Receita"?FORMAS_REC[0]:FORMAS_DEP[0],valor:""});setModal(true);}
  function addLanc(l){setLancs(p=>[{id:Date.now(),...l},...p]);}
  function salvar(){
    const v=parseFloat(form.valor);
    if(!form.data||!v||v<=0){showT("Informe o valor e a data.","error");return;}
    addLanc({tipo,...form,valor:v});setModal(false);showT(`${tipo} adicionada!`);
  }
  function deletar(id){setLancs(p=>p.filter(l=>l.id!==id));showT("Removido.","error");}

  // Recorrentes
  function addRec(r){
    setRecorrentes(p=>[...p,r]);
    // Gera lançamentos imediatamente
    const novos=gerarRecorrentesDoMes([r],lancs);
    if(novos.length>0){setLancs(p=>[...p,...novos]);showT(`Recorrente salvo! ${novos.length} lançamento(s) gerado(s) este mês.`);}
    else showT("Recorrente salvo!");
  }
  function toggleRec(id){setRecorrentes(p=>p.map(r=>r.id===id?{...r,ativo:!r.ativo}:r));}
  function deleteRec(id){
    setRecorrentes(p=>p.filter(r=>r.id!==id));
    setLancs(p=>p.filter(l=>l.recId!==id));
    showT("Recorrente removido.","error");
  }

  if(!rdy)return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:G.bg,gap:10}}><style>{CSS}</style><div style={{fontFamily:"'Fraunces',serif",fontSize:30,fontWeight:700}}>fin<span style={{color:G.accent}}>ance</span></div><div style={{fontSize:12,color:G.muted}}>carregando...</div></div>);

  return(
    <>
      <style>{CSS}</style>
      <div style={{display:"flex",flexDirection:"column",height:"100vh",background:G.bg}}>
        <Head view={view} onRec={()=>openModal("Receita")} onDep={()=>openModal("Despesa")}/>
        {view==="chat"?(
          <div style={{position:"fixed",top:HH,left:0,right:0,bottom:NH,display:"flex",flexDirection:"column"}}>
            <ChatView lancs={lancs} onAddLanc={l=>{addLanc(l);showT("Salvo! ✓");}}/>
          </div>
        ):(
          <main key={view} style={{flex:1,overflowY:"auto",padding:"16px 14px",marginTop:HH,marginBottom:NH,animation:"fadeUp .2s ease both"}}>
            {view==="dashboard"&&<Dashboard lancs={lancs} onDelete={deletar}/>}
            {view==="receitas"&&<LancsView tipo="Receita" lancs={lancs} recorrentes={recorrentes} onDelete={deletar} onAddRec={addRec} onToggleRec={toggleRec} onDeleteRec={deleteRec}/>}
            {view==="despesas"&&<LancsView tipo="Despesa" lancs={lancs} recorrentes={recorrentes} onDelete={deletar} onAddRec={addRec} onToggleRec={toggleRec} onDeleteRec={deleteRec}/>}
          </main>
        )}
        <Nav view={view} setView={setView}/>
      </div>
      <Sheet open={modal} onClose={()=>setModal(false)} title="Novo Lançamento">
        <LancForm tipo={tipo} setTipo={setTipo} form={form} setForm={setForm} onSave={salvar}/>
      </Sheet>
      {toast&&<div style={{position:"fixed",bottom:NH+12,left:"50%",transform:"translateX(-50%)",background:G.card2,border:`1px solid ${toast.type==="success"?G.green:G.red}55`,borderRadius:20,padding:"10px 18px",fontSize:13,fontWeight:600,zIndex:9999,display:"flex",alignItems:"center",gap:8,animation:"fadeUp .28s ease",boxShadow:"0 6px 24px rgba(0,0,0,.5)",whiteSpace:"nowrap",color:toast.type==="success"?G.green:G.red}}>{toast.type==="success"?"✓":"✕"} {toast.msg}</div>}
    </>
  );
}
