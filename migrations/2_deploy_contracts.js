const EHR = artifacts.require("../contracts/EHR.sol");

module.exports = function(deployer) {

  deployer.deploy(EHR);

};
