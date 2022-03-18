const { expect } = require("chai");
const { ethers } = require("hardhat");

// list of available matchers: https://ethereum-waffle.readthedocs.io/en/latest/matchers.html
// We need to cast to strings to compare the 256 bit integers
// expect((await this.flexAttr.getNumericVal()).toString()).to.equal('42');
describe('SynthChan', function () {
  // Use large integers ('big numbers')
  // const value = new BN('42');

  let owner, person1, person2;
  let contract, override;
  const nftId = 5;
  let traits = [];
  const collectionChunks = ['collection name', 'detailed description', 'https://url.com', 'https://link.io'];
  const imgChunks = [
    '<svg>stroke:',';stroke:',';stroke:',';stroke:',';stroke:',
    ';<image href="https://','.ipfs.nftstorage.link" height="100%" width="100%"/><text>','</text></svg>'
  ];
  const descrChunks = ['This is __','__-chan! _"','"_. @ ipfs://',' owned by ','! Copyright © '];
  const validNftIds = [5, 1, 2];
  const validNftMeta = [
    ["Kihara","Masaki","dark","gray","thistle","dark melodious sky","bright future in space","bafybeigslulqatvcbgkjhpzncm3rri4www3z45wegqrqqlfcx6ltytr4me","#696969","#808080","#d8bfd8","#6a5acd","#191970"],
    ["Yanagawa","Ayumu","gainsboro","midnight-blue","sky-blue","slate-gray metrical light","bright future in space","bafybeiayncsfbwoymn6nkghz2lgfxhiolut6rdk5q2snh4lq566tt6j3jq","#dcdcdc","#191970","#87ceeb","#6495ed","#708090"],
    ["Tsuchimoto","Shinobu","rosy-brown","black","thistle","dark scissor plate","bright future in space","bafybeig53gwks5jv35agrqcnc4ykhofyf4gyaqkjtfr74ilwd6m46bp5u4","#bc8f8f","#000000","#d8bfd8","#696969","#f5deb3"]
  ];
  const validSigIds = [0, 1, 2, 3, 4, 5];
  const validSigs = [
    "0x0000000000000000000000000000000000000000000000000000000000000000", // this is the default, empty signature of a minted NFT
    "0x66f49e2fea7ebdcdb4f4163c7e51d8e98b8ab713f1961186b3c3e860a056dac8",
    "0x71277f3c3343d7405bba6a6722692f47063114e03f0eba0125be6bd2f99fab63",
    "0x0f1f96afb6ab0b0bf9f4a4a977ef2d0b8a6d5fcbe2a121043018e27a00e09f07",
    "0xcb50c181243cc44c90f4d9de01ff9f10a287382685b8d135f4c7a1d6e3e6f6d7",
    "0xc1dc6823176f7474fbe6da124d4277025558b1f0792e48bc96a971779d53a758"
  ];


  before(async function () {
    // run something before all the tests?
  });


  beforeEach(async function () {
    [ owner, person1, person2 ] = await ethers.getSigners();
    traits = [
      'Last Name','First Name','Primary Color','Secondary Color','Accent Color',
      'Daydreaming of...','theme', 'ipfs','color1','color2','color3','color4','color5', 'minted_at', 'message'
    ];
    override = { value: ethers.utils.parseEther('0.01') };
    const Token = await ethers.getContractFactory("SynthChan");
    contract = await Token.deploy();
    await contract.setTraits(traits);
    await contract.fillMinted(validSigIds, validSigs);
    await contract.setInfo(0, collectionChunks);
    await contract.setInfo(1, imgChunks);
    await contract.setInfo(2, descrChunks);
    await contract.setInfo(2, descrChunks);
    await contract.setCost(ethers.utils.parseEther('0.01'), 5, 1000);
  });


  it("should allow only Owner to add unique Traits and revert on duplicate names", async function () {
    const result = await contract.addTrait('test');
    expect(result).to.be.not.null;
    expect(contract.addTrait('test')).to.be.revertedWith('NotUnique("test")');
    expect(contract.connect(person1).addTrait('sneaky_test')).to.be.revertedWith('Ownable: caller is not the owner');
  });


  it("should allow only Owner to be able to remove Traits", async function () {
    const result = await contract.rmTrait('ipfs');
    expect(result).to.be.not.null;
    expect(contract.rmTrait('ipfs')).to.be.revertedWith('DNE');
    expect(contract.connect(person1).rmTrait('theme')).to.be.revertedWith('Ownable: caller is not the owner');
  });


  it("should mint NFT with valid metadata", async function () {
    const price = ethers.utils.parseEther('0.1');
    const contractBalance = await contract.getBalance();
    const person1Balance = await person1.getBalance();
    override = { value: price };

    // an UNminted NFT should have its fingerprint stored and can be checked with checkMinted():
    expect(await contract.checkMinted(5)).to.equal(validSigs[5]);
    const res = await contract.connect(person1).mintSynth(validNftIds, validNftMeta, override);
    // an minted NFT should have its fingerprint cleared:
    expect(await contract.checkMinted(5)).to.equal(validSigs[0]);

    // make sure the funds got transferred properly
    // both are BigInt; can be compared for equality natively
    expect(await contract.getBalance()).to.equal(contractBalance + price);
    // BigInt can't be compared using > <, so need to cast to a regular Number()
    // (the person1's balance is less than the price due to the gas costs they had to pay)
    expect(Number(await person1.getBalance())).to.be.lt(Number(person1Balance - price));
    // and person1 has to have 3 NFTs now.
    expect(Number(await contract.balanceOf(person1.address))).to.equal(3);
  });


  it("should revert on double-minting an NFT", async function () {
    override = { value: ethers.utils.parseEther('0.1') };
    await contract.connect(person1).mintSynth(validNftIds, validNftMeta, override);
    // person1 has to have 3 NFTs now.
    expect(Number(await contract.balanceOf(person1.address))).to.equal(3);

    const person1Balance = await person1.getBalance();
    expect(
      contract.connect(person1).mintSynth(validNftIds, validNftMeta, override)
    ).to.be.revertedWith("e06");
    // person1 should not be charged anything for the reverting transaction
    expect(await person1.getBalance()).to.equal(person1Balance);
  });


  it("should revert on minting an NFT with invalid metadata", async function () {
    expect(
      contract.connect(person1).mintSynth([5], [['1', '2', '3', '4', '5', '6', '7', '8']], override)
    // ).to.be.reverted; // -- can use this if we don't care about comparing the error message
    ).to.be.revertedWith("e06");
  });


  it("should return an Attribute object when trying to get the value of a valid Attribute", async function () {
    const res = await contract.connect(person1).mintSynth([validNftIds[0]], [validNftMeta[0]], override); // mint NFT#5

    // of an existing NFT:
    let attr = await contract.getAttribute(5, 'ipfs');
    // [
    //   0, false, false, BigInt(0), BigInt(0), '', 'dispType': 0, 'nftOwnerEditable': false, 'display': false,
    //   'value': BigInt(10), 'maxValue': BigInt(10), 'strValue': ''
    // ]
    expect(attr.strValue).to.equal('bafybeigslulqatvcbgkjhpzncm3rri4www3z45wegqrqqlfcx6ltytr4me');
    // of an non-existing NFT (maybe not minted yet?)
    attr = await contract.getAttribute(99, 'ipfs');
    expect(attr.strValue).to.equal('');
  });


  it("should update a String Attribute by Owner", async function () {
    let res = await contract.connect(person1).mintSynth([validNftIds[0]], [validNftMeta[0]], override); // mint NFT#5

    // expect revert on non-existent
    expect(contract.setStrAttribute(nftId, 'dne', 'whatev', true)).to.be.revertedWith("DNE");

    // allow the Owner to update Attributes
    res = await contract.setStrAttribute(nftId, 'ipfs', '0x12345678', true);
    let attr = await contract.getAttribute(nftId, 'ipfs');
    expect(res).to.be.not.null;
    expect(attr.strValue).to.equal('0x12345678');
  });

  it("should update a Numeric Attribute by Owner", async function () {
    let res = await contract.connect(person1).mintSynth([validNftIds[0]], [validNftMeta[0]], override); // mint NFT#5

    // expect revert on non-existent
    expect(contract.setIntAttribute(nftId, 'test', 2, 42, true)).to.be.revertedWith("DNE");
    res = await contract.addTrait('test');

    // allow the Owner to update Attributes
    res = await contract.setIntAttribute(nftId, 'test', 2, 42, true);
    let attr = await contract.getAttribute(nftId, 'test');
    expect(res).to.be.not.null;
    expect(Number(attr.value)).to.equal(42);
    expect(Number(attr.maxValue)).to.equal(0);
  });

  it("should update a Gauge (numeric) Attribute by Owner", async function () {
    let res = await contract.connect(person1).mintSynth([validNftIds[0]], [validNftMeta[0]], override); // mint NFT#5

    // expect revert on non-existent
    expect(contract.setGaugeAttribute(nftId, 'test', 2, 10, 42, true)).to.be.revertedWith("DNE");
    res = await contract.addTrait('test');

    // cannot set a value (42) bigger than maxValue (10)
    expect(contract.setGaugeAttribute(nftId, 'test', 2, 42, 10, true)).to.be.revertedWith("BadValue");
    // allow the Owner to update Attributes
    res = await contract.setGaugeAttribute(nftId, 'test', 2, 10, 42, true);
    await res.wait(); // wait until mined
    let attr = await contract.getAttribute(nftId, 'test');
    expect(res).to.be.not.null;
    expect(Number(attr.value)).to.equal(10);
    expect(Number(attr.maxValue)).to.equal(42);
  });


  // I think it's ok to test this functionality only on the .setStrAttribute() instead of all of them
  // because they (.setIntAttribute() and .setGaugeAttribute()) have the same modifier applied to them.
  it("should update an Attribute by NFT-Owner only if permission is set", async function () {
    let res = await contract.connect(person1).mintSynth([validNftIds[0]], [validNftMeta[0]], override); // mint NFT#5

    await contract.toggleOwnerEditable(nftId, 'ipfs');
    // and now, it should allow person1 to update the Attribute!
    res = await contract.connect(person1).setStrAttribute(nftId, 'ipfs', '0x87654321', true);
    attr = await contract.getAttribute(nftId, 'ipfs');
    expect(attr.strValue).to.equal('0x87654321');

    // a random person who is not Owner nor NFT-Owner, shouldn't be able to update Attributes
    expect(contract.connect(person2).setStrAttribute(nftId, 'ipfs', '0x12345678', true))
      .to.be.revertedWith('e01');

    await contract.toggleOwnerEditable(nftId, 'ipfs');
    // and now, it's blocked again:
    expect(contract.connect(person1).setStrAttribute(nftId, 'ipfs', '0x12345678', true))
      .to.be.revertedWith('e01');
  });


  it("should revert on trying to get the value of a non-existing Attribute", async function () {
    const res = await contract.connect(person1).mintSynth([validNftIds[0]], [validNftMeta[0]], override); // mint NFT#5
    expect(contract.getAttribute(5, 'dne')).to.be.revertedWith("DNE");
  });


  it("should generate properly base64 encoded TokenURIs taking toggleDisplay() into account", async function () {
    const base64Encoded = 'data:application/json;base64,eyduYW1lJzonS2loYXJhIE1hc2FraScsICdkZXNjcmlwdGlvbic6J1RoaXMgaXMgX19LaWhhcmEgTWFzYWtpX18tY2hhbiEgXyJicmlnaHQgZnV0dXJlIGluIHNwYWNlIl8uIEAgaXBmczovL2JhZnliZWlnc2x1bHFhdHZjYmdramhwem5jbTNycmk0d3d3M3o0NXdlZ3FycXFsZmN4Nmx0eXRyNG1lIG93bmVkIGJ5IDB4NzA5OTc5NzBjNTE4MTJkYzNhMDEwYzdkMDFiNTBlMGQxN2RjNzljOCEgQ29weXJpZ2h0IMKpIDIwMjInLCAnaW1hZ2UnOidkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBITjJaejV6ZEhKdmEyVTZJelk1TmprMk9UdHpkSEp2YTJVNkl6Z3dPREE0TUR0emRISnZhMlU2STJRNFltWmtPRHR6ZEhKdmEyVTZJelpoTldGalpEdHpkSEp2YTJVNkl6RTVNVGszTURzOGFXMWhaMlVnYUhKbFpqMGlhSFIwY0hNNkx5OWlZV1o1WW1WcFozTnNkV3h4WVhSMlkySm5hMnBvY0hwdVkyMHpjbkpwTkhkM2R6TjZORFYzWldkeGNuRnhiR1pqZURac2RIbDBjalJ0WlM1cGNHWnpMbTVtZEhOMGIzSmhaMlV1YkdsdWF5SWdhR1ZwWjJoMFBTSXhNREFsSWlCM2FXUjBhRDBpTVRBd0pTSXZQangwWlhoMFBqd3ZkR1Y0ZEQ0OEwzTjJaejQ9JywgJ2F0dHJpYnV0ZXMnOlt7J3RyYWl0X3R5cGUnOidMYXN0IE5hbWUnLCd2YWx1ZSc6J0tpaGFyYSd9LHsndHJhaXRfdHlwZSc6J0ZpcnN0IE5hbWUnLCd2YWx1ZSc6J01hc2FraSd9LHsndHJhaXRfdHlwZSc6J1ByaW1hcnkgQ29sb3InLCd2YWx1ZSc6J2RhcmsnfSx7J3RyYWl0X3R5cGUnOidTZWNvbmRhcnkgQ29sb3InLCd2YWx1ZSc6J2dyYXknfSx7J3RyYWl0X3R5cGUnOidBY2NlbnQgQ29sb3InLCd2YWx1ZSc6J3RoaXN0bGUnfSxdfQ==';
    const base64Modified = 'data:application/json;base64,eyduYW1lJzonS2loYXJhIE1hc2FraScsICdkZXNjcmlwdGlvbic6J1RoaXMgaXMgX19LaWhhcmEgTWFzYWtpX18tY2hhbiEgXyJicmlnaHQgZnV0dXJlIGluIHNwYWNlIl8uIEAgaXBmczovL2JhZnliZWlnc2x1bHFhdHZjYmdramhwem5jbTNycmk0d3d3M3o0NXdlZ3FycXFsZmN4Nmx0eXRyNG1lIG93bmVkIGJ5IDB4NzA5OTc5NzBjNTE4MTJkYzNhMDEwYzdkMDFiNTBlMGQxN2RjNzljOCEgQ29weXJpZ2h0IMKpIDIwMjInLCAnaW1hZ2UnOidkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBITjJaejV6ZEhKdmEyVTZJelk1TmprMk9UdHpkSEp2YTJVNkl6Z3dPREE0TUR0emRISnZhMlU2STJRNFltWmtPRHR6ZEhKdmEyVTZJelpoTldGalpEdHpkSEp2YTJVNkl6RTVNVGszTURzOGFXMWhaMlVnYUhKbFpqMGlhSFIwY0hNNkx5OWlZV1o1WW1WcFozTnNkV3h4WVhSMlkySm5hMnBvY0hwdVkyMHpjbkpwTkhkM2R6TjZORFYzWldkeGNuRnhiR1pqZURac2RIbDBjalJ0WlM1cGNHWnpMbTVtZEhOMGIzSmhaMlV1YkdsdWF5SWdhR1ZwWjJoMFBTSXhNREFsSWlCM2FXUjBhRDBpTVRBd0pTSXZQangwWlhoMFBqd3ZkR1Y0ZEQ0OEwzTjJaejQ9JywgJ2F0dHJpYnV0ZXMnOlt7J3RyYWl0X3R5cGUnOidGaXJzdCBOYW1lJywndmFsdWUnOidNYXNha2knfSx7J3RyYWl0X3R5cGUnOidQcmltYXJ5IENvbG9yJywndmFsdWUnOidkYXJrJ30seyd0cmFpdF90eXBlJzonU2Vjb25kYXJ5IENvbG9yJywndmFsdWUnOidncmF5J30seyd0cmFpdF90eXBlJzonQWNjZW50IENvbG9yJywndmFsdWUnOid0aGlzdGxlJ30seyd0cmFpdF90eXBlJzonaXBmcycsJ3ZhbHVlJzonYmFmeWJlaWdzbHVscWF0dmNiZ2tqaHB6bmNtM3JyaTR3d3czejQ1d2VncXJxcWxmY3g2bHR5dHI0bWUnfSxdfQ==';
    let res = await contract.connect(person1).mintSynth([validNftIds[0]], [validNftMeta[0]], override); // mint NFT#5
    expect(await contract.tokenURI(nftId)).to.equal(base64Encoded);

    res = await contract.toggleDisplay(nftId, 'ipfs');
    res = await contract.toggleDisplay(nftId, 'Last Name');
    await res.wait(); // wait until mined
    expect(await contract.tokenURI(nftId)).to.equal(base64Modified);

    // only Owner can toggle Attribute display
    expect(contract.connect(person1).toggleDisplay(nftId, 'ipfs')).to.be.revertedWith('Ownable: caller is not the owner');
  });


  it("should generate properly base64 encoded contractURI", async function () {
    const base64Encoded = 'data:application/json;base64,eyduYW1lJzonY29sbGVjdGlvbiBuYW1lJywnZGVzY3JpcHRpb24nOidkZXRhaWxlZCBkZXNjcmlwdGlvbicsJ2ltYWdlJzonaHR0cHM6Ly91cmwuY29tJywnZXh0ZXJuYWxfbGluayc6J2h0dHBzOi8vbGluay5pbycsJ3NlbGxlcl9mZWVfYmFzaXNfcG9pbnRzJzoxMDAwLCAnZmVlX3JlY2lwaWVudCc6JzB4ZjM5ZmQ2ZTUxYWFkODhmNmY0Y2U2YWI4ODI3Mjc5Y2ZmZmI5MjI2Nid9';
    expect(await contract.contractURI()).to.equal(base64Encoded);
  });


  it("should allow only NFT-owner to setMessage", async function () {
    let res = await contract.connect(person1).mintSynth([validNftIds[0]], [validNftMeta[0]], override);
    // a random person, even the contract Owner, cannot set a new Message on an NFT
    expect(contract.setMessage(nftId, 'aloha!')).to.be.revertedWith('e01');
    res = await contract.connect(person1).setMessage(nftId, 'aloha!');
    expect(res).to.be.not.null;
  });


  it("should not allow minting NFTs if the contract is paused", async function () {
    let res = await contract.pause(true);
    expect(
      contract.connect(person1).mintSynth([validNftIds[0]], [validNftMeta[0]], override)
    ).to.be.revertedWith('e00');
  });


  it("should allow minting promo NFTs (even if contract is paused)", async function () {
    let res = await contract.promoSynth(person1.address, validNftIds[1], validNftMeta[1]);
    res = await contract.pause(true);
    res = await contract.promoSynth(person2.address, validNftIds[0], validNftMeta[0]);

    expect(
      contract.connect(person1).promoSynth(person2.address, validNftIds[0], validNftMeta[0])
    ).to.be.revertedWith('Ownable: caller is not the owner');
    expect(Number(await contract.balanceOf(person1.address))).to.equal(1);
    expect(Number(await contract.balanceOf(person2.address))).to.equal(1);
  });


  it("should allow only Owner to withdraw funds from Contract", async function () {
    let price = ethers.utils.parseEther('0.2');
    override = { value: price };
    const contractBalance = await contract.getBalance();
    const ownerBalance = await owner.getBalance();
    await contract.connect(person1).mintSynth(validNftIds, validNftMeta, override);
    expect(
      contract.connect(person1).withdraw()
    ).to.be.revertedWith('Ownable: caller is not the owner');
    await contract.withdraw();
    expect(Number(await contract.getBalance())).to.equal(0);
    expect(await owner.getBalance()).to.be.gt(ownerBalance);
  });


  it("should allow only Owner to update royalty info", async function () {
    // after updating royalties, they should change in both .contractURI() and .royaltyInfo(nftId, salePrice)
    // .royaltyInfo(...) for a minted NFT cannot be updated, so any changed roalty data is only applied to newly minted NFTs.
    const contractURI1 = 'data:application/json;base64,eyduYW1lJzonY29sbGVjdGlvbiBuYW1lJywnZGVzY3JpcHRpb24nOidkZXRhaWxlZCBkZXNjcmlwdGlvbicsJ2ltYWdlJzonaHR0cHM6Ly91cmwuY29tJywnZXh0ZXJuYWxfbGluayc6J2h0dHBzOi8vbGluay5pbycsJ3NlbGxlcl9mZWVfYmFzaXNfcG9pbnRzJzoxMDAwLCAnZmVlX3JlY2lwaWVudCc6JzB4ZjM5ZmQ2ZTUxYWFkODhmNmY0Y2U2YWI4ODI3Mjc5Y2ZmZmI5MjI2Nid9';
    const contractURI2 = 'data:application/json;base64,eyduYW1lJzonY29sbGVjdGlvbiBuYW1lJywnZGVzY3JpcHRpb24nOidkZXRhaWxlZCBkZXNjcmlwdGlvbicsJ2ltYWdlJzonaHR0cHM6Ly91cmwuY29tJywnZXh0ZXJuYWxfbGluayc6J2h0dHBzOi8vbGluay5pbycsJ3NlbGxlcl9mZWVfYmFzaXNfcG9pbnRzJzoyMDAwLCAnZmVlX3JlY2lwaWVudCc6JzB4ZjM5ZmQ2ZTUxYWFkODhmNmY0Y2U2YWI4ODI3Mjc5Y2ZmZmI5MjI2Nid9';
    let res = await contract.connect(person1).mintSynth([validNftIds[0]], [validNftMeta[0]], override);
    res = await contract.royaltyInfo(5, 100);
    expect(await contract.contractURI()).to.equal(contractURI1);
    expect(Number(res.royaltyAmount)).to.equal(10);

    res = await contract.setCost(ethers.utils.parseEther('0.01'), 5, 2000);
    res = await contract.connect(person2).mintSynth([validNftIds[1]], [validNftMeta[1]], override);
    await res.wait(); // wait until mined

    res = await contract.royaltyInfo(1, 100);

    expect(await contract.contractURI()).to.equal(contractURI2);
    expect(res.receiver).to.equal(owner.address);
    expect(Number(res.royaltyAmount)).to.equal(20);
  });


  it("should show the tokens which a wallet owns", async function () {
    override = { value: ethers.utils.parseEther('0.1') };
    let res = await contract.connect(person1).mintSynth(validNftIds, validNftMeta, override);

    expect(JSON.stringify(await contract.connect(person1).tokensOfSender())).to.equal('[{"type":"BigNumber","hex":"0x05"},{"type":"BigNumber","hex":"0x01"},{"type":"BigNumber","hex":"0x02"}]');
    expect(JSON.stringify(await contract.connect(person2).tokensOfSender())).to.equal('[]');
  });
});
