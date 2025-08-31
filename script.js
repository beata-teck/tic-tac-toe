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
    lock: false
  };

  // ----- DOM -----
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
    confettiCanvas: document.getElementById('confettiCanvas')
  };

  // ----- Init -----
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
    el.cells.forEach(cell => cell.addEventListener('click', () => onCellClick(cell)));
  }

  // ----- Mode -----
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

  // ----- Game Start/Reset -----
  function startGame(){
    state.players.X = el.nameX.value.trim() || 'Player X';
    state.players.O = el.nameO.disabled ? 'Computer' : (el.nameO.value.trim() || 'Player O');
    resetBoard(false);
    state.playing = true;
    renderStatus(`${state.players.X} (X) starts. Your move.`);
  }

  function resetBoard(hard){
    state.board = Array(9).fill(null);
    state.current = 'X';
    state.playing = true;
    state.lock = false;

    el.cells.forEach(c => {
      c.textContent = '';
      c.className = 'cell';
      c.setAttribute('aria-disabled','false');
    });

    if (hard){
      state.scores = { X:0, O:0, D:0 };
      renderScores();
      renderStatus('Choose a mode and press Start.');
      state.playing = false;
    } else {
      renderStatus(`${state.players.X} (X) starts. Your move.`);
    }
  }

  function hardReset(){
    resetBoard(true);
    el.nameX.value = '';
    if (!el.nameO.disabled) el.nameO.value = '';
  }

  // ----- Events -----
  function onCellClick(cell){
    if (!state.playing || state.lock) return;
    const i = Number(cell.dataset.index);
    if (state.board[i] !== null){
      flashInvalid(cell);
      return;
    }
    placeMark(i, state.current);

    const win = checkWinner(state.board);
    if (win){
      endRound('win', win);
      return;
    }
    if (isDraw(state.board)){
      endRound('draw');
      return;
    }

    switchTurn();

    if (state.mode === 'single' && state.current === 'O'){
      state.lock = true;
      setTimeout(() => {
        const move = makeComputerMove();
        if (move != null){
          const aiCell = el.cells[move];
          aiCell.classList.add('ai');
          setTimeout(() => aiCell.classList.remove('ai'), 260);
        }
        const win2 = checkWinner(state.board);
        if (win2){
          endRound('win', win2);
          state.lock = false;
          return;
        }
        if (isDraw(state.board)){
          endRound('draw');
          state.lock = false;
          return;
        }
        switchTurn();
        state.lock = false;
      }, 420);
    }
  }

  // ----- Game Logic -----
  const LINES = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  function placeMark(index, symbol){
    state.board[index] = symbol;
    renderCell(index, symbol);
  }

  function switchTurn(){
    state.current = state.current === 'X' ? 'O' : 'X';
    renderStatus(`${state.players[state.current]} (${state.current}) to move.`);
  }

  function checkWinner(board){
    for (const [a,b,c] of LINES){
      if (board[a] && board[a] === board[b] && board[b] === board[c]){
        return { symbol: board[a], line: [a,b,c] };
      }
    }
    return null;
  }

  function isDraw(board){
    return board.every(x => x !== null);
  }

  // ----- AI -----
  function makeComputerMove(){
    const board = state.board.slice();
    const me = 'O';
    const you = 'X';

    let idx = findWinningMove(board, me);
    if (idx == null) idx = findWinningMove(board, you);
    if (idx == null) idx = getBestMove(board);
    if (idx != null) placeMark(idx, me);
    return idx;
  }

  function findWinningMove(board, symbol){
    for (let i=0; i<9; i++){
      if (board[i] === null){
        board[i] = symbol;
        const win = checkWinner(board);
        board[i] = null;
        if (win && win.symbol === symbol) return i;
      }
    }
    return null;
  }

  function getBestMove(board){
    const priority = [4,0,2,6,8,1,3,5,7];
    for (const i of priority){
      if (board[i] === null) return i;
    }
    return null;
  }

  // ----- Round End / Scores -----
  function endRound(type, win){
    state.playing = false;

    if (type === 'win' && win){
      const { symbol, line } = win;
      line.forEach(i => el.cells[i].classList.add('win'));
      state.scores[symbol] += 1;
      renderScores();
      renderStatus(`${state.players[symbol]} wins!`);
      launchConfetti(); // 🎉 trigger here
      lockCells();
      return;
    }

    if (type === 'draw'){
      state.scores.D += 1;
      renderScores();
      renderStatus(`It's a draw.`);
      lockCells();
      return;
    }
  }

  function lockCells(){
    el.cells.forEach(c => c.setAttribute('aria-disabled','true'));
  }

  // ----- UI Rendering -----
  function renderCell(index, symbol){
    const cell = el.cells[index];
    cell.textContent = symbol;
    cell.classList.add('filled', symbol.toLowerCase());
  }

  function renderScores(){
    el.scoreX.textContent = state.scores.X;
    el.scoreO.textContent = state.scores.O;
    el.scoreD.textContent = state.scores.D;
  }

  function renderStatus(text){
    el.status.textContent = text;
  }

  function flashInvalid(cell){
    cell.classList.remove('invalid');
    void cell.offsetWidth;
    cell.classList.add('invalid');
  }

  // ----- Confetti -----
    function launchConfetti(){
    if (!window.confetti || !el.confettiCanvas) return;
    const confettiInstance = confetti.create(el.confettiCanvas, { resize: true, useWorker: true });

    // Center burst
    confettiInstance({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7c5cff', '#22c55e', '#60a5fa', '#f472b6', '#f59e0b']
    });

    // Side bursts after a short delay
    setTimeout(() => {
      confettiInstance({
        particleCount: 60,
        spread: 100,
        angle: 60,
        origin: { x: 0, y: 0.7 },
        colors: ['#7c5cff', '#22c55e', '#60a5fa', '#f472b6', '#f59e0b']
      });
      confettiInstance({
        particleCount: 60,
        spread: 100,
        angle: 120,
        origin: { x: 1, y: 0.7 },
        colors: ['#7c5cff', '#22c55e', '#60a5fa', '#f472b6', '#f59e0b']
      });
    }, 250);

    // Final celebratory rain
    setTimeout(() => {
      confettiInstance({
        particleCount: 100,
        spread: 160,
        startVelocity: 25,
        origin: { y: 0.2 },
        colors: ['#7c5cff', '#22c55e', '#60a5fa', '#f472b6', '#f59e0b']
      });
    }, 600);
  }
})();