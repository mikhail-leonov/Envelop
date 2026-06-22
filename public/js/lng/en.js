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
      print: "Print",
      print_envelope: "Print Envelope",

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
      edit: "Edit",
      delete: "Delete",
      clear_slot: "Clear this slot",
      close: "Close",
      current: "Current",

      confirm_delete: "Delete this address?",
      saved_ok: "Saved.",
      deleted_ok: "Deleted.",
      nothing_to_save: "Please fill in at least one field.",
      auto_placed: "Placed automatically — click again to change."
    }
  });
})();
