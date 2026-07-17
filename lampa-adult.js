(function () {
  'use strict';

  if (window.plugin_adult_catalog_ready) return;
  window.plugin_adult_catalog_ready = true;

  var COMPONENT = 'adult_catalog';
  var SETTINGS = 'adult_catalog_settings';
  var DEFAULT_API = 'https://YOUR-DOMAIN.example/api';
  var network = new Lampa.Reguest();

  function apiBase() {
    return String(Lampa.Storage.get('adult_catalog_api', DEFAULT_API) || '').replace(/\/$/, '');
  }

  function accepted() {
    return Lampa.Storage.get('adult_catalog_age_ok', false) === true;
  }

  function askAge(onAccept) {
    if (accepted()) return onAccept();
    Lampa.Select.show({
      title: 'Контент 18+',
      items: [
        { title: 'Мені виповнилося 18 років', value: 'yes' },
        { title: 'Вийти', value: 'no' }
      ],
      onSelect: function (item) {
        if (item.value === 'yes') {
          Lampa.Storage.set('adult_catalog_age_ok', true);
          onAccept();
        } else Lampa.Controller.toggle('menu');
      },
      onBack: function () { Lampa.Controller.toggle('menu'); }
    });
  }

  function play(item) {
    if (item.provider === 'xvideos') return resolveXvideosNative(item);
    var url = apiBase() + '/resolve?provider=' + encodeURIComponent(item.provider) +
      '&id=' + encodeURIComponent(item.id);
    network.silent(url, function (data) {
      if (!data || !data.url) return Lampa.Noty.show('Сервер не повернув адресу відео');
      Lampa.Player.play({
        title: item.title || '18+',
        url: data.url,
        quality: data.quality || {},
        poster: item.img || item.poster || ''
      });
      Lampa.Player.playlist([item]);
    }, function () {
      Lampa.Noty.show('Не вдалося отримати відео');
    });
  }

  function decodeHtml(value) {
    var node = document.createElement('textarea');
    node.innerHTML = value || '';
    return node.value;
  }

  function parseXvideos(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var cards = [];
    var seen = {};
    var links = doc.querySelectorAll('a[href^="/video."][title]');
    Array.prototype.forEach.call(links, function (link) {
      var href = link.getAttribute('href');
      if (!href || seen[href]) return;
      var block = link.closest ? link.closest('.thumb-block') : link.parentNode;
      var image = block && block.querySelector ? block.querySelector('img') : null;
      var img = image && (image.getAttribute('data-src') || image.getAttribute('src')) || '';
      if (img.indexOf('//') === 0) img = 'https:' + img;
      seen[href] = true;
      cards.push({
        id: href,
        provider: 'xvideos',
        title: decodeHtml(link.getAttribute('title') || link.textContent).trim(),
        img: img,
        url: 'https://www.xvideos.com' + href,
        card_type: 'small'
      });
    });
    return cards;
  }

  function loadXvideosNative(object, done, fail) {
    var page = Math.max(0, Number(object.page || 1) - 1);
    var source = object.query
      ? 'https://www.xvideos.com/?k=' + encodeURIComponent(object.query) + '&p=' + page
      : 'https://www.xvideos.com/new/' + page;
    network.native(source, function (html) {
      var results = parseXvideos(String(html || ''));
      if (!results.length) return fail('XVideos не повернув каталог');
      done({ results: results, page: page + 1, total_pages: 50, collection: true });
    }, function () { fail('Нативний запит XVideos заблоковано'); });
  }

  function resolveXvideosNative(item) {
    network.native(item.url, function (html) {
      html = String(html || '');
      var high = html.match(/html5player\.setVideoUrlHigh\(['"]([^'"]+)/i);
      var low = html.match(/html5player\.setVideoUrlLow\(['"]([^'"]+)/i);
      var hls = html.match(/html5player\.setVideoHLS\(['"]([^'"]+)/i);
      function clean(match) {
        return match ? match[1].replace(/\\\//g, '/').replace(/\\u0026|\\x26/g, '&') : '';
      }
      var quality = {};
      if (clean(high)) quality['720p'] = clean(high);
      if (clean(low)) quality['360p'] = clean(low);
      if (clean(hls)) quality.HLS = clean(hls);
      var url = quality['720p'] || quality.HLS || quality['360p'];
      if (!url) return Lampa.Noty.show('Адресу відео не знайдено');
      Lampa.Player.play({ title: item.title, url: url, quality: quality, poster: item.img || '' });
      Lampa.Player.playlist([item]);
    }, function () { Lampa.Noty.show('Не вдалося відкрити сторінку відео'); });
  }

  function Catalog(object) {
    var comp = new Lampa.InteractionCategory(object);

    function load(done, fail) {
      var provider = object.provider || 'pornhub';
      if (provider === 'xvideos') return loadXvideosNative(object, done, fail);
      var page = object.page || 1;
      var query = object.query || '';
      var url = apiBase() + '/list?provider=' + encodeURIComponent(provider) +
        '&page=' + encodeURIComponent(page) + '&q=' + encodeURIComponent(query);
      network.silent(url, function (data) {
        var list = (data && (data.results || data.list)) || [];
        list.forEach(function (item) {
          item.card_type = item.card_type || 'small';
          item.title = item.title || 'Без назви';
        });
        done({
          results: list,
          page: page,
          total_pages: (data && data.total_pages) || page,
          collection: true
        });
      }, fail);
    }

    comp.create = function () {
      this.activity.loader(true);
      load(this.build.bind(this), this.empty.bind(this));
      return this.render();
    };
    comp.nextPageReuest = function (next, resolve, reject) {
      object.page = next.page;
      load(resolve, reject);
    };
    comp.cardRender = function (params, item, card) {
      card.onEnter = function () { play(item); };
    };
    comp.destroy = function () {
      network.clear();
      Lampa.InteractionCategory.prototype.destroy &&
        Lampa.InteractionCategory.prototype.destroy.call(this);
    };
    return comp;
  }

  function openProviders() {
    askAge(function () {
      Lampa.Select.show({
        title: 'Оберіть джерело',
        items: [
          { title: 'Pornhub', value: 'pornhub' },
          { title: 'XHamster', value: 'xhamster' },
          { title: 'XVideos', value: 'xvideos' },
          { title: 'GayPornTube', value: 'gayporntube' }
        ],
        onSelect: function (item) {
          Lampa.Activity.push({
            title: item.title,
            component: COMPONENT,
            provider: item.value,
            page: 1
          });
        },
        onBack: function () { Lampa.Controller.toggle('menu'); }
      });
    });
  }

  function addSettings() {
    Lampa.SettingsApi.addComponent({
      component: SETTINGS,
      name: 'Каталог 18+',
      icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-4 6h2v8H8zm4 0h2v8h-2zm4 0h2v8h-2z"/></svg>'
    });
    Lampa.SettingsApi.addParam({
      component: SETTINGS,
      param: { name: 'adult_catalog_api', type: 'input', 'default': DEFAULT_API },
      field: { name: 'URL API', description: 'HTTPS-адреса вашого сервера-посередника' }
    });
    Lampa.SettingsApi.addParam({
      component: SETTINGS,
      param: { name: 'adult_catalog_age_ok', type: 'trigger', 'default': false },
      field: { name: 'Підтверджено 18+', description: 'Вимкніть, щоб знову показати попередження' }
    });
  }

  function addMenu() {
    var button = $('<li class="menu__item selector"><div class="menu__ico">' +
      '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-4 6h2v8H8zm4 0h2v8h-2zm4 0h2v8h-2z"/></svg>' +
      '</div><div class="menu__text">Каталог 18+</div></li>');
    button.on('hover:enter', openProviders);
    $('.menu .menu__list').eq(0).append(button);
    addSettings();
  }

  Lampa.Component.add(COMPONENT, Catalog);
  if (window.appready) addMenu();
  else Lampa.Listener.follow('app', function (event) {
    if (event.type === 'ready') addMenu();
  });
})();
