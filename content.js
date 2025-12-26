// content.js - Whatsapp Toplu Mesaj Gönderici (sidebar paneli)

let allRows = [];
let isRunning = false;

/* ==== Ayarlar (selector) ==== */

const DEFAULT_SETTINGS = {
  sendButtonSelector: 'span[data-icon="wds-ic-send-filled"]',
  blurChat: false
};

let userSettings = { ...DEFAULT_SETTINGS };
let settingsLoaded = false;

function loadSettings() {
  if (settingsLoaded) return;
  try {
    const raw = localStorage.getItem("wpSenderSettings");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        userSettings = { ...DEFAULT_SETTINGS, ...parsed };
      }
    }
  } catch (e) {
    console.warn("Settings parse error:", e);
  }
  settingsLoaded = true;
}

function saveSettings() {
  try {
    localStorage.setItem("wpSenderSettings", JSON.stringify(userSettings));
  } catch (e) {
    console.warn("Settings save error:", e);
  }
}

/* ==== Yardımcı: Etikete göre kuyruk oluştur ==== */

function buildQueueForTag(tag) {
  if (!tag) return [];

  return allRows
    .filter((row) => {
      const rawNum = row.Numara ? row.Numara.toString().replace(/\D/g, "") : "";
      if (rawNum.length <= 5) return false; // numara filtresine dokunmadım

      // Herkes seçeneği: etikete bakmadan tüm geçerli numaralar
      if (tag === "__ALL__") {
        return true;
      }

      const hasTag = Object.keys(row).some(
        (key) =>
          key.toLowerCase().startsWith("etiket") &&
          String(row[key]).trim() === String(tag).trim()
      );
      return hasTag;
    })
    .map((row) => ({
      phone: row.Numara ? row.Numara.toString().replace(/\D/g, "") : "",
      ad: row.Ad || "",
      soyad: row.Soyad || "",
      hitap: row.Hitap || ""
    }));
}

/* ==== Panel Enjeksiyonu ==== */

function injectPanel() {
  const sidebar = document.getElementById("side");
  if (!sidebar) {
    setTimeout(injectPanel, 1000);
    return;
  }

  if (document.getElementById("wp-custom-panel")) return;

  loadSettings();

  const logoUrl = chrome.runtime.getURL('icon.png');

  const panel = document.createElement("div");
  panel.id = "wp-custom-panel";
  panel.className = "minimized";

  panel.innerHTML = `
    <div class="wp-shell">
      <div class="wp-header" id="wp-header-trigger">
        <div class="wp-header-left">
          <div class="wp-avatar">
             <img src="${logoUrl}" alt="logo">
          </div>
          <div class="wp-header-text">
            <div class="wp-header-title">Whatsapp Toplu Mesaj Gönderici</div>
            <div class="wp-header-sub">
              <span class="wp-status-dot" id="wp-dot"></span>
              <span id="wp-status">Hazır.</span>
            </div>
            <div class="wp-signature">Developed by Tuna</div>
          </div>
        </div>
        <button class="wp-header-toggle" type="button">
          <span id="wp-toggle-icon">▼</span>
        </button>
      </div>

      <div class="wp-content-area">
        <!-- Üst açıklama kartı -->
        <section class="wp-card wp-card-intro">
          <div class="wp-card-intro-main">
            <div class="wp-card-intro-title">Toplu gönderim paneli</div>
            <div class="wp-card-intro-sub">Excel’den kişileri çek, etiketi seç, mesajı yaz ve otomatik gönder.</div>
          </div>
          <div class="wp-card-intro-pill">v1.0</div>
        </section>

        <!-- Adım 1 + Adım 2 yan yana -->
        <div class="wp-grid-2">
          <!-- Adım 1: Excel -->
          <section class="wp-card">
            <div class="wp-card-head">
              <div class="wp-card-head-left">
                <span class="wp-card-title">Excel Dosyası</span>
                <span class="wp-card-sub">Kişi listen .xlsx formatında</span>
              </div>
              <span class="wp-step-pill">1</span>
            </div>

            <div class="wp-file-row">
              <label class="wp-file-btn" style="cursor:pointer;">
                Dosya Seç
                <input type="file" id="wp-file" accept=".xlsx" />
              </label>
              <button type="button" id="wp-file-reset" class="wp-file-reset-btn">Temizle</button>
            </div>
            <div class="wp-file-name" id="wp-file-info">Dosya seçilmedi.</div>
          </section>

          <!-- Adım 2: Etiket -->
          <section class="wp-card">
            <div class="wp-card-head">
              <div class="wp-card-head-left">
                <span class="wp-card-title">Hedef Kitle</span>
                <span class="wp-card-sub">Etikete göre filtreleyebilirsin</span>
              </div>
              <span class="wp-step-pill">2</span>
            </div>

            <select id="wp-tag-select" class="wp-select" disabled>
              <option value="">Dosya bekleniyor...</option>
            </select>
          </section>
        </div>

        <!-- Adım 3: Mesaj -->
        <section class="wp-card">
          <div class="wp-card-head">
            <div class="wp-card-head-left">
              <span class="wp-card-title">Mesaj İçeriği</span>
              <span class="wp-card-sub">Ad, soyad ve hitap ile kişiselleştir</span>
            </div>
            <span class="wp-step-pill">3</span>
          </div>

          <div class="wp-tag-container">
            <button class="wp-tag-btn" data-ins="{{Hitap}}">Hitap</button>
            <button class="wp-tag-btn" data-ins="{{Ad}}">Ad</button>
            <button class="wp-tag-btn" data-ins="{{Soyad}}">Soyad</button>
          </div>
          <textarea id="wp-msg" class="wp-textarea" placeholder="Gönderilecek mesajı yaz..."></textarea>
        </section>

        <!-- Adım 4: Süreler -->
        <section class="wp-card">
          <div class="wp-card-head">
            <div class="wp-card-head-left">
              <span class="wp-card-title">Gönderim Hızı</span>
              <span class="wp-card-sub">Mesajlar arası rastgele bekleme</span>
            </div>
            <span class="wp-step-pill">4</span>
          </div>

          <div class="wp-time-grid">
            <div class="wp-time-item">
              <label class="wp-label-small">Minimum (sn)</label>
              <input type="number" id="wp-min" value="2" min="2" max="6" class="wp-input" />
            </div>
            <div class="wp-time-item">
              <label class="wp-label-small">Maksimum (sn)</label>
              <input type="number" id="wp-max" min="7" max="20" value="7" class="wp-input" />
            </div>
          </div>
        </section>

        <!-- Gelişmiş Ayarlar -->
        <section class="wp-card">
          <div class="wp-card-head wp-card-head-settings">
            <div class="wp-card-head-left">
              <span class="wp-card-title">Gelişmiş Ayarlar</span>
              <span class="wp-card-sub">WhatsApp güncellemesi sonrası buton çalışmazsa</span>
            </div>
            <button type="button" class="wp-settings-toggle" id="wp-settings-toggle">
              Gelişmiş
              <span class="wp-settings-chevron">▼</span>
            </button>
          </div>
          <div class="wp-settings-body" id="wp-settings-body">
            <div class="wp-settings-grid-single">
              
              <!-- Sohbet Gizliliği -->
              <div class="wp-settings-item" style="margin-bottom: 6px;">
                 <label style="display:flex; align-items:center; gap:6px; font-size:11px; color:var(--wp-text-main); cursor:pointer;">
                   <input type="checkbox" id="wp-blur-chat" />
                   Sohbet Gizliliği (Blur)
                 </label>
              </div>

              <div class="wp-settings-item">
                <label class="wp-label-small">Gönder buton seçicisi</label>
                <input type="text" id="wp-send-selector" class="wp-input" />
              </div>
              <div class="wp-settings-actions">
                <button type="button" id="wp-settings-save" class="wp-settings-btn">Kaydet</button>
                <button type="button" id="wp-settings-reset" class="wp-settings-btn wp-settings-btn-secondary">Sıfırla</button>
              </div>
              <p class="wp-settings-hint">
                Bu alanı sadece zorunda kalırsan değiştir. Varsayılan ayar çoğu zaman yeterli olacaktır.
              </p>
            </div>
          </div>
        </section>

        <!-- Aksiyonlar + Durum -->
        <div class="wp-actions-group">
          <div class="wp-actions">
            <button id="wp-start" class="wp-btn-main" disabled>BAŞLAT</button>
            <button id="wp-stop" class="wp-btn-main wp-btn-stop">DURDUR</button>
          </div>

          <div class="wp-status-bar">
            <span class="wp-status-dot" id="wp-dot-detail"></span>
            <span id="wp-status-detail">Hazır.</span>
          </div>
        </div>
      </div>
    </div>
  `;

  sidebar.prepend(panel);
  setupEvents();
  toggleButtons(false);

  // Gizlilik filtrelerini uygula
  applyPrivacyFilters();

  // Header butonunu eklemeye çalış
  injectHeaderButton();
}

/* ==== Header Butonu (Quick Toggle) ==== */

function injectHeaderButton() {
  if (document.getElementById("wp-header-toggle-btn")) return;

  // Strateji: "Yeni Sohbet" ikonunu bul, onun butonuna ve kapsayıcısına git.
  // data-icon="new-chat-outline" veya "chat" (eski sürümler)
  const newChatIcon = document.querySelector('span[data-icon="new-chat-outline"]');

  if (!newChatIcon) return;

  // İkon -> Buton -> Kapsayıcı Div -> Ana Container
  // HTML yapısı: Container > Div > Span > Button > Div > ...
  // Bizim için önemli olan Button'un içinde bulunduğu en dış sarmalayıcıyı bulmak.
  // closest('div[role="button"]') veya button etiketi.

  const newChatBtn = newChatIcon.closest('button') || newChatIcon.closest('[role="button"]');
  if (!newChatBtn) return;

  // Butonun parent'ı olan div'i bul (flex item olan)
  // Genellikle butonun 2-3 seviye yukarısındaki div, yanındaki diğer butonlarla kardeş olandır.
  // HTML'e göre: Container > Div > Span > Button. 
  // O yüzden Button.parentElement (Span) -> Span.parentElement (Div) -> Div.parentElement (Container)

  // Güvenli gezinme:
  const btnContainer = newChatBtn.parentElement?.parentElement; // Span > Div
  if (!btnContainer) return;

  const mainContainer = btnContainer.parentElement;
  if (!mainContainer) return;

  // Butonu oluştur
  const btn = document.createElement("button");
  btn.id = "wp-header-toggle-btn";
  btn.className = "wp-header-btn";
  btn.title = "Sohbet Gizliliği (Blur)";
  // Stili WA headera uydurmak için margin ayarı
  btn.style.marginRight = "10px";

  btn.innerHTML = `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
    </svg>
  `;

  btn.onclick = () => {
    userSettings.blurChat = !userSettings.blurChat;
    saveSettings();
    applyPrivacyFilters();

    const cb = document.getElementById("wp-blur-chat");
    if (cb) cb.checked = userSettings.blurChat;
  };

  // Main container içine, New Chat buton container'ının öncesine ekle
  mainContainer.insertBefore(btn, btnContainer);

  updateHeaderButtonState();
}

function updateHeaderButtonState() {
  const btn = document.getElementById("wp-header-toggle-btn");
  if (!btn) return;

  // Aktifse renk değişimi
  if (userSettings.blurChat) {
    btn.classList.add("active");
    // İkonu bloke edilmiş göz yapabiliriz ama renk değişimi yeterli
  } else {
    btn.classList.remove("active");
  }
}

function applyPrivacyFilters() {
  if (userSettings.blurChat) {
    document.body.classList.add("wp-blur-chats");
  } else {
    document.body.classList.remove("wp-blur-chats");
  }
  updateHeaderButtonState();
}


/* ==== Eventler ==== */

function setupEvents() {
  const panel = document.getElementById("wp-custom-panel");
  const headerTrigger = document.getElementById("wp-header-trigger");

  const fileInput = document.getElementById("wp-file");
  const fileResetBtn = document.getElementById("wp-file-reset");
  const tagSelect = document.getElementById("wp-tag-select");
  const startBtn = document.getElementById("wp-start");
  const stopBtn = document.getElementById("wp-stop");
  const msgInput = document.getElementById("wp-msg");

  // Ayarlar paneli elemanları
  const settingsToggle = document.getElementById("wp-settings-toggle");
  const settingsBody = document.getElementById("wp-settings-body");
  const sendSelectorInput = document.getElementById("wp-send-selector");
  const settingsSaveBtn = document.getElementById("wp-settings-save");
  const settingsResetBtn = document.getElementById("wp-settings-reset");

  // Gizlilik Checkbox (Gelişmiş Ayarlar içinde)
  const blurChatCb = document.getElementById("wp-blur-chat");

  if (blurChatCb) {
    blurChatCb.checked = userSettings.blurChat || false;
    blurChatCb.onchange = (e) => {
      userSettings.blurChat = e.target.checked;
      saveSettings();
      applyPrivacyFilters();
    };
  }

  // Selector input'una varsayılan değeri JS ile yaz
  if (sendSelectorInput) {
    sendSelectorInput.value =
      userSettings.sendButtonSelector || DEFAULT_SETTINGS.sendButtonSelector;
  }

  // Akordiyon toggle
  headerTrigger.onclick = () => {
    panel.classList.toggle("minimized");
  };

  // Gelişmiş Ayarlar aç/kapa
  if (settingsToggle && settingsBody) {
    settingsToggle.onclick = (e) => {
      e.stopPropagation();
      const isOpen = settingsBody.classList.toggle("open");
      settingsToggle.classList.toggle("open", isOpen);
    };
  }

  // Ayarlar Kaydet
  if (settingsSaveBtn) {
    settingsSaveBtn.onclick = (e) => {
      e.stopPropagation();
      userSettings.sendButtonSelector =
        sendSelectorInput.value.trim() || DEFAULT_SETTINGS.sendButtonSelector;
      saveSettings();
      alert("Ayarlar kaydedildi.");
    };
  }

  // Ayarlar Sıfırla
  if (settingsResetBtn) {
    settingsResetBtn.onclick = (e) => {
      e.stopPropagation();
      userSettings = { ...DEFAULT_SETTINGS };
      saveSettings();
      if (sendSelectorInput) {
        sendSelectorInput.value = userSettings.sendButtonSelector;
      }
      alert("Ayarlar varsayılanlara sıfırlandı.");
    };
  }

  // Excel okuma
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (elem) => {
      try {
        const data = new Uint8Array(elem.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        allRows = XLSX.utils.sheet_to_json(
          workbook.Sheets[workbook.SheetNames[0]]
        );

        const tags = new Set();
        allRows.forEach((row) => {
          Object.keys(row).forEach((key) => {
            if (key.toLowerCase().startsWith("etiket") && row[key]) {
              tags.add(String(row[key]).trim());
            }
          });
        });

        // Numara sayısı
        const totalNumbers = allRows.filter((row) => {
          const rawNum = row.Numara
            ? row.Numara.toString().replace(/\D/g, "")
            : "";
          return rawNum.length > 5;
        }).length;

        tagSelect.innerHTML = '<option value="">Seçiniz...</option>';

        // Etiketleri ekle
        tags.forEach((t) => {
          const opt = document.createElement("option");
          opt.value = t;
          opt.textContent = t;
          tagSelect.appendChild(opt);
        });

        // Herkes seçeneği
        if (totalNumbers > 0) {
          const optAll = document.createElement("option");
          optAll.value = "__ALL__";
          optAll.textContent = `Herkes (${totalNumbers})`;
          tagSelect.appendChild(optAll);
          tagSelect.disabled = false;
        } else {
          tagSelect.disabled = true;
        }

        document.getElementById("wp-file-info").innerText =
          totalNumbers > 0
            ? `✅ ${totalNumbers} numara.`
            : "Uygun numara bulunamadı.";
        startBtn.disabled = true;
        startBtn.innerText = "BAŞLAT";
      } catch (err) {
        console.error(err);
        allRows = [];
        tagSelect.innerHTML = '<option value="">Dosya okunamadı</option>';
        tagSelect.disabled = true;
        document.getElementById("wp-file-info").innerText = "❌ Dosya okunamadı.";
        startBtn.disabled = true;
        startBtn.innerText = "BAŞLAT";
        alert("Dosya okunamadı!");
      }
    };
    reader.readAsArrayBuffer(file);
  });

  // Excel temizleme
  if (fileResetBtn) {
    fileResetBtn.onclick = (e) => {
      e.stopPropagation();
      fileInput.value = "";
      allRows = [];
      tagSelect.innerHTML = '<option value="">Dosya bekleniyor...</option>';
      tagSelect.disabled = true;
      document.getElementById("wp-file-info").innerText = "Dosya seçilmedi.";
      startBtn.disabled = true;
      startBtn.innerText = "BAŞLAT";
    };
  }

  // Hedef etiket seçimi
  tagSelect.addEventListener("change", () => {
    const tag = tagSelect.value;
    const queue = buildQueueForTag(tag);
    const count = queue.length;

    startBtn.disabled = count === 0;
    startBtn.innerText = count > 0 ? `BAŞLAT (${count})` : "BAŞLAT";
  });

  // Değişken butonları (sonuna 1 boşluk ekle)
  document.querySelectorAll(".wp-tag-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const ins = btn.getAttribute("data-ins") || "";
      const toInsert = ins + " ";
      msgInput.setRangeText(
        toInsert,
        msgInput.selectionStart,
        msgInput.selectionEnd,
        "end"
      );
      msgInput.focus();
    };
  });

  // BAŞLAT
  startBtn.onclick = (e) => {
    e.stopPropagation();

    if (isRunning) {
      alert("Zaten bir gönderim işlemi devam ediyor.");
      return;
    }

    const tag = tagSelect.value;
    const msg = msgInput.value;

    if (!tag || !msg) {
      alert("Etiket ve mesaj zorunludur!");
      return;
    }

    const queue = buildQueueForTag(tag);

    if (queue.length === 0) {
      alert("Bu etiket için numara bulunamadı.");
      return;
    }

    // Başlar başlamaz paneli kapat
    const p = document.getElementById("wp-custom-panel");
    if (p && !p.classList.contains("minimized")) {
      p.classList.add("minimized");
    }

    startSendingProcess(queue, msg);
  };

  // DURDUR
  stopBtn.onclick = (e) => {
    e.stopPropagation();
    isRunning = false;
    setStatus("⛔ Durduruldu.");
    toggleButtons(false);
  };
}

/* ==== Gönderim Motoru ==== */

async function startSendingProcess(queue, msgTemplate) {
  isRunning = true;
  toggleButtons(true);

  const minTime = parseInt(document.getElementById("wp-min")?.value) || 5;
  const maxTime = parseInt(document.getElementById("wp-max")?.value) || 10;

  // Kullanıcı değiştiremiyor; sabit
  const breakCount = 45;
  const breakSec = 120;

  let sentCount = 0;

  for (let i = 0; i < queue.length; i++) {
    if (!isRunning) break;

    const person = queue[i];

    let text = msgTemplate
      .replace(/{{Ad}}/g, person.ad)
      .replace(/{{Soyad}}/g, person.soyad)
      .replace(/{{Hitap}}/g, person.hitap || "");

    setStatus(`Gönderiliyor (${i + 1}/${queue.length}): ${person.ad}`);

    const url = `https://web.whatsapp.com/send?phone=${encodeURIComponent(
      person.phone
    )}&text=${encodeURIComponent(text)}`;

    // Link tıklama simülasyonu
    const link = document.createElement("a");
    link.href = url;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Yüklenmesi için bekle
    await sleep(4000);

    try {
      const selector =
        userSettings.sendButtonSelector || DEFAULT_SETTINGS.sendButtonSelector;
      const sendBtn = await waitForElement(selector, 10000);

      if (sendBtn && isRunning) {
        sendBtn.click();
        sentCount++;
        setStatus(`✅ ${i + 1}/${queue.length} - ${person.ad}`);
      } else {
        setStatus(`❌ Buton bulunamadı: ${person.ad}`);
        console.warn("Send button not found for:", person.ad);
      }
    } catch (e) {
      console.error("Error clicking send button:", e);
      setStatus(`❌ Hata: ${person.ad}`);
    }

    if (!isRunning) break;

    // Son kişiden sonra kesinlikle bekleme yapma
    if (i < queue.length - 1) {
      if (breakCount > 0 && sentCount > 0 && sentCount % breakCount === 0) {
        await sleepCount(breakSec, "Mola");
      } else {
        const wait = Math.floor(
          Math.random() * (maxTime - minTime + 1) + minTime
        );
        await sleepCount(wait, "Bekleniyor");
      }
    }
  }

  isRunning = false;
  toggleButtons(false);
  if (sentCount > 0) setStatus("🎉 Bitti!");
}

/* ==== Yardımcılar ==== */

function setStatus(msg) {
  const headerStatus = document.getElementById("wp-status");
  const detailStatus = document.getElementById("wp-status-detail");
  const headerDot = document.getElementById("wp-dot");
  const detailDot = document.getElementById("wp-dot-detail");

  if (headerStatus) headerStatus.innerText = msg;
  if (detailStatus) detailStatus.innerText = msg;

  const isActive =
    msg.includes("Gönderiliyor") ||
    msg.includes("Bekleniyor") ||
    msg.includes("Mola");

  if (headerDot) headerDot.classList.toggle("active", isActive);
  if (detailDot) detailDot.classList.toggle("active", isActive);
}

function toggleButtons(active) {
  const startBtn = document.getElementById("wp-start");
  const stopBtn = document.getElementById("wp-stop");
  if (!startBtn || !stopBtn) return;

  startBtn.style.display = active ? "none" : "block";
  stopBtn.style.display = active ? "block" : "none";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sleepCount(sec, label) {
  while (sec > 0 && isRunning) {
    setStatus(`⏳ ${label}: ${sec}`);
    await sleep(1000);
    sec--;
  }
}

function waitForElement(selector, timeout) {
  return new Promise((resolve) => {
    const elNow = document.querySelector(selector);
    if (elNow) return resolve(elNow);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/* ==== İzleme ==== */

window.addEventListener("load", injectPanel);

const observer = new MutationObserver(() => {
  if (!document.getElementById("wp-custom-panel") && document.getElementById("side")) {
    injectPanel();
  }
  // Sürekli header butonunu kontrol et (WA navigasyonunda kaybolabilir)
  if (document.getElementById("side") && !document.getElementById("wp-header-toggle-btn")) {
    injectHeaderButton();
  }
});
observer.observe(document.body, { childList: true, subtree: true });
