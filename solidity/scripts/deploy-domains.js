const main = async () => {
  // The first return is the deployer/contract owner, the second is just a random account
  const [owner, randomPerson] = await hre.ethers.getSigners();
  const domainContractFactory = await hre.ethers.getContractFactory('Domains');
  const domainContract = await domainContractFactory.deploy('synth');
  await domainContract.deployed();
  console.log("Contract deployed to:", domainContract.address);
  console.log("Contract deployed by:", owner.address);
  // const test_domain = 'wave'

  // let txn = await domainContract.register(test_domain, {value: hre.ethers.utils.parseEther('0.4')});
  // await txn.wait();

  // txn = await domainContract.setRecord(test_domain, "https://newsovietwave.com");
  // await txn.wait();
  // console.log("Set record for ", test_domain);

  // const domainAddress = await domainContract.getDomOwnerAddress(test_domain);
  // console.log('Owner of', test_domain, ':', domainAddress);

  // const balance = await hre.ethers.provider.getBalance(domainContract.address);
  // console.log("Contract balance:", hre.ethers.utils.formatEther(balance));
}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
