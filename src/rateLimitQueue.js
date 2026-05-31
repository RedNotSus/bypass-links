export class RateLimitQueue {
  constructor({ limit = 25, intervalMs = 10_000, concurrency = 2 } = {}) {
    this.limit = limit;
    this.intervalMs = intervalMs;
    this.concurrency = concurrency;
    this.active = 0;
    this.queue = [];
    this.timestamps = [];
  }

  schedule(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.runNext();
    });
  }

  runNext() {
    if (this.active >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const now = Date.now();
    this.timestamps = this.timestamps.filter((timestamp) => now - timestamp < this.intervalMs);

    if (this.timestamps.length >= this.limit) {
      const waitMs = this.intervalMs - (now - this.timestamps[0]) + 5;
      setTimeout(() => this.runNext(), waitMs);
      return;
    }

    const item = this.queue.shift();
    this.active += 1;
    this.timestamps.push(now);

    Promise.resolve()
      .then(item.task)
      .then(item.resolve, item.reject)
      .finally(() => {
        this.active -= 1;
        this.runNext();
      });
  }
}
