const PALABRAS_ORIGINALES = ["PERU", "LIMA", "MAPA", "COSTA", "SIERRA", "SELVA"];
const FILAS = 10;
const COLUMNAS = 10;

const COLORES_PALABRAS = [
  "rgba(255, 68, 68, 0.35)",
  "rgba(33, 150, 243, 0.35)",
  "rgba(76, 175, 80, 0.35)",
  "rgba(255, 152, 0, 0.35)",
  "rgba(156, 39, 176, 0.35)",
  "rgba(233, 30, 99, 0.35)"
];

const sonidoExito = new Audio('sonidos/exito.mp3');
const sonidoError = new Audio('sonidos/error.mp3');

let asignacionColores = {};
let tableroMatriz = [];
let palabrasActivas = [];
let celdasSeleccionadas = [];
let estaSeleccionando = false;
let celdaInicio = null;

let segundosTranscurridos = 0;
let idIntervaloTiempo = null;

const confettiCanvas = document.getElementById('confettiCanvas');
const confettiCtx = confettiCanvas.getContext('2d');
let confetis = [];
let animacionConfetiId = null;
let lanzarConfeti = false;

const boardEl = document.getElementById('wordSearchBoard');
const wordListEl = document.getElementById('wordList');
const victoryScreen = document.getElementById('victoryScreen');
const restartBtn = document.getElementById('restartBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const timeCountEl = document.getElementById('timeCount');
const finalTimeEl = document.getElementById('finalTime');

function ajustarCanvasConfeti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', ajustarCanvasConfeti);
ajustarCanvasConfeti();

function iniciarJuego() {
  // CORREGIDO: Resetear variables lógicas a sus estados por defecto de forma estricta
  tableroMatriz = Array(FILAS).fill(null).map(() => Array(COLUMNAS).fill('.'));
  palabrasActivas = [...PALABRAS_ORIGINALES];
  celdasSeleccionadas = [];
  estaSeleccionando = false;
  celdaInicio = null;
  asignacionColores = {};
  segundosTranscurridos = 0;
  lanzarConfeti = false;
  confetis = [];
  
  // Limpiar UI y detener animaciones previas de forma limpia
  boardEl.innerHTML = '';
  wordListEl.innerHTML = '';
  victoryScreen.style.display = 'none';
  timeCountEl.textContent = "00:00";
  cancelAnimationFrame(animacionConfetiId);
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  PALABRAS_ORIGINALES.forEach((palabra, index) => {
    asignacionColores[palabra] = COLORES_PALABRAS[index % COLORES_PALABRAS.length];
  });

  palabrasActivas.forEach(palabra => {
    let colocada = false;
    let intentos = 0;
    while (!colocada && intentos < 300) {
      intentos++;
      const fila = Math.floor(Math.random() * FILAS);
      const col = Math.floor(Math.random() * COLUMNAS);
      const dir = Math.floor(Math.random() * 4); 
      
      let dFila = 0, dCol = 0;
      if (dir === 0) dCol = 1;
      else if (dir === 1) dFila = 1;
      else if (dir === 2) { dFila = 1; dCol = 1; }
      else if (dir === 3) { dFila = -1; dCol = 1; }

      if (validarEspacioPalabra(palabra, fila, col, dFila, dCol)) {
        colocarPalabraEnMatriz(palabra, fila, col, dFila, dCol);
        colocada = true;
      }
    }
  });

  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let f = 0; f < FILAS; f++) {
    for (let c = 0; c < COLUMNAS; c++) {
      if (tableroMatriz[f][c] === '.') {
        tableroMatriz[f][c] = letras[Math.floor(Math.random() * letras.length)];
      }
    }
  }

  for (let f = 0; f < FILAS; f++) {
    for (let c = 0; c < COLUMNAS; c++) {
      const cellDiv = document.createElement('div');
      cellDiv.className = 'cell';
      cellDiv.textContent = tableroMatriz[f][c];
      cellDiv.dataset.row = f;
      cellDiv.dataset.col = c;
      
      cellDiv.addEventListener('pointerdown', iniciarSeleccion);
      cellDiv.addEventListener('pointerenter', continuarSeleccion);
      
      boardEl.appendChild(cellDiv);
    }
  }

  // CORREGIDO: Evitar la acumulación de listeners duplicados globales al reiniciar
  document.removeEventListener('pointerup', terminarSeleccion);
  document.addEventListener('pointerup', terminarSeleccion);

  PALABRAS_ORIGINALES.forEach(palabra => {
    const li = document.createElement('li');
    li.className = 'word-item';
    li.id = `word-${palabra}`;
    li.textContent = palabra;
    wordListEl.appendChild(li);
  });

  clearInterval(idIntervaloTiempo);
  idIntervaloTiempo = setInterval(actualizarCronometro, 1000);
}

function actualizarCronometro() {
  segundosTranscurridos++;
  const min = Math.floor(segundosTranscurridos / 60).toString().padStart(2, '0');
  const seg = (segundosTranscurridos % 60).toString().padStart(2, '0');
  timeCountEl.textContent = `${min}:${seg}`;
}

function validarEspacioPalabra(palabra, f, c, dF, dC) {
  for (let i = 0; i < palabra.length; i++) {
    const nuevaF = f + i * dF;
    const nuevaC = c + i * dC;
    if (nuevaF < 0 || nuevaF >= FILAS || nuevaC < 0 || nuevaC >= COLUMNAS) return false;
    if (tableroMatriz[nuevaF][nuevaC] !== '.' && tableroMatriz[nuevaF][nuevaC] !== palabra[i]) return false;
  }
  return true;
}

function colocarPalabraEnMatriz(palabra, f, c, dF, dC) {
  for (let i = 0; i < palabra.length; i++) {
    tableroMatriz[f + i * dF][c + i * dC] = palabra[i];
  }
}

function iniciarSeleccion(e) {
  e.preventDefault();
  estaSeleccionando = true;
  celdaInicio = e.target;
  celdasSeleccionadas = [celdaInicio];
  celdaInicio.classList.add('selecting');
}

function continuarSeleccion(e) {
  if (!estaSeleccionando || !celdaInicio) return;
  const celdaActual = e.target;
  
  if (celdaActual.classList.contains('cell')) {
    const fStart = parseInt(celdaInicio.dataset.row);
    const cStart = parseInt(celdaInicio.dataset.col);
    const fCurrent = parseInt(celdaActual.dataset.row);
    const cCurrent = parseInt(celdaActual.dataset.col);

    const dF = Math.sign(fCurrent - fStart);
    const dC = Math.sign(cCurrent - cStart);

    if (dF === 0 || dC === 0 || Math.abs(fCurrent - fStart) === Math.abs(cCurrent - cStart)) {
      document.querySelectorAll('.cell.selecting').forEach(c => c.classList.remove('selecting'));
      celdasSeleccionadas = [];

      let f = fStart;
      let c = cStart;
      while (f !== fCurrent + dF || c !== cCurrent + dC) {
        const celdaLinea = document.querySelector(`.cell[data-row='${f}'][data-col='${c}']`);
        if (celdaLinea) {
          celdaLinea.classList.add('selecting');
          celdasSeleccionadas.push(celdaLinea);
        }
        if (f === fCurrent && c === cCurrent) break;
        f += dF;
        c += dC;
      }
    }
  }
}

function terminarSeleccion() {
  if (!estaSeleccionando) return;
  estaSeleccionando = false;

  let palabraFormada = celdasSeleccionadas.map(c => c.textContent).join('').toUpperCase();
  let palabraFormadaInvertida = palabraFormada.split('').reverse().join('');

  let palabraEncontrada = "";
  if (palabrasActivas.includes(palabraFormada)) palabraEncontrada = palabraFormada;
  else if (palabrasActivas.includes(palabraFormadaInvertida)) palabraEncontrada = palabraFormadaInvertida;

  if (palabraEncontrada) {
    const colorAsignado = asignacionColores[palabraEncontrada];
    sonidoExito.currentTime = 0;
    sonidoExito.play().catch(() => {});

    celdasSeleccionadas.forEach(c => {
      c.classList.remove('selecting');
      const overlay = document.createElement('div');
      overlay.className = 'cell-overlay';
      overlay.style.backgroundColor = colorAsignado;
      c.appendChild(overlay);
    });

    const itemLista = document.getElementById(`word-${palabraEncontrada}`);
    if (itemLista) {
      itemLista.classList.add('solved');
      itemLista.style.backgroundColor = colorAsignado.replace("0.35", "1");
      itemLista.style.color = "white";
    }
    
    palabrasActivas = palabrasActivas.filter(w => w !== palabraEncontrada);

    if (palabrasActivas.length === 0) {
      clearInterval(idIntervaloTiempo);
      finalTimeEl.textContent = timeCountEl.textContent;
      
      setTimeout(() => {
        victoryScreen.style.display = 'flex';
        lanzarConfeti = true;
        animarConfeti();
      }, 400);
    }
  } else {
    if (celdasSeleccionadas.length > 1) {
      sonidoError.currentTime = 0;
      sonidoError.play().catch(() => {});
    }
    celdasSeleccionadas.forEach(c => c.classList.remove('selecting'));
  }
  
  celdasSeleccionadas = [];
  celdaInicio = null;
}

class ConfettiParticle {
  constructor() {
    this.x = Math.random() * confettiCanvas.width;
    this.y = Math.random() * -confettiCanvas.height - 20;
    this.size = Math.random() * 8 + 6;
    this.speedX = Math.random() * 4 - 2;
    this.speedY = Math.random() * 5 + 4;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = Math.random() * 4 - 2;
    this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.rotation += this.rotationSpeed;
    if (this.y > confettiCanvas.height) {
      this.y = -20;
      this.x = Math.random() * confettiCanvas.width;
    }
  }
  draw() {
    confettiCtx.save();
    confettiCtx.translate(this.x, this.y);
    confettiCtx.rotate((this.rotation * Math.PI) / 180);
    confettiCtx.fillStyle = this.color;
    confettiCtx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    confettiCtx.restore();
  }
}

function animarConfeti() {
  if (!lanzarConfeti) return;
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  if (confetis.length < 120) {
    confetis.push(new ConfettiParticle());
  }
  confetis.forEach(p => {
    p.update();
    p.draw();
  });
  animacionConfetiId = requestAnimationFrame(animarConfeti);
}

// CORREGIDO: Escuchadores vinculados de forma definitiva para un correcto reciclaje del juego
restartBtn.addEventListener('click', iniciarJuego);
playAgainBtn.addEventListener('click', iniciarJuego);

window.onload = iniciarJuego;
