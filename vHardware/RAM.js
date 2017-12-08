class RAM {
  constructor() {
    this.mem = new Array(256);
    this.mem.fill(0);
  }
}

module.exports = RAM;