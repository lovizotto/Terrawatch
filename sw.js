const VER = 'tw-' + self.registration.scope
const ASSETS = ['./','./index.html']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(ASSETS).catch(()=>{})))
  self.skipWaiting()
})
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==VER).map(k=>caches.delete(k)))))
  self.clients.claim()
})
self.addEventListener('fetch', e => {
  if(e.request.method!=='GET') return
  // Network-first for HTML + worker, cache-first for assets
  const url = new URL(e.request.url)
  const isNav = e.request.mode==='navigate'
  const isWorker = url.pathname.endsWith('worker.js')
  if(isNav || isWorker){
    e.respondWith(fetch(e.request).then(r=>{
      const clone=r.clone()
      caches.open(VER).then(c=>c.put(e.request,clone))
      return r
    }).catch(()=>caches.match(e.request)))
  } else {
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))
  }
})
