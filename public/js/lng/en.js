/* js/lng/en.js — English language pack. Registers itself with the i18n engine. */
(function () {
  "use strict";
  // Bootstrap the shared namespace so this file works regardless of script load order.
  var FT = (window.FT = window.FT || {});
  FT.I18n = FT.I18n || {
    _packs: {},
    register: function (code, def) { this._packs[code] = def; }
  };

  FT.I18n.register("en", {
    name: "English",
    nativeName: "English",
    dir: "ltr",
    strings: {
      app_title: "Envelope Printer",
      lang: "Language",
      env_size: "Envelope size",
      print: "Print",
      print_envelope: "Print Envelope",
      hide_recipient: "Hide recipient",

      sender: "Sender",
      recipient: "Recipient",
      choose_sender: "Choose sender address",
      choose_recipient: "Choose recipient address",

      saved_addresses: "Saved addresses",
      add_new: "Add new address",

      name: "Name",
      address: "Address",
      city: "City",
      state: "State",

      save_use: "Save & use",
      save_changes: "Save changes",
      save: "Save",
      edit: "Edit",
      delete: "Delete",
      load: "Load",
      clear_slot: "Clear this slot",
      close: "Close",
      current: "Current",

      presets: "Presets",
      save_preset: "Save current as preset",
      preset_name_ph: "Preset name",
      no_presets: "No presets saved yet.",
      preset_saved: "Preset saved.",
      preset_loaded: "Preset loaded.",
      preset_deleted: "Preset deleted.",
      preset_name_required: "Please enter a preset name.",
      confirm_delete_preset: "Delete this preset?",

      calibrate: "Calibrate",
      print_calibration: "Print calibration",
      offset_x: "Horizontal offset (mm)",
      offset_y: "Vertical offset (mm)",
      reset: "Reset",
      calib_hint: "Print a test envelope, measure how far the text is off, then nudge until it lines up. Right and down are positive. The preview moves with it, so what you see is what prints.",

      confirm_delete: "Delete this address?",
      saved_ok: "Saved.",
      deleted_ok: "Deleted.",
      nothing_to_save: "Please fill in at least one field.",
      auto_placed: "Placed automatically — click again to change."
    }
  });
})();
