// For interactive use:
// npx hardhat node
// AND:
// npx hardhat run scripts/run.js
const { utils } = require("ethers");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const main = async () => {
  const synthContractFactory = await hre.ethers.getContractFactory('SynthChan');
  const synthContract = await synthContractFactory.deploy();
  await synthContract.deployed();
  console.log("Contract deployed to:", synthContract.address);

  let txn;
  // Mint 2 NFTs w/ 0.1 ether
  txn = await synthContract.mintSynth([{
      name: 'name1',
      imageURI: 'ipfs://imageURI1',
      hp: 100,
      maxHp: 120,
      attackDamage: 30
    },{
      name: 'name2',
      imageURI: 'ipfs://imageURI2',
      hp: 1001,
      maxHp: 1201,
      attackDamage: 301
    }], { value: utils.parseEther('0.1') });
  await txn.wait();

  txn = await synthContract.timestamp();
  console.log('yo!!', txn);
  await sleep(10000);
  txn = await synthContract.timestamp();
  console.log('yo!!', txn);
  await sleep(10000);
    txn = await synthContract.mintSynth([{
      name: 'name1',
      imageURI: 'ipfs://imageURI1',
      hp: 100,
      maxHp: 120,
      attackDamage: 30
    },{
      name: 'name2',
      imageURI: 'ipfs://imageURI2',
      hp: 1001,
      maxHp: 1201,
      attackDamage: 301
    }], { value: utils.parseEther('0.1') });
  await txn.wait();
  txn = await synthContract.timestamp();
  console.log('yo!!', txn);
  await sleep(10000);
};

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
