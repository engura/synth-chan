# Synth NFTs and their web3 App

### Helpful getting-started commands to try w/ hardhat
```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat run scripts/___.js
npx hardhat test
npx hardhat node
npx hardhat help
```

### Interactive debugging/running localhost blockchain
```shell
npx hardhat node                                   # runs the server in foreground && shows test wallet accounts
npx hardhat run --network localhost scripts/run.js # or whatever deploy script you like
npx hardhat console --network localhost            # jumps into interactive console with ethers already included
```

#### Tips:
* https://docs.openzeppelin.com/learn/deploying-and-interacting
* [dev.to tutorial](https://dev.to/dabit3/the-complete-guide-to-full-stack-web3-development-4g74): covers writing tests, local interactive debug, and a basic web3 app on localhost to interact w/ metamask
* It’s important that we explicitly set the `--network` for Hardhat to connect our console session to. If we don’t, Hardhat will default to using a new ephemeral network, which our Box contract wouldn’t be deployed to.
* use `await` to avoid Promise objects.
* `.toString()` helps you to display uint256 numbers (which are too big for JS).

```shell
# hook in to the contract:
const Token = await ethers.getContractFactory("SynthChan")
# if we already know an address for previously deployed contract, can just attach to it:
const contract = await Token.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3")
# OR... we can just do a fresh .deploy()?
const contract = await Token.deploy()
await contract.transfer("0xdd2fd4581271e230360230f9337d5c0430bf44c0", 42069)
# .balanceOf(wallet_address) is for checking how many NFTs an address has, NOT eth
(await contract.balanceOf("0xdd2fd4581271e230360230f9337d5c0430bf44c0")).toString()
# check the eth balance of the contract owner:
const [owner, person1, person2] = await ethers.getSigners();
await owner.getBalance()
await person1.getBalance()

# useful list of available methods: https://docs.ethers.io/v5/api/contract/contract/
# executing methods from some other user's perspective and giving them some ether to send to a payable transaction
let override = { value: ethers.utils.parseEther('0.5') }
await contract.connect(person1).mintSynth([1, 2], [['one', 'two'], ['three', 'four']], override)
```

### Contract Deployment & Verification
* valid `--network` args are set up && configured in `hardhat.config.js`
* need to get appropriate API keys from [Alchemy](https://dashboard.alchemyapi.io/) for deployment and
* [etherscan](https://etherscan.io/apis) for eth / [polygonscan](https://polygonscan.com/apis) for polygon, etc: to verify contract
```shell
npx hardhat clean
npx hardhat run scripts/deploy___.js --network mumbai
# It will show something like ...Contract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3...
# use that address as the CONTRACT_ADDR:
npx hardhat verify CONTRACT_ADDR --network mumbai  # OR:
npx hardhat verify --network rinkeby CONTRACT_ADDR "CONSTRUCTOR_ARG"
```

### Contributing
After modifications are made, need to run tests and the linter:
```shell
npx hardhat test           # https://docs.openzeppelin.com/learn/writing-automated-tests
solhint contracts/**.*.sol # https://protofire.github.io/solhint/
```

### Descriptions
#### Collection Description Template
Soon...

#### Individual NFT Template
This is __$lastName $firstName__-chan, created autonomously by several interconnected AI (deep-learning machine learning models). The image was not modified, retouched, or guided in any way by a human other than by providing an initial guiding phrase: _"$guidingPhrase"_. [Check out the details](https://sample.com) about the steps required to create each unique artwork!

About the NFT:
 * **The image** itself is stored on IPFS:decentralized and permanent storage. It cannot be modified, destroyed, and is safe from any single company going out of business.
 * **The metadata**: this description and other stats are stored on-chain, which also ensures security from destruction via decentralization. The metadata are coded in a custom smart contract that allows them to evolve over time. Some are immutable: such as the name, or the primary color scheme of the painting. Others can be changed only by the NFT owner at their discretion (such as the custom message that can be overlayed on the pic). Over time, additional metadata attributes can also be added to expand the NFT's utility.

What do I actually get by investing in this project? [Detailed Answer](https://sample.com)
 * Ownership of the original image itself, permanently stored at ipfs://$ipfsLink.
 * Associated owner's rights under the International Copyright Law. Feel free to do whatever you like with it!
 * Access to NFT-Owner only functions of the underlying smart contract.
 * The NFT itself is a pass to our exclusive, growing [community](https://sample.com) for exploring intersections of modern art and AI/machine learning.
 * Show support for emerging artforms and novel ways to interact with them!

This painting is proudly owned by $address! Copyright © $year
