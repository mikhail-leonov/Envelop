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
      env_size: "Размер конверта",
      print: "Печать",
      print_envelope: "Печать конверта",
      hide_recipient: "Скрыть получателя",

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
      save: "Сохранить",
      edit: "Изменить",
      delete: "Удалить",
      load: "Загрузить",
      clear_slot: "Очистить поле",
      close: "Закрыть",
      current: "Текущий",

      presets: "Шаблоны",
      save_preset: "Сохранить текущее как шаблон",
      preset_name_ph: "Название шаблона",
      no_presets: "Пока нет сохранённых шаблонов.",
      preset_saved: "Шаблон сохранён.",
      preset_loaded: "Шаблон загружен.",
      preset_deleted: "Шаблон удалён.",
      preset_name_required: "Введите название шаблона.",
      confirm_delete_preset: "Удалить этот шаблон?",

      calibrate: "Калибровка",
      print_calibration: "Калибровка печати",
      offset_x: "Смещение по горизонтали (мм)",
      offset_y: "Смещение по вертикали (мм)",
      reset: "Сбросить",
      calib_hint: "Напечатайте пробный конверт, измерьте смещение текста и подстройте, пока не совпадёт. Вправо и вниз — положительные значения. Предпросмотр сдвигается вместе с печатью, поэтому вы видите именно то, что напечатается.",

      confirm_delete: "Удалить этот адрес?",
      saved_ok: "Сохранено.",
      deleted_ok: "Удалено.",
      nothing_to_save: "Заполните хотя бы одно поле.",
      auto_placed: "Подставлено автоматически — нажмите ещё раз, чтобы изменить."
    }
  });
})();
