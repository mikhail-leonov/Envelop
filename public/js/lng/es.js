/* js/lng/es.js — Spanish language pack (Español). Registers itself with the i18n engine. */
(function () {
  "use strict";
  // Bootstrap the shared namespace so this file works regardless of script load order.
  var FT = (window.FT = window.FT || {});
  FT.I18n = FT.I18n || {
    _packs: {},
    register: function (code, def) { this._packs[code] = def; }
  };

  FT.I18n.register("es", {
    name: "Spanish",
    nativeName: "Español",
    dir: "ltr",
    strings: {
      app_title: "Impresora de sobres",
      lang: "Idioma",
      env_size: "Tamaño del sobre",
      print: "Imprimir",
      print_envelope: "Imprimir sobre",
      hide_recipient: "Ocultar destinatario",

      sender: "Remitente",
      recipient: "Destinatario",
      choose_sender: "Elegir dirección del remitente",
      choose_recipient: "Elegir dirección del destinatario",

      saved_addresses: "Direcciones guardadas",
      add_new: "Añadir nueva dirección",

      name: "Nombre",
      address: "Dirección",
      city: "Ciudad",
      state: "Provincia",

      save_use: "Guardar y usar",
      save_changes: "Guardar cambios",
      save: "Guardar",
      edit: "Editar",
      delete: "Eliminar",
      load: "Cargar",
      clear_slot: "Vaciar este campo",
      close: "Cerrar",
      current: "Actual",

      presets: "Preajustes",
      save_preset: "Guardar actual como preajuste",
      preset_name_ph: "Nombre del preajuste",
      no_presets: "Aún no hay preajustes guardados.",
      preset_saved: "Preajuste guardado.",
      preset_loaded: "Preajuste cargado.",
      preset_deleted: "Preajuste eliminado.",
      preset_name_required: "Introduce un nombre de preajuste.",
      confirm_delete_preset: "¿Eliminar este preajuste?",

      calibrate: "Calibrar",
      print_calibration: "Calibración de impresión",
      offset_x: "Desplazamiento horizontal (mm)",
      offset_y: "Desplazamiento vertical (mm)",
      reset: "Restablecer",
      calib_hint: "Imprime un sobre de prueba, mide cuánto se desvía el texto y ajústalo hasta que cuadre. Derecha y abajo son positivos. La vista previa se mueve con él, así que lo que ves es lo que se imprime.",

      confirm_delete: "¿Eliminar esta dirección?",
      saved_ok: "Guardado.",
      deleted_ok: "Eliminado.",
      nothing_to_save: "Rellena al menos un campo.",
      auto_placed: "Colocado automáticamente — haz clic de nuevo para cambiar."
    }
  });
})();
