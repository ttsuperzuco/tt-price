/* 絵をスマホの中に置いておく係（2026-09-07 まるちゃん「一度スマホに読んだら置いておける？」）

   ★何をするか
     商品ページの絵（img/ の中の写真）を、一度取ったらスマホの中に取っておく。
     次に開いた時は、置き場へ聞きに行かずにスマホの中の物をそのまま出す＝待ち時間ゼロ。

   ★なぜ安全か（前に「直しても古い画面が出る」で困った件と別物）
     ①ページそのもの（文字・値段・仕組み）は絶対に取っておかない。必ず毎回、置き場から取る。
       ＝直した内容はいつもどおりすぐ反映される。
     ②取っておくのは絵だけ。しかも絵の名前は中身から作ってあるので、
       絵を差し替えれば名前が変わる＝古い絵が出ることが原理的に起きない。
     ③名前の形（h1sp-0123456789.jpg のような形）に合う物だけを扱う。
       他のページ・他のファイルには一切手を出さない。

   ★やめたい時
     このファイルの中身を  self.addEventListener('install',()=>self.registration.unregister());
     だけにして置き場へ送れば、次に開いた人から自動的に外れる。 */

var HAKO = 'tt-signature-e-v1';
var KATACHI = /\/img\/[A-Za-z0-9_]+-[0-9a-f]{10}\.jpg$/;

self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u;
  try { u = new URL(r.url); } catch (err) { return; }
  if (u.origin !== self.location.origin) return;
  if (!KATACHI.test(u.pathname)) return;        /* 絵以外には一切さわらない */

  e.respondWith(
    caches.open(HAKO).then(function (hako) {
      return hako.match(r).then(function (atta) {
        if (atta) return atta;                  /* スマホの中にあった＝そのまま出す */
        return fetch(r).then(function (kita) {
          if (kita && kita.status === 200) { try { hako.put(r, kita.clone()); } catch (x) {} }
          return kita;
        });
      });
    }).catch(function () { return fetch(r); })  /* 何かおかしければ、ふつうに取りに行く */
  );
});

/* ページが「今つかう絵はこれ」と教えてくれたら、それ以外の古い絵は捨てる
   （使わなくなった絵がスマホの中にたまり続けないように） */
self.addEventListener('message', function (e) {
  var d = e.data;
  if (!d || d.yo !== 'tsukau' || !d.list || !d.list.length) return;
  e.waitUntil(caches.open(HAKO).then(function (hako) {
    return hako.keys().then(function (aru) {
      var iru = {};
      d.list.forEach(function (u) { try { iru[new URL(u, self.location.href).pathname] = 1; } catch (x) {} });
      return Promise.all(aru.map(function (k) {
        var p;
        try { p = new URL(k.url).pathname; } catch (x) { return null; }
        return iru[p] ? null : hako.delete(k);
      }));
    });
  }));
});
