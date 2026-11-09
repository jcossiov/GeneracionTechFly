// src/curriculum.js
// Etapas de la vida y Ruta Pedagógica Gradual de Generación Tech (adaptada desde niños pequeños hasta nivel avanzado)

export const LIFE_STAGES = [
  {
    level: 1,
    lifeStage: 'Nivel 1 • Etapa Semilla (Niños)',
    subtitle: 'Primeros Pasos • Sumas y Restas Sencillas',
    moduleName: 'Matemáticas Iniciales',
    badgeColor: '#ffc700',
    skyColor: 0x070b1a,
    fogColor: 0x0f152d,
    gridColor: 0xffc700,
    accentHex: '#ffc700',
    bossName: 'GLITCH ALPHA — Guardián de los Números',
    numChoices: 2,
    obstacleTheme: 'asteroid',
    milestones: [
      '🌱 Etapa Semilla: ¡Aprende sumando y restando en el aire!',
      '🃏 Pasa por la TARJETA DE PREGUNTA si sabes la respuesta para ver las opciones',
      '⭐ Cada respuesta correcta mejora los poderes de tu avión',
    ],
  },
  {
    level: 2,
    lifeStage: 'Nivel 2 • Infancia Exploradora',
    subtitle: 'Primaria • Multiplicaciones y Cálculo Ágil',
    moduleName: 'Tablas y Agilidad Mental',
    badgeColor: '#38bdf8',
    skyColor: 0x091931,
    fogColor: 0x102849,
    gridColor: 0x38bdf8,
    accentHex: '#38bdf8',
    bossName: 'MEGA CALCULUS — Titán Aritmético',
    numChoices: 3,
    obstacleTheme: 'asteroid',
    milestones: [
      '🧮 Infancia Exploradora: ¡Dominando las tablas de multiplicar!',
      '🃏 Cruza la Tarjeta de Pregunta para desplegar las tarjetas de respuesta',
      '🚀 ¡Tu mente calcula cada vez más rápido!',
    ],
  },
  {
    level: 3,
    lifeStage: 'Nivel 3 • Juventud Programadora',
    subtitle: 'Descubriendo el Código • Python y Lógica',
    moduleName: 'Programación en Python',
    badgeColor: '#a855f7',
    skyColor: 0x120829,
    fogColor: 0x1f0f42,
    gridColor: 0x9d4edd,
    accentHex: '#c084fc',
    bossName: 'SYNTAX TERROR — Devorador de Código',
    numChoices: 3,
    obstacleTheme: 'code_block',
    milestones: [
      '🐍 Juventud Tech: Mi primera línea de código con print("Hola")',
      '💻 Creando funciones con "def" y resolviendo retos lógicos',
      '⚡ ¡El código te da superpoderes para transformar el mundo!',
    ],
  },
  {
    level: 4,
    lifeStage: 'Nivel 4 • Aprendiz Maker',
    subtitle: 'Taller de Creación • Arduino e Impresión 3D',
    moduleName: 'Robótica Arduino e Impresión 3D',
    badgeColor: '#10b981',
    skyColor: 0x041e19,
    fogColor: 0x07332a,
    gridColor: 0x10b981,
    accentHex: '#34d399',
    bossName: 'SHORT-CIRCUIT — Coloso Mecatrónico',
    numChoices: 3,
    obstacleTheme: 'arduino',
    milestones: [
      '🤖 Etapa Maker: Encendiendo LEDs y sensores con Arduino UNO',
      '🖨️ Impresión 3D: Diseñando en ejes X, Y, Z con filamento PLA',
      '🛠️ ¡Tus ideas pasan de la pantalla al mundo real!',
    ],
  },
  {
    level: 5,
    lifeStage: 'Nivel 5 • Innovador Generación Tech',
    subtitle: 'Impacto Global • Internet de las Cosas (IoT) y Nube',
    moduleName: 'IoT, Sensores y Ruta Completa',
    badgeColor: '#f72585',
    skyColor: 0x180521,
    fogColor: 0x2b0938,
    gridColor: 0xf72585,
    accentHex: '#ff4d8d',
    bossName: 'OMEGA LAG — Emperador de la Desconexión',
    numChoices: 4,
    obstacleTheme: 'iot_node',
    milestones: [
      '🌐 Graduado Generación Tech: Conectando dispositivos con IoT y Wi-Fi',
      '📡 Sensores inteligentes, Python, Arduino e Impresión 3D unidos',
      '🏆 ¡Eres el futuro de la tecnología en Generación Tech!',
    ],
  },
];

export function getStageForLevel(level) {
  const idx = Math.min(LIFE_STAGES.length - 1, Math.max(0, (level || 1) - 1));
  const base = LIFE_STAGES[idx];
  if (level <= LIFE_STAGES.length) return base;
  return Object.assign({}, base, {
    level,
    lifeStage: `Nivel ${level} • Maestro Generación Tech`,
    subtitle: 'Dominio Total • Matemáticas + Python + Arduino + 3D + IoT',
    moduleName: 'Maestría Generación Tech',
    bossName: `OMEGA LAG v${level}.0 — Núcleo Supremo`,
    numChoices: 4,
  });
}

// Preguntas claras y amigables de la ruta pedagógica
const TECH_QUESTIONS = {
  python: [
    {
      q: '🐍 Python: ¿Qué comando muestra un texto en pantalla?',
      correct: 'print("Hola")',
      wrongs: ['saltar("Hola")', 'borrar()', 'pintar()'],
      rewardText: '¡Muy bien! print() muestra mensajes en pantalla',
    },
    {
      q: '🐍 Python: ¿Qué palabra se usa para crear una función?',
      correct: 'def',
      wrongs: ['fin', 'rojo', 'stop'],
      rewardText: '¡Excelente! Con "def" defines una función en Python',
    },
    {
      q: '🐍 Python: ¿Qué símbolo se usa para escribir un comentario?',
      correct: '# Comentario',
      wrongs: ['? Comentario', '$ Comentario', '@ Comentario'],
      rewardText: '¡Exacto! El símbolo # crea un comentario en Python',
    },
    {
      q: '🐍 Python: ¿Cuántos elementos tiene la lista [5, 10, 15]?',
      correct: '3 elementos',
      wrongs: ['1 elemento', '9 elementos', '0 elementos'],
      rewardText: '¡Correcto! len([5, 10, 15]) es igual a 3',
    },
    {
      q: '🐍 Python: ¿Qué comando pide al usuario escribir su nombre?',
      correct: 'input()',
      wrongs: ['dormir()', 'salir()', 'apagar()'],
      rewardText: '¡Genial! input() recibe lo que escribe el usuario',
    },
  ],
  maker: [
    {
      q: '🤖 Arduino: ¿Qué placa usamos para programar circuitos y LEDs?',
      correct: 'Arduino UNO',
      wrongs: ['Control de TV', 'Disco de Vinilo', 'Cámara de Rollo'],
      rewardText: '¡Correcto! Arduino UNO es el cerebro de nuestros circuitos',
    },
    {
      q: '🤖 Arduino: ¿Qué comando enciende un LED en el pin 13?',
      correct: 'digitalWrite(13, HIGH)',
      wrongs: ['apagarTodo()', 'borrarPin(0)', 'cerrarPuerta()'],
      rewardText: '¡Brillante! HIGH envía energía para encender el LED',
    },
    {
      q: '🤖 Electrónica: ¿Qué componente protege al LED para que no se queme?',
      correct: 'Resistencia',
      wrongs: ['Borrador', 'Imán', 'Regla'],
      rewardText: '¡Salvaste el LED! La resistencia regula la corriente',
    },
    {
      q: '🖨️ Impresión 3D: ¿Cómo se llama el rollo de material para imprimir en 3D?',
      correct: 'Filamento PLA',
      wrongs: ['Hilo de Coser', 'Cinta Adhesiva', 'Papel Aluminio'],
      rewardText: '¡Exacto! El filamento PLA se funde capa por capa',
    },
    {
      q: '🖨️ Impresión 3D: ¿Cuáles son los 3 ejes de movimiento de una impresora 3D?',
      correct: 'Ejes X, Y, Z',
      wrongs: ['Solo Norte y Sur', 'Ejes A y B', 'Sin ejes'],
      rewardText: '¡Muy bien! X (ancho), Y (fondo) y Z (altura)',
    },
    {
      q: '🖨️ Impresión 3D: ¿Qué formato de archivo guardamos para llevar el diseño a imprimir?',
      correct: 'Archivo .STL',
      wrongs: ['Canción .MP3', 'Video .MP4', 'Audio .WAV'],
      rewardText: '¡Correcto! El archivo .STL contiene la figura en 3D',
    },
  ],
  iot: [
    {
      q: '🌐 ¿Qué significa IoT en la ruta de Generación Tech?',
      correct: 'Internet de las Cosas',
      wrongs: ['Isla de Tornillos', 'Imagen de Televisión', 'Impresora de Tinta'],
      rewardText: '¡Excelente! Internet de las Cosas conecta objetos a la red',
    },
    {
      q: '🌐 IoT: ¿Qué permite que un circuito envíe datos a la Nube sin cables?',
      correct: 'Conexión Wi-Fi / IoT',
      wrongs: ['Una cuerda', 'Un lápiz', 'Un espejo'],
      rewardText: '¡Así es! Con Wi-Fi y protocolos IoT conectamos sensores a la nube',
    },
    {
      q: '🌐 IoT: ¿Qué mide un sensor DHT11 en una estación inteligente?',
      correct: 'Temperatura y Humedad',
      wrongs: ['El peso de una roca', 'El color del cielo', 'La hora del reloj'],
      rewardText: '¡Correcto! El sensor DHT11 mide temperatura y humedad ambiental',
    },
    {
      q: '🌐 IoT: ¿Qué sensor mide distancias usando ondas de ultrasonido?',
      correct: 'Sensor Ultrasónico',
      wrongs: ['Micrófono de radio', 'Bombillo de casa', 'Teclado USB'],
      rewardText: '¡Genial! El sensor ultrasónico mide distancias como un radar',
    },
  ],
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

// Generador gradual de Matemáticas por Nivel (pensado para niños pequeños en niveles bajos)
export function generateMathByLevel(level = 1) {
  let q = '';
  let ans = 0;

  if (level === 1) {
    // Nivel 1 (Niños pequeños): Sumas de 1 dígito (1..6 + 1..5) o restas muy fáciles
    if (Math.random() < 0.7) {
      const a = randInt(1, 6);
      const b = randInt(1, 5);
      ans = a + b;
      q = `🧮 ¿Cuánto es ${a} + ${b}?`;
    } else {
      const b = randInt(1, 4);
      const ansVal = randInt(2, 6);
      const a = b + ansVal;
      ans = ansVal;
      q = `🧮 ¿Cuánto es ${a} - ${b}?`;
    }
  } else if (level === 2) {
    // Nivel 2 (Primaria): Sumas hasta 20 o tablas fáciles (×2, ×3, ×4, ×5)
    if (Math.random() < 0.45) {
      const a = randInt(6, 12);
      const b = randInt(4, 10);
      ans = a + b;
      q = `🧮 ¿Cuánto es ${a} + ${b}?`;
    } else {
      const a = randInt(2, 5);
      const b = randInt(2, 6);
      ans = a * b;
      q = `⚡ ¿Cuánto es ${a} × ${b}?`;
    }
  } else if (level === 3) {
    // Nivel 3: Multiplicaciones intermedias
    const a = randInt(3, 8);
    const b = randInt(3, 7);
    ans = a * b;
    q = `⚡ ¿Cuánto es ${a} × ${b}?`;
  } else {
    // Nivel 4+: Multiplicaciones mayores u operación combinada sencilla
    if (Math.random() < 0.65) {
      const a = randInt(5, 10);
      const b = randInt(4, 9);
      ans = a * b;
      q = `⚡ ¿Cuánto es ${a} × ${b}?`;
    } else {
      const a = randInt(2, 5);
      const b = randInt(3, 5);
      const c = randInt(2, 6);
      ans = a * b + c;
      q = `🧮 ¿Cuánto es (${a} × ${b}) + ${c}?`;
    }
  }

  const wrongs = new Set();
  const offsets = level === 1 ? [-2, -1, 1, 2, 3] : [-5, -3, -2, -1, 1, 2, 3, 5];
  while (wrongs.size < 3) {
    const off = offsets[randInt(0, offsets.length - 1)];
    const candidate = ans + off;
    if (candidate !== ans && candidate > 0) wrongs.add(String(candidate));
  }

  return {
    q,
    correct: String(ans),
    wrongs: Array.from(wrongs),
    rewardText: `¡Muy bien! La respuesta correcta es ${ans}`,
  };
}

const POWERUP_REWARDS = [
  { type: 'weapon', label: '🔥 ¡DISPARO MEJORADO!' },
  { type: 'shield', label: '🛡️ ¡SUPER ESCUDO +50!' },
  { type: 'boost', label: '⚡ ¡TURBO VELOCIDAD!' },
  { type: 'health', label: '💚 ¡VIDA RECUPERADA +40!' },
];

export function generateGateChallenge(level = 1, mode = 'levels', arcadeTime = 0) {
  const effectiveLevel = mode === 'arcade' ? Math.floor(arcadeTime / 45) + 1 : level;
  const stage = getStageForLevel(effectiveLevel);
  const numChoices = stage.numChoices || 2;

  let raw;
  const roll = Math.random();

  if (effectiveLevel === 1) {
    // Nivel 1: 100% Matemáticas muy fáciles para niños pequeños
    raw = generateMathByLevel(1);
  } else if (effectiveLevel === 2) {
    // Nivel 2: 100% Matemáticas de primaria y tablas fáciles
    raw = generateMathByLevel(2);
  } else if (effectiveLevel === 3) {
    // Nivel 3: Mitad Matemáticas, mitad Python básico (print, def)
    const pool = TECH_QUESTIONS.python;
    raw = roll < 0.45 ? generateMathByLevel(3) : pool[randInt(0, pool.length - 1)];
  } else if (effectiveLevel === 4) {
    // Nivel 4: Arduino, Electrónica e Impresión 3D + Matemáticas
    const pool = TECH_QUESTIONS.maker;
    raw = roll < 0.3 ? generateMathByLevel(4) : pool[randInt(0, pool.length - 1)];
  } else {
    // Nivel 5+: IoT + Python + Arduino + Impresión 3D + Matemáticas
    if (roll < 0.25) {
      raw = generateMathByLevel(5);
    } else if (roll < 0.65) {
      const pool = TECH_QUESTIONS.iot;
      raw = pool[randInt(0, pool.length - 1)];
    } else {
      const allPool = [...TECH_QUESTIONS.python, ...TECH_QUESTIONS.maker, ...TECH_QUESTIONS.iot];
      raw = allPool[randInt(0, allPool.length - 1)];
    }
  }

  const wrongSlice = shuffle(raw.wrongs).slice(0, numChoices - 1);
  const options = shuffle([
    { text: raw.correct, isCorrect: true },
    ...wrongSlice.map(w => ({ text: w, isCorrect: false })),
  ]);

  const reward = POWERUP_REWARDS[randInt(0, POWERUP_REWARDS.length - 1)];

  return {
    question: raw.q,
    correctText: raw.correct,
    rewardText: raw.rewardText,
    rewardType: reward.type,
    rewardLabel: reward.label,
    options,
    stage,
  };
}
