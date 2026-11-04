'use strict';
(()=>{
 const $=id=>document.getElementById(id),frame=$('visual-frame'),initial=JSON.parse($('visual-initial').textContent);
 let context,path=initial.path,selected=null,selectionRange=null,editing=true,dirty=false,saving=false,images=[],snapshots=new Map();
 let pagePatches=new Map(),globalPatches=new Map(),recordChanges=new Map();
 const status=text=>$('visual-status').textContent=text;
 const clone=value=>structuredClone(value);
 async function api(url,data){const r=await fetch(url,data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const out=await r.json();if(!r.ok)throw Error(out.error||'Não foi possível concluir.');return out;}
 function changed(){dirty=true;status('Alterações na prévia. Clique em Salvar alterações para publicar.');}
 function entryFor(el){const id=el.closest('[data-cms-entry]')?.dataset.cmsEntry;return context?.entries.find(e=>e.id===id);}
 function photosOf(e){return [...new Set([e.image,...e.gallery].filter(Boolean))];}
 function changeRecord(entry,key,value){if(!recordChanges.has(entry.id))recordChanges.set(entry.id,{id:entry.id,version:entry.version,changes:{}});recordChanges.get(entry.id).changes[key]=value;changed();}
 function patchFor(el,kind='style'){const key=el.dataset.visualKey;if(!key)throw Error('Selecione um elemento da página.');const map=/^(header|footer)(\/|$)/.test(key)?globalPatches:pagePatches;let patch=map.get(key);if(!patch){patch={key,kind,styles:{}};map.set(key,patch);}if(kind!=='style')patch.kind=kind;return patch;}
 function captureRange(){const s=frame.contentWindow.getSelection();if(s?.rangeCount&&selected?.kind==='text'){const range=s.getRangeAt(0);if(selected.el.contains(range.commonAncestorContainer)||selected.el===range.commonAncestorContainer)selectionRange=range.cloneRange();}}
 function restoreRange(){selected?.el.focus();if(selectionRange){try{const s=frame.contentWindow.getSelection();s.removeAllRanges();s.addRange(selectionRange);}catch{selectionRange=null;}}}
 function recordBinding(el){const entry=entryFor(el);if(!entry)return null;const field=el.dataset.cmsField;if(field==='title'&&entry.kind!=='crossing')return {entry,field};if(field==='commercialName'&&entry.kind==='crossing')return {entry,field};if(field==='body')return {entry,field};return null;}
 function saveText(){if(!selected||selected.kind!=='text')return;const el=selected.el,binding=recordBinding(el);if(binding?.field==='body'){changeRecord(binding.entry,'bodyHtml',el.innerHTML);}else{const patch=patchFor(el,'text');patch.html=el.innerHTML;if(binding&&['title','commercialName'].includes(binding.field)){const title=el.textContent.trim();changeRecord(binding.entry,binding.field,title);Object.assign(patch,{binding:'title',entryId:binding.entry.id,expectedText:title});}}changed();}
 function remember(el){if(!snapshots.has(el.dataset.visualKey))snapshots.set(el.dataset.visualKey,{html:el.innerHTML,style:el.getAttribute('style'),src:el.getAttribute('src')});}
 function colorHex(color){const m=color?.match(/\d+/g);return m&&m.length>=3?'#'+m.slice(0,3).map(n=>(+n).toString(16).padStart(2,'0')).join(''):'#725432';}
 function select(el,kind='text'){
  if(selected?.el!==el){selected?.el.removeAttribute('contenteditable');selected?.el.removeAttribute('data-visual-active');selectionRange=null;}
  frame.contentWindow.StudVisual.stamp();remember(el);selected={el,kind};el.setAttribute('data-visual-active',kind);
  $('visual-selection-title').textContent=kind==='image'?'Editar imagem':kind==='video'?'Editar vídeo':kind==='section'?'Editar seção':'Editar texto';
  $('visual-selection-description').textContent=kind==='text'?'Digite na página ou selecione um trecho e use a barra de formatação.':kind==='video'?'Atualize o link do YouTube, o título e a capa.':'Use os campos abaixo para atualizar o elemento selecionado.';
  $('visual-media-fields').hidden=!['image','video','background'].includes(kind);$('visual-video-cover-label').hidden=kind!=='video';$('visual-media-title-label').hidden=kind!=='video';document.querySelector('.visual-upload').hidden=kind==='video';
  $('visual-url-label').firstChild.textContent=kind==='video'?'Link do YouTube':'URL da imagem';
  if(kind==='text'){el.contentEditable='true';el.spellcheck=true;const style=frame.contentWindow.getComputedStyle(el);$('visual-size').value=Math.round(parseFloat(style.fontSize));$('visual-font').value=style.fontFamily.split(',')[0].replace(/["']/g,'').trim();$('visual-color').value=colorHex(style.color);}
  if(kind==='image')$('visual-media-url').value=el.currentSrc||el.src;
  if(kind==='background')$('visual-media-url').value=frame.contentWindow.getComputedStyle(el).backgroundImage.replace(/^url\(["']?|["']?\)$/g,'');
  if(kind==='video'){
   const entry=entryFor(el),active=el.closest('.animal-videos')?.querySelector('[data-video-select][aria-pressed="true"]');const index=Number(active?.dataset.videoSelect||0);selected.videoIndex=index;selected.entry=entry;
   const video=entry?(recordChanges.get(entry.id)?.changes.videos||entry.info.videos||[])[index]:null;const existing=pagePatches.get(el.dataset.visualKey)||globalPatches.get(el.dataset.visualKey);
   $('visual-media-url').value=video?'https://www.youtube.com/watch?v='+video.youtubeId:existing?.url?'https://www.youtube.com/watch?v='+existing.url:el.querySelector('iframe')?.src||el.src||'';
   $('visual-media-title').value=video?.title||existing?.title||'Vídeo Stud PB';$('visual-video-cover').value=video?.cover||existing?.cover||'';
  }
 }
 function bindDocument(){
  const doc=frame.contentDocument;if(!doc?.querySelector('main')){status('Entre novamente no admin para continuar.');return;}
  frame.contentWindow.StudVisual?.stamp();const style=doc.createElement('style');style.textContent='[data-visual-active]{outline:2px solid #725432!important;outline-offset:5px!important} [contenteditable=true]{cursor:text!important;min-height:1em} body[data-editing=true] [data-visual-key]:hover{outline:1px dashed #b89b71;outline-offset:3px}';doc.head.append(style);doc.body.dataset.editing=String(editing);
  doc.addEventListener('selectionchange',captureRange);doc.addEventListener('input',e=>{if(selected?.kind==='text'&&selected.el.contains(e.target))saveText();});
  doc.addEventListener('paste',e=>{if(!editing||selected?.kind!=='text')return;e.preventDefault();doc.execCommand('insertText',false,e.clipboardData.getData('text/plain'));saveText();});
  doc.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();},true);
  doc.addEventListener('click',e=>{
   const target=e.target;if(!editing){const a=target.closest('a');if(a){const u=new URL(a.href);if(u.origin===location.origin&&!a.getAttribute('href').startsWith('#')&&!u.pathname.startsWith('/admin')){e.preventDefault();e.stopImmediatePropagation();go(u.pathname);}}return;}
   e.preventDefault();e.stopImmediatePropagation();
   const stage=target.closest('.animal-video-stage,.visual-video-stage,.video-options');if(stage){select(stage.closest('.video-options')?stage.closest('.animal-videos').querySelector('.animal-video-stage'):stage,'video');return;}
   if(target.tagName==='IFRAME'){select(target,'video');return;}
   if(target.tagName==='IMG'){select(target,'image');return;}
   const binding=target.closest('[data-cms-field]');const text=binding||target.closest('h1,h2,h3,h4,h5,h6,p,li,dt,dd,address,figcaption,span,a,button,label');
   if(text&&!text.querySelector('input,textarea,select,img,iframe')){
    const same=selected?.el===text;select(text,'text');text.focus();
    if(!same){let caret=doc.caretRangeFromPoint?.(e.clientX,e.clientY);if(!caret||!text.contains(caret.startContainer)){caret=doc.createRange();caret.selectNodeContents(text);caret.collapse(false);}selectionRange=caret;restoreRange();}else captureRange();
   }else{const section=target.closest('section,article,main');if(section)select(section,frame.contentWindow.getComputedStyle(section).backgroundImage!=='none'?'background':'section');}
  },true);
  doc.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();}});
  images=[...doc.images].filter(img=>!img.closest('.photo-dialog'));$('visual-image-list').replaceChildren(new Option('Selecionar uma imagem…',''),...images.map((img,i)=>new Option((img.alt||'Imagem '+(i+1)).slice(0,60),String(i))));
  status('Clique no conteúdo para editar. As alterações só são publicadas ao salvar.');
 }
 async function load(next){status('Carregando página…');context=await api('/api/visual/context?path='+encodeURIComponent(next));path=context.path;pagePatches=new Map(context.patches.map(p=>[p.key,p]));globalPatches=new Map(context.globalPatches.map(p=>[p.key,p]));recordChanges=new Map();snapshots=new Map();selected=null;dirty=false;$('visual-page').replaceChildren(...context.pages.map(p=>new Option(p.title,p.path)));$('visual-page').value=path;frame.src='/admin/preview/?path='+encodeURIComponent(path);}
 function go(next){if(dirty&&!confirm('Há alterações não salvas. Deseja abrir outra página e descartá-las?'))return;load(next).catch(err=>status(err.message));}
 function styleSelection(property,value){if(!selected)return status('Selecione um texto ou uma seção primeiro.');const el=selected.el;restoreRange();const range=frame.contentWindow.getSelection()?.rangeCount?frame.contentWindow.getSelection().getRangeAt(0):null;
  if(selected.kind==='text'&&range&&!range.collapsed&&el.contains(range.commonAncestorContainer)){const span=frame.contentDocument.createElement('span');span.style[property]=value;span.append(range.extractContents());range.insertNode(span);const next=frame.contentDocument.createRange();next.selectNodeContents(span);selectionRange=next;restoreRange();saveText();}else{el.style[property]=value;patchFor(el).styles[property]=value;changed();}
 }
 document.querySelectorAll('[data-command]').forEach(b=>{b.addEventListener('mousedown',e=>e.preventDefault());b.onclick=()=>{if(selected?.kind!=='text')return status('Selecione um texto na página.');restoreRange();let value=null;if(b.dataset.command==='createLink'){value=prompt('Endereço do link (https://...):','https://');if(!value)return;if(!/^(https:\/\/|mailto:|tel:|\/(?!\/)|#)/.test(value))return status('Use um endereço válido.');}const doc=frame.contentDocument;doc.execCommand('styleWithCSS',false,true);doc.execCommand(b.dataset.command,false,value);captureRange();saveText();};});
 $('visual-font').onchange=e=>styleSelection('fontFamily',e.target.value);$('visual-size').onchange=e=>{const size=+e.target.value;if(size>=8&&size<=120)styleSelection('fontSize',size+'px');};$('visual-color').onchange=e=>styleSelection('color',e.target.value);$('visual-highlight').onchange=e=>styleSelection('backgroundColor',e.target.value);
 $('visual-mode').onclick=()=>{editing=!editing;$('visual-mode').textContent=editing?'Modo edição':'Navegar no site';$('visual-mode').setAttribute('aria-pressed',String(editing));frame.contentDocument.body.dataset.editing=String(editing);selected?.el.removeAttribute('contenteditable');};
 $('visual-mobile').onclick=()=>{const active=$('visual-mobile').getAttribute('aria-pressed')!=='true';$('visual-mobile').setAttribute('aria-pressed',String(active));document.querySelector('.visual-canvas').classList.toggle('mobile-preview',active);};
 $('visual-page').onchange=e=>go(e.target.value);$('visual-image-list').onchange=e=>{if(e.target.value!==''){const el=images[Number(e.target.value)];el.scrollIntoView({block:'center'});select(el,'image');}};
 function idFromURL(value){try{const u=new URL(value);if(!['youtu.be','youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(u.hostname))return '';const id=u.hostname==='youtu.be'?u.pathname.slice(1).split('/')[0]:u.searchParams.get('v')||u.pathname.split('/')[2];return /^[A-Za-z0-9_-]{11}$/.test(id)?id:'';}catch{return '';}}
 $('visual-apply-media').onclick=()=>{
  if(!selected)return;const {el,kind}=selected,url=$('visual-media-url').value.trim();if(kind==='video'){
   const id=idFromURL(url);if(!id)return status('Use um link válido do YouTube.');const video={youtubeId:id,title:$('visual-media-title').value.trim()||'Vídeo Stud PB',cover:$('visual-video-cover').value.trim()};
   if(selected.entry){const videos=clone(recordChanges.get(selected.entry.id)?.changes.videos||selected.entry.info.videos||[]);videos[selected.videoIndex]=video;changeRecord(selected.entry,'videos',videos);}
   else{const patch=patchFor(el,'video');Object.assign(patch,{url:id,title:video.title,cover:video.cover,placement:selected.placement||patch.placement||'replace'});}
   frame.contentWindow.StudVisual.video(el,{key:el.dataset.visualKey,url:id,title:video.title,cover:video.cover,placement:selected.placement||'replace'});changed();return;
  }
  if(!/^(https:\/\/|\/(?:assets|media)\/)/.test(url))return status('Use uma imagem HTTPS ou envie um arquivo.');
  if(kind==='image'){
   const entry=entryFor(el),oldURL=el.getAttribute('src'),photos=entry?clone(recordChanges.get(entry.id)?.changes.photos||photosOf(entry)):[];
   let index=Number(el.closest('[data-gallery-select]')?.dataset.gallerySelect||el.closest('[data-profile-gallery]')?.querySelector('[data-gallery-open]')?.dataset.galleryIndex||0);
   const own=entry&&!el.closest('.parent-pair,.animal-videos')&&photos[index]&&new URL(photos[index],location.origin).href===new URL(oldURL,location.origin).href;
   const parentSide=el.closest('[data-cms-parent]')?.dataset.cmsParent;
   if(entry?.kind==='crossing'&&['father','mother'].includes(parentSide))changeRecord(entry,parentSide+'Image',url);
   else if(own){photos[index]=url;changeRecord(entry,'photos',photos);}else Object.assign(patchFor(el,'image'),{url,title:el.alt||''});
   for(const image of frame.contentDocument.images)if(image.getAttribute('src')===oldURL){image.src=url;image.removeAttribute('srcset');}
  }else{el.style.backgroundImage='url("'+url.replaceAll('"','%22')+'")';Object.assign(patchFor(el,'background'),{url});}changed();
 };
 $('visual-upload').onclick=async()=>{const file=$('visual-file').files[0];if(!file)return status('Selecione uma imagem.');try{status('Enviando imagem…');const out=await window.StudUpload(file);$('visual-media-url').value=out.url;$('visual-apply-media').click();}catch(err){status(err.message)}};
 $('visual-add-video').onclick=()=>{
  const entry=context.entries.find(e=>e.id===context.entryId);if(entry&&entry.kind!=='page'){const videos=recordChanges.get(entry.id)?.changes.videos||entry.info.videos||[];if(videos.length>=10)return status('Use até 10 vídeos por cadastro.');const anchor=frame.contentDocument.querySelector('.animal-videos .animal-video-stage')||frame.contentDocument.querySelector('main>section:last-of-type');select(anchor,'video');selected.entry=entry;selected.videoIndex=videos.length;selected.placement='after';$('visual-media-url').value='';$('visual-media-title').value=entry.title+' em movimento';status('Insira o link do YouTube e clique em Aplicar na prévia.');return;}
  const anchor=selected?.el.closest('section,article')||frame.contentDocument.querySelector('main');select(anchor,'video');selected.entry=null;selected.placement=anchor.tagName==='MAIN'?'append':'after';$('visual-media-url').value='';$('visual-media-title').value='Vídeo Stud PB';status('Insira o link do YouTube e clique em Aplicar na prévia.');
 };
 $('visual-remove-edit').onclick=()=>{if(!selected)return;const {el,kind}=selected,key=el.dataset.visualKey,snapshot=snapshots.get(key);pagePatches.delete(key);globalPatches.delete(key);if(snapshot){el.innerHTML=snapshot.html;snapshot.style===null?el.removeAttribute('style'):el.setAttribute('style',snapshot.style);if(snapshot.src!==null)el.setAttribute('src',snapshot.src);}const binding=recordBinding(el);if(binding&&recordChanges.has(binding.entry.id)){const record=recordChanges.get(binding.entry.id);delete record.changes[binding.field==='body'?'bodyHtml':'title'];}if(kind==='image'){const entry=entryFor(el),record=entry&&recordChanges.get(entry.id);if(record?.changes.photos)delete record.changes.photos;}changed();};
 async function save(){if(saving||!context)return;saving=true;$('visual-save').disabled=true;selected?.kind==='text'&&saveText();try{status('Salvando alterações…');await api('/api/visual/save',{path,revision:context.revision,globalRevision:context.globalRevision,patches:[...pagePatches.values()],globalPatches:[...globalPatches.values()],records:[...recordChanges.values()].filter(r=>Object.keys(r.changes).length)});dirty=false;location.assign('/admin/?saved=visual');}catch(err){status(err.message);saving=false;$('visual-save').disabled=false;}}
 $('visual-save').onclick=save;$('visual-back').onclick=e=>{if(dirty&&!confirm('Deseja sair sem salvar as alterações?'))e.preventDefault();};window.addEventListener('beforeunload',e=>{if(dirty&&!saving){e.preventDefault();e.returnValue='';}});frame.onload=bindDocument;load(path).catch(err=>status(err.message));
})();
