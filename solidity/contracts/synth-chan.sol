// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import { Base64 } from "./lib/Base64.sol";
import "./lib/FlexAttributes.sol";
import { StringUtils } from "./lib/StringUtils.sol";
import "hardhat/console.sol";

contract SynthChan is ERC721Enumerable, Ownable, FlexAttributes {
  address public creator;
  uint public price = 0.01 ether;
  uint public maxMintAmount = 5;
  bool public paused = false; // an idea similar to @openzeppelin's pausable, but simplified w/ less code

  // let's keep track of which NFTs were already minted or not.
  // because these nfts are not randomly generated, their attributes are passed together with a minting request.
  // all images and their respective attributes correspond to each other and should not be changed prior to creation
  // so, we validate using keccak256 the attributes that are sent to us with a fingerprint stored upon the collection's
  // creation. After a successful minting, the fingerprint is cleared and the NFT will be impossible to mint again.
  // uint (nft's id) => string (keccak256 hash of an nft's attributes)
  mapping(uint16 => bytes32) private minted;
  // infos holds various description texts such as for the collection's description, title, and each nft's
  // description and URI templates. Because we need to be able to inject variable content into the texts,
  // it is a mapping to `string[]` instead of just single `string`s
  // infos[0][0]   == collection_name
  // infos[0][1]   == collection_description
  // infos[0][2]   == collection_image
  // infos[0][3]   == external_link
  // infos[0][4]   == seller_fee_basis_points
  // infos[0][5]   == fee_recepient
  // infos[1][...] == NFTimageURI
  // infos[2][...] == NFTtokenDescription
  mapping(uint8 => string[]) private infos;

  event SynthNFTMinted(address sender, uint256 tokenId);
  event SynthNFTUpdated(address sender, uint256 tokenId);

  // Constructor runs only once upon contract creation and creates initial/permanent default values
  constructor() ERC721("synth-chan", "SYNTH")
  {
    creator = msg.sender;

    // pause the minting ability upon launch?
    // pause(true);
  }

  // json should be in this format:
  // {
  //   "name": "OpenSea Collection",
  //   "description": "Some description",
  //   "image": "https://sample.com/image.png",
  //   "external_link": "https://our-website.io",
  //   "seller_fee_basis_points": 100, # Indicates a 1% seller fee.
  //   "fee_recipient": "0x1234" # Where seller fees will be paid to.
  // }
  // checked ✓
  function contractURI() public view returns (string memory) {
    return string(
      abi.encodePacked("data:application/json;base64,", Base64.encode(
        abi.encodePacked(
          "{'name':'", infos[0][0],
          "','description':'", infos[0][1],
          "','image':'", infos[0][2],
          "','external_link':'", infos[0][3],
          "','seller_fee_basis_points':", infos[0][4],
          ", 'fee_recipient':'", infos[0][5], "'}"
          )
        )
      )
    );
  }

  // checked ✓
  function checkMetadata(bytes32 _hash, string[] memory _val) public pure returns (bool valid) {
    return (
      keccak256(abi.encodePacked(_val[0], _val[1], _val[2], _val[3], _val[4], _val[5],_val[6], _val[7])) == _hash
    );
  }

  // checked ✓: can only do a few at a time (~10~50?...100?). need to set up a loop to upload all NFT signatures.
  // sets new NFT ids with appropriate metadata signatures, indicating that these ids haven't been minted yet
  // upon minting, the signature is deleted and this id can no longer be minted.
  function fillMinted(uint16[] memory _nftIds, bytes32[] memory _signatures) public onlyOwner {
    for(uint i = 0; i < _nftIds.length; i++) {
      minted[_nftIds[i]] = _signatures[i];
    }
  }

  // checked ✓
  // check whether a particular NFT id was already minted or not
  // Returns metadata signature hash if NFT is still NOT minted.
  function checkMinted(uint16 _id) public view returns (bytes32) {
    return minted[_id];
  }

  function _mintNFT(address _recipient, uint256 _tokenId, string[] memory _attrs) private {
    // metadata must match our fingerprint! Else is it corrupted? Modified?
    require(checkMetadata(minted[uint16(_tokenId)], _attrs), "e06");
    _safeMint(_recipient, _tokenId);

    // let's save our attributes:
    string[] memory traits = getTraits();
    uint attrsLength = _attrs.length;
    bool showOnUI = true;
    for (uint i = 1; i < traits.length; i++) {
      if(i > 5) showOnUI = false;
      if(attrsLength >= i) {
        setStrAttribute(_tokenId, traits[i], _attrs[i-1], showOnUI); // the traits are offset by +1!
      }
    }

    // solhint-disable-next-line not-rely-on-time
    setIntAttribute(_tokenId, "minted_at", DisplayType.Date, block.timestamp, showOnUI);
    minted[uint16(_tokenId)] = ""; // clear the signature to disallow double-minting
    // console.log("Minted NFT w/ tokenId %s", _tokenId);
    emit SynthNFTMinted(_recipient, _tokenId);
  }

  // Users can mint one or more at a time
  function mintSynth(uint256[] memory _tokenId, string[][] memory _attrs) public payable {
    uint count = _tokenId.length;

    require(!paused, "e00");                              // minting is paused!
    require(count > 0 && count <= maxMintAmount, "e02");  // Cannot mint specified number of NFTs.
    require(msg.value >= price * count, "e03");           // Not enough ether to purchase NFTs.
    for (uint i = 0; i < count; i++) {
      _mintNFT(msg.sender, _tokenId[i], _attrs[i]);
    }
  }

  // same as mintSynth, but the Owner can set destination address manually
  function promoSynth(address _recipient, uint256 _tokenId, string[] memory _attrs) public onlyOwner {
    _mintNFT(_recipient, _tokenId, _attrs);
  }

  function tokenURI(uint256 _tokenId) public view override returns (string memory) {
    return string(
      abi.encodePacked("data:application/json;base64,", Base64.encode(
        abi.encodePacked(
          "{'name':'",attributes[_tokenId]["Last Name"].strValue," ",attributes[_tokenId]["First Name"].strValue,"',",
          " 'description':'",description(_tokenId),"',",
          " 'image':'data:image/svg+xml;base64,", imageURI(_tokenId), "',",
          " 'attributes':[",jsonAttributes(_tokenId),"]}"
        )
      ))
    );
  }

  function description(uint _tokenId) internal view returns (string memory) {
    bytes memory data;
    string[3] memory filler = [
      string(abi.encodePacked(
        attributes[_tokenId]["Last Name"].strValue," ",attributes[_tokenId]["First Name"].strValue)
      ),
      getAttribute(_tokenId, "theme").strValue,
      getAttribute(_tokenId, "ipfs").strValue
    ];
    string memory mintedYear = StringUtils.uint2str(getAttribute(_tokenId, "minted_at").value / 31556926 + 1970);

    for(uint i = 0; i < filler.length; i++) {
      data = abi.encodePacked(data, infos[2][i], filler[i]);
    }
    return string(
      abi.encodePacked(data, infos[2][3], StringUtils.toAsciiString(ownerOf(_tokenId)), infos[2][4], mintedYear)
    );
  }

  function imageURI(uint _tokenId) internal view returns (string memory) {
    string[7] memory filler = ["color1","color2","color3","color4","color5","ipfs","message"];
    bytes memory imgData;

    for(uint i = 0; i < filler.length; i++) {
      imgData = abi.encodePacked(imgData, infos[1][i], getAttribute(_tokenId, filler[i]).strValue);
    }
    return Base64.encode(abi.encodePacked(imgData, infos[1][infos[1].length - 1]));
  }

  // adjusts the price of an NFT
  function setCost(uint256 _newPrice) public onlyOwner {
    price = _newPrice;
  }

  // adjusts the max amount an address can mint
  function setmaxMintAmount(uint256 _newMaxMintAmount) public onlyOwner {
    maxMintAmount = _newMaxMintAmount;
  }

  // checked ✓
  function setInfo(uint8 _id, string[] memory _info) public onlyOwner {
    infos[_id] = _info;
  }

  // only an owner of our NFT can do this
  function setMessage(uint _tokenId, string memory _message) public {
    require(ownerOf(_tokenId) == _msgSender(), "e01");
    setStrAttribute(_tokenId, "message", _message, false);
  }

  // pause/unpause minting
  function pause(bool _state) public onlyOwner {
    paused = _state;
  }

  function tokensOfOwner(address _owner) public view returns (uint[] memory) {
    uint tokenCount = balanceOf(_owner); // courtesy of ERC721Enumerable
    uint[] memory tokenIds = new uint256[](tokenCount);
    for (uint i = 0; i < tokenCount; i++) {
      tokenIds[i] = tokenOfOwnerByIndex(_owner, i); // courtesy of ERC721Enumerable
    }

    return tokenIds;
  }

  // checked ✓
  function tokensOfSender() external view returns (uint[] memory) {
    return tokensOfOwner(_msgSender());
  }

  // checked ✓
  function getBalance() external view onlyOwner returns (uint ethBalance) {
    return address(this).balance;
  }

  // checked ✓
  function withdraw() public payable onlyOwner {
    uint balance = address(this).balance;
    require(balance > 0, "e04"); // No ether left to withdraw
    // solhint-disable-next-line avoid-low-level-calls
    (bool success, ) = (_msgSender()).call{value: balance}("");
    require(success, "e05"); // "Transfer failed."
  }
}
