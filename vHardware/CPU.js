const readline = require('readline');


const INIT = 0b00000001;
const SET = 0b00000010;
const SAVE = 0b00000100;
const SAVESTR = 0b00001111;
const MUL = 0b00000101;
const SUB = 0b00000011;
const ADD = 0b00001000;
const DIV = 0b00011000;
const ROUT = 0b00011100;
const PR = 0b00000110;
const PRA = 0b00001110;
const RET = 0b10000000;
const HALT = 0b00000000;

class CORE {
  constructor(reg, RAM) {
    this.reg = reg;
    this.PC = 0;
    this.curReg = 0;
    this.RAM = RAM;

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on('keypress', (str, key) => {
      if(key.ctrl && key.name === 'c') this.interrupt('exit');
      if(key.ctrl && key.name === 'r') this.interrupt('restart');
    });
  }

  interrupt(inrupt) {
    if(inrupt === 'exit') {console.log('**STOPPED**'); process.exit(1);}
    if(inrupt === 'restart') {console.log('**RESTARTED**'); this.PC = 0;}
  }

  inc(num) {
    this.PC += num;
  }
  dec(num) {
    this.PC - num;
  }  

  push(ins) {
    console.log('PUSH', 'ins: ' + ins);
    this.RAM.mem[0xff - 10]++;
    this.RAM.mem[0xff + this.RAM.mem[0xff - 10]] = ins;
  }
  pop() {
    
    this.PC = this.RAM.mem[0xff + this.RAM.mem[0xff - 10]];
    this.RAM.mem[0xff + this.RAM.mem[0xff - 10]] = 0;
    this.RAM.mem[0xff - 10]--;
    console.log('POP', this.PC);
  }

  rout() {
    console.log('ROUT', 'ins: ' + this.RAM.mem[this.PC + 1]);
    this.push(this.PC + 2);
    this.PC = this.RAM.mem[this.PC + 1];
  }
  ret() {
    console.log('RET');
    this.pop();
  }

  startClock(num) {
    this.clock = setInterval(() => { this.tick(); }, 1000);
    this.core = num;
  }

  
  init() {
    console.log('INIT');
    this.inc(1);
  };
  set() {
    
    const reg = this.RAM.mem[this.PC + 1];
    console.log('SET', reg);
    this.curReg = reg;
    this.inc(2);
  }
  save() {
    console.log('SAVE', this.RAM.mem[this.PC + 1]);
    this.reg[this.curReg] = this.RAM.mem[this.PC + 1];
    this.inc(2);
  }
  savestr() {
    console.log('SAVESTR');
    const strlen = this.RAM.mem[this.PC + 1];
    for(let i = 1; i < strlen + 1; i++) {
      this.reg[this.curReg + i] = this.RAM.mem[this.PC + 1 + i];
    }
    this.reg[this.curReg] = strlen;
    this.inc(2 + strlen);
  }
  
  add() {
    console.log('ADD', this.reg[this.RAM.mem[this.PC + 1]] + '+' + this.reg[this.RAM.mem[this.PC + 2]] );
    const x = this.reg[this.RAM.mem[this.PC + 1]];
    const y = this.reg[this.RAM.mem[this.PC + 2]];
    this.reg[this.curReg] = x + y & 0xff;
    this.inc(3);
  }
  sub() {
    console.log('SUB', this.reg[this.RAM.mem[this.PC + 1]] + '-' + this.reg[this.RAM.mem[this.PC + 2]] );
    const x = this.reg[this.RAM.mem[this.PC + 1]];
    const y = this.reg[this.RAM.mem[this.PC + 2]];
    this.reg[this.curReg] = x - y & 0xff;
    this.inc(3);
  }
  mul() {
    console.log('MUL',this.reg[this.RAM.mem[this.PC + 1]] + '*' + this.reg[this.RAM.mem[this.PC + 2]] );
    const x = this.reg[this.RAM.mem[this.PC + 1]];
    const y = this.reg[this.RAM.mem[this.PC + 2]];
    this.reg[this.curReg] = x * y & 0xff;
    this.inc(3);
  }
  div() {
    console.log('DIV', this.reg[this.RAM.mem[this.PC + 1]] + '/' + this.reg[this.RAM.mem[this.PC + 2]] );
    const x = this.reg[this.RAM.mem[this.PC + 1]];
    const y = this.reg[this.RAM.mem[this.PC + 2]];

    this.reg[this.curReg] = x / y & 0xff;
    this.inc(3);
  }
  pra() {
    console.log('PRA');
    const strlen = this.reg[this.curReg];
    let string;
    for(let i = 1; i < strlen; i++)
    {
      string += String.fromCharCode(this.reg[this.curReg + i]);
    }
    console.log(string);
    this.inc(2 + strlen);
  }
  pr() {
    console.log('PR', this.reg[this.curReg]);
    this.inc(1);
  }

  halt() {
    console.log('HALT');
    clearInterval(this.clock);
    process.exit(0);
  }
  tick() {
    const current = this.RAM.mem[this.PC];
    console.log(`C${this.core}:`);
    switch (current) {
      case INIT:
      this.init();
      break;
      case SET:
      this.set();
      break;  
      case SAVE:
      this.save();
      break;
      case SAVESTR:
      this.savestr();
      break;
      case ROUT:
      this.rout();
      break;
      case ADD:
      this.add();
      break;
      case SUB:
      this.sub();
      break;
      case MUL:
      this.mul();
      break;
      case DIV:
      this.div();
      break;
      case PRA:
      this.pra();
      break;
      case PR: 
      this.pr();
      break;
      case RET:
      this.ret();
      break;
      case HALT:
      this.halt();
    }
    
  }
}

class CPU {
  constructor(RAM) {
    this.reg = new Array(256);
    this.reg.fill(0);
    this.RAM = RAM;
    this.CORE1 = new CORE(this.reg, this.RAM); //0xff - 1
    this.CORE2 = new CORE(this.reg, this.RAM); //0xff - 2
    this.CORE3 = new CORE(this.reg, this.RAM); //0xff - 3
    this.CORE4 = new CORE(this.reg, this.RAM); //0xff - 4
  }
  poke(address, value) {
    this.RAM.mem[address] = value;
  }
  init(){
    const loadCore = () => {
    if (!this.reg[0xff - 1])  {this.reg[0xff - 1] = 1; return this.CORE1.startClock(1);}
    if (!this.reg[0xff - 2])  {this.reg[0xff - 2] = 1; return this.CORE2.startClock(2);}
    if (!this.reg[0xff - 3])  {this.reg[0xff - 3] = 1; return this.CORE3.startClock(3);}
    if (!this.reg[0xff - 4])  {this.reg[0xff - 4] = 1; return this.CORE4.startClock(4);}
    loadCore(); // Recheck if all are busy
    }
    loadCore(); //init load
  }
}


module.exports = CPU;