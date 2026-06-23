/* js/lng/pt.js — Portuguese language pack (Português). Registers itself with the i18n engine. */
(function () {
  "use strict";
  // Bootstrap the shared namespace so this file works regardless of script load order.
  var FT = (window.FT = window.FT || {});
  FT.I18n = FT.I18n || {
    _packs: {},
    register: function (code, def) { this._packs[code] = def; }
  };

  FT.I18n.register("pt", {
    name: "Portuguese",
    nativeName: "Português",
    dir: "ltr",
    strings: {
      app_title: "Impressora de envelopes",
      lang: "Idioma",
      env_size: "Tamanho do envelope",
      print: "Imprimir",
      print_envelope: "Imprimir envelope",
      hide_recipient: "Ocultar destinatário",

      sender: "Remetente",
      recipient: "Destinatário",
      choose_sender: "Escolher endereço do remetente",
      choose_recipient: "Escolher endereço do destinatário",

      saved_addresses: "Endereços salvos",
      add_new: "Adicionar novo endereço",

      name: "Nome",
      address: "Endereço",
      city: "Cidade",
      state: "Estado",

      save_use: "Salvar e usar",
      save_changes: "Salvar alterações",
      save: "Salvar",
      edit: "Editar",
      delete: "Excluir",
      load: "Carregar",
      clear_slot: "Limpar este campo",
      close: "Fechar",
      current: "Atual",

      presets: "Predefinições",
      save_preset: "Salvar atual como predefinição",
      preset_name_ph: "Nome da predefinição",
      no_presets: "Nenhuma predefinição salva ainda.",
      preset_saved: "Predefinição salva.",
      preset_loaded: "Predefinição carregada.",
      preset_deleted: "Predefinição excluída.",
      preset_name_required: "Digite um nome de predefinição.",
      confirm_delete_preset: "Excluir esta predefinição?",

      calibrate: "Calibrar",
      print_calibration: "Calibração de impressão",
      offset_x: "Deslocamento horizontal (mm)",
      offset_y: "Deslocamento vertical (mm)",
      reset: "Redefinir",
      calib_hint: "Imprima um envelope de teste, meça o quanto o texto está deslocado e ajuste até alinhar. Direita e baixo são positivos. A pré-visualização acompanha o ajuste, então o que você vê é o que será impresso.",

      confirm_delete: "Excluir este endereço?",
      saved_ok: "Salvo.",
      deleted_ok: "Excluído.",
      nothing_to_save: "Preencha pelo menos um campo.",
      auto_placed: "Colocado automaticamente — clique novamente para alterar."
    }
  });
})();
