const autocannon = require("autocannon");
const corpus = require('./corpus-en.json');

const tests = [];
corpus.data.forEach((item) => {
  item.tests.forEach((test) => {
    tests.push({ utterance: test, intent: item.intent });
  });
});

const port = process.env.PORT || 8123;

const host = `http://localhost:${port}`;
const urls = tests.map(x => `${host}/${x.utterance}`);

function startBench() {
  const instance = autocannon(
    {
      url: urls,
      connections: 400,
      pipelining: 20,
      duration: 60,
      workers: 4
    }
  );
  autocannon.track(instance);
}

startBench();
