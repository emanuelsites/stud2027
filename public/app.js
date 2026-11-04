'use strict';
const A='';
const PHOTO_PLACEHOLDER='/assets/templates/photo-unavailable-16x9.png';
const categories={embriao:'Embrião congelado',gestacao:'Gestação',potro:'Potro'};
const products=window.STUD_DATA.products;
const mares=window.STUD_DATA.mares;
const state={category:'all',query:'',mother:'',expanded:false};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normal=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const title=p=>p.name||`${p.father} × ${p.mother}`;
const parentPair=p=>`<div class="parent-pair" style="--parent-frame-ratio:${Number(p.frameRatio)||1.5}">${['father','mother'].map(side=>`<div class="parent-photo" data-cms-entry="${p.id}" data-cms-parent="${side}">${p[side+'Image']?`<img src="${esc(p[side+'Image'])}" alt="${esc(p[side])}, ${side==='father'?'pai':'mãe'}" loading="lazy" width="600" height="500">`:`<img src="${PHOTO_PLACEHOLDER}" alt="Imagem provisória de ${esc(p[side])}; fotografia em atualização" loading="lazy" width="1600" height="900" data-photo-placeholder>`}<span class="parent-label">${side==='father'?'PAI':'MÃE'}<strong>${esc(p[side])}</strong></span></div>`).join('')}</div>`;
const photo=p=>p.type==='potro'?`<img class="foal-photo" src="${p.image?A+p.image:PHOTO_PLACEHOLDER}" alt="${esc(p.name)}" loading="lazy">`:parentPair(p);
const nameMarkup=p=>p.name?esc(p.name):`${esc(p.father)}<span class="sire-line">× ${esc(p.mother)}</span>`;
const action=p=>p.type==='embriao'?'Ver cruzamento':p.type==='gestacao'?'Conhecer a gestação':'Conhecer o potro';
function crossingCard(p){
 const note=p.type==='gestacao'?`<p class="crossing-note">${esc(p.status==='Situação em confirmação'?'Situação da gestação sob consulta':p.year&&p.year!=='Sob consulta'?'Previsão de nascimento: '+p.year:'Informações sob consulta')}</p>`:'';
 return `<article class="product-card crossing-offer" data-cms-entry="${p.id}" data-visual-record="${p.id}"><h3 class="crossing-code" data-cms-field="commercialName"><a href="${esc(p.url)}">${esc(title(p))}</a></h3>${parentPair(p)}${note}<a class="text-link crossing-action" href="${esc(p.url)}">Conhecer o cruzamento <span aria-hidden="true">→</span></a></article>`;
}
function meta(p){
 if(p.type==='potro')return `<p>Pai: ${esc(p.father)}</p><p>Mãe: ${esc(p.mother)}</p>`;
 if(p.type==='gestacao')return `<p>Previsão de nascimento: ${esc(p.year)}</p>`;
 return `<p>${esc(p.line)}</p>`;
}
function card(p){if(p.type!=='potro')return crossingCard(p);return `<article class="product-card" data-cms-entry="${p.id}" data-visual-record="${p.id}"><button class="image-button" data-detail="${p.id}" aria-label="${esc(action(p)+': '+title(p))}">${photo(p)}${p.availability==='sold'?'<span class="sold-badge">Vendido</span>':''}</button><p class="product-kind">${p.type==='potro'?'Nascimento '+p.year:categories[p.type]}</p><h3 class="product-name" data-cms-field="${p.type==='potro'?'title':'commercialName'}">${nameMarkup(p)}</h3>${p.type!=='potro'?`<p class="product-genetics">${esc(p.father)} × ${esc(p.mother)}</p>`:''}<div class="product-meta">${meta(p)}</div><button class="text-link" data-detail="${p.id}">${p.availability==='sold'?'Ver animal vendido':action(p)} <span aria-hidden="true">→</span></button></article>`;}
function filteredProducts(){
 const q=normal(state.query);
 return products.filter(p=>(state.category==='all'||p.type===state.category)&&(!state.mother||p.mother===state.mother)&&(!q||normal([p.name,p.mother,p.father,p.line,p.year,categories[p.type]].filter(Boolean).join(' ')).includes(q)));
}
function renderCatalog(){
 const all=filteredProducts();const limited=state.category==='all'&&!state.query&&!state.mother&&!state.expanded;
 const order=['embriao','gestacao','potro'];
 const labels={embriao:'Embriões congelados',gestacao:'Gestações futuras',potro:'Potros'};
 const links={embriao:'/embrioes/congelados/',gestacao:'/gestacoes/',potro:'/potros/'};
 const grouped=state.category==='all';
 let count=0;
 const grid=document.querySelector('#catalog-grid');
 grid.classList.toggle('catalog-grouped',grouped);
 grid.innerHTML=grouped?order.map(type=>{
  const group=all.filter(p=>p.type===type);if(!group.length)return '';
  const shown=limited?group.slice(0,3):group;count+=shown.length;
  return `<section class="catalog-category" aria-label="${labels[type]}"><div class="section-head"><h3>${labels[type]}</h3><a class="text-link" href="${links[type]}">Ver todos (${group.length}) →</a></div><div class="product-grid">${shown.map(card).join('')}</div></section>`;
 }).join(''):all.map(card).join('');
 const visibleCount=grouped?count:all.length;
 document.querySelector('#empty').hidden=all.length!==0;
 document.querySelector('#show-all').hidden=!limited||visibleCount===all.length;
 document.querySelector('#catalog-status').textContent=`${all.length} opções encontradas. ${visibleCount} exibidas.`;
 document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===state.category)));
 document.querySelector('#active-line').hidden=!state.query&&!state.mother;
 document.querySelector('#active-description').textContent=state.mother?`Linhagem materna: ${state.mother}`:`Busca: ${state.query}`;
 window.StudVisual?.refresh();
}
function setCategory(value){state.category=value;state.query='';state.mother='';state.expanded=false;document.querySelector('#catalog-search').value='';renderCatalog();}
function scrollCatalog(){document.querySelector('#catalogo').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
function filterMother(name){state.category='all';state.mother=name;state.query='';state.expanded=true;document.querySelector('#catalog-search').value='';renderCatalog();scrollCatalog();}
const detail=document.querySelector('#detail-dialog');
const contact=document.querySelector('#contact-dialog');
function openDetail(id){
 const p=products.find(x=>x.id===id);if(!p)return;
 document.querySelector('#detail-body').innerHTML=`<div class="detail-content">${photo(p)}<p class="eyebrow">${categories[p.type]}</p><h2 id="detail-title">${nameMarkup(p)}</h2><dl class="details-table"><div><dt>Pai ♂</dt><dd>${esc(p.father)}</dd></div><div><dt>Mãe ♀</dt><dd>${p.mother==='Balance Z'?'<a class="text-link" href="/animais/balance-z/">Balance Z ↗</a>':esc(p.mother)}</dd></div>${p.year&&p.type!=='embriao'?`<div><dt>${p.type==='gestacao'?'Previsão de nascimento':'Nascimento'}</dt><dd>${esc(p.year)}</dd></div>`:''}${p.genetics?`<div><dt>Genética</dt><dd>${esc(p.genetics)}</dd></div>`:''}${p.status?`<div><dt>Disponibilidade</dt><dd>${esc(p.status)}</dd></div>`:''}${p.line?`<div><dt>Origem materna</dt><dd>${esc(p.line.replace('Linha materna: ',''))}</dd></div>`:''}</dl><div class="detail-actions"><button class="button" data-inquire="${p.id}">${p.availability==='sold'?'Consultar outras opções':'Consultar '+(p.type==='embriao'?'este embrião':p.type==='gestacao'?'esta gestação':'este potro')} <span aria-hidden="true">↗</span></button><button class="text-link" data-mother="${esc(p.mother)}">Explorar esta linhagem <span aria-hidden="true">→</span></button></div><p class="availability">Consulte a equipe sobre disponibilidade, condições e ${p.type==='gestacao'?'situação atual da gestação':'informações atualizadas'}.</p></div>`;
 document.querySelector('#detail-body').insertAdjacentHTML('beforeend',`<a class="text-link full-record" href="${esc(p.url)}">Abrir ficha completa →</a>`);
 detail.showModal();
}
function openContact(id){
 const p=products.find(x=>x.id===id);if(detail.open)detail.close();
 document.querySelector('#inquiry-interest').value=p?({embriao:'Embriões',gestacao:'Gestações',potro:'Potros'}[p.type]):'Embriões';
 document.querySelector('#inquiry-message').value=p?`Olá, equipe Stud PB! Gostaria de saber mais sobre ${title(p)} (${categories[p.type].toLowerCase()}).\n\nPai: ${p.father}\nMãe: ${p.mother}\n\nPodem me informar a disponibilidade e as condições?`:'Olá, equipe Stud PB! Gostaria de conversar sobre as opções de embriões, gestações e potros.';
 document.querySelector('.form-status').textContent='';contact.showModal();
}
function inquiryMessage(){const name=document.querySelector('#inquiry-name').value.trim();return (name?`Meu nome é ${name}.\n\n`:'')+document.querySelector('#inquiry-message').value.trim();}
function renderEditorial(id,selector,description){const p=products.find(x=>x.id===id);if(!p){document.querySelector(selector).hidden=true;return;}document.querySelector(selector).innerHTML=`<button class="image-button" data-detail="${id}" aria-label="${esc(title(p))}">${parentPair(p)}</button><p class="product-kind">${categories[p.type]}</p><h3 class="product-name" data-cms-field="title">${nameMarkup(p)}</h3><p class="product-meta">${description}</p><a class="text-link" href="#catalogo" data-category="${p.type}">Explorar ${p.type==='embriao'?'embriões':'gestações'} <span aria-hidden="true">→</span></a>`;}
renderCatalog();
// The reproduction section explains the two modalities instead of repeating products.
document.querySelector('#mare-grid').innerHTML=mares.map(m=>{
 const isBalance=!!m.url;
 const image=`<img class="mare-photo" src="${A+m.image}" alt="${esc(m.name)}" loading="lazy" width="300" height="500">`;
 const visual=isBalance?`<a class="image-button" href="${esc(m.url)}" aria-label="Conhecer a matriz ${esc(m.name)}">${image}</a>`:`<button class="image-button" data-mother="${esc(m.name)}" aria-label="Conhecer a linhagem de ${esc(m.name)}">${image}</button>`;
 return `<article class="mare-card">${visual}<h3>${esc(m.name)}</h3><p>${esc(m.line)}</p>${isBalance?`<a class="text-link matrix-profile-link" href="${esc(m.url)}">Conheça a matriz <span aria-hidden="true">→</span></a>`:''}${m.descendantsURL?`<a class="text-link" href="${esc(m.descendantsURL)}">${esc(m.descendantsLabel)} <span aria-hidden="true">→</span></a>`:''}</article>`;
}).join('');
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#navegacao');
function closeMenu(){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menu');nav.classList.remove('open');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');nav.classList.toggle('open',open);});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
document.addEventListener('click',e=>{
 const el=e.target.closest('button,a');if(!el)return;
 if(el.dataset.category){e.preventDefault();setCategory(el.dataset.category);closeMenu();scrollCatalog();}
 if(el.dataset.filter){setCategory(el.dataset.filter);}
 if(el.dataset.detail)openDetail(el.dataset.detail);
 if(el.dataset.mother){if(detail.open)detail.close();filterMother(el.dataset.mother);}
 if(el.dataset.inquire)openContact(el.dataset.inquire);
 if(el.hasAttribute('data-contact'))openContact();
 if(el.hasAttribute('data-close'))el.closest('dialog').close();
 if(el.closest('#navegacao'))closeMenu();
});
[detail,contact].forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close();}));
document.querySelector('#catalog-search').addEventListener('input',e=>{state.query=e.target.value;state.mother='';state.expanded=true;renderCatalog();});
document.querySelector('#clear-search').addEventListener('click',()=>{setCategory('all');document.querySelector('#catalog-search').focus();});
document.querySelector('#show-all').addEventListener('click',()=>{state.expanded=true;renderCatalog();});
document.querySelector('#inquiry-form').addEventListener('submit',async e=>{e.preventDefault();const form=e.target,button=form.querySelector('[type=submit]'),status=form.querySelector('.form-status');button.disabled=true;status.textContent='Enviando sua consulta…';try{const r=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:document.querySelector('#inquiry-name').value,email:document.querySelector('#inquiry-email').value,phone:'',interest:document.querySelector('#inquiry-interest').value,message:document.querySelector('#inquiry-message').value,consent:document.querySelector('#inquiry-consent').checked,website:''})});const data=await r.json();if(!r.ok)throw Error(data.error);status.textContent=data.message}catch(err){status.textContent=err.message}finally{button.disabled=false}});
document.querySelector('.copy-message').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(inquiryMessage());document.querySelector('.form-status').textContent='Mensagem copiada. Você pode encaminhá-la para a equipe do Stud PB.';}catch{document.querySelector('#inquiry-message').focus();document.querySelector('#inquiry-message').select();document.querySelector('.form-status').textContent='Mensagem selecionada. Use Copiar no seu dispositivo.';}});
const topButton=document.querySelector('.back-top');window.addEventListener('scroll',()=>{topButton.hidden=window.scrollY<700;},{passive:true});topButton.addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));

const initialCategory=new URLSearchParams(window.location.search).get('categoria');
if(['embriao','gestacao','potro'].includes(initialCategory))setCategory(initialCategory);
