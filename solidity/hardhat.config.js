require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require('dotenv').config();
require('hardhat-contract-sizer');

const {
  ALCHEMY_API_POLYGON_TEST,
  ALCHEMY_API_ETH_TEST,
  PRIVATE_KEY,
  ETHERSCAN_API,
  POLYGONSCAN_API
} = process.env;

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  solidity: {
    version: "0.8.10",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100 // results in about 30%~40% reduction in size?
      }
    }
  },
  contractSizer: {
    alphaSort: true,
    // disambiguatePaths: false,
    runOnCompile: true,
    // strict: true,
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    mumbai: { // polygon testnet; a good faucet: https://faucet.polygon.technology/
      url: ALCHEMY_API_POLYGON_TEST,
      accounts: [PRIVATE_KEY]
    },
    // polygon: {
    //   url: "https://polygon-rpc.com/",
    //   accounts: [PRIVATE_KEY]
    // },
    rinkeby: { // etherium testnet; a good faucet: https://faucets.chain.link/rinkeby
      url: ALCHEMY_API_ETH_TEST, // alchemy api key
      accounts: [PRIVATE_KEY], // Top Secret!!
    },
  },
  etherscan: {
    apiKey: {
         //ethereum
         mainnet: "ETHERSCAN_API_KEY",
         rinkeby: ETHERSCAN_API,
         //polygon
         polygon: "POLYGONSCAN_API_KEY",
         polygonMumbai: POLYGONSCAN_API
    }
  },
};
