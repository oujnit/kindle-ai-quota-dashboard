(function (win, doc) {
  'use strict';

  // 汉王墨水屏的安卓系统只认用户交互和媒体会话，页面动不动它不管。
  // 所以这里双层保活：优先 Wake Lock（屏幕常亮锁），兜底静音视频循环
  // （安卓把视频播放算作媒体使用，部分rom会因此放宽息屏计时）。
  var wakeLock = null;
  var video = null;

  function requestWakeLock() {
    var anyNavigator = win.navigator;
    if (!anyNavigator.wakeLock || !anyNavigator.wakeLock.request) return;
    anyNavigator.wakeLock.request('screen').then(function (lock) {
      wakeLock = lock;
      lock.addEventListener('release', function () {
        wakeLock = null;
      });
    }).catch(function () {});
  }

  function startVideo() {
    if (video) return;
    video = doc.createElement('video');
    video.src = 'awake.mp4';
    video.muted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');
    video.loop = true;
    video.style.cssText = 'position:fixed;left:0;bottom:0;width:2px;height:2px;'
      + 'opacity:0.001;pointer-events:none;z-index:-1;';
    var attempt = function () {
      var playing = video.play();
      if (playing && playing.catch) {
        playing.catch(function () {
          // 自动播放被拦时静默重试，不弹任何提示
        });
      }
    };
    video.addEventListener('pause', attempt);
    doc.body.appendChild(video);
    attempt();
  }

  function start() {
    requestWakeLock();
    startVideo();
  }

  // Wake Lock 被释放（切后台、系统回收）后自动补申请
  doc.addEventListener('visibilitychange', function () {
    if (doc.visibilityState === 'visible') {
      if (!wakeLock) requestWakeLock();
    }
  });

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
}(window, document));
