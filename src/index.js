var VM = require('../index.js')
var LogTranslator = require('./logtranslator.js');
var _ = require('lodash');
var utils = require('web3/lib/utils/utils.js');
var sha3 = require('web3/lib/utils/sha3.js');
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
var coder = require('web3/lib/solidity/coder.js');

var classes = require('./classes.json');

// create a new VM instance
var vm = new VM()

// Generating sourceclass map: (sha3(bin) => name)
// This is needed to infer class names of deployed contracts
var sourceclassMap = {};
var sourceclassMap2 = {};

// mapss class => function signature => constant bool
// TODO - maybe substitute class names with sha(bin)
//      ? can I find the info on an address origins code?
var classfunctionconstantsMap = {};
var class_x_function_to_object = {};

_.each(classes, (json, name) => {
  sourceclassMap[sha3(json.bin)] = name;
  sourceclassMap2[json.bin] = name;
  classfunctionconstantsMap[name] = {};
  class_x_function_to_object[name] = {};
  JSON.parse(json.abi)
  .filter(json => json.type !== 'constructor')
  .forEach(abi => {
    var fname = utils.transformToFullName(abi);
    classfunctionconstantsMap[name][sha3(fname).slice(0,8)] = abi.constant;
    class_x_function_to_object[name][sha3(fname).slice(0,8)] = abi;
  });
  // class_x_function_to_object[name]['constructor'] =
  var constructor =
    JSON.parse(json.abi)
    .find(abi => abi.type === 'constructor');
  if(!!constructor) class_x_function_to_object[name]['constructor'] = constructor;
});


// TODO - export log-translator into own dapple-utils module
var logtranslator = new LogTranslator(JSON.parse(classes.B.abi));

// TODO - deprecated? maybe not. Make a huge contract class knowledge base
var constantsMap = {};
// abiA.filter(json => json.type !== 'constructor').forEach(json => {
//   var name = utils.transformToFullName(json);
//   constantsMap[sha3(name).slice(0,8)] = json.constant;
// });

// vm.on('step', function (data) {
//   console.log(data.opcode.name)
// })
var addressclassMap = {};

web3.eth.defaultAccount = web3.eth.coinbase;

// TODO - make one dapplescript related communication object
vm.runCode({
  code: new Buffer(classes.B.bin, 'hex'),
  gasLimit: new Buffer('ffffffff', 'hex'),
  caller: new Buffer(web3.eth.defaultAccount.slice(2), 'hex'),
  constantsMap: constantsMap,
  sourceclassMap: sourceclassMap,
  addressclassMap: addressclassMap,
  ds: {
    origin: web3.eth.coinbase,
    classfunctionconstantsMap,
    logtranslator,
    callFlag: false,
    class_x_function_to_object,
    coder,
    sourceclassMap2,
    web3: web3
  }
}, function (err, receipt) {

  var logs = [];

  for (var i = 0; i < receipt.logs.length; i++) {
    var log = receipt.logs[i];
    var address = '0x'+log[0].toString('hex');
    var topics = []

    for (var j = 0; j < log[1].length; j++) {
      topics.push('0x'+log[1][j].toString('hex'));
    }

    var data = '0x'+log[2].toString('hex');

    logs.push({
      logIndex: i.toString(16),
      transactionIndex: "0x0",
      address: address,
      data: data,
      topics: topics,
      type: "mined"
    });
  }
  var llogs = logtranslator.translateAll(logs);
  llogs.forEach(llog => {
    if(llog.event == 'exportObject') {
      llog.args.class = addressclassMap[llog.args.addr];
    }
  })
  console.log('\n\n\n');
  console.log(llogs.map(log => `${log.event}(${_.map(log.args, (v, k) => {return k + ' ' + v}).join(', ')})`).join('\n'));
  // console.log(JSON.stringify(results, false, 2));
  // console.log(err)
})
