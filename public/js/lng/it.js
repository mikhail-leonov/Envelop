/* js/lng/it.js — Italian language pack (Italiano). Registers itself with the i18n engine. */
(function () {
  "use strict";
  // Bootstrap the shared namespace so this file works regardless of script load order.
  var FT = (window.FT = window.FT || {});
  FT.I18n = FT.I18n || {
    _packs: {},
    register: function (code, def) { this._packs[code] = def; }
  };

  FT.I18n.register("it", {
    name: "Italian",
    nativeName: "Italiano",
    dir: "ltr",
    strings: {
      app_title: "Stampa buste",
      lang: "Lingua",
      env_size: "Formato busta",
      print: "Stampa",
      print_envelope: "Stampa busta",
      hide_recipient: "Nascondi destinatario",

      sender: "Mittente",
      recipient: "Destinatario",
      choose_sender: "Scegli l'indirizzo del mittente",
      choose_recipient: "Scegli l'indirizzo del destinatario",

      saved_addresses: "Indirizzi salvati",
      add_new: "Aggiungi nuovo indirizzo",

      name: "Nome",
      address: "Indirizzo",
      city: "Città",
      state: "Provincia",

      save_use: "Salva e usa",
      save_changes: "Salva modifiche",
      save: "Salva",
      edit: "Modifica",
      delete: "Elimina",
      load: "Carica",
      clear_slot: "Svuota questo campo",
      close: "Chiudi",
      current: "Attuale",

      presets: "Preimpostazioni",
      save_preset: "Salva come preimpostazione",
      preset_name_ph: "Nome preimpostazione",
      no_presets: "Nessuna preimpostazione salvata.",
      preset_saved: "Preimpostazione salvata.",
      preset_loaded: "Preimpostazione caricata.",
      preset_deleted: "Preimpostazione eliminata.",
      preset_name_required: "Inserisci un nome per la preimpostazione.",
      confirm_delete_preset: "Eliminare questa preimpostazione?",

      calibrate: "Calibra",
      print_calibration: "Calibrazione di stampa",
      offset_x: "Spostamento orizzontale (mm)",
      offset_y: "Spostamento verticale (mm)",
      reset: "Reimposta",
      calib_hint: "Stampa una busta di prova, misura di quanto il testo è disallineato, poi regola fino ad allinearlo. Destra e giù sono positivi. L'anteprima si sposta di conseguenza, quindi ciò che vedi è ciò che viene stampato.",

      confirm_delete: "Eliminare questo indirizzo?",
      saved_ok: "Salvato.",
      deleted_ok: "Eliminato.",
      nothing_to_save: "Compila almeno un campo.",
      auto_placed: "Inserito automaticamente — clicca di nuovo per cambiare."
    }
  });
})();
