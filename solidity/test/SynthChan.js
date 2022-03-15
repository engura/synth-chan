const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

describe("SynthChan", function () { //[ owner, other ]
  before(async function () {
    this.Attributes = await ethers.getContractFactory('Box');
  });

  beforeEach(async function () {
    this.flexAttr = await this.Attributes.deploy(['first string', 'numeric', 'string attr', 'numeric2', 'datetime']);
    await this.flexAttr.deployed();
  });

  it("Should return the new greeting once it's changed", async function () {
    // We need to cast to strings to compare the 256 bit integers
    // expect((await this.flexAttr.getNumericVal()).toString()).to.equal('42');

    // const setGreetingTx = await greeter.setGreeting("Hola, mundo!");
    // wait until the transaction is mined
    // await setGreetingTx.wait();
    expect((await this.flexAttr.showTraitTypes().toString()).to.equal('something'));
  });
});

token.addTrait('test')
await token.getTraits()
[ '', 'synth', 'numeric', 'string attr', 'datetime', 'test' ]
await token.rmTrait('string attr')
await token.getTraits()

await token.addTrait('test') // expect `revert`! (because not unique)

await token.getAttribute(1, 'dne') // expect revert
await token.getAttribute(99, 'synth') // unexistant NFT(99) tries to get a valid Trait... expect: returns default trait value
await token.jsonAttributes(99) // unexistant nft get attributes... expect: empty string

await token.addStrAttribute(1, 'synth', 'aloha', true) // ok
await token.getAttribute(1, 'synth')
[
  1,
  false,
  false,
  BigNumber { value: "0" },
  BigNumber { value: "0" },
  'aloha',
  dispType: 1,
  nftOwnerEditable: false,
  display: false,
  value: BigNumber { value: "0" },
  maxValue: BigNumber { value: "0" },
  strValue: 'aloha'
]

await token.addStrAttribute(1, 'dne', 'whatev', true) // expect revert on non-existent
await token.addIntAttribute(1, 'dne', 2, 4, true) // expect revert on non-existent
await token.addGaugeAttribute(1, 'dne', 2, 4, 5, true) // expect revert on non-existent
await token.addGaugeAttribute(1, 'dne', 2, 6, 4, true) // expect revert bad value (value > max_value)

await token.addGaugeAttribute(1, 'numeric', 2, 4, 5, true) // ok
await token.addIntAttribute(1, 'numeric', 2, 10, true) // expect revert bad value (10 > 5)
await token.addIntAttribute(1, 'datetime', 3, 12345000, true) // ok
await token.jsonAttributes(1)
' { "trait_type": "synth", "value": "aloha" }, { "display_type": "number", "trait_type": "numeric", "value": 4, "maxValue": 5 }, { "display_type": "date", "trait_type": "datetime", "value": 12345000 },'

await token.toggleDisplay(1, 'numeric')
value: 1 or 0;
await token.jsonAttributes(1)
' { "trait_type": "synth", "value": "aloha" }, { "display_type": "date", "trait_type": "datetime", "value": 12345000 },'

await token.rmTrait('datetime')
await token.jsonAttributes(1)
' { "trait_type": "synth", "value": "aloha" },'

await token.toggleOwnerEditable(1, 'numeric')
v: 1 or 0;


await contract.setInfo(0, ['name', 'description', 'https://url.com', 'https://link.io', '123', '0x123456'])

await contract.contractURI()
'data:application/json;base64,eyAibmFtZSI6ICJuYW1lIiwiZGVzY3JpcHRpb24iOiAiZGVzY3JpcHRpb24iLCJpbWFnZSI6ICJodHRwczovL3VybC5jb20iLCJleHRlcm5hbF9saW5rIjogImh0dHBzOi8vbGluay5pbyIsInNlbGxlcl9mZWVfYmFzaXNfcG9pbnRzIjogMTIzLCAiZmVlX3JlY2lwaWVudCI6ICIweDEyMzQ1NiJ9'

// Can you spot the difference? the first one is valid, and the second one... not so much! (hint: it's the ipfs)
await contract.checkMetadata("0x1d427754aed3c80e3f8b54e7131f994600d4ea740f81e8e2bfe4344496585adc", ["Tokumaru","Fusako","slate-gray","tan","dodger-blue","dark motorcycle scissor","bright future in space","bafybeiapwvkscpwfjs3dmshftvb5gctfintn3e3vgdapf6q3gvpb22buyy","#708090","#d2b48c","#1e90aa"])
await contract.checkMetadata("0x1d427754aed3c80e3f8b54e7131f994600d4ea740f81e8e2bfe4344496585adc", ["Tokumaru","Fusako","slate-gray","tan","dodger-blue","dark motorcycle scissor","bright future in space","bafybeiapwvkscpwfjs3dmshftvb5gatfintn3e3vgdapf6q3gvpb22buyy","#708090","#d2b48c","#1e90aa"])

// test minting process!
// first, need to set a few valid NFT signatures
contract.fillMinted([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], ["0x66f49e2fea7ebdcdb4f4163c7e51d8e98b8ab713f1961186b3c3e860a056dac8", "0x71277f3c3343d7405bba6a6722692f47063114e03f0eba0125be6bd2f99fab63", "0x0f1f96afb6ab0b0bf9f4a4a977ef2d0b8a6d5fcbe2a121043018e27a00e09f07", "0xcb50c181243cc44c90f4d9de01ff9f10a287382685b8d135f4c7a1d6e3e6f6d7", "0xc1dc6823176f7474fbe6da124d4277025558b1f0792e48bc96a971779d53a758", "0x4c1ee5cf1c844b872c53d32eb46998aa1a485498ffc17cf470e8f905aaaf903c", "0x5e952695af34a21a4cddfe5931845081e0257c1774d94472847121e09aa195ec", "0x79b111dbe7964ef45c412ca62ea393bc159ead8ce08fc4f58c9f463422e61fce", "0x5ebaa947339f5717b1bf960f35a3650b087759d3e3bfc410dca62d7e99fdeb1b", "0xb2f431c7bb7d11fc54b8d85ad5a32bedaf511e0ac2e5c2148ff51ba1d986a3de"])
await contract.checkMinted(4)
'0xcb50c181243cc44c90f4d9de01ff9f10a287382685b8d135f4c7a1d6e3e6f6d7'
// but...
await contract.checkMinted(99)
''

const [owner, person1, person2] = await ethers.getSigners();
let override = { value: ethers.utils.parseEther('0.5') }
await contract.connect(person1).mintSynth([5, 1, 2], [['five', '2'], ['one', '3'], ['two', '4']], override)
// should revert (DNE()) due to our metadata failing the validity check
await contract.connect(person1).mintSynth([5, 1, 2], [["Kihara","Masaki","dark","gray","thistle","dark melodious sky","bright future in space","bafybeigslulqatvcbgkjhpzncm3rri4www3z45wegqrqqlfcx6ltytr4me","#696969","#808080","#d8bfd8","#6a5acd","#191970"], ["Yanagawa","Ayumu","gainsboro","midnight-blue","sky-blue","slate-gray metrical light","bright future in space","bafybeiayncsfbwoymn6nkghz2lgfxhiolut6rdk5q2snh4lq566tt6j3jq","#dcdcdc","#191970","#87ceeb","#6495ed","#708090"], ["Tsuchimoto","Shinobu","rosy-brown","black","thistle","dark scissor plate","bright future in space","bafybeig53gwks5jv35agrqcnc4ykhofyf4gyaqkjtfr74ilwd6m46bp5u4","#bc8f8f","#000000","#d8bfd8","#696969","#f5deb3"]], override)
