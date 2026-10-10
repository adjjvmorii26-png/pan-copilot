/**
 * Fixed-capacity ring for agent messages (single-threaded sim tick).
 * Drop-on-full; zero-alloc steady state if messages are not retained.
 */
export class MessageRing {
  constructor(capacity = 4096) {
    const cap = 1 << (32 - Math.clz32(Math.max(2, capacity - 1)));
    this.capacity = cap;
    this.mask = cap - 1;
    this.buf = new Array(cap).fill(null);
    this.head = 0;
    this.tail = 0;
    this.dropped = 0;
    this.delivered = 0;
  }

  get size() {
    return (this.tail - this.head) & this.mask;
  }

  push(msg) {
    const next = (this.tail + 1) & this.mask;
    if (next === this.head) {
      this.dropped++;
      return false;
    }
    this.buf[this.tail] = {
      from: msg.from,
      to: msg.to,
      type: msg.type,
      payload: msg.payload,
      ttl: msg.ttl ?? 1,
    };
    this.tail = next;
    return true;
  }

  drain(fn, max = 512) {
    let n = 0;
    while (this.head !== this.tail && n < max) {
      const m = this.buf[this.head];
      this.buf[this.head] = null;
      this.head = (this.head + 1) & this.mask;
      if (m) {
        fn(m);
        this.delivered++;
        n++;
      }
    }
    return n;
  }
}
