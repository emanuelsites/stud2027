import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
class Element{
 constructor(){this.dataset={};this.children=[];this.listeners={};this.attributes={};this.nodes=new Map();this.innerHTML='';this.textContent='';this.open=false;this.classList={remove(){}};}
 querySelector(s){if(!this.nodes.has(s))this.nodes.set(s,new Element());return this.nodes.get(s)}
 querySelectorAll(s){return this.groups?.[s]||[]}
 setAttribute(k,v){this.attributes[k]=v}
 getAttribute(k){return this.attributes[k]}
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn)}
 append(...nodes){this.children.push(...nodes)}
 replaceChildren(...nodes){this.children=nodes}
 focus(){this.focused=true}
 showModal(){this.open=true}
 close(){this.open=false;for(const fn of this.listeners.close||[])fn()}
}
const photos=['/assets/a.webp','/assets/b.webp','/assets/c.webp'];
const videos=[{youtubeId:'wQ_7xsOkDBM',title:'Em pista',cover:''},{youtubeId:'0Gu68eVFlJc',title:'Em liberdade',cover:'/assets/cover.webp'}];
const gallery=new Element(),main=gallery.querySelector('[data-gallery-open]');main.dataset={galleryIndex:'0',galleryGroup:'profile'};main.href=photos[0];
const thumbs=photos.map((_,i)=>{const b=new Element();b.dataset.gallerySelect=String(i);return b});gallery.groups={'[data-gallery-select]':thumbs};
const stage=new Element(),videoRoot=new Element(),elements=new Map([['#profile-media-data',{textContent:JSON.stringify({name:'Animal teste',photos,videos})}],['[data-profile-gallery]',gallery],['[data-video-stage]',stage],['.animal-videos',videoRoot],['[data-video-title]',new Element()],['[data-video-external]',new Element()]]);
const document={body:new Element(),listeners:{},querySelector:s=>elements.get(s)||null,querySelectorAll:()=>[],addEventListener(k,fn){(this.listeners[k]??=[]).push(fn)},createElement(tag){const el=new Element();el.tagName=tag;if(tag==='dialog'){el.groups={'[data-photo-step]':[new Element(),new Element()]};}return el;}};
vm.runInNewContext(fs.readFileSync('public/system.js','utf8'),{document,window:{STUD_DATA:{}},console});
assert.equal(stage.children.length,0,'No player before an explicit click');
const eventFor=(selector,node)=>({target:{closest:s=>s===selector?node:null},preventDefault(){}});
gallery.listeners.click[0](eventFor('[data-gallery-select]',thumbs[2]));assert.equal(main.href,photos[2]);assert.equal(thumbs[2].attributes['aria-pressed'],'true');assert.equal(gallery.querySelector('[data-gallery-counter]').textContent,'3 / 3');
videoRoot.listeners.click[0](eventFor('[data-video-play]',{}));assert.equal(stage.children[0].tagName,'iframe');assert(stage.children[0].src.startsWith('https://www.youtube-nocookie.com/embed/wQ_7xsOkDBM?'));assert(stage.children[0].src.includes('autoplay=1'));
videoRoot.listeners.click[0](eventFor('[data-video-select]',{dataset:{videoSelect:'1'}}));assert.equal(stage.children[0].tagName,'button','Switching video removes player and restores poster');assert.equal(elements.get('[data-video-title]').textContent,'Em liberdade');assert.equal(elements.get('[data-video-external]').href,'https://www.youtube.com/watch?v=0Gu68eVFlJc');
videoRoot.listeners.click[0](eventFor('[data-video-play]',{}));assert(stage.children[0].src.includes('/0Gu68eVFlJc?'));
const click=eventFor('[data-lightbox]',main);for(const fn of document.listeners.click)fn(click);
const dialog=document.body.children[0];assert(dialog.open);assert.equal(dialog.querySelector('img').src,photos[2]);
for(const fn of document.listeners.keydown)fn({key:'ArrowRight',preventDefault(){}});assert.equal(dialog.querySelector('img').src,photos[0]);
for(const fn of document.listeners.keydown)fn({key:'ArrowLeft',preventDefault(){}});assert.equal(dialog.querySelector('img').src,photos[2]);
dialog.close();assert(main.focused);
console.log('PASS: photo selection/count, lightbox arrows/wrap/focus, lazy YouTube activation and switching/stop.');
