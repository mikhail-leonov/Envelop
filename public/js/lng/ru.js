/* js/lng/ru.js — Russian language pack (Русский). Registers itself with the i18n engine. */
(function () {
  "use strict";

  // Bootstrap the shared namespace so this file works regardless of script load order.
  var FT = (window.FT = window.FT || {});
  FT.I18n = FT.I18n || {
    _packs: {},
    register: function (code, def) { this._packs[code] = def; }
  };

  FT.I18n.register("ru", {
    name: "Russian",
    nativeName: "Русский",
    dir: "ltr",
    strings: {
      app_title: "Печать конвертов",
      lang: "Язык",
      print: "Печать",
      print_envelope: "Печать конверта",

      sender: "Отправитель",
      recipient: "Получатель",
      choose_sender: "Выберите адрес отправителя",
      choose_recipient: "Выберите адрес получателя",

      saved_addresses: "Сохранённые адреса",
      add_new: "Добавить новый адрес",

      name: "Имя",
      address: "Адрес",
      city: "Город",
      state: "Регион",

      save_use: "Сохранить и выбрать",
      save_changes: "Сохранить изменения",
      edit: "Изменить",
      delete: "Удалить",
      clear_slot: "Очистить поле",
      close: "Закрыть",
      current: "Текущий",

      confirm_delete: "Удалить этот адрес?",
      saved_ok: "Сохранено.",
      deleted_ok: "Удалено.",
      nothing_to_save: "Заполните хотя бы одно поле.",
      auto_placed: "Подставлено автоматически — нажмите ещё раз, чтобы изменить."
    }
  });
})();
