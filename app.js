/**
 * Skat Calculator App
 */

// --- State ---
let state = {
    players: [], // { name, score }
    history: [], // { round, declarerIndex, gameValue, result, scoreChange, details }
    lossFactor: 2, // Default: -2x game value
    currentRound: 1,
    dealerIndex: 0, // Current dealer
    ui: {
        currentScreen: 'setup-screen'
    }
};

// --- Constants ---
const SUIT_VALUES = {
    clubs: 12,
    spades: 11,
    hearts: 10,
    diamonds: 9,
    grand: 24
};

const NULL_VALUES = {
    'null': 23,
    'null-hand': 35,
    'null-ouvert': 46,
    'null-ouvert-hand': 59
};

// --- DOM Elements ---
const getEl = (id) => document.getElementById(id);

let setupScreen, gameScreen, startBtn, resetBtn, addRoundBtn, roundForm, cancelBtn, confirmBtn, guideBtn, guideModal, closeGuide, scoreboard, historyList, declarerBtns, gvNum, gvScore, roundNumSpan, suitRow, nullRow, jacksRow, modsRow;

function initElements() {
    setupScreen = getEl('setup-screen');
    gameScreen = getEl('game-screen');
    startBtn = getEl('start-btn');
    resetBtn = getEl('reset-btn');
    addRoundBtn = getEl('add-round-btn');
    roundForm = getEl('round-form');
    cancelBtn = getEl('cancel-btn');
    confirmBtn = getEl('confirm-btn');
    guideBtn = getEl('guide-btn');
    guideModal = getEl('guide-modal');
    closeGuide = getEl('close-guide');
    scoreboard = getEl('scoreboard');
    historyList = getEl('history');
    declarerBtns = getEl('declarer-btns');
    gvNum = getEl('gv-num');
    gvScore = getEl('gv-score');
    roundNumSpan = getEl('round-num');

    suitRow = getEl('row-suit');
    nullRow = getEl('row-null');
    jacksRow = getEl('row-jacks');
    modsRow = getEl('row-mods');
}

// --- Initialization ---
function init() {
    initElements();

    // Basic verification to avoid null errors
    if (!startBtn || !guideBtn) {
        return;
    }

    startBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
    addRoundBtn.addEventListener('click', () => {
        roundForm.classList.add('open');
        updateGameValue();
    });
    cancelBtn.addEventListener('click', () => roundForm.classList.remove('open'));
    confirmBtn.addEventListener('click', submitRound);
    
    // Guide Modal
    guideBtn.addEventListener('click', () => {
        if (guideModal) {
            guideModal.classList.add('open');
        }
    });
    if (closeGuide) {
        closeGuide.addEventListener('click', () => guideModal.classList.remove('open'));
    }
    window.addEventListener('click', (e) => {
        if (guideModal && e.target === guideModal) guideModal.classList.remove('open');
    });

    // Setup toggle buttons
    document.querySelectorAll('.tbtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const group = e.target.dataset.g;
            document.querySelectorAll(`.tbtn[data-g="${group}"]`).forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            if (group === 'type') {
                updateFormVisibility(e.target.dataset.v);
            }
            updateGameValue();
        });
    });

    // Jacks counter
    document.getElementById('jacks-minus').addEventListener('click', () => updateJacks(-1));
    document.getElementById('jacks-plus').addEventListener('click', () => updateJacks(1));

    // Checkboxes
    document.querySelectorAll('#row-mods input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', updateGameValue);
    });
}

function updateFormVisibility(gameType) {
    if (gameType === 'null') {
        suitRow.classList.add('hidden');
        nullRow.classList.remove('hidden');
        jacksRow.classList.add('hidden');
        modsRow.classList.add('hidden');
    } else {
        suitRow.classList.toggle('hidden', gameType === 'grand');
        nullRow.classList.add('hidden');
        jacksRow.classList.remove('hidden');
        modsRow.classList.remove('hidden');
    }
}

function updateJacks(delta) {
    const span = document.getElementById('jacks-val');
    let val = parseInt(span.textContent) + delta;
    if (val < 1) val = 1;
    if (val > 4) val = 4;
    span.textContent = val;
    updateGameValue();
}

function startGame() {
    const p1 = document.getElementById('p1').value.trim() || 'Spieler 1';
    const p2 = document.getElementById('p2').value.trim() || 'Spieler 2';
    const p3 = document.getElementById('p3').value.trim() || 'Spieler 3';
    
    state.players = [
        { name: p1, score: 0 },
        { name: p2, score: 0 },
        { name: p3, score: 0 }
    ];
    
    state.lossFactor = parseInt(document.querySelector('input[name="loss"]:checked').value);
    state.dealerIndex = 0; // First player deals first
    
    setupScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    renderDeclarerBtns();
    renderScoreboard();
    renderHistory();
}

function renderDeclarerBtns() {
    declarerBtns.innerHTML = '';
    state.players.forEach((p, i) => {
        const btn = document.createElement('button');
        btn.className = 'tbtn' + (i === 0 ? ' active' : '');
        btn.textContent = p.name;
        btn.dataset.g = 'declarer';
        btn.dataset.v = i;
        btn.onclick = (e) => {
            document.querySelectorAll('.tbtn[data-g="declarer"]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        };
        declarerBtns.appendChild(btn);
    });
}

function calculateGameValue() {
    const type = document.querySelector('.tbtn[data-g="type"].active').dataset.v;
    
    if (type === 'null') {
        const nvar = document.querySelector('.tbtn[data-g="nvar"].active').dataset.v;
        return NULL_VALUES[nvar];
    }
    
    const suit = type === 'grand' ? 'grand' : document.querySelector('.tbtn[data-g="suit"].active').dataset.v;
    const baseValue = SUIT_VALUES[suit];
    
    const jacks = parseInt(document.getElementById('jacks-val').textContent);
    // Multipliers: Jacks + 1 (Spiel) + others
    let multipliers = jacks + 1;
    
    if (document.getElementById('m-hand').checked) multipliers++;
    if (document.getElementById('m-schneider').checked) multipliers++;
    if (document.getElementById('m-schneider-ang').checked) multipliers++;
    if (document.getElementById('m-schwarz').checked) multipliers++;
    if (document.getElementById('m-schwarz-ang').checked) multipliers++;
    if (document.getElementById('m-ouvert').checked) multipliers++;
    
    return baseValue * multipliers;
}

function updateGameValue() {
    const val = calculateGameValue();
    const resultBtn = document.querySelector('.tbtn[data-g="result"].active');
    const isWin = resultBtn ? resultBtn.dataset.v === 'win' : true;
    
    if (gvNum) gvNum.textContent = val;
    const change = isWin ? val : -(val * state.lossFactor);
    if (gvScore) {
        gvScore.textContent = (change > 0 ? '+' : '') + change;
        gvScore.className = 'gv-score ' + (change >= 0 ? 'win' : 'lose');
    }
}

function submitRound() {
    const declarerBtn = document.querySelector('.tbtn[data-g="declarer"].active');
    const typeBtn = document.querySelector('.tbtn[data-g="type"].active');
    const resultBtn = document.querySelector('.tbtn[data-g="result"].active');
    
    if (!declarerBtn || !typeBtn || !resultBtn) {
        alert('Bitte Alleinspieler, Spielart und Ergebnis auswählen.');
        return;
    }

    const val = calculateGameValue();
    const isWin = resultBtn.dataset.v === 'win';
    const declarerIdx = parseInt(declarerBtn.dataset.v);
    const scoreChange = isWin ? val : -(val * state.lossFactor);
    
    state.players[declarerIdx].score += scoreChange;
    
    // Rotate dealer
    state.dealerIndex = (state.dealerIndex + 1) % state.players.length;
    
    // Details for history
    const type = typeBtn.dataset.v;
    let detail = '';
    if (type === 'null') {
        const nvarBtn = document.querySelector('.tbtn[data-g="nvar"].active');
        detail = nvarBtn ? nvarBtn.textContent : 'Null';
    } else {
        const suitBtn = document.querySelector('.tbtn[data-g="suit"].active');
        const suit = type === 'grand' ? 'Grand' : (suitBtn ? suitBtn.textContent : '?');
        const jtBtn = document.querySelector('.tbtn[data-g="jt"].active');
        const jacksText = (jtBtn ? jtBtn.textContent : '') + ' ' + document.getElementById('jacks-val').textContent;
        detail = `${suit}, ${jacksText}`;
    }

    state.history.unshift({
        round: state.currentRound++,
        declarerName: state.players[declarerIdx].name,
        gameValue: val,
        result: isWin ? 'win' : 'lose',
        scoreChange: scoreChange,
        detail: detail
    });
    
    roundForm.classList.remove('open');
    roundNumSpan.textContent = state.currentRound;
    
    renderScoreboard();
    renderHistory();
    resetForm();
}

function resetForm() {
    // Reset to defaults
    document.querySelectorAll('.tbtn[data-g="type"]').forEach(b => b.classList.remove('active'));
    document.querySelector('.tbtn[data-g="type"][data-v="suit"]').classList.add('active');
    updateFormVisibility('suit');
    
    document.querySelectorAll('.tbtn[data-g="result"]').forEach(b => b.classList.remove('active'));
    document.querySelector('.tbtn[data-g="result"][data-v="win"]').classList.add('active');
    
    document.querySelectorAll('#row-mods input').forEach(c => c.checked = false);
    document.getElementById('jacks-val').textContent = '1';
}

function renderScoreboard() {
    state.players.forEach((p, i) => {
        const id = i + 1;
        document.getElementById(`name-p${id}`).textContent = p.name;
        const scoreEl = document.getElementById(`score-p${id}`);
        scoreEl.textContent = p.score;
        scoreEl.className = 'sc-score' + (p.score > 0 ? ' pos' : (p.score < 0 ? ' neg' : ''));
        
        // Mark leader
        const maxScore = Math.max(...state.players.map(pl => pl.score));
        const card = document.getElementById(`card-p${id}`);
        if (p.score === maxScore && state.players.some(pl => pl.score !== 0)) {
            card.classList.add('leader');
        } else {
            card.classList.remove('leader');
        }

        // Mark dealer
        if (i === state.dealerIndex) {
            card.classList.add('dealer');
        } else {
            card.classList.remove('dealer');
        }
        card.classList.add('has-role');

        // Add roles (Geben, Hören, Sagen, Weitersagen)
        // For 3 players (Clockwise):
        // i = dealerIndex -> Geber / Hinterhand (HH) -> "Weitersagen"
        // i = (dealerIndex + 1) % 3 -> Vorhand (VH) -> "Hören"
        // i = (dealerIndex + 2) % 3 -> Mittelhand (MH) -> "Sagen"
        
        let roleLabel = '';
        let roleClass = '';
        
        if (i === state.dealerIndex) {
            roleLabel = '🎴 Geber';
            roleClass = 'role-geben';
        } else if (i === (state.dealerIndex + 1) % 3) {
            roleLabel = '👂 Hören';
            roleClass = 'role-hoeren';
        } else if (i === (state.dealerIndex + 2) % 3) {
            roleLabel = '🗣️ Sagen';
            roleClass = 'role-sagen';
        }
        
        // Remove old badge if exists
        const oldBadge = card.querySelector('.role-badge');
        if (oldBadge) oldBadge.remove();
        
        const badge = document.createElement('div');
        badge.className = `role-badge ${roleClass}`;
        badge.textContent = roleLabel;
        card.appendChild(badge);
    });
}

function renderHistory() {
    if (state.history.length === 0) {
        historyList.innerHTML = '<div class="hist-empty">Noch keine Runden eingetragen</div>';
        return;
    }

    historyList.innerHTML = '';
    state.history.forEach(h => {
        const item = document.createElement('div');
        item.className = 'hist-item';
        item.innerHTML = `
            <div class="hist-num">${h.round}</div>
            <div class="hist-main">
                <div class="hist-who">${h.declarerName}</div>
                <div class="hist-game">${h.detail}</div>
            </div>
            <div class="hist-right">
                <div class="hist-sw">${h.gameValue} Pkt.</div>
                <div class="hist-pts ${h.result}">${h.scoreChange > 0 ? '+' : ''}${h.scoreChange}</div>
            </div>
        `;
        historyList.appendChild(item);
    });
}

function resetGame() {
    if (confirm('Spiel wirklich zurücksetzen? Alle Daten gehen verloren.')) {
        state.players = [];
        state.history = [];
        state.currentRound = 1;
        state.dealerIndex = 0;
        roundNumSpan.textContent = '1';
        setupScreen.classList.add('active');
        gameScreen.classList.remove('active');
        resetForm();
    }
}

document.addEventListener('DOMContentLoaded', init);
