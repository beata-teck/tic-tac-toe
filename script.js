(() => {
  // ----- State -----
  const state = {
    mode: 'two',            // 'single' | 'two'
    players: { X: 'Player X', O: 'Player O' },
    symbols: ['X', 'O'],
    current: 'X',
    board: Array(9).fill(null),
    scores: { X: 0, O: 0, D: 0 },
    playing: false,
    lock: false // prevents double input during AI move
  };
  const el = {
    singleBtn: document.getElementById('singlePlayerBtn'),
    twoBtn: document.getElementById('twoPlayerBtn'),
    nameX: document.getElementById('playerX'),
    nameO: document.getElementById('playerO'),
    start: document.getElementById('startBtn'),
    board: document.getElementById('board'),
    cells: Array.from(document.querySelectorAll('.cell')),
    status: document.getElementById('status'),
    scoreX: document.getElementById('scoreX'),
    scoreO: document.getElementById('scoreO'),
    scoreD: document.getElementById('scoreD'),
    restart: document.getElementById('restartBtn'),
    reset: document.getElementById('resetBtn'),
  };
   bindUI();
  setMode('two');
  renderStatus('Choose a mode and press Start.');

  // ----- UI Bindings -----
  function bindUI(){
    el.singleBtn.addEventListener('click', () => setMode('single'));
    el.twoBtn.addEventListener('click', () => setMode('two'));
    el.start.addEventListener('click', startGame);
    el.restart.addEventListener('click', () => resetBoard(false));
    el.reset.addEventListener('click', hardReset);

    el.cells.forEach(cell => {
      cell.addEventListener('click', () => onCellClick(cell));
    });
  }
 function setMode(mode){
    state.mode = mode;
    const single = mode === 'single';
    el.singleBtn.classList.toggle('active', single);
    el.twoBtn.classList.toggle('active', !single);
    el.singleBtn.setAttribute('aria-pressed', String(single));
    el.twoBtn.setAttribute('aria-pressed', String(!single));

    if (single){
      el.nameO.value = 'Computer';
      el.nameO.disabled = true;
    } else {
      el.nameO.disabled = false;
      if (el.nameO.value === 'Computer') el.nameO.value = '';
    }
  }

