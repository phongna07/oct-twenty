import './style.css'
import { GREETING } from './config'
import { createExperience } from './scene/experience'
import { getPersonalization } from './personalization'

const copy = getPersonalization(window.location.search)
const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <main class="experience" aria-label="Món quà ngày Phụ nữ Việt Nam">
    <div class="ambient ambient-left" aria-hidden="true"></div>
    <div class="ambient ambient-right" aria-hidden="true"></div>
    <div class="grain" aria-hidden="true"></div>
    <div class="dedication" aria-hidden="true"><span class="tiny-flower">✳</span><span>20.10</span><i></i><span id="dedication" class="dedication-text">DÀNH RIÊNG CHO BẠN</span></div>
    <div id="scene" aria-hidden="true"></div>
    <div id="loading" class="loading" role="status"><div class="loading-flower"><span></span><span></span><span></span><span></span><span></span></div><p>Đang ươm một điều xinh đẹp…</p></div>
    <div class="caption" aria-live="polite" aria-atomic="true"><p id="meaning" class="meaning">ĐỢI MỘT CHÚT NHÉ</p><p id="caption" class="caption-title">Một món quà đang hé nở</p></div>
    <div class="sequence-details" aria-hidden="true"><span id="count">MỘT BẤT NGỜ NHO NHỎ</span><div class="progress-track"><div id="progress"></div></div><span class="signature"><span id="signature">gửi bạn, bằng cả trái tim</span> <span aria-hidden="true">♡</span></span></div>
    <h1 id="accessible-greeting" class="sr-only">${GREETING}</h1>
    <section id="fallback" class="fallback" hidden><span class="fallback-flower" aria-hidden="true">✿</span><p id="fallback-dedication" class="meaning">DÀNH RIÊNG CHO BẠN</p><h2>Chúc mừng<br>ngày phụ nữ Việt Nam<br><span>20/10</span></h2><p><span id="fallback-wish">Chúc bạn luôn rạng rỡ, hạnh phúc</span><br>và được yêu thương mỗi ngày.</p><p class="fallback-note">Trình duyệt này chưa thể mở món quà 3D.<br>Hãy thử một trình duyệt hỗ trợ WebGL.</p></section>
  </main>`
const get = <T extends HTMLElement>(id:string) => document.getElementById(id) as T
// Treat the URL name as text, never as markup.
get('dedication').textContent = copy.dedication
get('signature').textContent = copy.signature
get('fallback-dedication').textContent = copy.dedication
get('fallback-wish').textContent = copy.wish
document.title = copy.title
if (copy.name) get('accessible-greeting').textContent = `${GREETING} — Dành tặng ${copy.name}`
let dispose: (()=>void)|undefined
let cancelled=false
function fallback(error:unknown) {
  console.error('Pink Bloom:',error)
  get('loading').hidden=true;get('scene').hidden=true;get('fallback').hidden=false
  document.body.dataset.phase='fallback'
  dispose?.()
}
createExperience(get('scene'),{
  progress:get('progress'),caption:get('caption'),meaning:get('meaning'),count:get('count'),
  finalCaption:copy.finalCaption,
  onReady:()=>{get('loading').hidden=true;document.body.classList.add('ready')},onError:fallback,
}).then(cleanup=>{if(cancelled)cleanup();else dispose=cleanup}).catch(fallback)
if(import.meta.hot)import.meta.hot.dispose(()=>{cancelled=true;dispose?.()})
