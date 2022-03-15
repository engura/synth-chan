const main = async () => {
  // The first return is the deployer/contract owner, the second is just a random account
  const contractFactory = await hre.ethers.getContractFactory('SynthChan');
  const traits = [
    'Last Name','First Name','Primary Color','Secondary Color','Accent Color',
    'Daydreaming of...','theme', 'ipfs','color1','color2','color3','color4','color5', 'minted_at', 'message'
  ]

  const collectionChunks = ['collection name', 'detailed description', 'https://url.com', 'https://link.io', '123', '0x123456'];

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

await contract.fillMinted([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], ["0x66f49e2fea7ebdcdb4f4163c7e51d8e98b8ab713f1961186b3c3e860a056dac8", "0x71277f3c3343d7405bba6a6722692f47063114e03f0eba0125be6bd2f99fab63", "0x0f1f96afb6ab0b0bf9f4a4a977ef2d0b8a6d5fcbe2a121043018e27a00e09f07", "0xcb50c181243cc44c90f4d9de01ff9f10a287382685b8d135f4c7a1d6e3e6f6d7", "0xc1dc6823176f7474fbe6da124d4277025558b1f0792e48bc96a971779d53a758", "0x4c1ee5cf1c844b872c53d32eb46998aa1a485498ffc17cf470e8f905aaaf903c", "0x5e952695af34a21a4cddfe5931845081e0257c1774d94472847121e09aa195ec", "0x79b111dbe7964ef45c412ca62ea393bc159ead8ce08fc4f58c9f463422e61fce", "0x5ebaa947339f5717b1bf960f35a3650b087759d3e3bfc410dca62d7e99fdeb1b", "0xb2f431c7bb7d11fc54b8d85ad5a32bedaf511e0ac2e5c2148ff51ba1d986a3de"]);

  let t = await contract.getTraits();
  console.log(t);
  // now fill the minted array with appropriate new NFT signatures
  // await contract.fillMinted(nftIds, signatures);

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
