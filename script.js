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
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diagonals
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


