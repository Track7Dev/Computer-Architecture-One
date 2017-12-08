const fs = require('fs');
const args = process.argv;
const verbose = args.includes('-v');
const debug = args.includes('-debug');
const filename = args[args.indexOf('-i') + 1];
let CPU = require('./vHardware/CPU');
let RAM = require('./vHardware/RAM');
let address = 0;


if(!args.includes('-i')) return console.log('-i [Instructions Flag Missing]');
if(!args[args.indexOf('-i') + 1]) return console.log('[Instructions File Missing]');

const print = (output) => {if(verbose) return console.log('#' + output)};
const log = (output) => {if(debug) return console.log('-' + output)};

if (verbose) print('[Verbose Enabled]');
if (debug) log('[Debug Enabled]');

const readFile = data => {
  try{
    return fs.readFileSync(data, 'utf-8');
  }catch(err){
    return log(err);
  }   
};

const loadMem = (cpu, data) => {
  let lines = data.split('\n');
  lines.forEach((line) => {
    const commentIndex = line.indexOf('#');
    if(commentIndex != -1) line = line.substr(0, commentIndex).trim();
    const val = parseInt(line, 2);
    if(Number.isNaN(val)) return;
    print(val);
    cpu.poke(address++, val);
  })
}

RAM = new RAM();
CPU = new CPU(RAM);

loadMem(CPU, readFile(filename));

CPU.init();
