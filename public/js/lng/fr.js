/* js/lng/fr.js — French language pack (Français). Registers itself with the i18n engine. */
(function () {
  "use strict";
  // Bootstrap the shared namespace so this file works regardless of script load order.
  var FT = (window.FT = window.FT || {});
  FT.I18n = FT.I18n || {
    _packs: {},
    register: function (code, def) { this._packs[code] = def; }
  };

  FT.I18n.register("fr", {
    name: "French",
    nativeName: "Français",
    dir: "ltr",
    strings: {
      app_title: "Imprimante d'enveloppes",
      lang: "Langue",
      env_size: "Taille de l'enveloppe",
      print: "Imprimer",
      print_envelope: "Imprimer l'enveloppe",
      hide_recipient: "Masquer le destinataire",

      sender: "Expéditeur",
      recipient: "Destinataire",
      choose_sender: "Choisir l'adresse de l'expéditeur",
      choose_recipient: "Choisir l'adresse du destinataire",

      saved_addresses: "Adresses enregistrées",
      add_new: "Ajouter une nouvelle adresse",

      name: "Nom",
      address: "Adresse",
      city: "Ville",
      state: "Région",

      save_use: "Enregistrer et utiliser",
      save_changes: "Enregistrer les modifications",
      save: "Enregistrer",
      edit: "Modifier",
      delete: "Supprimer",
      load: "Charger",
      clear_slot: "Vider ce champ",
      close: "Fermer",
      current: "Actuel",

      presets: "Préréglages",
      save_preset: "Enregistrer comme préréglage",
      preset_name_ph: "Nom du préréglage",
      no_presets: "Aucun préréglage enregistré.",
      preset_saved: "Préréglage enregistré.",
      preset_loaded: "Préréglage chargé.",
      preset_deleted: "Préréglage supprimé.",
      preset_name_required: "Veuillez saisir un nom de préréglage.",
      confirm_delete_preset: "Supprimer ce préréglage ?",

      calibrate: "Calibrer",
      print_calibration: "Calibrage de l'impression",
      offset_x: "Décalage horizontal (mm)",
      offset_y: "Décalage vertical (mm)",
      reset: "Réinitialiser",
      calib_hint: "Imprimez une enveloppe test, mesurez le décalage du texte, puis ajustez jusqu'à l'alignement. La droite et le bas sont positifs. L'aperçu se déplace avec, donc ce que vous voyez est ce qui s'imprime.",

      confirm_delete: "Supprimer cette adresse ?",
      saved_ok: "Enregistré.",
      deleted_ok: "Supprimé.",
      nothing_to_save: "Veuillez remplir au moins un champ.",
      auto_placed: "Placé automatiquement — cliquez à nouveau pour changer."
    }
  });
})();
