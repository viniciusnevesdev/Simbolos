(()=>{
  const SEEN_KEY="simbolos.official.organizeDemoSeen.v2";

  function install(){
    const organizerBar=document.getElementById("organizerBar");
    const organizeButton=document.getElementById("organizeButton");
    if(!organizerBar||!organizeButton)return false;
    if(document.getElementById("organizeDemoDialog"))return true;

    const head=organizerBar.querySelector(".organizer-head");
    const done=document.getElementById("organizerDoneButton");
    const help=document.createElement("button");
    help.id="organizerHelpButton";
    help.className="organizer-help";
    help.type="button";
    help.textContent="Como trocar";
    done?.before(help);

    const dialog=document.createElement("dialog");
    dialog.id="organizeDemoDialog";
    dialog.className="organize-demo-dialog";
    dialog.innerHTML=`<div class="organize-demo-card"><button class="organize-demo-close" type="button" aria-label="Fechar demonstração">×</button><p class="eyebrow">Reorganizar</p><h2>Troque em dois toques</h2><p>Toque em <strong>Trocar lugar</strong> no primeiro ícone e depois no outro. Eles invertem as posições.</p><div class="organize-demo-motion" aria-hidden="true"><span class="organize-demo-tile tile-a">◇</span><span class="organize-demo-gap"></span><span class="organize-demo-tile tile-b">⌁</span><span class="organize-demo-hand">⇄</span></div><button class="organize-demo-done" type="button">Entendi</button></div>`;
    document.body.appendChild(dialog);

    const show=()=>{if(!dialog.open)dialog.showModal();};
    const close=()=>{if(dialog.open)dialog.close();try{localStorage.setItem(SEEN_KEY,"1");}catch{}};
    help.addEventListener("click",show);
    dialog.querySelector(".organize-demo-close").addEventListener("click",close);
    dialog.querySelector(".organize-demo-done").addEventListener("click",close);
    dialog.addEventListener("cancel",event=>{event.preventDefault();close();});
    organizeButton.addEventListener("click",()=>setTimeout(()=>{
      try{if(document.body.classList.contains("organize-mode")&&!localStorage.getItem(SEEN_KEY))show();}catch{if(document.body.classList.contains("organize-mode"))show();}
    },260));
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{if(install()||++tries>80)clearInterval(timer);},75);
})();
