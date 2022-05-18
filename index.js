const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const fastify = require('fastify')();
const { Neural } = require('@agarimo/neural');
const corpus = require('./corpus-en.json');
const { getProcessor } = require('@agarimo/languages');


const port = process.env.PORT || process.env.port || 3000;

function startServer() {
  const processorEn = getProcessor('en');
  const net = new Neural({ processor: processorEn });
  net.train(corpus);
  fastify.get('/:text', function (req, reply) {
    const text = req.params.text;
    const output = net.run(text);
    reply.code(200).send(output);
  });  
  fastify.listen(port, '0.0.0.0', () => {
    console.log(`listening on port ${port}, PID: ${process.pid}`);
  });
}

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', worker => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  startServer();
}
