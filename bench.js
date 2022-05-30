// eslint-disable-next-line import/no-extraneous-dependencies
const autocannon = require('autocannon');
const fs = require('fs');
const config = require('./conf.json');

const corpus = JSON.parse(fs.readFileSync(config.corpus, 'utf-8'));

const tests = [];
corpus.data.forEach((item) => {
  item.tests.forEach((test) => {
    tests.push({ utterance: test, intent: item.intent });
  });
});

const port = process.env.PORT || config.port || 3000;

const host = `http://localhost:${port}`;

const urls = tests.map((x) => `${host}/${x.utterance}`);

function startBench() {
  const instance = autocannon({
    url: urls,
    connections: config.connections || 400,
    pipelining: config.pipelining || 20,
    duration: config.duration || 60,
    workers: config.workers || 4,
  });
  autocannon.track(instance);
}

startBench();
