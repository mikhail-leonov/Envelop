/* app.js — Envelope Printer
   Vanilla JavaScript, no frameworks, no jQuery, no inline scripts.

   The envelope starts empty with two large clickable buttons:
   Sender (top-left) and Recipient (bottom-right). Clicking one opens a
   window listing the saved address book. The first list entry is always
   "Add new address"; the remaining entries are saved addresses.
   If exactly one address exists, clicking an empty slot places it
   automatically instead of opening the window.
   Addresses are { name, address, city, state } and live in localStorage.

   Envelope size is chosen from a fixed list of standard sizes and drives
   both the on-screen aspect ratio and the printed @page size.

   Presets store a named snapshot of { senderId, recipientId, size } so a
   whole envelope setup can be saved and reloaded in one click.

   The modals and toast are driven by plain JS using Bootstrap's CSS classes,
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

  // Standard envelope sizes. w/h are in inches; mm sizes converted (1mm=0.0393701in).
  var SIZES = [
    { code: "no10",    label: "#10 — 9.5 × 4.125 in",    w: 9.5,    h: 4.125 },
    { code: "no9",     label: "#9 — 8.875 × 3.875 in",   w: 8.875,  h: 3.875 },
    { code: "monarch", label: "Monarch — 7.5 × 3.875 in", w: 7.5,   h: 3.875 },
    { code: "a2",      label: "A2 — 5.75 × 4.375 in",    w: 5.75,   h: 4.375 },
    { code: "dl",      label: "DL — 220 × 110 mm",       w: 8.6614, h: 4.3307 },
    { code: "c6",      label: "C6 — 162 × 114 mm",       w: 6.3780, h: 4.4882 },
    { code: "c5",      label: "C5 — 229 × 162 mm",       w: 9.0157, h: 6.3780 },
    { code: "171x100", label: "171×100 — 100 × 171 mm (~3.94 × 6.73 in)", w: 6.7323, h: 3.9370 },
    { code: "250x112", label: "250×112 — 112 × 250 mm (~4.41 × 9.84 in)", w: 9.8425, h: 4.4094 }
  ];

  var addresses = [];
  var presets = [];
  var settings = { lang: "en", senderId: null, recipientId: null, size: "no10" };

  var activeSlot = "sender"; // which slot the open address modal is editing
  var formEditingId = null;  // address id being edited in the modal form
  var backdropEl = null;     // manual modal backdrop element
  var openModalEl = null;    // element of the currently open modal (if any)

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

  function findPreset(id) {
    if (!id) { return null; }
    for (var i = 0; i < presets.length; i++) {
      if (presets[i] && presets[i].id === id) { return presets[i]; }
    }
    return null;
  }

  function findSize(code) {
    for (var i = 0; i < SIZES.length; i++) {
      if (SIZES[i].code === code) { return SIZES[i]; }
    }
    return SIZES[0];
  }
  function hasSize(code) {
    for (var i = 0; i < SIZES.length; i++) { if (SIZES[i].code === code) { return true; } }
    return false;
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
  /* Modals (manual — no Bootstrap JS required)                        */
  /* A single shared backdrop; only one modal open at a time.          */
  /* ---------------------------------------------------------------- */
  function showModalEl(id) {
    var el = $(id);
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
    openModalEl = el;
  }

  function hideModalEl(id) {
    var el = $(id);
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
    if (openModalEl === el) { openModalEl = null; }
  }

  function showForm(show) {
    var f = $("addrForm");
    var b = $("btnSaveAddr");
    if (f) { f.classList.toggle("d-none", !show); }
    if (b) { b.classList.toggle("d-none", !show); }
  }

  // Address modal wrappers (carry the extra form reset behaviour).
  function showModal() { showModalEl("addrModal"); }
  function hideModal() {
    hideModalEl("addrModal");
    resetForm();
    showForm(false);
  }

  function closeOpenModal() {
    if (!openModalEl) { return; }
    if (openModalEl.id === "addrModal") { hideModal(); }
    else { hideModalEl(openModalEl.id); }
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
      if (typeof s.size === "string") { settings.size = s.size; }
    }
    if (!I18n.has(settings.lang)) {
      settings.lang = I18n.has("en") ? "en" : (I18n.list()[0] || "en");
    }
    if (!hasSize(settings.size)) { settings.size = SIZES[0].code; }
  }
  function saveSettings() { writeJSON(STORAGE.settings, settings); }

  function loadAddresses() {
    addresses = readJSON(STORAGE.addresses, []);
    if (!Array.isArray(addresses)) { addresses = []; }
  }
  function saveAddresses() { writeJSON(STORAGE.addresses, addresses); }

  function loadPresets() {
    presets = readJSON(STORAGE.presets, []);
    if (!Array.isArray(presets)) { presets = []; }
  }
  function savePresets() { writeJSON(STORAGE.presets, presets); }

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
  /* Envelope size                                                     */
  /* ================================================================ */
  function applyEnvelopeSize() {
    var s = findSize(settings.size);
    var env = $("envelope");
    if (env) {
      env.style.setProperty("--env-w", String(s.w));
      env.style.setProperty("--env-h", String(s.h));
      env.setAttribute("data-size", s.code);
    }
    // CSS variables aren't allowed inside @page, so inject a print rule.
    var st = $("printSizeStyle");
    if (!st) {
      st = document.createElement("style");
      st.id = "printSizeStyle";
      document.head.appendChild(st);
    }
    st.textContent =
      "@media print{" +
        "@page{size:" + s.w + "in " + s.h + "in;margin:0;}" +
        "#envelope{width:" + s.w + "in;height:" + s.h + "in;}" +
      "}";
  }

  function buildSizeSelect() {
    var sel = $("sizeSelect");
    if (!sel) { return; }
    // Use the markup's <option> list if it has one; otherwise build from SIZES.
    if (!sel.options || sel.options.length === 0) {
      SIZES.forEach(function (s) {
        var opt = document.createElement("option");
        opt.value = s.code;
        opt.textContent = s.label;
        sel.appendChild(opt);
      });
    }
    sel.value = settings.size;
  }

  function setSize(code) {
    if (!hasSize(code)) { code = SIZES[0].code; }
    settings.size = code;
    applyEnvelopeSize();
    saveSettings();
    var sel = $("sizeSelect");
    if (sel && sel.value !== code) { sel.value = code; }
  }

  /* ================================================================ */
  /* Envelope rendering                                                */
  /* ================================================================ */
  function renderSlot(slot, container) {
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
    renderSlot("sender", $("envSender"));
    renderSlot("recipient", $("envRecipient"));
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
  /* Presets (modal list)                                              */
  /* ================================================================ */
  function presetSummary(p) {
    var size = findSize(p.size).label;
    var snd = findAddress(p.senderId);
    var rcp = findAddress(p.recipientId);
    var sName = snd && snd.name ? snd.name : "—";
    var rName = rcp && rcp.name ? rcp.name : "—";
    return size + " · " + sName + " \u2192 " + rName;
  }

  function renderPresetList() {
    var box = $("presetList");
    if (!box) { return; }
    box.textContent = "";

    if (!presets.length) {
      var empty = document.createElement("div");
      empty.className = "list-group-item text-secondary";
      empty.textContent = I18n.t("no_presets");
      box.appendChild(empty);
      return;
    }

    presets.forEach(function (p) {
      var item = document.createElement("div");
      item.className = "list-group-item d-flex justify-content-between align-items-center gap-2";

      var pick = document.createElement("button");
      pick.type = "button";
      pick.className = "btn btn-link text-start text-reset text-decoration-none p-0 flex-grow-1";
      pick.setAttribute("data-action", "load-preset");
      pick.setAttribute("data-id", p.id);

      var nm = document.createElement("div");
      nm.className = "fw-semibold";
      nm.textContent = p.name;
      pick.appendChild(nm);

      var desc = document.createElement("div");
      desc.className = "small text-secondary";
      desc.textContent = presetSummary(p);
      pick.appendChild(desc);

      var group = document.createElement("div");
      group.className = "btn-group btn-group-sm flex-shrink-0";
      group.appendChild(makeBtn("load-preset", p.id, "btn-outline-secondary", I18n.t("load")));
      group.appendChild(makeBtn("delete-preset", p.id, "btn-outline-danger", I18n.t("delete")));

      item.appendChild(pick);
      item.appendChild(group);
      box.appendChild(item);
    });
  }

  function openPresets() {
    var inp = $("presetName");
    if (inp) { inp.value = ""; }
    renderPresetList();
    showModalEl("presetModal");
  }

  function savePreset() {
    var inp = $("presetName");
    var name = inp ? inp.value.trim() : "";
    if (!name) {
      flash(I18n.t("preset_name_required"), true);
      if (inp && inp.focus) { inp.focus(); }
      return;
    }
    presets.push({
      id: uid(),
      name: name,
      senderId: settings.senderId,
      recipientId: settings.recipientId,
      size: settings.size
    });
    savePresets();
    if (inp) { inp.value = ""; }
    renderPresetList();
    flash(I18n.t("preset_saved"));
  }

  function loadPreset(id) {
    var p = findPreset(id);
    if (!p) { return; }
    settings.senderId = p.senderId || null;
    settings.recipientId = p.recipientId || null;
    if (p.size && hasSize(p.size)) { settings.size = p.size; }
    saveSettings();

    var sel = $("sizeSelect");
    if (sel && sel.value !== settings.size) { sel.value = settings.size; }
    applyEnvelopeSize();
    updateEnvelope();
    hideModalEl("presetModal");
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
    if (clearBtn) { clearBtn.classList.toggle("d-none", !settings[SLOT_KEY[slot]]); }

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
    if (clearBtn) { clearBtn.classList.toggle("d-none", !settings[SLOT_KEY[activeSlot]]); }

    flash(I18n.t("deleted_ok"));
  }

  /* ================================================================ */
  /* Printing                                                          */
  /* ================================================================ */
  function printEnvelope() {
    closeOpenModal();
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
  /* Events (delegation)                                               */
  /* ================================================================ */
  function onClick(e) {
    // Click on a modal overlay (outside the dialog) closes it.
    if (openModalEl && e.target === openModalEl) { closeOpenModal(); return; }

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
      case "close-presets": hideModalEl("presetModal"); break;
      case "close-toast": hideToast(); break;
      case "print": printEnvelope(); break;
      default: break;
    }
  }

  function onKeydown(e) {
    if (e.key === "Escape" && openModalEl) {
      closeOpenModal();
      return;
    }
    if (e.key === "Enter" && e.target && e.target.id === "presetName") {
      e.preventDefault();
      savePreset();
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
  function onSizeChange(e) { setSize(e.target.value); }

  /* ================================================================ */
  /* Init                                                              */
  /* ================================================================ */
  function init() {
    loadSettings();
    loadAddresses();
    loadPresets();

    buildLangSelect();
    buildSizeSelect();
    setLanguage(settings.lang);
    applyEnvelopeSize();
    updateEnvelope();

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeydown);

    var langSel = $("langSelect");
    if (langSel) { langSel.addEventListener("change", onLangChange); }
    var sizeSel = $("sizeSelect");
    if (sizeSel) { sizeSel.addEventListener("change", onSizeChange); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
