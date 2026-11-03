'use strict';
(()=>{
 const isHome=!!window.STUD_DATA;
 const placeholder='/assets/templates/photo-unavailable-16x9.png';
 const photoSelector='.library-photo>img,.parent-photo>img,.mare-main-photo>img,.foal-photo,.mare-photo';
 function missingPhoto(image){
  if(!image.matches(photoSelector)||image.getAttribute('src')===placeholder)return;
  image.dataset.failedPhoto=image.getAttribute('src')||'';
  image.src=placeholder;image.alt='Fotografia em atualização. Imagem provisória do Stud PB.';
  image.setAttribute('data-photo-placeholder','');
 }
 document.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement)missingPhoto(event.target)},true);
 document.querySelectorAll(photoSelector).forEach(image=>{if(image.complete&&!image.naturalWidth)missingPhoto(image)});
 const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#navegacao');
 if(!isHome&&menu)menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');nav.classList.toggle('open',open)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.nav-dropdown[open]').forEach(d=>d.open=false);menu?.setAttribute('aria-expanded','false');nav?.classList.remove('open')}});
 document.addEventListener('click',e=>{document.querySelectorAll('.nav-dropdown[open]').forEach(d=>{if(!d.contains(e.target))d.open=false})});
 const search=document.querySelector('#library-search'),year=document.querySelector('#library-year');
 const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function filter(){let n=0;document.querySelectorAll('.library-card').forEach(card=>{const matches=normalize(card.dataset.search).includes(normalize(search?.value||''))&&(!year?.value||card.dataset.year===year.value);card.hidden=!matches;if(matches)n++});const status=document.querySelector('#library-count');if(status)status.textContent=n+' opções';const empty=document.querySelector('#library-empty');if(empty)empty.hidden=n!==0}
 search?.addEventListener('input',filter);year?.addEventListener('change',filter);document.querySelector('#reset-library')?.addEventListener('click',()=>{search.value='';if(year)year.value='';filter();search.focus()});
 const tree=document.querySelector('#pedigree-data');if(tree&&window.StudPedigree){const data=JSON.parse(tree.textContent);document.querySelector('#animal-pedigree').innerHTML=window.StudPedigree.markup(data.record,{order:data.order})}
 const form=document.querySelector('#public-inquiry');if(form)form.addEventListener('submit',async e=>{e.preventDefault();const button=form.querySelector('[type=submit]'),status=form.querySelector('[role=status]');button.disabled=true;status.textContent='Enviando sua consulta…';const data=Object.fromEntries(new FormData(form));data.consent=form.elements.consent.checked;try{const r=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const j=await r.json();if(!r.ok)throw Error(j.error);form.reset();status.textContent=j.message}catch(err){status.textContent=err.message||'Não foi possível enviar. Use o e-mail do Stud PB.'}finally{button.disabled=false}});
 const mediaElement=document.querySelector('#profile-media-data');
 const media=mediaElement?JSON.parse(mediaElement.textContent):{photos:[],videos:[]};
 let photoIndex=0,videoIndex=0;
 const gallery=document.querySelector('[data-profile-gallery]');
 function selectPhoto(index){
  if(!media.photos.length||!gallery)return;
  photoIndex=(index+media.photos.length)%media.photos.length;
  const main=gallery.querySelector('[data-gallery-open]'),img=main.querySelector('img');
  main.href=media.photos[photoIndex];main.dataset.galleryIndex=String(photoIndex);img.src=main.href;img.alt=media.name+' • Fotografia '+(photoIndex+1)+' de '+media.photos.length;
  gallery.querySelectorAll('[data-gallery-select]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.gallerySelect)===photoIndex)));
  const counter=gallery.querySelector('[data-gallery-counter]');if(counter)counter.textContent=(photoIndex+1)+' / '+media.photos.length;
 }
 gallery?.addEventListener('click',e=>{const select=e.target.closest('[data-gallery-select]'),step=e.target.closest('[data-gallery-step]');if(select)selectPhoto(Number(select.dataset.gallerySelect));if(step)selectPhoto(photoIndex+Number(step.dataset.galleryStep))});
 const videoStage=document.querySelector('[data-video-stage]');
 function selectVideo(index){
  if(!media.videos[index]||!videoStage)return;videoIndex=index;const v=media.videos[index];
  videoStage.replaceChildren();const button=document.createElement('button');button.type='button';button.className='animal-video-poster';button.dataset.videoPlay='';button.setAttribute('aria-label','Reproduzir '+v.title);
  const img=document.createElement('img');img.src=v.cover||media.photos[0]||'https://i.ytimg.com/vi/'+v.youtubeId+'/hqdefault.jpg';img.alt=media.name;img.width=1280;img.height=720;
  const symbol=document.createElement('span');symbol.className='video-play-symbol';symbol.setAttribute('aria-hidden','true');symbol.textContent='▶';const caption=document.createElement('span');caption.className='video-play-caption';caption.textContent='Assistir ao vídeo';button.append(img,symbol,caption);videoStage.append(button);
  document.querySelector('[data-video-title]').textContent=v.title;document.querySelector('[data-video-external]').href='https://www.youtube.com/watch?v='+v.youtubeId;
  document.querySelectorAll('[data-video-select]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.videoSelect)===index)));
 }
 document.querySelector('.animal-videos')?.addEventListener('click',e=>{
  const select=e.target.closest('[data-video-select]');if(select){selectVideo(Number(select.dataset.videoSelect));return;}
  if(!e.target.closest('[data-video-play]'))return;
  const v=media.videos[videoIndex];if(!v||!/^[A-Za-z0-9_-]{11}$/.test(v.youtubeId))return;
  const iframe=document.createElement('iframe');iframe.src='https://www.youtube-nocookie.com/embed/'+v.youtubeId+'?autoplay=1&rel=0&playsinline=1';iframe.title=v.title;iframe.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';videoStage.replaceChildren(iframe);iframe.focus();
 });
 let lightbox,lightboxPhotos=[],lightboxIndex=0,returnFocus;
 function lightboxPhoto(index){lightboxIndex=(index+lightboxPhotos.length)%lightboxPhotos.length;const photo=lightboxPhotos[lightboxIndex];const img=lightbox.querySelector('img');img.src=photo.src;img.alt=photo.alt;lightbox.querySelector('p').textContent=photo.alt+' • '+(lightboxIndex+1)+' / '+lightboxPhotos.length;lightbox.querySelectorAll('[data-photo-step]').forEach(b=>b.hidden=lightboxPhotos.length<2);}
 document.addEventListener('click',e=>{
  const a=e.target.closest('[data-lightbox]');if(!a)return;e.preventDefault();returnFocus=a;
  if(!lightbox){lightbox=document.createElement('dialog');lightbox.className='photo-dialog';lightbox.setAttribute('aria-label','Galeria de fotografias');lightbox.innerHTML='<button class="close-dialog" aria-label="Fechar foto">×</button><button class="lightbox-step previous" data-photo-step="-1" aria-label="Fotografia anterior">←</button><img alt=""><button class="lightbox-step next" data-photo-step="1" aria-label="Próxima fotografia">→</button><p role="status" aria-live="polite"></p>';document.body.append(lightbox);lightbox.querySelector('.close-dialog').onclick=()=>lightbox.close();lightbox.onclick=ev=>{if(ev.target===lightbox)lightbox.close();const b=ev.target.closest('[data-photo-step]');if(b)lightboxPhoto(lightboxIndex+Number(b.dataset.photoStep))};lightbox.addEventListener('close',()=>returnFocus?.focus());}
  lightboxPhotos=a.dataset.galleryGroup==='profile'?media.photos.map((src,i)=>({src,alt:media.name+' • Fotografia '+(i+1)})):[{src:a.href,alt:a.querySelector('img')?.alt||'Fotografia Stud PB'}];
  lightboxPhoto(Number(a.dataset.galleryIndex)||0);lightbox.showModal();
 });
 document.addEventListener('keydown',e=>{if(!lightbox?.open)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();lightboxPhoto(lightboxIndex+(e.key==='ArrowRight'?1:-1))}});
})();
