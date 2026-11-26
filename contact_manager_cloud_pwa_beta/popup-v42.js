const $=id=>document.getElementById(id);let contacts=[];let awaiting="";
function remind(show=false){ $("reminder").textContent=show&&awaiting?`Mensagem copiada para @${awaiting}. Confirma como Contactado ou Ignorado antes de trocar de perfil.`:"";}
function canSwitch(u){if(awaiting&&u.toLowerCase()!==awaiting.toLowerCase()){remind(true);$("msgresult").textContent="Resolve primeiro o contacto anterior.";return false;}return true;}
function followerNumber(value){
 if(value===null||value===undefined||value==="") return null;
 let s=String(value).toUpperCase().replace(/\s/g,"").replace(/FOLLOWERS?|SEGUIDORES?/g,"");
 let mult=1;if(s.endsWith("K")){mult=1000;s=s.slice(0,-1);}else if(s.endsWith("M")){mult=1000000;s=s.slice(0,-1);}else if(s.endsWith("B")){mult=1000000000;s=s.slice(0,-1);}
 if(mult===1){s=s.replace(/\./g,"").replace(/,/g,"");}
 else s=s.replace(",",".");
 let n=Number(s);return Number.isFinite(n)?Math.round(n*mult):null;
}
function eligible(x){let n=followerNumber(x.followers);return n!==null&&n>60000;}
function purgeLow(){contacts=contacts.filter(x=>{const n=followerNumber(x.followers);return n===null||n>60000||x.reviewState==="contacted";});}
function refreshStatuses(){for(const x of contacts)x.status=eligible(x)?(x.reviewState||"pending"):"ignorar";}
async function save(){}
function render(){
 $("totalStat").textContent=contacts.length;
 $("pendingStat").textContent=contacts.filter(x=>eligible(x)&&(!x.reviewState||x.reviewState==="pending")).length;
 $("contactedStat").textContent=contacts.filter(x=>x.reviewState==="contacted").length;
 $("ignoredStat").textContent=contacts.filter(x=>!eligible(x)||x.reviewState==="skipped").length;
 const remaining=contacts.filter(x=>eligible(x)&&(!x.reviewState||x.reviewState==="pending")).length;
 $("lowStock").textContent=remaining===0?"Sem contactos pendentes. Adiciona novos perfis no computador.":remaining<=5?`Atenção: restam ${remaining} contactos pendentes.`:"";
 refreshStatuses();
 let q=$("search").value.toLowerCase().replace("@","");
 let eligibleCount=contacts.filter(eligible).length;
 let showOnly=$("eligibleOnly").checked;
 $("historyCount").textContent=`${contacts.filter(x=>eligible(x)&&x.status==="pending").length} pendentes · ${contacts.filter(x=>x.reviewState==="contacted").length} contactados · ${contacts.filter(x=>x.reviewState==="skipped").length} ignorados manualmente`;
 let a=contacts.filter(x=>($("stateFilter").value==="all"||x.status===$("stateFilter").value)&&(!showOnly||eligible(x))&&x.username.toLowerCase().includes(q));
 $("count").textContent=a.length;
 $("filterCount").textContent=`${eligibleCount} acima de 60.000 · ${contacts.length-eligibleCount} ignorados (abaixo de 60.001 ou sem número identificado).`;
 $("list").innerHTML="";
 if($("sort").value!=="recent")a.sort((x,y)=>($("sort").value==="desc"?-1:1)*((followerNumber(x.followers)||0)-(followerNumber(y.followers)||0)));
 a.forEach(x=>{let d=document.createElement("div");d.className="item";let s=document.createElement("span");s.textContent="@"+x.username+(x.followers?" · "+x.followers+" seguidores":" · sem número")+" · "+({pending:"Pendente",contacted:"Contactado",skipped:"Ignorado",ignorar:"Não elegível"}[x.status]||x.status);let b=document.createElement("button");b.textContent="Usar";b.disabled=!eligible(x);b.style.opacity=eligible(x)?"1":".45";b.onclick=()=>{activateContact(x);};if(x.reviewedAt){let date=document.createElement("small");date.textContent="Atualizado: "+new Date(x.reviewedAt).toLocaleString("pt-PT");s.append(document.createElement("br"),date);}d.append(s,b);$("list").append(d);});
}
function activateContact(x){
 if(!x||!canSwitch(x.username))return false;
 $("user").value=x.username;$("name").value=suggestedName(x.username);preview();
 document.querySelector(".message").scrollIntoView({behavior:"instant",block:"start"});return true;
}
function selectNext(exclude){
 let next=contacts.filter(x=>x.username.toLowerCase()!==exclude&&eligible(x)&&(!x.reviewState||x.reviewState==="pending"));
 const sort=$("sort").value;
 if(sort!=="recent")next.sort((x,y)=>(sort==="desc"?-1:1)*(followerNumber(x.followers)-followerNumber(y.followers)));
 const x=next[0];
 if(x){if(!activateContact(x))return null;}else{$("user").value="";$("name").value="";preview();}
 return x;
}
function suggestedName(u){
 const fallback=String(u||"").trim().replace(/^@/,"");
 const clean=fallback.toLowerCase();
 const names="cerasella cerasela alexandra alexandru andreea andrei anastasia antonia antoni bianca carla catalin cristina daniela denisa diana elena emilia florin flavius gabriel gabriela ioana ionut irina laura lavinia maria mariana mihaela mihai nicole nicolle oana patricia raluca robert roxana sabina simona sofia stefan teodora valentina vlad ana ada eva dan ion adrian adriana alessia amalia amelia alex alice alina alin ana anca anton bogdan carmen corina cosmin darius david eduard emil george georgiana iulia iulian laurentiu lucian luiza marc marcela marius matei mircea monica natalia nicoleta paul petru radu rares razvan sandra sebastian silvia sorin tudor victor victoria".split(" ").sort((a,b)=>b.length-a.length);
 const first=clean.split(/[._0-9]/)[0];
 if(!first || /(?:official|shop|store|agency|studio|brand|company|travel|business|market|agriculture)/.test(clean))return fallback;
 const n=names.find(n=>first===n)||names.find(n=>first.startsWith(n)&&first.length>=n.length+2&&(n.length>=4||["ana"].includes(n)));
 return n?n[0].toUpperCase()+n.slice(1):fallback;
}
function message(u){let n=$("name").value.trim();let t=$("template").value;return (n?t.replaceAll("{nome}",n):t.replaceAll(", {nome}","").replaceAll("{nome}","")).replaceAll("{username}",u);}
function preview(){let u=$("user").value.replace(/^@/,"").trim();$("preview").textContent=u?message(u):"Escreve ou seleciona um username.";}
$("search").oninput=render;$("eligibleOnly").onchange=render;$("user").oninput=()=>{if(!canSwitch($("user").value.replace(/^@/,"").trim())){$("user").value=awaiting;return;}$("name").value=suggestedName($("user").value.replace(/^@/,"").trim());preview();};$("name").oninput=preview;$("template").oninput=async()=>{await save();preview();};
$("copy").onclick=async()=>{let u=$("user").value.replace(/^@/,"").trim();if(!u){$("msgresult").textContent="Indica um username.";return;}let target=contacts.find(x=>x.username.toLowerCase()===u.toLowerCase());if(!target||!eligible(target)||target.reviewState==="contacted"||target.reviewState==="skipped"){$("msgresult").textContent="Perfil não elegível ou já tratado. Revê o estado antes de continuar.";return;}if(!canSwitch(u))return;try{await navigator.clipboard.writeText(message(u));}catch(e){$("msgresult").textContent="Não foi possível copiar. Seleciona o texto manualmente.";return;}awaiting=u;remind();$("msgresult").textContent="Mensagem copiada para colares manualmente."};
$("open").onclick=()=>{let u=$("user").value.replace(/^@/,"").trim();let target=contacts.find(x=>x.username.toLowerCase()===u.toLowerCase());if(!target||!eligible(target)||target.reviewState==="contacted"||target.reviewState==="skipped"){$("msgresult").textContent="Perfil não elegível ou já tratado. Revê o estado antes de continuar.";return;}if(u)window.open("https://www.instagram.com/"+encodeURIComponent(u)+"/","_blank","noopener");};
$("stateFilter").onchange=render;
let updatingState=false, stateRevision=0;
for(const state of ["contacted","skipped","pending"]){
 $(""+state).onclick=async()=>{
 if(updatingState)return;
 let u=$("user").value.replace(/^@/,"").trim().toLowerCase();
 let x=contacts.find(c=>c.username.toLowerCase()===u);
 if(!x||!eligible(x)){ $("msgresult").textContent="Seleciona um perfil elegível.";return;}
 if(state==="contacted"&&x.reviewState==="contacted"){ $("msgresult").textContent="Este perfil já está contactado.";return;}
 updatingState=true;stateRevision++;
 try{await api("contacts?username=eq."+encodeURIComponent(u),{method:"PATCH",body:JSON.stringify({status:state,updated_at:new Date().toISOString()}),headers:{Prefer:"return=representation"}}).then(rows=>{if(rows.length!==1)throw Error("Contacto não atualizado")});}catch(e){$("msgresult").textContent=e.message;return;}finally{updatingState=false;}x=contacts.find(c=>c.username.toLowerCase()===u)||x;x.reviewState=state;x.reviewedAt=new Date().toISOString();
 if(state==="contacted"||state==="skipped"){awaiting="";remind();$("stateFilter").value="pending";$("user").value="";$("name").value="";preview();}
 refreshStatuses();
 const next=state!=="pending"?selectNext(u):null;
 render();
 if(next)document.querySelector(".message").scrollIntoView({behavior:"instant",block:"start"});
 $("msgresult").textContent="Estado guardado: "+({contacted:"Contactado",skipped:"Ignorado",pending:"Pendente"}[state])+(state==="pending"?"":next?" · Próximo perfil: @"+next.username:" · Sem contactos pendentes.");
 };
}
$("sort").onchange=render;

const base="https://fxjcjotjvcsduugxqjbd.supabase.co",key="sb_publishable_btMb2nbwSzN6k6JwrGRkGw_R-iZJRv9";
let session=null, timer=null, busy=false, refreshing=null, generation=0;
const sessionKey="contact-manager-mobile-session-v1";
function persist(d){session={access_token:d.access_token,refresh_token:d.refresh_token,expires_at:d.expires_at||Math.floor(Date.now()/1000)+(d.expires_in||3600),user:d.user};localStorage.setItem(sessionKey,JSON.stringify(session));}
function clearSession(){generation++;clearInterval(timer);session=null;localStorage.removeItem(sessionKey);contacts=[];awaiting="";$("workspace").hidden=true;$("logout").hidden=true;$("login").hidden=false;render();}
async function ensureSession(){
 if(!session)throw Error("Inicia sessão.");
 if(session.expires_at>Date.now()/1000+90)return;
 if(refreshing)return refreshing;
 const g=generation;
 refreshing=(async()=>{const r=await fetch(base+"/auth/v1/token?grant_type=refresh_token",{method:"POST",headers:{apikey:key,"Content-Type":"application/json"},body:JSON.stringify({refresh_token:session.refresh_token})});
 if(g!==generation)throw Error("Sessão terminada.");
 if(r.status===400||r.status===401||r.status===403){clearSession();throw Error("Sessão expirada. Entra novamente.");}
 if(!r.ok)throw Error("Não foi possível renovar a sessão. Tenta novamente.");
 const d=await r.json();if(!d.access_token||!d.refresh_token)throw Error("Resposta de sessão inválida.");persist(d);
 })().finally(()=>{refreshing=null;});return refreshing;
}
async function startSession(){clearInterval(timer);$("login").hidden=true;$("logout").hidden=false;$("workspace").hidden=false;await pull();if(session)timer=setInterval(pull,10000);}

let templateDirty=false;
$("template").addEventListener("input",()=>{templateDirty=true;});
const status=s=>$("cloudstatus").textContent=s;
async function api(path,opts={}){
 await ensureSession();
 const r=await fetch(base+"/rest/v1/"+path,{...opts,headers:{apikey:key,Authorization:"Bearer "+session.access_token,"Content-Type":"application/json",...opts.headers}});
 if(!r.ok)throw Error("Erro de sincronização: HTTP "+r.status);
 const body=await r.text();
 return body.trim()?JSON.parse(body):null;
}
async function pull(){
 if(!session||busy||updatingState)return;busy=true;const revision=stateRevision;
 try{
 let rows=[],offset=0;
 while(true){let batch=await api("contacts?select=*&order=username&limit=500&offset="+offset);rows.push(...batch);if(batch.length<500)break;offset+=500;}
 if(updatingState||revision!==stateRevision)return;
 contacts=rows.map(x=>({username:x.username,followers:x.followers,reviewState:x.status,addedAt:x.added_at,reviewedAt:x.updated_at}));
 if(awaiting&&contacts.some(x=>x.username===awaiting.toLowerCase()&&x.reviewState!=="pending")){awaiting="";remind();}
 if(!templateDirty){const settings=await api("contact_settings?select=message_template");if(settings.length&&!templateDirty&&$("template").value!==settings[0].message_template){$("template").value=settings[0].message_template;preview();}}
 render();status("Sincronizado · "+new Date().toLocaleTimeString("pt-PT"));
 }catch(e){status(e.message);}finally{busy=false;}
}
$("login").onsubmit=async e=>{e.preventDefault();try{
 const r=await fetch(base+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:key,"Content-Type":"application/json"},body:JSON.stringify({email:$("email").value,password:$("password").value})});
 const raw=await r.text(); const d=raw.trim()?JSON.parse(raw):{};if(!r.ok||!d.access_token)throw Error("Login recusado.");
 persist(d);$("password").value="";await startSession();
 }catch(e){status(e.message);}};
$("logout").onclick=async()=>{const token=session?.access_token;clearSession();status("Sem sessão");if(token)try{await fetch(base+"/auth/v1/logout?scope=local",{method:"POST",headers:{apikey:key,Authorization:"Bearer "+token}});}catch{}location.reload();};
$("saveTemplate").onclick=async()=>{try{await api("contact_settings?on_conflict=user_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({user_id:session.user.id,message_template:$("template").value})});templateDirty=false;status("Modelo guardado.");}catch(e){status(e.message);}};
async function restore(){try{const saved=JSON.parse(localStorage.getItem(sessionKey)||"null");if(saved?.refresh_token&&saved?.access_token){session=saved;await startSession();}}catch(e){status(e.message);}}
restore();document.addEventListener("visibilitychange",()=>{if(!document.hidden)pull();});
if("serviceWorker" in navigator){navigator.serviceWorker.register("./sw.js?v=40",{updateViaCache:"none"}).then(r=>r.update()).catch(()=>{});}
