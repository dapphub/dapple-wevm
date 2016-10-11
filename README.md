# SYNOPSIS
This is a direct fork of [ethereumjs-vm](https://github.com/ethereumjs/ethereumjs-vm) with a few
(significant) modifications.

This repository is a Proof-of-Concept for a wallet side EVM execution(**WEVM**),
which brings several use cases which I want to explore in this POC project.
Possible use cases could be:
* [Solidity based Deployment-Scripting](#Deployment-Scripting)
* [(Server side) Sidechain](#Sidechain)



##Deployment-scripting
### Why
* no context switching between development, testing or interacting

### Features
* full solidity features
* dapples unit testing and integration testing

### Example
Considder the setup of the following `OnBlockchain` Contract:
```
contract OnBlockchain {
  event owner(address owner);
  function OnBlockchain(bytes construcorrr) {
    owner(msg.sender);
    // hahaha
  }
  function giveMeTHIRTYTWO() constant returns (uint) {
    return 32;
  }
  function giveMeSEVENTEEN(uint integer) returns (uint) {
    return 17;
  }
  function giveMeFOUR() returns (uint) {
    return 4;
  }
}
```

```
contract B is Script {
  function B() {

    // deploys a new contract
    OnBlockchain a = new OnBlockchain("123");

    // export the contract address as variable "varname". Its class
    // is automatically inferred
    exportObject("varname", a);

    // as the function giveMeTHIRTYTWO is constant, the function call
    // triggers a call and retrieve a value and export it as the variable
    // name "thirtytwo"
    exportNumber("thirtytwo", a.giveMeTHIRTYTWO());

    // The function giveMeSEVENTEEN is not static, therefore
    // a transaction is triggered. However a return value
    // can be still retrieved and exported (currently not working)
    exportNumber("seventeen_nonstatic", a.giveMeSEVENTEEN(2));

    // If one want to retrieve a return value from a function
    // without triggering a transaction, this can be done either by
    // setting the call flag to true:
    setCalls(true);
    exportNumber("seventeen", a.giveMeSEVENTEEN(3));
    setCalls(false);

    // or exporting the the static calls into a function:
    staticStuff(b);

    // sets the address which triggers the transaction
    setOrigin(0x6deec6383397044107be3a74a6d50d41901f0356);

    // this contract will have 0x6d... as its creator
    OnBlockchain b = new OnBlockchain("123");

    // Interacting with the default server environment is also supported
    // In order for this to work, curl and jq need to be installed
    uint BTC_USD = SH.to_uint("curl -s https://api.coindesk.com/v1/bpi/currentprice.json|jq '.bpi.USD.rate|tonumber|floor'");
    exportNumber("btc_usd", BTC_USD);

    // one can think of different integrations/ apis, which can be provided by
    // dapple with this approach
  }

  // the static flag indicates, that all transactions in this function will be
  // treated as static calls rather then generating a transaction
  function staticStuff(OnBlockchain a) static {
    exportNumber("four", a.giveMeFOUR());
  }
}
```

This is producing the following output:
```
NEW   new OnBlockchain(0x313233)
TXR   OnBlockchain(0xac5fce7ae0051acf4dcd81a64523da41e59cc7a5).giveMeSEVENTEEN(2)
ACC   switch origin to 0x6deec6383397044107be3a74a6d50d41901f0356
NEW   new OnBlockchain(0x313233)


exportObject(name a, addr 0xac5fce7ae0051acf4dcd81a64523da41e59cc7a5, class OnBlockchain)
exportNumber(name thirtytwo, number 32)
exportNumber(name seventeen_nonstatic, number 1.13526946735478465913037617028159547472529646787646290075579373593588249133056e+77)
exportNumber(name seventeen, number 17)
exportNumber(name four, number 4)
exportNumber(name btc_usd, number 678)
```

##Sidechain
A sidechain running on Dapphub/ Controlled servers can be used to directly
interact with ethereum and dapple.
E.g. centralized callbacks can be deployed which are triggered by on
blockchain events.
external Plugins/ Packages/ Services can be easilly implemented and provided
through a standard dapphub api.
```

    Contract c = new Contract();
    Event(c).on("Trade", "sale");
    ...
  }

  function callback(address sender, string name, uint ammount) on("sale") {
    sms.msg(me, "Got request, sold ${name} for ${ammount}");
  }


```


### Development

WEVM related stuff is located in `./src/`. Also ethereumjs-vm's code was modified.
To test it for yourself run `testrpc` in the background and:
```
cd src
node index.js
```
