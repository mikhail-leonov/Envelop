/* js/lng/eo.js — Esperanto language pack (Esperanto). Registers itself with the i18n engine. */
(function () {
  "use strict";
  // Bootstrap the shared namespace so this file works regardless of script load order.
  var FT = (window.FT = window.FT || {});
  FT.I18n = FT.I18n || {
    _packs: {},
    register: function (code, def) { this._packs[code] = def; }
  };

  FT.I18n.register("eo", {
    name: "Esperanto",
    nativeName: "Esperanto",
    dir: "ltr",
    strings: {
      app_title: "Koverta Presilo",
      lang: "Lingvo",
      env_size: "Koverta grandeco",
      print: "Presi",
      print_envelope: "Presi koverton",
      hide_recipient: "Kaŝi ricevanton",

      sender: "Sendanto",
      recipient: "Ricevanto",
      choose_sender: "Elektu sendantan adreson",
      choose_recipient: "Elektu ricevantan adreson",

      saved_addresses: "Konservitaj adresoj",
      add_new: "Aldoni novan adreson",

      name: "Nomo",
      address: "Adreso",
      city: "Urbo",
      state: "Regiono",

      save_use: "Konservi kaj uzi",
      save_changes: "Konservi ŝanĝojn",
      save: "Konservi",
      edit: "Redakti",
      delete: "Forigi",
      load: "Ŝargi",
      clear_slot: "Vakigi ĉi tiun kampon",
      close: "Fermi",
      current: "Nuna",

      presets: "Antaŭagordoj",
      save_preset: "Konservi nunan kiel antaŭagordon",
      preset_name_ph: "Nomo de antaŭagordo",
      no_presets: "Ankoraŭ neniu antaŭagordo konservita.",
      preset_saved: "Antaŭagordo konservita.",
      preset_loaded: "Antaŭagordo ŝargita.",
      preset_deleted: "Antaŭagordo forigita.",
      preset_name_required: "Bonvolu enigi nomon de antaŭagordo.",
      confirm_delete_preset: "Ĉu forigi ĉi tiun antaŭagordon?",

      calibrate: "Alĝustigi",
      print_calibration: "Presa alĝustigo",
      offset_x: "Horizontala deŝovo (mm)",
      offset_y: "Vertikala deŝovo (mm)",
      reset: "Restarigi",
      calib_hint: "Presu testan koverton, mezuru kiom la teksto deŝoviĝas, poste alĝustigu ĝis ĝi akordiĝas. Dekstren kaj malsupren estas pozitivaj. La antaŭrigardo moviĝas kune, do kion vi vidas estas kio presiĝas.",

      confirm_delete: "Ĉu forigi ĉi tiun adreson?",
      saved_ok: "Konservita.",
      deleted_ok: "Forigita.",
      nothing_to_save: "Bonvolu plenigi almenaŭ unu kampon.",
      auto_placed: "Aŭtomate metita — klaku denove por ŝanĝi."
    }
  });
})();
