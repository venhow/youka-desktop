const debug = require("debug")("youka:desktop");
const rp = require("request-promise");
const api = require("../config").api;
const retry = require("promise-retry");

const QUEUE_ALIGN = "align";
const QUEUE_ALIGN_LINE = "alignline";
const QUEUE_ALIGN_EN = "alignen";
const QUEUE_SPLIT = "split";

async function enqueue(queue, body) {
  const { id } = await rp({
    uri: `${api}/queues/${queue}/enqueue`,
    method: "POST",
    json: true,
    body,
  });

  return id;
}

async function upload(body) {
  const { url } = await rp({ uri: `${api}/upload`, json: true });

  await retry((r) =>
    rp({
      uri: url,
      body,
      method: "PUT",
    }).catch(r)
  );

  return url;
}

async function job(queue, id) {
  return retry((r) =>
    rp({ uri: `${api}/queues/${queue}/${id}`, json: true }).catch(r)
  );
}

async function wait(queue, id, onStatus) {
  while (true) {
    const job = await this.job(queue, id);
    debug(queue, id, job);

    if (!job || !job.status) return null;

    switch (job.status) {
      case "waiting":
        onStatus("Waiting in the queue");
        break;
      case "active": {
        onStatus("Server is processing your song");
        break;
      }
      default: {
        break;
      }
    }

    switch (job.status) {
      case "succeeded":
        return job;
      case "failed":
        return null;
      default:
        await (async () =>
          new Promise((resolve) => setTimeout(resolve, 5000)))();
    }
  }
}

module.exports = {
  job,
  wait,
  enqueue,
  upload,
  QUEUE_ALIGN,
  QUEUE_ALIGN_EN,
  QUEUE_SPLIT,
  QUEUE_ALIGN_LINE,
};
