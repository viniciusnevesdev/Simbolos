const STORAGE_KEY = "simbolos.library.v2";
const LEGACY_KEY = "simbolos.library.v1";
const $ = s => document.querySelector(s);
const clone = value => JSON.parse(JSON.stringify(value));

const els = {
  grid: $("#symbolGrid"), empty: $("#emptyState"), noResults: $("#noResultsState"), count: $("#symbolCount"), search: $("#searchInput"), clearSearch: $("#clearSearchButton"),
  add: $("#addButton"), emptyAdd: $("#emptyAddButton"), libraryButton: $("#libraryButton"), libraryMenu: $("#libraryMenu"), exportButton: $("#exportButton"), importButton: $("#importButton"), importFile: $("#importFileInput"), aboutStorage: $("#aboutStorageButton"),
  editor: $("#editorDialog"), editorTitle: $("#editorTitle"), cancel: $("#cancelEditorButton"), save: $("#saveSymbolButton"), name: $("#nameInput"), variantTabs: $("#variantTabs"), addVariant: $("#addVariantButton"), variantLabel: $("#variantLabelInput"), defaultVariant: $("#defaultVariantInput"),
  svg: $("#svgInput"), paste: $("#pasteButton"), format: $("#formatButton"), preview: $("#svgPreview"), previewColor: $("#previewColorInput"), previewStatus: $("#previewStatus"), previewVariantName: $("#previewVariantName"), fixedColor: $("#fixedColorInput"), cleanup: $("#cleanupInput"),
  strokeControls: $("#strokeControls"), strokeInput: $("#strokeWidthInput"), strokeOutput: $("#strokeWidthOutput"), restoreStroke: $("#restoreStrokeButton"), analysisChips: $("#analysisChips"), analysisText: $("#analysisText"), output: $("#outputCode code"), copyOutput: $("#copyOutputButton"), downloadOutput: $("#downloadOutputButton"), deleteVariant: $("#deleteVariantButton"), deleteSymbol: $("#deleteSymbolButton"),
  copyDialog: $("#copyVariantsDialog"), copyTitle: $("#copyVariantsTitle"), copyList: $("#copyVariantsList"), closeCopyDialog: $("#closeCopyVariantsButton"), info: $("#infoDialog"), closeInfo: $("#closeInfoButton"), toast: $("#toast"), template: $("#symbolCardTemplate")
};

const familyLabel=document.createElement("label"),familyInput=document.createElement("input"),familyList=document.createElement("datalist");
familyLabel.className="field-label";familyLabel.htmlFor="familyInput";familyLabel.textContent="Grupo";
familyInput.id="familyInput";familyInput.className="text-input";familyInput.type="text";familyInput.maxLength=40;familyInput.placeholder="Grupo";familyInput.setAttribute("list","familySuggestions");
familyList.id="familySuggestions";
const familySlot=document.getElementById("familyFieldSlot");
if(familySlot){familySlot.append(familyLabel,familyInput,familyList);}else{els.name.insertAdjacentElement("afterend",familyList);els.name.insertAdjacentElement("afterend",familyInput);els.name.insertAdjacentElement("afterend",familyLabel);}
els.family=familyInput;els.familyList=familyList;

let items = loadItems();
let draft = null;
let activeVariantId = null;
let toastTimer = null;
const collapsedFamilies=new Set();

let organizeMode=false;
const selectedItems=new Set();

const organizeButton=document.createElement("button");
organizeButton.id="organizeButton";
organizeButton.type="button";
organizeButton.textContent="Organizar biblioteca";
els.aboutStorage.insertAdjacentElement("beforebegin",organizeButton);

const organizerBar=document.createElement("div");
organizerBar.id="organizerBar";
organizerBar.className="organizer-bar";
organizerBar.hidden=true;
organizerBar.innerHTML=`
  <div class="organizer-head">
    <div><strong>Organizar biblioteca</strong><small id="organizerCount">0 selecionados</small></div>
    <button id="organizerDoneButton" class="organizer-done" type="button">Concluir</button>
  </div>
  <div class="organizer-group-tools">
    <input id="organizerFamilyInput" class="organizer-family-input" type="text" maxlength="40" placeholder="Grupo" autocomplete="off" aria-autocomplete="list" aria-controls="organizerFamilyMatches">
    <datalist id="organizerFamilySuggestions" hidden></datalist>
    <div id="organizerFamilyMatches" class="organizer-family-matches" role="listbox" hidden></div>
    <button id="organizerApplyFamilyButton" class="organizer-add-family" type="button">Adicionar ao grupo</button>
    <button id="organizerRemoveFamilyButton" class="organizer-remove-family" type="button" hidden>Tirar do grupo</button>
  </div>
`;
document.body.appendChild(organizerBar);

const organizerCount=document.getElementById("organizerCount");
const organizerDone=document.getElementById("organizerDoneButton");
const organizerFamilyInput=document.getElementById("organizerFamilyInput");
const organizerFamilyList=document.getElementById("organizerFamilySuggestions");
const organizerApplyFamily=document.getElementById("organizerApplyFamilyButton");
const organizerRemoveFamily=document.getElementById("organizerRemoveFamilyButton");
const organizerFamilyMatches=document.getElementById("organizerFamilyMatches");

const symbolActionsDialog=document.createElement("dialog");
symbolActionsDialog.id="symbolActionsDialog";
symbolActionsDialog.className="symbol-actions-dialog";
symbolActionsDialog.innerHTML=`
  <div class="symbol-actions-card">
    <div class="symbol-actions-head">
      <div><small>Símbolo</small><strong id="symbolActionsTitle">—</strong></div>
      <button id="symbolActionsClose" type="button" aria-label="Fechar">×</button>
    </div>
    <div class="symbol-actions-grid">
      <button id="symbolActionsCopy" type="button"><span aria-hidden="true">⧉</span><strong>Copiar código</strong></button>
      <button id="symbolActionsDownload" type="button"><span aria-hidden="true">↓</span><strong>Baixar .SVG</strong></button>
      <button id="symbolActionsEdit" type="button"><span aria-hidden="true">✎</span><strong>Editar</strong></button>
      <button id="symbolActionsDelete" class="danger" type="button"><span aria-hidden="true">⌫</span><strong>Excluir</strong></button>
    </div>
  </div>
`;
document.body.appendChild(symbolActionsDialog);
const symbolActionsTitle=document.getElementById("symbolActionsTitle");
const symbolActionsClose=document.getElementById("symbolActionsClose");
const symbolActionsCopy=document.getElementById("symbolActionsCopy");
const symbolActionsDownload=document.getElementById("symbolActionsDownload");
const symbolActionsEdit=document.getElementById("symbolActionsEdit");
const symbolActionsDelete=document.getElementById("symbolActionsDelete");
let symbolActionsItemId=null;

const duplicateWarningDialog=document.createElement("dialog");
duplicateWarningDialog.id="duplicateWarningDialog";
duplicateWarningDialog.className="duplicate-warning-dialog";
duplicateWarningDialog.innerHTML=`
  <div class="duplicate-warning-card">
    <div class="duplicate-warning-badge">!</div>
    <h2>Possível duplicata</h2>
    <div id="duplicateWarningDetails" class="duplicate-warning-details"></div>
    <p class="duplicate-warning-note">Você ainda pode salvar, mas este aviso sempre aparecerá quando o título ou o código SVG já existir.</p>
    <div class="duplicate-warning-actions">
      <button id="duplicateReviewButton" type="button">Voltar e revisar</button>
      <button id="duplicateSaveAnywayButton" type="button">Salvar duplicata</button>
    </div>
  </div>
`;
document.body.appendChild(duplicateWarningDialog);
const duplicateWarningDetails=document.getElementById("duplicateWarningDetails");
const duplicateReviewButton=document.getElementById("duplicateReviewButton");
const duplicateSaveAnywayButton=document.getElementById("duplicateSaveAnywayButton");

function uid(){ return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function defaultOptions(){ return { colorMode:"currentColor", sizeMode:"24", fixedColor:"#000000", cleanup:true, strokeOverride:null }; }
function normalizeOptions(value){ const source=value&&typeof value==="object"&&!Array.isArray(value)?value:{},stroke=Number(source.strokeOverride);return {colorMode:["currentColor","original","fixed"].includes(source.colorMode)?source.colorMode:"currentColor",sizeMode:["24","1em","original"].includes(source.sizeMode)?source.sizeMode:"24",fixedColor:typeof source.fixedColor==="string"&&/^#[0-9a-f]{6}$/i.test(source.fixedColor)?source.fixedColor:"#000000",cleanup:source.cleanup!==false,strokeOverride:source.strokeOverride!=null&&Number.isFinite(stroke)?Math.min(4,Math.max(.5,stroke)):null}; }
function newVariant(label="Padrão"){ return { id:uid(), label, originalSvg:"", finalSvg:"", options:defaultOptions(), createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() }; }
function normalizeItem(item){
  if(!item||typeof item!=="object"||Array.isArray(item))return null;
  if (Array.isArray(item.variants) && item.variants.length) {
    item.variants = item.variants.filter(v=>v&&typeof v==="object"&&!Array.isArray(v)).map(v => ({ id:typeof v.id==="string"&&v.id?v.id:uid(), label:typeof v.label==="string"&&v.label.trim()?v.label.trim().slice(0,40):"Padrão", originalSvg:typeof v.originalSvg==="string"?v.originalSvg:"", finalSvg:typeof v.finalSvg==="string"?v.finalSvg:"", options:normalizeOptions(v.options), createdAt:typeof v.createdAt==="string"?v.createdAt:new Date().toISOString(), updatedAt:typeof v.updatedAt==="string"?v.updatedAt:new Date().toISOString() }));
    if(!item.variants.length)return null;
    item.id=typeof item.id==="string"&&item.id?item.id:uid();
    item.name=typeof item.name==="string"&&item.name.trim()?item.name.trim().slice(0,80):"Sem título";
    item.family=typeof item.family==="string"?item.family.trim().slice(0,40):"";
    item.createdAt=typeof item.createdAt==="string"?item.createdAt:new Date().toISOString();
    item.updatedAt=typeof item.updatedAt==="string"?item.updatedAt:new Date().toISOString();
    item.defaultVariantId = item.variants.some(v=>v.id===item.defaultVariantId) ? item.defaultVariantId : item.variants[0].id;
    return item;
  }
  if (typeof item.originalSvg === "string") {
    const v = { id:uid(), label:"Padrão", originalSvg:item.originalSvg, finalSvg:typeof item.finalSvg==="string"?item.finalSvg:item.originalSvg, options:normalizeOptions(item.options), createdAt:typeof item.createdAt==="string"?item.createdAt:new Date().toISOString(), updatedAt:typeof item.updatedAt==="string"?item.updatedAt:new Date().toISOString() };
    return { id:typeof item.id==="string"&&item.id?item.id:uid(), name:typeof item.name==="string"&&item.name.trim()?item.name.trim().slice(0,80):"Sem título", family:typeof item.family==="string"?item.family.trim().slice(0,40):"", variants:[v], defaultVariantId:v.id, createdAt:v.createdAt, updatedAt:v.updatedAt };
  }
  return null;
}
function loadItems(){
  const read=key=>{try{const value=JSON.parse(localStorage.getItem(key)||"null");return Array.isArray(value)?value:null;}catch{return null;}};
  const current=read(STORAGE_KEY),legacy=current===null?read(LEGACY_KEY):null,raw=current??legacy??[];
  const normalized=raw.map(normalizeItem).filter(Boolean);
  if(current===null&&legacy!==null){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(normalized));}catch{}}
  return normalized;
}
function persist(nextItems=items){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(nextItems));return true;}catch(error){console.warn("Não foi possível salvar a biblioteca:",error);return false;} }
function showToast(message){ clearTimeout(toastTimer); els.toast.textContent=message; els.toast.hidden=false; toastTimer=setTimeout(()=>els.toast.hidden=true,1800); }
async function copyText(text){
  if (!text) throw new Error("empty");
  if (navigator.clipboard?.writeText) { try{await navigator.clipboard.writeText(text);return;}catch{} }
  const ta=document.createElement("textarea"); ta.value=text; ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select();
  const ok=document.execCommand("copy"); ta.remove(); if(!ok) throw new Error("copy");
}
function parseSvg(code){
  const source=String(code||"").trim(); if(!source) return {ok:false,error:"Cole um código SVG."};
  const doc=new DOMParser().parseFromString(source,"image/svg+xml"); if(doc.querySelector("parsererror")) return {ok:false,error:"O código não é um SVG válido."};
  const root=doc.documentElement; if(!root||root.localName.toLowerCase()!=="svg") return {ok:false,error:"O código precisa começar com <svg>."};
  return {ok:true,root};
}
function hasUnsafeUrl(value){ return [...String(value||"").matchAll(/url\s*\(\s*(['"]?)(.*?)\1\s*\)/gi)].some(match=>!match[2].trim().startsWith("#")); }
function sanitize(root,cleanup=true){
  const out=root.cloneNode(true); out.querySelectorAll("script,style,foreignObject,iframe,object,embed,audio,video,animate,animateMotion,animateTransform,set,discard,mpath").forEach(el=>el.remove());
  if(cleanup) out.querySelectorAll("metadata,title,desc").forEach(el=>el.remove());
  [out,...out.querySelectorAll("*")].forEach(el=>[...el.attributes].forEach(attr=>{
    const n=attr.name.toLowerCase(),v=String(attr.value||"").trim();
    if(n.startsWith("on")) el.removeAttribute(attr.name);
    if((n==="href"||n.endsWith(":href"))&&!v.startsWith("#")) el.removeAttribute(attr.name);
    if(hasUnsafeUrl(v)) el.removeAttribute(attr.name);
    if(cleanup&&(n==="class"||n.startsWith("data-"))) el.removeAttribute(attr.name);
  }));
  return out;
}
function isSolidPaint(value){ if(!value)return false; const v=value.trim().toLowerCase(); return !["none","transparent","currentcolor","inherit","initial","unset"].includes(v)&&!v.startsWith("url("); }
function styleProperty(el,name){ const match=String(el.getAttribute("style")||"").match(new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`,"i"));return match?match[1].trim():null; }
function applyPaint(root,mode,fixedColor){
  if(mode==="original")return; const target=mode==="currentColor"?"currentColor":fixedColor;
  [root,...root.querySelectorAll("*")].forEach(el=>{
    ["fill","stroke"].forEach(attr=>{ const value=el.getAttribute(attr); if(isSolidPaint(value)) el.setAttribute(attr,target); });
    const style=el.getAttribute("style"); if(style){ let next=style.replace(/(fill\s*:\s*)(?!none\b|transparent\b|currentColor\b|url\()[^;]+/gi,`$1${target}`); next=next.replace(/(stroke\s*:\s*)(?!none\b|transparent\b|currentColor\b|url\()[^;]+/gi,`$1${target}`); el.setAttribute("style",next); }
  });
  const nodes=[root,...root.querySelectorAll("*")]; if(!nodes.some(el=>el.hasAttribute("fill"))&&!nodes.some(el=>el.hasAttribute("stroke"))) root.setAttribute("fill",target);
}
function applySize(root,mode){ if(mode==="1em"){root.setAttribute("width","1em");root.setAttribute("height","1em");} else if(mode==="24"){root.setAttribute("width","24");root.setAttribute("height","24");} }
function applyStroke(root,width){ if(width==null)return; [root,...root.querySelectorAll("*")].forEach(el=>{ const stroke=el.getAttribute("stroke")||styleProperty(el,"stroke"); if(stroke&&stroke.toLowerCase()!=="none") el.setAttribute("stroke-width",String(width)); }); }
function serializeSvg(root){ if(!root.hasAttribute("xmlns"))root.setAttribute("xmlns","http://www.w3.org/2000/svg"); return new XMLSerializer().serializeToString(root).replace(/></g,">\n<"); }
function analyzeSvg(root){
  const nodes=[root,...root.querySelectorAll("*")],fills=nodes.map(el=>el.getAttribute("fill")||styleProperty(el,"fill")).filter(Boolean),strokes=nodes.map(el=>el.getAttribute("stroke")||styleProperty(el,"stroke")).filter(v=>v&&v.toLowerCase()!=="none"),widths=nodes.map(el=>el.getAttribute("stroke-width")||styleProperty(el,"stroke-width")).filter(v=>v!=null&&v!=="").map(Number).filter(Number.isFinite);
  return { paths:root.querySelectorAll("path").length, viewBox:root.getAttribute("viewBox")||"sem viewBox", hasStroke:strokes.length>0, usesCurrent:[...fills,...strokes].some(v=>v.toLowerCase()==="currentcolor"), hasMultiColor:new Set([...fills,...strokes].filter(isSolidPaint).map(v=>v.toLowerCase())).size>1, strokeWidth:widths[0]||1.5 };
}
function transformSvg(svg,options){
  const parsed=parseSvg(svg); if(!parsed.ok)return {ok:false,error:parsed.error,output:"",analysis:null};
  const analysis=analyzeSvg(parsed.root),root=sanitize(parsed.root,options.cleanup!==false); applyPaint(root,options.colorMode||"currentColor",options.fixedColor||"#000000"); applySize(root,options.sizeMode||"24"); applyStroke(root,options.strokeOverride);
  return {ok:true,output:serializeSvg(root),analysis};
}
function getRadio(name){ return document.querySelector(`input[name="${name}"]:checked`)?.value; }
function setRadio(name,value){ const input=document.querySelector(`input[name="${name}"][value="${value}"]`); if(input)input.checked=true; }
function currentVariant(){ return draft?.variants.find(v=>v.id===activeVariantId)||null; }
function optionsFromUI(){ return { colorMode:getRadio("colorMode"), sizeMode:getRadio("sizeMode"), fixedColor:els.fixedColor.value, cleanup:els.cleanup.checked, strokeOverride:els.strokeInput.dataset.override==="true"?Number(els.strokeInput.value):null }; }
function stashCurrent(){
  const v=currentVariant(); if(!v)return; v.label=els.variantLabel.value.trim()||"Sem nome"; v.originalSvg=els.svg.value.trim(); v.options=optionsFromUI(); const transformed=transformSvg(v.originalSvg,v.options); v.finalSvg=transformed.ok?transformed.output:""; v.updatedAt=new Date().toISOString();
  if(els.defaultVariant.checked) draft.defaultVariantId=v.id;
}
function loadVariantToUI(id){
  const v=draft?.variants.find(x=>x.id===id); if(!v)return; activeVariantId=id; els.variantLabel.value=v.label; els.svg.value=v.originalSvg; setRadio("colorMode",v.options.colorMode||"currentColor"); setRadio("sizeMode",v.options.sizeMode||"24"); els.fixedColor.value=v.options.fixedColor||"#000000"; els.cleanup.checked=v.options.cleanup!==false; els.defaultVariant.checked=draft.defaultVariantId===v.id;
  els.strokeInput.dataset.override=v.options.strokeOverride==null?"false":"true"; els.strokeInput.value=String(v.options.strokeOverride??1.5); renderVariantTabs(); updateEditor();
}
function renderVariantTabs(){
  els.variantTabs.innerHTML=""; if(!draft)return;
  draft.variants.forEach(v=>{ const b=document.createElement("button"); b.type="button"; b.className=`variant-tab${v.id===activeVariantId?" active":""}`; b.textContent=v.label||"Sem nome"; if(v.id===draft.defaultVariantId)b.dataset.default="true"; b.addEventListener("click",()=>{ if(v.id===activeVariantId)return; stashCurrent(); loadVariantToUI(v.id); }); els.variantTabs.appendChild(b); });
  els.deleteVariant.hidden=draft.variants.length<=1;
}
function updateEditor(){
  const v=currentVariant(); if(!v)return; const options=optionsFromUI(),result=transformSvg(els.svg.value,options); els.preview.style.color=els.previewColor.value; els.previewVariantName.textContent=els.variantLabel.value.trim()||"Sem nome";
  if(!result.ok){ els.preview.innerHTML=""; els.previewStatus.textContent=result.error; els.output.textContent=""; els.analysisChips.innerHTML=""; els.analysisText.textContent="Cole um SVG válido para ver a análise."; els.strokeControls.hidden=true; return; }
  els.preview.innerHTML=result.output; els.previewStatus.textContent="Pré-visualização da versão selecionada."; els.output.textContent=result.output; const a=result.analysis;
  els.analysisChips.innerHTML=[`${a.paths} path${a.paths===1?"":"s"}`,a.hasStroke?"Com stroke":"Preenchido",a.usesCurrent?"Já usa currentColor":"Cor própria",a.hasMultiColor?"Multicor":"Monocor"].map(x=>`<span>${x}</span>`).join("");
  els.analysisText.textContent=`viewBox: ${a.viewBox}. ${a.hasStroke?"Esta versão usa stroke, então o peso do traço pode ser ajustado.":"Esta versão não usa stroke. Transformar automaticamente um ícone preenchido em contorno pode mudar o desenho, por isso o app não força essa conversão."}`;
  els.strokeControls.hidden=!a.hasStroke;
  if(a.hasStroke&&els.strokeInput.dataset.override!=="true"){ els.strokeInput.value=String(Math.min(4,Math.max(.5,a.strokeWidth))); els.strokeOutput.value=String(a.strokeWidth); } else els.strokeOutput.value=String(els.strokeInput.value);
}
function defaultVariant(item){ return item.variants.find(v=>v.id===item.defaultVariantId)||item.variants[0]; }
function previewMarkup(svg){ const parsed=parseSvg(svg); if(!parsed.ok)return""; const root=sanitize(parsed.root,true); root.setAttribute("width","62");root.setAttribute("height","62");return serializeSvg(root); }
function familyKey(item){ return item.family||""; }
function existingFamilies(){
  return [...new Set(items.map(item=>item.family).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
}
function renderOrganizerFamilyMatches(){
  if(!organizerFamilyMatches)return;
  const q=organizerFamilyInput.value.trim().toLocaleLowerCase("pt-BR");
  const matches=existingFamilies().filter(name=>!q||name.toLocaleLowerCase("pt-BR").includes(q)).slice(0,7);
  organizerFamilyMatches.innerHTML="";
  matches.forEach(name=>{
    const button=document.createElement("button");
    button.type="button";button.className="organizer-family-match";button.textContent=name;button.setAttribute("role","option");
    button.addEventListener("click",()=>{organizerFamilyInput.value=name;organizerFamilyMatches.hidden=true;updateOrganizerBar();});
    organizerFamilyMatches.appendChild(button);
  });
  organizerFamilyMatches.hidden=!organizeMode||matches.length===0;
}
function updateOrganizerBar(){
  if(!organizerBar)return;
  const count=selectedItems.size;
  const selected=[...selectedItems].map(id=>items.find(item=>item.id===id)).filter(Boolean);
  const hasGrouped=selected.some(item=>!!item.family);
  organizerCount.textContent=`${count} ${count===1?"selecionado":"selecionados"}`;
  organizerApplyFamily.disabled=count===0||!organizerFamilyInput.value.trim();
  organizerRemoveFamily.hidden=!hasGrouped;
  organizerRemoveFamily.disabled=!hasGrouped;
}
function toggleSelection(id){
  if(selectedItems.has(id))selectedItems.delete(id);else selectedItems.add(id);
  updateOrganizerBar();
  const card=els.grid.querySelector(`.symbol-card[data-symbol-id="${CSS.escape(id)}"]`);
  if(card){
    card.classList.toggle("selected",selectedItems.has(id));
    const b=card.querySelector(".organize-select");
    if(b){b.setAttribute("aria-pressed",String(selectedItems.has(id)));b.textContent=selectedItems.has(id)?"✓":"";}
  }
}
function moveItemWithinFamily(id,direction){
  const item=items.find(x=>x.id===id);if(!item)return;
  const key=familyKey(item),members=items.filter(x=>familyKey(x)===key),index=members.findIndex(x=>x.id===id),target=index+direction;
  if(target<0||target>=members.length)return;
  const a=items.findIndex(x=>x.id===members[index].id),b=items.findIndex(x=>x.id===members[target].id);
  [items[a],items[b]]=[items[b],items[a]];
  if(!persist(items)){showToast("Não foi possível salvar a nova ordem");return;}
  render();
}
function persistFamilyOrder(key,orderedIds){
  const memberIndexes=items.map((item,index)=>familyKey(item)===key?index:-1).filter(index=>index>=0);
  if(memberIndexes.length!==orderedIds.length)return;
  const byId=new Map(items.map(item=>[item.id,item]));
  const ordered=orderedIds.map(id=>byId.get(id)).filter(Boolean);
  if(ordered.length!==memberIndexes.length)return;
  memberIndexes.forEach((index,i)=>{items[index]=ordered[i];});
  if(!persist(items)){showToast("Não foi possível salvar a nova ordem");render();}
}
function enableCardDrag(handle,card,key){
  handle.addEventListener("pointerdown",event=>{
    if(!organizeMode)return;
    event.preventDefault();
    const grid=card.parentElement;
    const pointerId=event.pointerId;
    card.classList.add("is-dragging");
    try{handle.setPointerCapture(pointerId);}catch{}
    const move=e=>{
      if(e.clientY<90)window.scrollBy(0,-16);
      else if(e.clientY>window.innerHeight-120)window.scrollBy(0,16);
      const target=document.elementFromPoint(e.clientX,e.clientY)?.closest(".symbol-card");
      if(!target||target===card||target.parentElement!==grid)return;
      const rect=target.getBoundingClientRect(),cardRect=card.getBoundingClientRect();
      const sameRow=Math.abs(cardRect.top-rect.top)<rect.height*.45;
      const before=sameRow?e.clientX<rect.left+rect.width/2:e.clientY<rect.top+rect.height/2;
      grid.insertBefore(card,before?target:target.nextSibling);
    };
    const finish=()=>{
      handle.removeEventListener("pointermove",move);
      handle.removeEventListener("pointerup",finish);
      handle.removeEventListener("pointercancel",finish);
      card.classList.remove("is-dragging");
      const ids=[...grid.querySelectorAll(".symbol-card[data-symbol-id]")].map(node=>node.dataset.symbolId);
      persistFamilyOrder(key,ids);
    };
    handle.addEventListener("pointermove",move);
    handle.addEventListener("pointerup",finish,{once:true});
    handle.addEventListener("pointercancel",finish,{once:true});
  });
}
function setOrganizeMode(enabled){
  organizeMode=!!enabled;
  selectedItems.clear();
  organizerBar.hidden=!organizeMode;
  organizeButton.textContent=organizeMode?"Sair da organização":"Organizar biblioteca";
  document.body.classList.toggle("organize-mode",organizeMode);
  els.search.disabled=organizeMode;
  if(organizeMode){els.search.value="";els.libraryMenu.hidden=true;}
  updateOrganizerBar();
  render();
}
function applyFamilyToSelection(value){
  if(!selectedItems.size){showToast("Selecione pelo menos um ícone");return;}
  const family=String(value||"").trim().slice(0,40);
  items=items.map(item=>selectedItems.has(item.id)?{...item,family,updatedAt:new Date().toISOString()}:item);
  if(!persist(items)){showToast("Não foi possível atualizar o grupo");return;}
  const total=selectedItems.size;
  selectedItems.clear();
  organizerFamilyInput.value="";
  organizerFamilyMatches.hidden=true;
  render();
  updateOrganizerBar();
  showToast(family?`${total} ícone${total===1?"":"s"} movido${total===1?"":"s"} para “${family}”`:`${total} ícone${total===1?"":"s"} movido${total===1?"":"s"} para Outros`);
}
function render(){
  const q=els.search.value.trim().toLocaleLowerCase("pt-BR"),filtered=items.filter(item=>item.name.toLocaleLowerCase("pt-BR").includes(q)||(item.family||"").toLocaleLowerCase("pt-BR").includes(q)||item.variants.some(v=>v.label.toLocaleLowerCase("pt-BR").includes(q))); els.grid.innerHTML="";
  const named=[...new Set(filtered.map(item=>item.family).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR")),families=[...named,"Outros"];
  families.forEach(family=>{
    const members=filtered.filter(item=>family==="Outros"?!item.family:item.family===family);if(!members.length)return;
    const section=document.createElement("section"),heading=document.createElement("button"),title=document.createElement("span"),arrow=document.createElement("span"),inner=document.createElement("div"),key=family==="Outros"?"":family,collapseKey=family==="Outros"?"__others__":family;
    section.className="family-section";heading.className="family-heading";heading.type="button";title.textContent=family;arrow.className="family-arrow";arrow.textContent="↓";heading.append(title,arrow);inner.className="family-grid";inner.dataset.family=key;
    const setExpanded=expanded=>{heading.setAttribute("aria-expanded",String(expanded));heading.setAttribute("aria-label",`${expanded?"Recolher":"Expandir"} família ${family}`);inner.hidden=!expanded;section.classList.toggle("collapsed",!expanded);};
    setExpanded(!collapsedFamilies.has(collapseKey));heading.addEventListener("click",()=>{const expanded=heading.getAttribute("aria-expanded")==="true";if(expanded)collapsedFamilies.add(collapseKey);else collapsedFamilies.delete(collapseKey);setExpanded(!expanded);});
    members.forEach(item=>{
      const node=els.template.content.cloneNode(true),card=node.querySelector(".symbol-card"),main=node.querySelector(".symbol-main"),copy=node.querySelector(".copy-button"),download=node.querySelector(".download-button"),def=defaultVariant(item);
      card.dataset.symbolId=item.id;
      node.querySelector(".card-preview").innerHTML=previewMarkup(def?.finalSvg||def?.originalSvg||"");
      node.querySelector("h2").textContent=item.name;
      if(organizeMode){
        card.classList.add("organize-card");
        card.classList.toggle("selected",selectedItems.has(item.id));
        const select=document.createElement("button");select.type="button";select.className="organize-select";select.setAttribute("aria-label",`Selecionar ${item.name}`);select.setAttribute("aria-pressed",String(selectedItems.has(item.id)));select.textContent=selectedItems.has(item.id)?"✓":"";
        select.addEventListener("click",e=>{e.stopPropagation();toggleSelection(item.id);});
        const tools=document.createElement("div");tools.className="organize-card-tools";
        const previous=document.createElement("button");previous.type="button";previous.className="organize-move";previous.textContent="←";previous.setAttribute("aria-label","Mover uma posição para trás");previous.disabled=members[0].id===item.id;previous.addEventListener("click",e=>{e.stopPropagation();moveItemWithinFamily(item.id,-1);});
        const drag=document.createElement("button");drag.type="button";drag.className="organize-drag";drag.innerHTML="<span aria-hidden=\"true\">⠿</span><small>arrastar</small>";drag.setAttribute("aria-label","Arrastar para reorganizar");
        const next=document.createElement("button");next.type="button";next.className="organize-move";next.textContent="→";next.setAttribute("aria-label","Mover uma posição para frente");next.disabled=members[members.length-1].id===item.id;next.addEventListener("click",e=>{e.stopPropagation();moveItemWithinFamily(item.id,1);});
        tools.append(previous,drag,next);card.append(select,tools);enableCardDrag(drag,card,key);
        main.addEventListener("click",e=>{e.preventDefault();toggleSelection(item.id);});
        copy.hidden=true;download.hidden=true;
      }else{
        main.addEventListener("click",()=>openSymbolActions(item.id));
        node.querySelector(".card-actions")?.remove();
      }
      inner.appendChild(node);
    });
    section.append(heading,inner);els.grid.appendChild(section);
  });
  const familiesForInputs=[...new Set(items.map(item=>item.family).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  els.familyList.innerHTML="";organizerFamilyList.innerHTML="";
  familiesForInputs.forEach(family=>{const option=document.createElement("option");option.value=family;els.familyList.appendChild(option);const option2=document.createElement("option");option2.value=family;organizerFamilyList.appendChild(option2);});
  els.count.textContent=`${items.length} ${items.length===1?"símbolo":"símbolos"}`; els.empty.hidden=items.length!==0; els.noResults.hidden=!(items.length>0&&filtered.length===0); els.grid.hidden=filtered.length===0; els.clearSearch.style.display=q?"grid":"none";
  updateOrganizerBar();
}
function svgFilename(item,variant){ const raw=[item.name,variant.label].filter(Boolean).join("-").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,""); return `${raw||"simbolo"}.svg`; }
function downloadSvg(item,variant){ const code=variant.finalSvg||variant.originalSvg;if(!code){showToast("Este SVG está vazio");return;} const url=URL.createObjectURL(new Blob([code],{type:"image/svg+xml;charset=utf-8"})),a=document.createElement("a");a.href=url;a.download=svgFilename(item,variant);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast(`Arquivo “${svgFilename(item,variant)}” salvo`); }
async function copyVariant(item,variant){ try{await copyText(variant.finalSvg||variant.originalSvg);showToast(`“${item.name} · ${variant.label}” copiado`);}catch{showToast("Não foi possível copiar");} }
function openSymbolActions(id){
  const item=items.find(x=>x.id===id);if(!item)return;
  symbolActionsItemId=id;symbolActionsTitle.textContent=item.name;symbolActionsDialog.showModal();
}
function closeSymbolActions(){ if(symbolActionsDialog.open)symbolActionsDialog.close();symbolActionsItemId=null; }
function deleteSymbolById(id){
  const item=items.find(x=>x.id===id);if(!item)return;
  if(!confirm(`Excluir “${item.name}” e todas as versões?`))return;
  const nextItems=items.filter(x=>x.id!==id);
  if(!persist(nextItems)){showToast("Não foi possível atualizar a biblioteca");return;}
  items=nextItems;render();closeSymbolActions();showToast("Símbolo excluído");
}
function openVariantChooser(item,mode){ els.copyTitle.textContent=item.name; els.copyList.innerHTML=""; item.variants.forEach(v=>{ const b=document.createElement("button"),details=document.createElement("span"),strong=document.createElement("strong"),small=document.createElement("small"),action=document.createElement("span"); b.type="button";strong.textContent=v.label;small.textContent=`${v.id===item.defaultVariantId?"Padrão · ":""}${v.options?.colorMode==="currentColor"?"currentColor":"SVG"}`;action.textContent=mode==="download"?"Salvar SVG":"Copiar";details.append(strong,small);b.append(details,action);b.addEventListener("click",async()=>{if(mode==="download")downloadSvg(item,v);else await copyVariant(item,v);els.copyDialog.close();});els.copyList.appendChild(b); }); els.copyDialog.showModal(); }
function openEditor(id=null){
  if(id){ const item=items.find(x=>x.id===id); if(!item)return; draft=clone(item); els.editorTitle.textContent=item.name; els.name.value=item.name; els.family.value=item.family||""; els.deleteSymbol.hidden=false; }
  else{ const v=newVariant("Padrão"); draft={id:uid(),name:"",family:"",variants:[v],defaultVariantId:v.id,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; els.editorTitle.textContent="Novo símbolo"; els.name.value=""; els.family.value=""; els.deleteSymbol.hidden=true; }
  activeVariantId=draft.defaultVariantId||draft.variants[0].id; els.previewColor.value="#000000"; loadVariantToUI(activeVariantId); els.editor.showModal(); document.body.classList.add("dialog-open");
}
function closeEditor(){ els.editor.close(); document.body.classList.remove("dialog-open"); draft=null; activeVariantId=null; }
function validateDraft(){
  const name=els.name.value.trim(); if(!name)return {ok:false,error:"Dê um título ao símbolo",focus:els.name}; stashCurrent(); draft.name=name; draft.family=els.family.value.trim().slice(0,40);
  for(const v of draft.variants){ if(!v.label.trim())return {ok:false,error:"Dê um nome para cada versão"}; const result=transformSvg(v.originalSvg,v.options); if(!result.ok)return {ok:false,error:`${v.label}: ${result.error}`}; v.finalSvg=result.output; }
  return {ok:true};
}
function duplicateKeySvg(value){
  const source=String(value||"").trim();
  if(!source)return "";
  const parsed=parseSvg(source);
  if(!parsed.ok)return source.replace(/\s+/g," ");
  try{return serializeSvg(parsed.root).replace(/>\s+</g,"><").replace(/\s+/g," ").trim();}catch{return source.replace(/\s+/g," ");}
}
function findDraftDuplicates(){
  if(!draft)return {titles:[],svgs:[]};
  const title=String(draft.name||els.name.value||"").trim().toLocaleLowerCase("pt-BR");
  const svgKeys=new Set();
  draft.variants.forEach(v=>{
    const original=duplicateKeySvg(v.originalSvg);
    const final=duplicateKeySvg(v.finalSvg);
    if(original)svgKeys.add(original);
    if(final)svgKeys.add(final);
  });
  const titles=[],svgs=[];
  items.forEach(item=>{
    if(item.id===draft.id)return;
    if(title&&String(item.name||"").trim().toLocaleLowerCase("pt-BR")===title)titles.push(item.name);
    const matched=item.variants?.some(v=>{
      const original=duplicateKeySvg(v.originalSvg);
      const final=duplicateKeySvg(v.finalSvg);
      return (original&&svgKeys.has(original))||(final&&svgKeys.has(final));
    });
    if(matched)svgs.push(item.name);
  });
  return {titles:[...new Set(titles)],svgs:[...new Set(svgs)]};
}
function commitDraft(){
  draft.updatedAt=new Date().toISOString();
  const exists=items.some(x=>x.id===draft.id),nextItems=exists?items.map(x=>x.id===draft.id?draft:x):[draft,...items];
  if(!persist(nextItems)){showToast("Não foi possível salvar. Exporte um backup e libere espaço.");return;}
  items=nextItems;render();const msg=exists?"Símbolo atualizado":"Símbolo adicionado";closeEditor();showToast(msg);
}
function showDuplicateWarning(duplicates){
  const parts=[];
  if(duplicates.titles.length)parts.push(`<p><strong>Título já existente</strong><span>${duplicates.titles.map(name=>`“${escapeDuplicateText(name)}”`).join(", ")}</span></p>`);
  if(duplicates.svgs.length)parts.push(`<p><strong>Código SVG já existente</strong><span>${duplicates.svgs.map(name=>`“${escapeDuplicateText(name)}”`).join(", ")}</span></p>`);
  duplicateWarningDetails.innerHTML=parts.join("");
  duplicateWarningDialog.showModal();
}
function escapeDuplicateText(value){
  return String(value||"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function saveDraft(){
  const validation=validateDraft();
  if(!validation.ok){validation.focus?.focus();showToast(validation.error);return;}
  const duplicates=findDraftDuplicates();
  if(duplicates.titles.length||duplicates.svgs.length){showDuplicateWarning(duplicates);return;}
  commitDraft();
}
function addVariant(){ stashCurrent(); const count=draft.variants.length+1,v=newVariant(`Versão ${count}`); draft.variants.push(v); loadVariantToUI(v.id); setTimeout(()=>{els.variantLabel.focus();els.variantLabel.select();},50); }
function deleteActiveVariant(){ if(!draft||draft.variants.length<=1)return; const v=currentVariant(); if(!confirm(`Excluir a versão “${v.label}”?`))return; draft.variants=draft.variants.filter(x=>x.id!==v.id); if(draft.defaultVariantId===v.id)draft.defaultVariantId=draft.variants[0].id; loadVariantToUI(draft.variants[0].id); }
function deleteWholeSymbol(){ if(!draft||!items.some(x=>x.id===draft.id))return; if(!confirm(`Excluir “${draft.name}” e todas as versões?`))return; const nextItems=items.filter(x=>x.id!==draft.id);if(!persist(nextItems)){showToast("Não foi possível atualizar a biblioteca");return;}items=nextItems;render();closeEditor();showToast("Símbolo excluído"); }
async function pasteSvg(){ try{ if(!navigator.clipboard?.readText)throw new Error(); els.svg.value=await navigator.clipboard.readText();updateEditor(); }catch{showToast("Cole o SVG manualmente neste campo");els.svg.focus();} }
function exportLibrary(){ const data=JSON.stringify({app:"Simbolos",version:2,exportedAt:new Date().toISOString(),symbols:items},null,2),blob=new Blob([data],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`simbolos-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);els.libraryMenu.hidden=true; }
function importLibrary(file){ const reader=new FileReader(); reader.onload=()=>{ try{ const data=JSON.parse(String(reader.result)),incoming=Array.isArray(data)?data:data.symbols;if(!Array.isArray(incoming))throw new Error(); const normalized=incoming.map(normalizeItem).filter(Boolean);if(incoming.length&&!normalized.length)throw new Error();const byId=new Map(items.map(x=>[x.id,x]));normalized.forEach(x=>byId.set(x.id,x));const nextItems=[...byId.values()];if(!persist(nextItems)){showToast("Sem espaço para importar. Exporte um backup e libere espaço.");return;}items=nextItems;render();showToast(`${normalized.length} símbolo${normalized.length===1?"":"s"} importado${normalized.length===1?"":"s"}`);}catch{showToast("Backup inválido");}finally{els.importFile.value="";}};reader.onerror=()=>{els.importFile.value="";showToast("Não foi possível ler o arquivo");};reader.readAsText(file); }

duplicateReviewButton.addEventListener("click",()=>duplicateWarningDialog.close());
duplicateSaveAnywayButton.addEventListener("click",()=>{duplicateWarningDialog.close();commitDraft();});
duplicateWarningDialog.addEventListener("cancel",event=>{event.preventDefault();duplicateWarningDialog.close();});
symbolActionsClose.addEventListener("click",closeSymbolActions);
symbolActionsDialog.addEventListener("cancel",event=>{event.preventDefault();closeSymbolActions();});
symbolActionsCopy.addEventListener("click",async()=>{const item=items.find(x=>x.id===symbolActionsItemId);if(!item)return;closeSymbolActions();const def=defaultVariant(item);if(item.variants.length>1)return openVariantChooser(item,"copy");await copyVariant(item,def);});
symbolActionsDownload.addEventListener("click",()=>{const item=items.find(x=>x.id===symbolActionsItemId);if(!item)return;closeSymbolActions();const def=defaultVariant(item);if(item.variants.length>1)return openVariantChooser(item,"download");downloadSvg(item,def);});
symbolActionsEdit.addEventListener("click",()=>{const id=symbolActionsItemId;if(!id)return;closeSymbolActions();openEditor(id);});
symbolActionsDelete.addEventListener("click",()=>{const id=symbolActionsItemId;if(id)deleteSymbolById(id);});
organizerFamilyInput.addEventListener("input",()=>{renderOrganizerFamilyMatches();updateOrganizerBar();});
organizerFamilyInput.addEventListener("focus",renderOrganizerFamilyMatches);
organizerFamilyInput.addEventListener("blur",()=>setTimeout(()=>organizerFamilyMatches.hidden=true,140));
organizeButton.addEventListener("click",()=>setOrganizeMode(!organizeMode));
organizerDone.addEventListener("click",()=>setOrganizeMode(false));
organizerApplyFamily.addEventListener("click",()=>applyFamilyToSelection(organizerFamilyInput.value));
organizerRemoveFamily.addEventListener("click",()=>applyFamilyToSelection(""));
els.add.addEventListener("click",()=>openEditor()); els.emptyAdd.addEventListener("click",()=>openEditor()); els.cancel.addEventListener("click",closeEditor); els.save.addEventListener("click",saveDraft);
els.name.addEventListener("input",()=>{if(draft)els.editorTitle.textContent=els.name.value.trim()||"Novo símbolo";}); els.variantLabel.addEventListener("input",()=>{const v=currentVariant();if(v){v.label=els.variantLabel.value;renderVariantTabs();els.previewVariantName.textContent=els.variantLabel.value||"Sem nome";}});
els.defaultVariant.addEventListener("change",()=>{if(!draft)return;if(els.defaultVariant.checked){draft.defaultVariantId=activeVariantId;renderVariantTabs();}else{els.defaultVariant.checked=true;showToast("Sempre precisa existir uma versão padrão");}});
els.addVariant.addEventListener("click",addVariant); els.deleteVariant.addEventListener("click",deleteActiveVariant); els.deleteSymbol.addEventListener("click",deleteWholeSymbol); els.svg.addEventListener("input",updateEditor); els.previewColor.addEventListener("input",updateEditor); els.fixedColor.addEventListener("input",updateEditor); els.cleanup.addEventListener("change",updateEditor);
document.querySelectorAll('input[name="colorMode"],input[name="sizeMode"]').forEach(x=>x.addEventListener("change",updateEditor)); els.strokeInput.addEventListener("input",()=>{els.strokeInput.dataset.override="true";els.strokeOutput.value=els.strokeInput.value;updateEditor();}); els.restoreStroke.addEventListener("click",()=>{els.strokeInput.dataset.override="false";updateEditor();});
els.paste.addEventListener("click",pasteSvg); els.format.addEventListener("click",()=>{const parsed=parseSvg(els.svg.value);if(!parsed.ok)return showToast(parsed.error);els.svg.value=serializeSvg(parsed.root);updateEditor();}); els.copyOutput.addEventListener("click",async()=>{const result=transformSvg(els.svg.value,optionsFromUI());if(!result.ok)return showToast(result.error);try{await copyText(result.output);showToast(`SVG · ${els.variantLabel.value||"versão"} copiado`);}catch{showToast("Não foi possível copiar");}}); els.downloadOutput.addEventListener("click",()=>{const result=transformSvg(els.svg.value,optionsFromUI());if(!result.ok)return showToast(result.error);downloadSvg({name:els.name.value.trim()||"simbolo"},{label:els.variantLabel.value.trim()||"versao",finalSvg:result.output});});
els.search.addEventListener("input",render); els.clearSearch.addEventListener("click",()=>{els.search.value="";els.search.focus();render();}); els.libraryButton.addEventListener("click",e=>{e.stopPropagation();els.libraryMenu.hidden=!els.libraryMenu.hidden;}); document.addEventListener("click",e=>{if(!els.libraryMenu.hidden&&!els.libraryMenu.contains(e.target))els.libraryMenu.hidden=true;}); els.exportButton.addEventListener("click",exportLibrary); els.importButton.addEventListener("click",()=>{els.libraryMenu.hidden=true;els.importFile.click();}); els.importFile.addEventListener("change",()=>{const file=els.importFile.files?.[0];if(file)importLibrary(file);}); els.aboutStorage.addEventListener("click",()=>{els.libraryMenu.hidden=true;els.info.showModal();}); els.closeInfo.addEventListener("click",()=>els.info.close()); els.closeCopyDialog.addEventListener("click",()=>els.copyDialog.close()); els.editor.addEventListener("cancel",e=>{e.preventDefault();closeEditor();});

render(); if("serviceWorker" in navigator && window.APP_CONFIG?.enableServiceWorker)navigator.serviceWorker.register("./sw.js").catch(()=>{});
