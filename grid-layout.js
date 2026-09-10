(()=>{
  const STORAGE_KEY="simbolos.ui.gridColumns.v1";
  const VALID_COLUMNS=[2,3,4,5,6];
  const grid=document.getElementById("symbolGrid");
  const menu=document.getElementById("libraryMenu");
  if(!grid||!menu)return;

  const defaultColumns=()=>window.matchMedia("(min-width:900px)").matches?4:window.matchMedia("(min-width:640px)").matches?3:2;
  const loadColumns=()=>{
    try{
      const value=Number(localStorage.getItem(STORAGE_KEY));
      return VALID_COLUMNS.includes(value)?value:defaultColumns();
    }catch{return defaultColumns();}
  };

  const style=document.createElement("style");
  style.id="grid-layout-styles";
  style.textContent=`
#symbolGrid.symbol-grid{
  --grid-columns:2;
  --grid-gap:12px;
  grid-template-columns:repeat(var(--grid-columns),minmax(0,1fr))!important;
  gap:var(--grid-gap)!important;
}
#symbolGrid .symbol-card{min-width:0;transition:border-radius .18s ease,transform .18s ease}
#symbolGrid .card-preview{
  height:auto!important;
  min-height:0!important;
  aspect-ratio:1.28 / 1;
  padding:clamp(6px,10%,25px)!important;
}
#symbolGrid .card-preview svg{
  width:min(62px,60%)!important;
  height:min(62px,60%)!important;
  max-width:60%!important;
  max-height:60%!important;
}
#symbolGrid[data-columns="3"]{--grid-gap:10px}
#symbolGrid[data-columns="3"] .card-info{padding:10px 10px 8px}
#symbolGrid[data-columns="3"] .card-info h2{font-size:13px}
#symbolGrid[data-columns="3"] .card-meta{font-size:10px}
#symbolGrid[data-columns="3"] .copy-button{width:calc(100% - 16px);height:33px;margin:0 8px 8px;font-size:12px}

#symbolGrid[data-columns="4"]{--grid-gap:8px}
#symbolGrid[data-columns="4"] .symbol-card{border-radius:16px}
#symbolGrid[data-columns="4"] .card-info{padding:8px 8px 6px}
#symbolGrid[data-columns="4"] .card-info h2{font-size:11.5px}
#symbolGrid[data-columns="4"] .card-meta{display:none}
#symbolGrid[data-columns="4"] .copy-button{width:calc(100% - 12px);height:30px;margin:0 6px 6px;gap:5px;font-size:11px}
#symbolGrid[data-columns="4"] .copy-button svg{width:14px;height:14px}

#symbolGrid[data-columns="5"]{--grid-gap:6px}
#symbolGrid[data-columns="5"] .symbol-card{border-radius:13px}
#symbolGrid[data-columns="5"] .card-info{padding:6px 6px 5px}
#symbolGrid[data-columns="5"] .card-info h2{font-size:10px}
#symbolGrid[data-columns="5"] .card-meta{display:none}
#symbolGrid[data-columns="5"] .copy-button{position:relative;width:calc(100% - 10px);height:28px;margin:0 5px 5px;border-radius:9px;gap:0}
#symbolGrid[data-columns="5"] .copy-button svg{width:14px;height:14px}
#symbolGrid[data-columns="5"] .copy-button span,
#symbolGrid[data-columns="6"] .copy-button span{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}

#symbolGrid[data-columns="6"]{--grid-gap:5px}
#symbolGrid[data-columns="6"] .symbol-card{border-radius:11px}
#symbolGrid[data-columns="6"] .card-info{padding:5px 5px 4px}
#symbolGrid[data-columns="6"] .card-info h2{font-size:9px}
#symbolGrid[data-columns="6"] .card-meta{display:none}
#symbolGrid[data-columns="6"] .copy-button{position:relative;width:calc(100% - 8px);height:26px;margin:0 4px 4px;border-radius:8px;gap:0}
#symbolGrid[data-columns="6"] .copy-button svg{width:13px;height:13px}

.grid-layout-setting{margin:3px 0 6px;padding:9px 8px 12px;border-bottom:1px solid var(--line)}
.grid-layout-heading{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:8px}
.grid-layout-heading strong{font-size:13px}
.grid-layout-heading span{color:var(--muted);font-size:10px;white-space:nowrap}
.popover .grid-layout-options{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}
.popover .grid-layout-options button{display:grid;width:auto;min-width:0;height:34px;padding:0;border:0;border-radius:9px;background:var(--soft);place-items:center;text-align:center;font-size:12px;font-weight:700}
.popover .grid-layout-options button[aria-pressed="true"]{background:var(--accent);color:#fff}
.popover .grid-layout-options button:active{transform:scale(.96)}
@media(max-width:430px){
  #symbolGrid[data-columns="5"] .card-info h2{font-size:9.5px}
  #symbolGrid[data-columns="6"] .card-info h2{font-size:8.5px}
}
`;
  document.head.appendChild(style);

  const setting=document.createElement("div");
  setting.className="grid-layout-setting";
  setting.setAttribute("role","group");
  setting.setAttribute("aria-label","Quantidade de ícones por linha");
  setting.innerHTML=`<div class="grid-layout-heading"><strong>Ícones por linha</strong><span id="gridColumnsValue"></span></div><div class="grid-layout-options"></div>`;
  const options=setting.querySelector(".grid-layout-options");
  const valueLabel=setting.querySelector("#gridColumnsValue");
  VALID_COLUMNS.forEach(value=>{
    const button=document.createElement("button");
    button.type="button";
    button.dataset.columns=String(value);
    button.textContent=String(value);
    button.setAttribute("aria-label",`${value} ícones por linha`);
    button.setAttribute("aria-pressed","false");
    options.appendChild(button);
  });
  menu.insertBefore(setting,menu.querySelector("#exportButton")||menu.firstChild);

  let columns=loadColumns();
  const applyColumns=(value,{save=true,announce=false}={})=>{
    const next=VALID_COLUMNS.includes(Number(value))?Number(value):2;
    columns=next;
    grid.dataset.columns=String(next);
    grid.style.setProperty("--grid-columns",String(next));
    valueLabel.textContent=`${next} por linha`;
    options.querySelectorAll("button").forEach(button=>button.setAttribute("aria-pressed",String(Number(button.dataset.columns)===next)));
    if(save){try{localStorage.setItem(STORAGE_KEY,String(next));}catch{}}
    if(announce){
      const toast=document.getElementById("toast");
      if(toast){toast.textContent=`${next} ícones por linha`;toast.hidden=false;clearTimeout(window.__gridLayoutToastTimer);window.__gridLayoutToastTimer=setTimeout(()=>toast.hidden=true,1400);}
    }
  };

  options.addEventListener("click",event=>{
    const button=event.target.closest("button[data-columns]");
    if(!button)return;
    event.stopPropagation();
    applyColumns(button.dataset.columns,{save:true,announce:true});
  });

  const observer=new MutationObserver(()=>{
    grid.querySelectorAll(".copy-button:not([aria-label])").forEach(button=>button.setAttribute("aria-label","Copiar código SVG"));
  });
  observer.observe(grid,{childList:true,subtree:true});
  grid.querySelectorAll(".copy-button:not([aria-label])").forEach(button=>button.setAttribute("aria-label","Copiar código SVG"));

  applyColumns(columns,{save:false,announce:false});
})();
