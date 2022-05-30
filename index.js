const useMicroWS = false;
const uWebSockets = useMicroWS ? require('uwebsockets.js') : undefined;
const fastify = useMicroWS ? undefined : require('fastify')();
const cluster = require('cluster');
const fs = require('fs');
const { Neural } = require('@agarimo/neural');
const { getProcessor } = require('@agarimo/languages');
const os = require('os');

const config = require('./conf.json');

const numCPUs = process.env.NUM_CPUS || config.numCPUS || os.cpus().length;

const port = process.env.PORT || process.env.port || config.port || 3000;

function startServer() {
  const corpus = JSON.parse(fs.readFileSync(config.corpus, 'utf-8'));
  const processorEn = getProcessor(corpus.locale);
  const net = new Neural({ processor: processorEn });
  net.train(corpus);
  if (useMicroWS) {
    const app = uWebSockets.App();
    app.get('/:text', (res, req) => {
      const text = decodeURI(req.getParameter(0));
      res.end(JSON.stringify(net.run(text)));
    });
    app.listen(port, (token) => {
      if (token) {
        console.log(`Server listening on port ${port}`);
      } else {
        console.log(`Server failed to start on port ${port}`);
      }
    });
  } else {
    fastify.get('*', (req, reply) => {
      const input = decodeURI(req.url.slice(1));
      reply.send(net.run(input)[0].intent);
    });
    fastify.listen(port, '0.0.0.0', () => {
      console.log(`listening on port ${port}, PID: ${process.pid}`);
    });
  }
}

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  for (let i = 0; i < numCPUs; i += 1) {
    cluster.fork();
  }
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  startServer();
}
