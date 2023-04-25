// MapLibre GL JSの読み込み
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// OpacityControlプラグインの読み込み
import OpacityControl from 'maplibre-gl-opacity';
import 'maplibre-gl-opacity/dist/maplibre-gl-opacity.css';

import './style.css'

const map = new maplibregl.Map({
  container: 'map', // div要素のid
  zoom: 5, // 初期表示のズーム
  center: [138, 37], // 初期表示の中心
  minZoom: 5, // 最小ズーム
  maxZoom: 18, // 最大ズーム
  maxBounds: [122, 20, 154, 50], // 表示可能な範囲
  style: {
    version: 8,
    sources: {
      // 背景地図ソース
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        maxzoom: 19,
        tileSize: 256,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
      mtgshop: {
        // 指定緊急避難場所ベクトルタイル
        type: 'vector',
        tiles: [
          `${location.href.replace(
            '/index.html',
            '',
          )}/mtgshop/{z}/{x}/{y}.pbf`,
        ],
        minzoom: 5,
        maxzoom: 8,
        attribution:
          '<a href="https://mtg-jp.com/shop/" target="_blank">mtg-jp公式サイト 公認店舗一覧</a>',
      },
    },

    layers: [
      // 背景地図レイヤー
      {
        id: 'osm-layer',
        source: 'osm',
        type: 'raster',
      },
      {
        id: 'mtgshop-layer',
        source: 'mtgshop',
        'source-layer': 'mtgshop',
        type: 'circle',
        paint: {
          'circle-color': '#AA22FF',
          'circle-radius': [
            // ズームレベルに応じた円の大きさ
            'interpolate',
            ['linear'],
            ['zoom'],
            5,
            5,
            14,
            6,
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#000000',
        },
        //filter: ['get', 'disaster1'], // 属性:disaster1がtrueの地物のみ表示する
        // layout: { visibility: 'none' }, // レイヤーの表示はOpacityControlで操作するためデフォルトで非表示にしておく
      },
      {
        id: 'mtgshop-layer_wpnad',
        source: 'mtgshop',
        'source-layer': 'mtgshop',
        type: 'circle',
        paint: {
          'circle-color': '#AA22FF',
          'circle-radius': [
            // ズームレベルに応じた円の大きさ
            'interpolate',
            ['linear'],
            ['zoom'],
            5,
            4,
            14,
            6,
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#000000',
        },
        filter: ['get', 'wpn_advance'], // 属性:disaster1がtrueの地物のみ表示する
        layout: { visibility: 'none' }, // レイヤーの表示はOpacityControlで操作するためデフォルトで非表示にしておく
      },
      {
        id: 'mtgshop-layer_meister',
        source: 'mtgshop',
        'source-layer': 'mtgshop',
        type: 'circle',
        paint: {
          'circle-color': '#AA22FF',
          'circle-radius': [
            // ズームレベルに応じた円の大きさ
            'interpolate',
            ['linear'],
            ['zoom'],
            5,
            4,
            14,
            6,
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#000000',
        },
        filter: ['get', 'meister'], // 属性:disaster1がtrueの地物のみ表示する
        layout: { visibility: 'none' }, // レイヤーの表示はOpacityControlで操作するためデフォルトで非表示にしておく
      },
    ]
  }
});

// マップの初期ロード完了時に発火するイベントを定義
map.on('load', () => {
  // WPNアドバンス、マイスターレイヤーのコントロール
  const opacityMTGShop = new OpacityControl({
    baseLayers: {
      'mtgshop-layer': 'すべての店舗',
      'mtgshop-layer_wpnad': 'WPNプレミアムストア',
      'mtgshop-layer_meister': 'ティーチングマイスターのいる店舗',
    },
  });
  //opacityMTGShop._container.style.width = '200px'
  map.addControl(opacityMTGShop, 'top-right');

  map.on('click', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: [
        'mtgshop-layer',
        'mtgshop-layer_wpnad',
        'mtgshop-layer_meister',
      ],
    });
    if (features.length === 0) return;//地物がなければ処理を終了
    const feature = features[0];
    const popup = new maplibregl.Popup()
      .setLngLat(feature.geometry.coordinates)//[lon,lat]
      // 名称・住所・備考・対応している災害種別を表示するよう、HTMLを文字列でセット
      .setHTML(
        `\
      <div style="font-weight:900; font-size: 1.2rem;">${feature.properties.shop_name
        }</div>\
      <div>${feature.properties.address}</div>\
      <div>\
      <span${feature.properties.wpn_advance ? '' : ' style="color:#ccc;"'
        }">WPNアドバンスプラス</span>\
      <span${feature.properties.meister ? '' : ' style="color:#ccc;"'
        }>マイスター所在</span>\
        <a href="${feature.properties.info}" target='_blank'>店舗イベント</a>\
      </div>`,
      )
      .setMaxWidth('400px')
      .addTo(map);
  });

  // 地図上でマウスが移動した際のイベント
  map.on('mousemove', (e) => {
    // マウスカーソル以下に指定緊急避難場所レイヤーが存在するかどうかをチェック
    const features = map.queryRenderedFeatures(e.point, {
      layers: [
        'mtgshop-layer',
        'mtgshop-layer_wpnad',
        'mtgshop-layer_meister',
      ],
    });
    if (features.length > 0) {
      // 地物が存在する場合はカーソルをpointerに変更
      map.getCanvas().style.cursor = 'pointer';
    } else {
      // 存在しない場合はデフォルト
      map.getCanvas().style.cursor = '';
    }
  });

})