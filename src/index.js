// index.js
const cluster = require('cluster');
const os = require('os');
const app = require('./app');
require('./config/validate-env');

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && cluster.isPrimary) {
  const numWorkers = Number(process.env.WEB_CONCURRENCY || os.cpus().length);
  console.log(`Primary ${process.pid} is running. Spawning ${numWorkers} workers...`);
  for (let i = 0; i < numWorkers; i += 1) {
    cluster.fork();
  }
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died. Spawning a new one.`);
    cluster.fork();
  });
} else {
  app.listen(PORT, () => {
    console.log(`PID ${process.pid} listening at http://localhost:${PORT}`);
  });
}
