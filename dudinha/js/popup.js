document.addEventListener("DOMContentLoaded", function () {
  const popup = document.getElementById("popupOverlay");
  const closeButton = document.getElementById("closePopup");
  const socialLinks = document.querySelectorAll(".social-link");
  // Add globe icon selector
  const globeIcon = document.querySelector(
    ".navbar svg[viewBox='0 0 30 30.000001']"
  );

  function openPopup() {
    if (window.innerWidth <= 768) {
      // Só abre em telas mobile
      popup.classList.add("active");
      document.body.classList.add("popup-active");
    }
  }

  function closePopup() {
    popup.classList.remove("active");
    document.body.classList.remove("popup-active");
  }

  // Event Listeners
  socialLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      openPopup();
    });
  });

  // Add click event for globe icon
  if (globeIcon) {
    globeIcon.parentElement.addEventListener("click", function (e) {
      e.preventDefault();
      openPopup();
    });
  }

  closeButton.addEventListener("click", closePopup);

  // Fecha o popup ao clicar fora dele
  popup.addEventListener("click", function (e) {
    if (e.target === popup) {
      closePopup();
    }
  });

  // Fecha o popup com a tecla ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && popup.classList.contains("active")) {
      closePopup();
    }
  });
});

/* ===== PIX via gateway SyncPay (mesmo das paginas up1/up2/back) ===== */
(function () {
  var SUPABASE_URL = 'https://qqgeppzhhpvmdxzctngj.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZ2VwcHpoaHB2bWR4emN0bmdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTQ2MzcsImV4cCI6MjA5MDc5MDYzN30.3PxnXi15bVJ_5x733nUXcUjlgPAIGsGBpAXkqtASRdg';
  var pollInterval = null;

  function utm(k) {
    return new URLSearchParams(window.location.search).get(k) || localStorage.getItem('utmify_' + k) || undefined;
  }
  function cookie(n) {
    var m = document.cookie.match(new RegExp('(^|; )' + n + '=([^;]+)'));
    return m ? decodeURIComponent(m[2]) : null;
  }
  function cpfFake() {
    var n = function () { return Math.floor(Math.random() * 9); };
    var nums = [n(), n(), n(), n(), n(), n(), n(), n(), n()];
    var s = nums.reduce(function (a, b, i) { return a + b * (10 - i); }, 0);
    var d1 = (s * 10) % 11; if (d1 >= 10) d1 = 0;
    s = nums.reduce(function (a, b, i) { return a + b * (11 - i); }, 0) + d1 * 2;
    var d2 = (s * 10) % 11; if (d2 >= 10) d2 = 0;
    return nums.concat([d1, d2]).join('');
  }
  function telFake() {
    var ddds = ['11', '21', '31', '41', '51'];
    return ddds[Math.floor(Math.random() * ddds.length)] + '9' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  }
  function valorAtual() {
    return Number(window._pixValorAtual || 9.90);
  }

  window.iniciarPollingNicolle = function (identifier) {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(async function () {
      try {
        var res = await fetch(SUPABASE_URL + '/functions/v1/syncpay-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY },
          body: JSON.stringify({ identifier: identifier })
        });
        var data = await res.json();
        var st = ((data && data.data && data.data.status) || (data && data.status) || '').toLowerCase();
        if (['completed', 'pago', 'success', 'paid', 'approved', 'paid_out', 'paidout'].indexOf(st) !== -1) {
          clearInterval(pollInterval);
          (function firePixel(value, txId, attempts) {
            if (window.PixelManager && typeof window.PixelManager.track === 'function') {
              try { window.PixelManager.track('Purchase', { value: value, currency: 'BRL', transaction_id: txId }); } catch (e) {}
            } else if (attempts > 0) {
              setTimeout(function () { firePixel(value, txId, attempts - 1); }, 500);
            }
          })(valorAtual(), identifier, 10);
          document.getElementById('pixQrArea').style.display = 'none';
          document.getElementById('pixSucessoArea').style.display = 'flex';
          setTimeout(function () {
            var url = new URL('../up1/index.html', window.location.href);
            ['utm_source', 'utm_campaign', 'utm_medium', 'utm_content', 'utm_term', 'src', 'xcod', 'sck'].forEach(function (k) {
              var v = utm(k); if (v) url.searchParams.set(k, v);
            });
            window.location.href = url.toString();
          }, 2500);
        }
      } catch (e) { console.error('Poll error:', e); }
    }, 5000);
  };

  window.gerarPixNicolle = async function () {
    var nome = document.getElementById('pixNome').value.trim();
    var email = document.getElementById('pixEmail').value.trim();
    if (!nome || nome.split(' ').length < 2) { alert('Informe seu nome completo.'); return; }
    if (!email || email.indexOf('@') === -1) { alert('Informe um e-mail válido.'); return; }
    var btn = document.getElementById('pixBtnGerar');
    var label = btn.textContent;
    btn.textContent = 'Gerando PIX...'; btn.disabled = true;
    try {
      var res = await fetch(SUPABASE_URL + '/functions/v1/syncpay-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY },
        body: JSON.stringify({
          amount: valorAtual(),
          name: nome,
          cpf: cpfFake(),
          email: email,
          phone: telFake(),
          plan: 'dudinha-' + valorAtual(),
          utm_source: utm('utm_source'), utm_medium: utm('utm_medium'),
          utm_campaign: utm('utm_campaign'), utm_content: utm('utm_content'),
          utm_term: utm('utm_term'), src: utm('src'),
          xcod: utm('xcod'), sck: utm('sck'),
          fbp: cookie('_fbp'), fbc: cookie('_fbc'),
          user_agent: navigator.userAgent, source_url: window.location.href
        })
      });
      var data = await res.json();
      if (!res.ok) {
        btn.textContent = label; btn.disabled = false;
        alert(data.message || 'Erro ao gerar PIX. Tente novamente.');
        return;
      }
      var pixCode = data.pix_code || data.qr_code || data.emv || '';
      var qrUrl = data.qr_code_url || (pixCode ? 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(pixCode) : '');
      var identifier = data.identifier || data.transaction_id || data.id || '';
      if (identifier) localStorage.setItem('pix_nicolle_identifier', identifier);
      document.getElementById('pixQrImg').src = qrUrl;
      document.getElementById('pixCode').value = pixCode;
      document.getElementById('pixFormArea').style.display = 'none';
      document.getElementById('pixQrArea').style.display = 'flex';
      btn.textContent = label; btn.disabled = false;
      if (identifier) window.iniciarPollingNicolle(identifier);
    } catch (e) {
      btn.textContent = label; btn.disabled = false;
      alert('Erro de conexão. Tente novamente.');
    }
  };
})();
