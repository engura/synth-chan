import fs from 'fs'

const main = async () => {
  // The first return is the deployer/contract owner, the second is just a random account
  const contractFactory = await hre.ethers.getContractFactory('SynthChan');
  const traits = [
    'Last Name','First Name','Primary Color','Secondary Color','Accent Color',
    'Daydreaming of...','theme', 'ipfs','color1','color2','color3','color4','color5', 'minted_at', 'message'
  ]

  const collectionChunks = ['collection name', 'detailed description', 'https://url.com', 'https://link.io'];

  const imgChunks = ['<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1024 1024" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"><style>@import url(https://fonts.googleapis.com/css?family=Open+Sans:800);.tl{font:8em/1 Open Sans,Arial;font-size:7em;}.tc{fill:none;stroke:white;stroke-dasharray:12% 24%;stroke-width:4px;animation:stroke-offset 9s infinite linear;}.tc:nth-child(1){stroke:',';stroke-dashoffset:8%;}.tc:nth-child(2){stroke:',';stroke-dashoffset:16%;}.tc:nth-child(3){stroke:',';stroke-dashoffset:24%;}.tc:nth-child(4){stroke:',';stroke-dashoffset:32%;}.tc:nth-child(5){stroke:',';stroke-dashoffset:48%;}@keyframes stroke-offset{50%{stroke-dashoffset:42%;stroke-dasharray:12% 64%;}}</style><image href="https://','.ipfs.nftstorage.link" height="100%" width="100%"/><symbol id="st"><text text-anchor="middle" x="50%" y="96%" class="tl">','</text></symbol><g><use xlink:href="#st" class="tc"></use><use xlink:href="#st" class="tc"></use><use xlink:href="#st" class="tc"></use><use xlink:href="#st" class="tc"></use><use xlink:href="#st" class="tc"></use></g></svg>'];

  const descrChunks = ['This is __','__-chan, created autonomously by several interconnected AI (deep-learning machine learning models). The image was not modified, retouched, or guided in any way by a human other than by providing an initial guiding phrase: _"','"_. [Check out the details](https://sample.com) about the steps required to create each unique artwork!\n\nAbout the NFT:\n * **The image** itself is stored on IPFS:decentralized and permanent storage. It cannot be modified, destroyed, and is safe from any single company going out of business.\n * **The metadata**: this description and other stats are stored on-chain, which also ensures security from destruction via decentralization. The metadata are coded in a custom smart contract that allows them to evolve over time. Some are immutable: such as the name, or the primary color scheme of the painting. Others can be changed only by the NFT owner at their discretion (such as the custom message that can be overlayed on the pic). Over time, additional metadata attributes can also be added to expand the NFT\'s utility.\n\nWhat do I actually get by investing in this project? [Detailed Answer](https://sample.com)\n * Ownership of the original image itself, permanently stored at ipfs://','.\n * Associated owner\'s rights under the International Copyright Law. Feel free to do whatever you like with it!\n * Access to NFT-Owner only functions of the underlying smart contract.\n * The NFT itself is a pass to our exclusive, growing [community](https://sample.com) for exploring intersections of modern art and AI/machine learning.\n * Show support for emerging artforms and novel ways to interact with them!\n\nThis painting is proudly owned by ','! Copyright © ']

  console.log('counting img chunks:', imgChunks.length);
  console.log('counting descr chunks:', descrChunks.length);
  const contract = await contractFactory.deploy();
  await contract.deployed();
  console.log("Contract deployed to:", contract.address);

  await contract.setTraits(traits);
  await contract.setInfo(0, collectionChunks);
  await contract.setInfo(1, imgChunks);
  await contract.setInfo(2, descrChunks);


  const file = '/home/vlad/Downloads/hybrid.daze/sr_art/20220201/metadata_signatures.json';
  const signatures = JSON.parse(fs.readFileSync(file));
  const step = 500;
  let idx = [];
  let hash = [];
  for(let i in signatures) {
    idx.push(i);
    hash.push(signatures[i]);
    if(i % step == 0) {
      console.log(idx, hash);
      await contract.fillMinted(idx, hash);
      idx = [];
      hash = [];
    }
    // if(i > 123) break;
  }
  if(idx) { console.log(idx, hash); await contract.fillMinted(idx, hash); }

  // Retrieve accounts from the local node:
  // const accounts = await ethers.provider.listAccounts();
  // console.log(accounts);
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
