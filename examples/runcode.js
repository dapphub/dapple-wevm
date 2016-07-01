var VM = require('../index.js')
var LogTranslator = require('./logtranslator.js');
var _ = require('lodash');
var utils = require('web3/lib/utils/utils.js');
var sha3 = require('web3/lib/utils/sha3.js');


// create a new VM instance
var vm = new VM()


/*
contract A {
  function giveMeSEVENTEEN() returns (uint) {
    return 17;
  }
}

contract B {
  event exportNumber(string name, uint number);
  event exportObject(string name, address addr, string className);

  function B() {
    A a = new A();
    exportObject("a", a, "A");
    exportNumber("seventeen", a.giveMeSEVENTEEN());
  }
}
 */

var code = '60606040525b60006040516075806101d3833901809050604051809103906000f090507f5864e519f79ffca2d24ef79e47354eaec549d234417647a460ca19c8509007518160405180806020018373ffffffffffffffffffffffffffffffffffffffff16815260200180602001838103835260018152602001807f6100000000000000000000000000000000000000000000000000000000000000815260200150602001838103825260018152602001807f4100000000000000000000000000000000000000000000000000000000000000815260200150602001935050505060405180910390a17f68bb3a6d7ca311425ccc82019f497b99137435f96aede3bc346698513b971def8173ffffffffffffffffffffffffffffffffffffffff16632dfeb2b7604051817c01000000000000000000000000000000000000000000000000000000000281526004018090506020604051808303816000876161da5a03f11561000257505050604051805190602001506040518080602001838152602001828103825260098152602001807f736576656e7465656e00000000000000000000000000000000000000000000008152602001506020019250505060405180910390a15b50600a806102486000396000f3606060405260658060106000396000f360606040526000357c0100000000000000000000000000000000000000000000000000000000900480632dfeb2b7146037576035565b005b604260048050506058565b6040518082815260200191505060405180910390f35b6000601190506062565b905660606040526008565b00';

var abiB = JSON.parse("[{\"inputs\":[],\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"name\":\"name\",\"type\":\"string\"},{\"indexed\":false,\"name\":\"number\",\"type\":\"uint256\"}],\"name\":\"exportNumber\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"name\":\"name\",\"type\":\"string\"},{\"indexed\":false,\"name\":\"addr\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"className\",\"type\":\"string\"}],\"name\":\"exportObject\",\"type\":\"event\"}]\n");
var abiA = JSON.parse("[{\"constant\":true,\"inputs\":[],\"name\":\"giveMeSEVENTEEN\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"type\":\"function\"}]\n");

var logtranslator = new LogTranslator(abiB);

var constantsMap = {};
abiA.filter(json => json.type !== 'constructor').forEach(json => {
  var name = utils.transformToFullName(json);
  constantsMap[sha3(name).slice(0,8)] = json.constant;
});


code = new Buffer(code, 'hex')

vm.on('step', function (data) {
  console.log(data.opcode.name)
})

vm.runCode({
  code: code,
  gasLimit: new Buffer('ffffffff', 'hex'),
  caller: new Buffer('1cd078a536aeacd1ec1bfd88e719c2fb692be578', 'hex'),
  constantsMap: constantsMap
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
  // console.log(logs);
  console.log(llogs.map(log => `${log.event}(${_.map(log.args, (v, k) => {return k + ' ' + v}).join(', ')})`));
  // console.log(JSON.stringify(results, false, 2));
  // console.log(err)
})
