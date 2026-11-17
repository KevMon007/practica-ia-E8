'use strict';
const path = require('node:path');
const { main } = require('./compare');

// Referencia compartida y configuración portátil; conserva la evidencia histórica.
main({ modes: ['generative'], outputDir: path.resolve(__dirname, '../results/nvidia-reference') })
  .catch(error => { console.error(error.message); process.exitCode = 1; });
