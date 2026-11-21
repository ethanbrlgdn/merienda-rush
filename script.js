/* Merienda Rush! — entry point. The game code lives in js/ (data, audio, art, ui, game). */
(function () {
  if (!window.MR || !MR.Game) {
    document.body.insertAdjacentHTML('beforeend', '<p style="padding:20px;color:#fff">Hindi ma-load ang laro. Siguraduhing kumpleto ang js/ folder.</p>');
    return;
  }
  MR.Game.init();
})();
