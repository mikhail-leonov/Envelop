/* app.js — Envelope Printer
   Vanilla JavaScript, no frameworks, no jQuery, no inline scripts.
   The envelope starts empty with two large clickable buttons:
   Sender (top-left) and Recipient (bottom-right). Clicking one opens a
   window listing the saved address book. The first list entry is always
   "Add new address"; the remaining entries are saved addresses.
   If exactly one address exists, clicking an empty slot places it
   automatically instead of opening the window.
   Addresses are { name, address, city, state } and live in localStorage.

   The modal and toast are driven by plain JS using Bootstrap's CSS classes,
   so everything works even if Bootstrap's JavaScript bundle is not loaded. */
(function () {
  "use strict";
  /* ================================================================ */
  /* i18n engine                                                       */
  /* ================================================================ */
  var FT = (window.FT = window.FT || {});
  FT.I18n = FT.I18n || {
    _packs: {},
    register: function (code, def) { this._packs[code] = def; }
  };

  var I18n = FT.I18n;
  I18n.current = I18n.current || "en";
  I18n.list = function () { return Object.keys(this._packs); };
  I18n.has = function (code) { return Object.prototype.hasOwnProperty.call(this._packs, code); };
  I18n.meta = function (code) { return this._packs[code] || {}; };
  I18n.setCurrent = function (code) { if (this.has(code)) { this.current = code; } };
  I18n.dict = function () {
    var p = this._packs[this.current];
    return (p && p.strings) || {};
  };
  I18n.t = function (key) {
    var d = this.dict();
    return Object.prototype.hasOwnProperty.call(d, key) ? d[key] : key;
  };

  /* ================================================================ */
  /* Constants & state                                                 */
  /* ================================================================ */
  var STORAGE = {
    addresses: "envelop.addresses",
    settings: "envelop.settings",
    presets: "envelop.presets"
  };

  var FIELDS = ["name", "address", "city", "state"];
  var SLOT_KEY = { sender: "senderId", recipient: "recipientId" };

  // Envelope sizes (landscape: width > height). Units kept per-size so metric
  // envelopes print in mm and imperial ones in inches.
  var ENV_SIZES = [
    { id: "no10",  label: "No. 10 — 9.5 × 4.125 in",  w: 9.5,   h: 4.125, unit: "in" },
    { id: "no9",   label: "No. 9 — 8.875 × 3.875 in", w: 8.875, h: 3.875, unit: "in" },
    { id: "no675", label: "No. 6¾ — 6.5 × 3.625 in",  w: 6.5,   h: 3.625, unit: "in" },
    { id: "a2",    label: "A2 — 5.75 × 4.375 in",     w: 5.75,  h: 4.375, unit: "in" },
    { id: "a7",    label: "A7 — 7.25 × 5.25 in",      w: 7.25,  h: 5.25,  unit: "in" },
    { id: "dl",    label: "DL — 220 × 110 mm",        w: 220,   h: 110,   unit: "mm" },
    { id: "c6",    label: "C6 — 162 × 114 mm",        w: 162,   h: 114,   unit: "mm" },
    { id: "c5",    label: "C5 — 229 × 162 mm",        w: 229,   h: 162,   unit: "mm" }
  ];
  function findSize(id) {
    for (var i = 0; i < ENV_SIZES.length; i++) {
      if (ENV_SIZES[i].id === id) { return ENV_SIZES[i]; }
    }
    return ENV_SIZES[0];
  }

  var addresses = [];
  var presets = [];
  var settings = {
    lang: "en", senderId: null, recipientId: null, hideRecipient: false,
    sizeId: "no10",
    offsetX: 0, offsetY: 0   // print calibration, in millimetres
  };

  var activeSlot = "sender"; // which slot the open modal is editing
  var formEditingId = null;  // address id being edited in the modal form
  var backdropEl = null;     // manual modal backdrop element
  var presetBackdrop = null; // manual backdrop for the presets modal
  var calibBackdrop = null;  // manual backdrop for the calibration modal

  /* ================================================================ */
  /* Utilities                                                         */
  /* ================================================================ */
  function $(id) { return document.getElementById(id); }
  function val(id) { var e = $(id); return e ? e.value.trim() : ""; }

  function uid() {
    return "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) { return fallback; }
      var parsed = JSON.parse(raw);
      return parsed === null ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // Storage unavailable (private mode / quota) — fail silently.
    }
  }

  function findAddress(id) {
    if (!id) { return null; }
    for (var i = 0; i < addresses.length; i++) {
      if (addresses[i] && addresses[i].id === id) { return addresses[i]; }
    }
    return null;
  }

  function isEmptyRecord(rec) {
    for (var i = 0; i < FIELDS.length; i++) {
      if (rec[FIELDS[i]]) { return false; }
    }
    return true;
  }

  /* ---------------------------------------------------------------- */
  /* Toast (manual — no Bootstrap JS required)                         */
  /* ---------------------------------------------------------------- */
  function flash(message, danger) {
    var el = $("appToast");
    var body = $("appToastBody");
    if (!el || !body) { return; }
    body.textContent = message;
    el.classList.remove("text-bg-success", "text-bg-danger");
    el.classList.add(danger ? "text-bg-danger" : "text-bg-success");
    el.classList.add("show");
    el.style.display = "block";
    if (el._timer) { window.clearTimeout(el._timer); }
    el._timer = window.setTimeout(function () {
      el.classList.remove("show");
      el.style.display = "";
    }, 2000);
  }
  function hideToast() {
    var el = $("appToast");
    if (!el) { return; }
    if (el._timer) { window.clearTimeout(el._timer); }
    el.classList.remove("show");
    el.style.display = "";
  }

  /* ---------------------------------------------------------------- */
  /* Modal (manual — no Bootstrap JS required)                         */
  /* ---------------------------------------------------------------- */
  function isModalOpen() {
    var el = $("addrModal");
    return !!(el && el.classList.contains("show"));
  }

  function showForm(show) {
    var f = $("addrForm");
    var b = $("btnSaveAddr");
    if (f) { f.classList.toggle("d-none", !show); }
    if (b) { b.classList.toggle("d-none", !show); }
  }

  function showModal() {
    var el = $("addrModal");
    if (!el) { return; }
    el.classList.add("show");
    el.style.display = "block";
    el.removeAttribute("aria-hidden");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("role", "dialog");
    document.body.classList.add("modal-open");

    if (!backdropEl) {
      backdropEl = document.createElement("div");
      backdropEl.className = "modal-backdrop fade show";
      document.body.appendChild(backdropEl);
    }
  }

  function hideModal() {
    var el = $("addrModal");
    if (el) {
      el.classList.remove("show");
      el.style.display = "";
      el.setAttribute("aria-hidden", "true");
      el.removeAttribute("aria-modal");
    }
    document.body.classList.remove("modal-open");
    if (backdropEl && backdropEl.parentNode) {
      backdropEl.parentNode.removeChild(backdropEl);
    }
    backdropEl = null;
    resetForm();
    showForm(false);
  }

  /* ================================================================ */
  /* Persistence                                                       */
  /* ================================================================ */
  function loadSettings() {
    var s = readJSON(STORAGE.settings, null);
    if (s && typeof s === "object") {
      if (typeof s.lang === "string") { settings.lang = s.lang; }
      settings.senderId = s.senderId || null;
      settings.recipientId = s.recipientId || null;
      settings.hideRecipient = !!s.hideRecipient;
      if (typeof s.sizeId === "string") { settings.sizeId = findSize(s.sizeId).id; }
      settings.offsetX = clampOffset(s.offsetX);
      settings.offsetY = clampOffset(s.offsetY);
    }
    if (!I18n.has(settings.lang)) {
      settings.lang = I18n.has("en") ? "en" : (I18n.list()[0] || "en");
    }
  }
  function saveSettings() { writeJSON(STORAGE.settings, settings); }

  function loadAddresses() {
    addresses = readJSON(STORAGE.addresses, []);
    if (!Array.isArray(addresses)) { addresses = []; }
  }
  function saveAddresses() { writeJSON(STORAGE.addresses, addresses); }

  /* ================================================================ */
  /* Address formatting                                                */
  /* Name / Address / "City, State" — empty fields are skipped.        */
  /* ================================================================ */
  function buildAddress(a) {
    a = a || {};
    var lines = [];
    if (a.name) { lines.push(a.name); }
    if (a.address) { lines.push(a.address); }
    var cs = "";
    if (a.city) { cs += a.city; }
    if (a.state) { cs += (cs ? ", " : "") + a.state; }
    if (cs) { lines.push(cs); }
    return lines;
  }

  function appendLines(container, lines) {
    lines.forEach(function (line) {
      var div = document.createElement("div");
      div.textContent = line;
      container.appendChild(div);
    });
  }

  /* ================================================================ */
  /* Envelope rendering                                                */
  /* ================================================================ */
  function renderSlot(slot, container) {
    if (!container) { return; }
    container.textContent = "";
    var rec = findAddress(settings[SLOT_KEY[slot]]);

    if (rec && !isEmptyRecord(rec)) {
      appendLines(container, buildAddress(rec));
      return;
    }

    // Empty state: a large button-styled prompt (purely visual <span>,
    // so the slot div stays the single tab stop and click target).
    var prompt = document.createElement("span");
    prompt.className = "btn btn-outline-primary btn-lg fw-semibold";
    prompt.setAttribute("data-placeholder", "");

    var icon = document.createElement("i");
    icon.className = "bi bi-plus-circle me-2";
    prompt.appendChild(icon);
    prompt.appendChild(document.createTextNode(I18n.t(slot)));

    container.appendChild(prompt);
  }

  function updateEnvelope() {
    var recipientEl = $("envRecipient");
    if (recipientEl) { recipientEl.classList.toggle("d-none", !!settings.hideRecipient); }
    renderSlot("sender", $("envSender"));
    renderSlot("recipient", recipientEl);
  }

  /* ================================================================ */
  /* Address book (modal list) — first entry is always "Add new".      */
  /* ================================================================ */
  function makeBtn(action, id, btnClass, label) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "btn " + btnClass;
    b.setAttribute("data-action", action);
    b.setAttribute("data-id", id);
    b.textContent = label;
    return b;
  }

  function renderAddressList() {
    var box = $("addrList");
    if (!box) { return; }
    box.textContent = "";

    // First item: Add new address.
    var addItem = document.createElement("button");
    addItem.type = "button";
    addItem.className = "list-group-item list-group-item-action d-flex align-items-center gap-2 fw-semibold";
    addItem.setAttribute("data-action", "show-add-form");
    var plus = document.createElement("i");
    plus.className = "bi bi-plus-circle";
    addItem.appendChild(plus);
    addItem.appendChild(document.createTextNode(I18n.t("add_new")));
    box.appendChild(addItem);

    var currentId = settings[SLOT_KEY[activeSlot]];

    addresses.forEach(function (rec) {
      var item = document.createElement("div");
      item.className = "list-group-item d-flex justify-content-between align-items-center gap-2";

      // Clicking the body picks this address for the active slot.
      var pick = document.createElement("button");
      pick.type = "button";
      pick.className = "btn btn-link text-start text-reset text-decoration-none p-0 flex-grow-1";
      pick.setAttribute("data-action", "pick-address");
      pick.setAttribute("data-id", rec.id);

      var lines = buildAddress(rec);
      if (!lines.length) { lines = ["—"]; }
      appendLines(pick, lines);

      if (rec.id === currentId) {
        var badge = document.createElement("span");
        badge.className = "badge text-bg-secondary mt-1";
        badge.textContent = I18n.t("current");
        pick.appendChild(badge);
      }

      var group = document.createElement("div");
      group.className = "btn-group btn-group-sm flex-shrink-0";
      group.appendChild(makeBtn("edit-address", rec.id, "btn-outline-secondary", I18n.t("edit")));
      group.appendChild(makeBtn("delete-address", rec.id, "btn-outline-danger", I18n.t("delete")));

      item.appendChild(pick);
      item.appendChild(group);
      box.appendChild(item);
    });
  }

  /* ================================================================ */
  /* Modal form helpers                                                */
  /* ================================================================ */
  function writeFormFromRecord(rec) {
    rec = rec || {};
    FIELDS.forEach(function (f) {
      var el = $("addr-" + f);
      if (el) { el.value = rec[f] || ""; }
    });
  }

  function readFormRecord() {
    var o = {};
    FIELDS.forEach(function (f) { o[f] = val("addr-" + f); });
    return o;
  }

  function updateSaveBtnLabel() {
    var b = $("btnSaveAddr");
    if (b) { b.textContent = I18n.t(formEditingId ? "save_changes" : "save_use"); }
  }

  function resetForm() {
    formEditingId = null;
    writeFormFromRecord({});
    updateSaveBtnLabel();
  }

  function focusName() {
    var nameEl = $("addr-name");
    window.setTimeout(function () { if (nameEl && nameEl.focus) { nameEl.focus(); } }, 0);
  }

  /* ================================================================ */
  /* Slot / address actions                                            */
  /* ================================================================ */
  // Decide what a slot click does: auto-place a lone address, else open.
  function activateSlot(slot) {
    var filled = !!findAddress(settings[SLOT_KEY[slot]]);
    if (!filled && addresses.length === 1) {
      placeAddress(slot, addresses[0].id);
      flash(I18n.t("auto_placed"));
      return;
    }
    openSlot(slot);
  }

  function openSlot(slot) {
    activeSlot = slot;
    resetForm();
    showForm(false); // show the list first; the form opens on demand

    var title = $("addrModalTitle");
    if (title) {
      title.textContent = I18n.t(slot === "sender" ? "choose_sender" : "choose_recipient");
    }
    var clearBtn = $("btnClearSlot");
    if (clearBtn) {
      var canClear = !!settings[SLOT_KEY[slot]];
      clearBtn.classList.toggle("d-none", !canClear);
    }

    renderAddressList();
    showModal();
  }

  function placeAddress(slot, id) {
    settings[SLOT_KEY[slot]] = id;
    saveSettings();
    updateEnvelope();
  }

  function assignToSlot(slot, id) {
    placeAddress(slot, id);
    hideModal();
  }

  function clearSlot() {
    settings[SLOT_KEY[activeSlot]] = null;
    saveSettings();
    updateEnvelope();
    hideModal();
  }

  // Toggle for hiding the recipient (destination) address (header switch).
  function setHideRecipient(hide) {
    settings.hideRecipient = !!hide;
    saveSettings();
    updateEnvelope();
  }

  function saveAddressFromForm() {
    var data = readFormRecord();
    if (isEmptyRecord(data)) {
      flash(I18n.t("nothing_to_save"), true);
      return;
    }

    var id = formEditingId;
    var rec = id ? findAddress(id) : null;

    if (rec) {
      FIELDS.forEach(function (f) { rec[f] = data[f]; });
    } else {
      data.id = uid();
      addresses.push(data);
      id = data.id;
    }

    formEditingId = null;
    saveAddresses();
    flash(I18n.t("saved_ok"));
    assignToSlot(activeSlot, id); // save & use, then close
  }

  function editAddress(id) {
    var rec = findAddress(id);
    if (!rec) { return; }
    formEditingId = id;
    writeFormFromRecord(rec);
    updateSaveBtnLabel();
    showForm(true);
    focusName();
  }

  function deleteAddress(id) {
    if (!window.confirm(I18n.t("confirm_delete"))) { return; }
    addresses = addresses.filter(function (r) { return r.id !== id; });

    if (settings.senderId === id) { settings.senderId = null; }
    if (settings.recipientId === id) { settings.recipientId = null; }
    if (formEditingId === id) { resetForm(); showForm(false); }

    saveAddresses();
    saveSettings();
    renderAddressList();
    updateEnvelope();

    var clearBtn = $("btnClearSlot");
    if (clearBtn) {
      var canClear = !!settings[SLOT_KEY[activeSlot]];
      clearBtn.classList.toggle("d-none", !canClear);
    }

    flash(I18n.t("deleted_ok"));
  }

  /* ================================================================ */
  /* Presets — a named bundle of                                       */
  /*   { sizeId, senderId, recipientId, hideRecipient }.               */
  /* ================================================================ */
  function loadPresets() {
    presets = readJSON(STORAGE.presets, []);
    if (!Array.isArray(presets)) { presets = []; }
  }
  function savePresets() { writeJSON(STORAGE.presets, presets); }

  function findPreset(id) {
    for (var i = 0; i < presets.length; i++) {
      if (presets[i] && presets[i].id === id) { return presets[i]; }
    }
    return null;
  }

  // Manual presets modal (same approach as the address modal).
  function showPresetModal() {
    var el = $("presetModal");
    if (!el) { return; }
    el.classList.add("show");
    el.style.display = "block";
    el.removeAttribute("aria-hidden");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("role", "dialog");
    document.body.classList.add("modal-open");
    if (!presetBackdrop) {
      presetBackdrop = document.createElement("div");
      presetBackdrop.className = "modal-backdrop fade show";
      document.body.appendChild(presetBackdrop);
    }
  }
  function hidePresetModal() {
    var el = $("presetModal");
    if (el) {
      el.classList.remove("show");
      el.style.display = "";
      el.setAttribute("aria-hidden", "true");
      el.removeAttribute("aria-modal");
    }
    document.body.classList.remove("modal-open");
    if (presetBackdrop && presetBackdrop.parentNode) {
      presetBackdrop.parentNode.removeChild(presetBackdrop);
    }
    presetBackdrop = null;
  }
  function isPresetModalOpen() {
    var el = $("presetModal");
    return !!(el && el.classList.contains("show"));
  }

  // One-line summary: "No. 10 · Alice → Bob".
  function presetSummary(p) {
    var sizeName = findSize(p.sizeId).label.split(" — ")[0];
    function nameOf(id) {
      var rec = findAddress(id);
      if (!rec) { return "—"; }
      var lines = buildAddress(rec);
      return lines.length ? lines[0] : "—";
    }
    return sizeName + " · " + nameOf(p.senderId) + " → " + nameOf(p.recipientId);
  }

  function renderPresetList() {
    var box = $("presetList");
    if (!box) { return; }
    box.textContent = "";

    if (!presets.length) {
      var empty = document.createElement("div");
      empty.className = "list-group-item text-secondary small";
      empty.textContent = I18n.t("no_presets");
      box.appendChild(empty);
      return;
    }

    presets.forEach(function (p) {
      var item = document.createElement("div");
      item.className = "list-group-item d-flex justify-content-between align-items-center gap-2";

      var info = document.createElement("div");
      info.className = "flex-grow-1";
      var title = document.createElement("div");
      title.className = "fw-semibold";
      title.textContent = p.name;
      var sub = document.createElement("div");
      sub.className = "small text-secondary";
      sub.textContent = presetSummary(p);
      info.appendChild(title);
      info.appendChild(sub);

      var group = document.createElement("div");
      group.className = "btn-group btn-group-sm flex-shrink-0";
      group.appendChild(makeBtn("load-preset", p.id, "btn-outline-primary", I18n.t("load")));
      group.appendChild(makeBtn("delete-preset", p.id, "btn-outline-danger", I18n.t("delete")));

      item.appendChild(info);
      item.appendChild(group);
      box.appendChild(item);
    });
  }

  function openPresets() {
    var nameInput = $("presetName");
    if (nameInput) { nameInput.value = ""; }
    renderPresetList();
    showPresetModal();
  }

  function savePreset() {
    var nameInput = $("presetName");
    var name = nameInput ? nameInput.value.trim() : "";
    if (!name) {
      flash(I18n.t("preset_name_required"), true);
      return;
    }
    presets.push({
      id: uid(),
      name: name,
      sizeId: settings.sizeId,
      senderId: settings.senderId,
      recipientId: settings.recipientId,
      hideRecipient: !!settings.hideRecipient
    });
    savePresets();
    if (nameInput) { nameInput.value = ""; }
    renderPresetList();
    flash(I18n.t("preset_saved"));
  }

  function loadPreset(id) {
    var p = findPreset(id);
    if (!p) { return; }
    settings.senderId = p.senderId || null;
    settings.recipientId = p.recipientId || null;
    settings.hideRecipient = !!p.hideRecipient;
    applySize(p.sizeId); // updates the size style + select, persists settings

    var hideChk = $("hideRecipient");
    if (hideChk) { hideChk.checked = !!settings.hideRecipient; }

    updateEnvelope();
    saveSettings();
    hidePresetModal();
    flash(I18n.t("preset_loaded"));
  }

  function deletePreset(id) {
    if (!window.confirm(I18n.t("confirm_delete_preset"))) { return; }
    presets = presets.filter(function (p) { return p.id !== id; });
    savePresets();
    renderPresetList();
    flash(I18n.t("preset_deleted"));
  }

  /* ================================================================ */
  /* Printing                                                          */
  /* ================================================================ */
  function printEnvelope() {
    hideModal();
    updateEnvelope();
    window.setTimeout(function () { window.print(); }, 120);
  }

  /* ================================================================ */
  /* Language                                                          */
  /* ================================================================ */
  function applyTranslations() {
    var dict = I18n.dict();

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      if (Object.prototype.hasOwnProperty.call(dict, k)) { el.textContent = dict[k]; }
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-ph");
      if (Object.prototype.hasOwnProperty.call(dict, k)) { el.setAttribute("placeholder", dict[k]); }
    });

    if (Object.prototype.hasOwnProperty.call(dict, "app_title")) {
      document.title = dict.app_title;
    }
  }

  function setLanguage(code) {
    if (!I18n.has(code)) {
      code = I18n.has("en") ? "en" : (I18n.list()[0] || "en");
    }
    I18n.setCurrent(code);
    settings.lang = code;

    var meta = I18n.meta(code);
    document.documentElement.setAttribute("lang", code);
    document.documentElement.setAttribute("dir", meta.dir || "ltr");

    var sel = $("langSelect");
    if (sel && sel.value !== code) { sel.value = code; }

    applyTranslations();
    updateSaveBtnLabel();

    var title = $("addrModalTitle");
    if (title) {
      title.textContent = I18n.t(activeSlot === "sender" ? "choose_sender" : "choose_recipient");
    }

    renderAddressList();
    renderPresetList();
    updateEnvelope();
    saveSettings();
  }

  /* ================================================================ */
  /* Envelope size                                                     */
  /* The chosen size drives both the on-screen aspect ratio and the    */
  /* print page: a dynamic <style> overrides the static defaults.      */
  /* ================================================================ */
  function buildSizeCSS(sz) {
    var w = sz.w + sz.unit;
    var h = sz.h + sz.unit;
    var ratio = (sz.w / sz.h).toFixed(4); // unit cancels; width = height * ratio
    // On screen, fit BOTH axes: width is the smaller of 94% of the viewport
    // width and the width implied by the available height.
    var screenW = "min(94vw, calc((100vh - 8rem) * " + ratio + "))";
    return "#envelope{" +
             "aspect-ratio:" + sz.w + " / " + sz.h + ";" +
             "width:" + screenW + ";" +
             "max-width:94vw;" +
             // Address text scales with the envelope width so every size keeps
             // the No. 10 proportions (~12pt base on a 9.5in-wide envelope).
             // Without this the static 1rem/12pt font overflowed shorter sizes
             // like DL, pushing the addresses off-centre.
             "font-size:calc((" + screenW + ") * 0.0175);" +
           "}" +
           "@media print{" +
             // The printed page IS the envelope. Matching @page to the selected
             // envelope (margin 0) maps the layout 1:1 onto the physical
             // envelope, instead of dropping it into a corner of a Letter sheet
             // where the feeder's alignment shifts everything off-position.
             "@page{size:" + w + " " + h + ";margin:0;}" +
             "#envelope{width:" + w + ";height:" + h + ";max-width:none;aspect-ratio:auto;" +
               "font-size:calc(" + w + " * 0.0175);}" +
           "}";
  }

  function applySize(id) {
    var sz = findSize(id);
    settings.sizeId = sz.id;

    var styleEl = $("envSizeStyle");
    if (styleEl) { styleEl.textContent = buildSizeCSS(sz); }

    var sel = $("envSizeSelect");
    if (sel && sel.value !== sz.id) { sel.value = sz.id; }

    applyOffset(); // offset is in mm; re-express it for the new size
    saveSettings();
  }

  function buildSizeSelect() {
    var sel = $("envSizeSelect");
    if (!sel) { return; }
    sel.textContent = "";
    ENV_SIZES.forEach(function (sz) {
      var opt = document.createElement("option");
      opt.value = sz.id;
      opt.textContent = sz.label;
      sel.appendChild(opt);
    });
    sel.value = settings.sizeId;
  }

  function buildLangSelect() {
    var sel = $("langSelect");
    if (!sel) { return; }
    sel.textContent = "";
    I18n.list().forEach(function (code) {
      var opt = document.createElement("option");
      opt.value = code;
      opt.textContent = code.toUpperCase();
      sel.appendChild(opt);
    });
    sel.value = settings.lang;
  }

  /* ================================================================ */
  /* Print calibration                                                 */
  /* A physical offset (mm) that nudges the print to match a specific  */
  /* printer's feed. It is expressed as a fraction of the envelope, so */
  /* the SAME value resolves to the exact physical offset on paper and */
  /* to the matching scaled shift on screen — that is what keeps the   */
  /* preview and the printed result connected.                         */
  /* ================================================================ */
  function sizeMM(sz) {
    var f = (sz.unit === "in") ? 25.4 : 1;
    return { w: sz.w * f, h: sz.h * f };
  }

  function clampOffset(v) {
    v = Number(v);
    if (!isFinite(v)) { v = 0; }
    if (v > 25) { v = 25; }
    if (v < -25) { v = -25; }
    return Math.round(v * 2) / 2; // snap to 0.5 mm
  }

  function applyOffset() {
    var styleEl = $("envOffsetStyle");
    if (!styleEl) { return; }
    if (!settings.offsetX && !settings.offsetY) {
      styleEl.textContent = "";
      return;
    }
    var mm = sizeMM(findSize(settings.sizeId));
    var rx = mm.w ? (settings.offsetX / mm.w) : 0;
    var ry = mm.h ? (settings.offsetY / mm.h) : 0;
    // translate() % on #envelope is relative to the envelope's own box, so it
    // becomes the true offset in print and the proportional shift on screen.
    styleEl.textContent = "#envelope{transform:translate(" +
      (rx * 100).toFixed(4) + "%," + (ry * 100).toFixed(4) + "%);}";
  }

  function syncCalibInputs() {
    var x = $("calibX"), y = $("calibY");
    if (x) { x.value = settings.offsetX; }
    if (y) { y.value = settings.offsetY; }
  }

  function setOffset(axis, value, syncField) {
    var v = clampOffset(value);
    if (axis === "x") { settings.offsetX = v; } else { settings.offsetY = v; }
    saveSettings();
    applyOffset();
    if (syncField) { syncCalibInputs(); }
  }

  function nudgeOffset(axis, delta) {
    var cur = (axis === "x") ? settings.offsetX : settings.offsetY;
    setOffset(axis, cur + delta, true);
  }

  function resetOffset() {
    settings.offsetX = 0;
    settings.offsetY = 0;
    saveSettings();
    applyOffset();
    syncCalibInputs();
  }

  function showCalibModal() {
    var el = $("calibModal");
    if (!el) { return; }
    el.classList.add("show");
    el.style.display = "block";
    el.removeAttribute("aria-hidden");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("role", "dialog");
    document.body.classList.add("modal-open");
    if (!calibBackdrop) {
      calibBackdrop = document.createElement("div");
      calibBackdrop.className = "modal-backdrop fade show";
      document.body.appendChild(calibBackdrop);
    }
  }
  function hideCalibModal() {
    var el = $("calibModal");
    if (el) {
      el.classList.remove("show");
      el.style.display = "";
      el.setAttribute("aria-hidden", "true");
      el.removeAttribute("aria-modal");
    }
    document.body.classList.remove("modal-open");
    if (calibBackdrop && calibBackdrop.parentNode) {
      calibBackdrop.parentNode.removeChild(calibBackdrop);
    }
    calibBackdrop = null;
  }
  function isCalibModalOpen() {
    var el = $("calibModal");
    return !!(el && el.classList.contains("show"));
  }
  function openCalibrate() {
    syncCalibInputs();
    showCalibModal();
  }

  /* ================================================================ */
  /* Events (delegation)                                               */
  /* ================================================================ */
  function onClick(e) {
    // Click on a modal overlay (outside the dialog) closes it.
    if (e.target === $("addrModal")) { hideModal(); return; }
    if (e.target === $("presetModal")) { hidePresetModal(); return; }
    if (e.target === $("calibModal")) { hideCalibModal(); return; }

    var node = e.target.closest("[data-action]");
    if (!node) { return; }
    var action = node.getAttribute("data-action");
    var id = node.getAttribute("data-id");

    switch (action) {
      case "open-slot": activateSlot(node.getAttribute("data-slot")); break;
      case "show-add-form": resetForm(); showForm(true); focusName(); break;
      case "pick-address": assignToSlot(activeSlot, id); break;
      case "edit-address": editAddress(id); break;
      case "delete-address": deleteAddress(id); break;
      case "save-address": saveAddressFromForm(); break;
      case "clear-slot": clearSlot(); break;
      case "close-modal": hideModal(); break;
      case "open-presets": openPresets(); break;
      case "save-preset": savePreset(); break;
      case "load-preset": loadPreset(id); break;
      case "delete-preset": deletePreset(id); break;
      case "close-presets": hidePresetModal(); break;
      case "open-calibrate": openCalibrate(); break;
      case "close-calibrate": hideCalibModal(); break;
      case "calib-nudge": nudgeOffset(node.getAttribute("data-axis"), parseFloat(node.getAttribute("data-delta"))); break;
      case "calib-reset": resetOffset(); break;
      case "close-toast": hideToast(); break;
      case "print": printEnvelope(); break;
      default: break;
    }
  }

  function onKeydown(e) {
    if (e.key === "Escape" && isCalibModalOpen()) {
      hideCalibModal();
      return;
    }
    if (e.key === "Escape" && isPresetModalOpen()) {
      hidePresetModal();
      return;
    }
    if (e.key === "Escape" && isModalOpen()) {
      hideModal();
      return;
    }
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      var zone = e.target.closest('[data-action="open-slot"]');
      if (zone) {
        e.preventDefault();
        activateSlot(zone.getAttribute("data-slot"));
      }
    }
  }

  function onLangChange(e) { setLanguage(e.target.value); }
  function onSizeChange(e) { applySize(e.target.value); }

  /* ================================================================ */
  /* Init                                                              */
  /* ================================================================ */
  function init() {
    loadSettings();
    loadAddresses();
    loadPresets();

    buildLangSelect();
    setLanguage(settings.lang);
    buildSizeSelect();
    applySize(settings.sizeId);
    applyOffset();
    syncCalibInputs();
    updateEnvelope();

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeydown);

    var sel = $("langSelect");
    if (sel) { sel.addEventListener("change", onLangChange); }

    var szSel = $("envSizeSelect");
    if (szSel) { szSel.addEventListener("change", onSizeChange); }

    var hideChk = $("hideRecipient");
    if (hideChk) {
      hideChk.checked = !!settings.hideRecipient;
      hideChk.addEventListener("change", function (e) { setHideRecipient(e.target.checked); });
    }

    var cx = $("calibX");
    if (cx) { cx.addEventListener("input", function (e) { setOffset("x", e.target.value, false); }); }
    var cy = $("calibY");
    if (cy) { cy.addEventListener("input", function (e) { setOffset("y", e.target.value, false); }); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
