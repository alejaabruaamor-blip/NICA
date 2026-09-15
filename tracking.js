/* Rastreamento Meta (Pixel + Conversions API) — NICA
   Rota de conformidade escolhida: SEM aviso de cookies.
   Em países que exigem consentimento prévio (UE/EEE, Reino Unido, Suíça) e
   quando o país não pode ser identificado, nada é carregado nem enviado. */
(function () {
  "use strict";
  var PIXEL_ID = "1085108217221575";
  var API = "https://dudinha-central.lovable.app/api/public/meta";
  var CONSENT_REQUIRED = ("AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT " +
    "RO SK SI ES SE IS LI NO GB CH").split(" ");

  var queue = [];
  var allowed = null; // null = ainda decidindo

  function cookie(name) {
    var m = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]+)"));
    return m ? decodeURIComponent(m[2]) : undefined;
  }

  function loadPixel() {
    if (window.fbq) return;
    var n = (window.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
    window.fbq("init", PIXEL_ID);
  }

  function send(name, params, eventId) {
    try {
      if (window.fbq) {
        var opts = eventId ? { eventID: eventId } : undefined;
        window.fbq("track", name, params || {}, opts);
      }
    } catch (e) {}
    var payload = {
      event_name: name,
      event_source_url: window.location.href,
      fbp: cookie("_fbp"),
      fbc: cookie("_fbc")
    };
    if (eventId) payload.event_id = eventId;
    if (params) {
      if (params.value) payload.value = params.value;
      if (params.currency) payload.currency = params.currency;
      if (params.content_name) payload.content_name = params.content_name;
      if (params.order_id) payload.order_id = params.order_id;
    }
    try {
      fetch(API + "/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  function flush() {
    var q = queue;
    queue = [];
    for (var i = 0; i < q.length; i++) send(q[i][0], q[i][1], q[i][2]);
  }

  function track(name, params, eventId) {
    if (allowed === false) return;
    if (allowed === null) {
      queue.push([name, params, eventId]);
      return;
    }
    send(name, params, eventId);
  }

  function decide(country) {
    var c = (country || "").toUpperCase();
    allowed = !!c && c !== "XX" && c !== "T1" && CONSENT_REQUIRED.indexOf(c) === -1;
    if (allowed) {
      loadPixel();
      flush();
    } else {
      queue = [];
    }
  }

  var done = false;
  var timer = setTimeout(function () {
    if (!done) {
      done = true;
      decide("");
    }
  }, 2500);

  try {
    fetch(API + "/geo", { cache: "no-store" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (d) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        decide(d && d.country);
      })
      .catch(function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        decide("");
      });
  } catch (e) {
    if (!done) {
      done = true;
      decide("");
    }
  }

  // API pública usada pelas páginas
  window.nicaTrack = track;
  window.nicaTrackPurchase = function (value, txId) {
    var key = "nica_purchase_" + (txId || "sem-id");
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch (e) {}
    track(
      "Purchase",
      { value: Number(value) || 0, currency: "BRL", order_id: txId ? String(txId) : undefined },
      txId ? String(txId) : undefined
    );
  };

  track("PageView");
})();

/* UTMify — pixel de vendas + captura de UTMs.
   Mesma regra de conformidade: não carrega em países que exigem consentimento
   prévio (UE/EEE, Reino Unido, Suíça) nem quando o país não é identificado. */
(function () {
  "use strict";
  var UTMIFY_PIXEL_ID = "6a8f6c777eb4684abaa803d5";
  var API = "https://dudinha-central.lovable.app/api/public/meta";
  var CONSENT_REQUIRED = ("AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT " +
    "RO SK SI ES SE IS LI NO GB CH").split(" ");

  function inject(src, attrs) {
    var s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    (attrs || []).forEach(function (a) {
      s.setAttribute(a[0], a[1]);
    });
    (document.head || document.documentElement).appendChild(s);
  }

  function load() {
    window.pixelId = UTMIFY_PIXEL_ID;
    inject("https://cdn.utmify.com.br/scripts/pixel/pixel.js");
    inject("https://cdn.utmify.com.br/scripts/utms/latest.js", [
      ["data-utmify-prevent-xcod-sck", ""],
      ["data-utmify-prevent-subids", ""]
    ]);
  }

  function decide(country) {
    var c = (country || "").toUpperCase();
    if (!!c && c !== "XX" && c !== "T1" && CONSENT_REQUIRED.indexOf(c) === -1) load();
  }

  var done = false;
  var timer = setTimeout(function () {
    if (!done) { done = true; decide(""); }
  }, 2500);

  try {
    fetch(API + "/geo", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (done) return;
        done = true; clearTimeout(timer); decide(d && d.country);
      })
      .catch(function () {
        if (done) return;
        done = true; clearTimeout(timer); decide("");
      });
  } catch (e) {
    if (!done) { done = true; decide(""); }
  }
})();

/* Origem da venda (UTMs) — anexa os parâmetros de campanha em cada cobrança Pix,
   para o painel de vendas saber de qual campanha veio cada pagamento. */
(function () {
  "use strict";
  var KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var STORE = "nica_utms";

  function readUrl() {
    var q = new URLSearchParams(location.search);
    var out = {};
    KEYS.forEach(function (k) {
      var v = q.get(k);
      if (v) out[k] = String(v).slice(0, 200);
    });
    var cid = q.get("fbclid") || q.get("gclid") || q.get("click_id");
    if (cid) out.click_id = String(cid).slice(0, 200);
    return out;
  }

  function tracking() {
    var fromUrl = readUrl();
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORE) || "{}") || {}; } catch (e) {}
    var merged = Object.keys(fromUrl).length ? fromUrl : saved;
    if (Object.keys(fromUrl).length) {
      try { localStorage.setItem(STORE, JSON.stringify(fromUrl)); } catch (e) {}
    }
    var page = (location.pathname.split("/").filter(Boolean)[0] || "raiz").slice(0, 60);
    return Object.assign({}, merged, { page: page, landing_url: location.href.slice(0, 500) });
  }

  var originalFetch = window.fetch;
  if (typeof originalFetch !== "function") return;

  window.fetch = function (input, init) {
    try {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      var method = ((init && init.method) || (input && input.method) || "GET").toUpperCase();
      if (url.indexOf("/tichupay/pix") !== -1 && method === "POST" && init && typeof init.body === "string") {
        var body = JSON.parse(init.body);
        body.tracking = Object.assign({}, body.tracking || {}, tracking());
        init = Object.assign({}, init, { body: JSON.stringify(body) });
      }
    } catch (e) {}
    return originalFetch.call(this, input, init);
  };
})();
