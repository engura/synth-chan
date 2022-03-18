// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import { Base64 } from "./lib/Base64.sol";
import "./lib/FlexAttributes.sol";
import { StringUtils } from "./lib/StringUtils.sol";
import "hardhat/console.sol";

import "./lib/rarible-royalties/impl/RoyaltiesV2Impl.sol";
import "./lib/rarible-royalties/LibPart.sol";
import "./lib/rarible-royalties/LibRoyaltiesV2.sol";

contract SynthChan is ERC721Enumerable, Ownable, FlexAttributes, RoyaltiesV2Impl {
  address public creator;
  uint private price = 0 ether;
  // Royalty percentages are in basis points so a 10% sales royalty should be entered as 1000
  uint96 private sellerFeeBasisPoints = 0;
  uint8 private maxMintAmount = 3;
  // an idea similar to @openzeppelin's pausable, but simplified w/ less code
  bool private paused = false;
  bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a; // we support ERC2981 (for marketplaces such as mintable)

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
  // infos[1][...] == NFTimageURI
  // infos[2][...] == NFTtokenDescription
  mapping(uint8 => string[]) private infos;

  event SynthNFTMinted(address sender, uint256 tokenId);
  event SynthNFTUpdated(address sender, uint256 tokenId);

  // Constructor runs only once upon contract creation and creates initial/permanent default values
  constructor() ERC721("synth-chan", "SYNTH")
  {
    creator = _msgSender();

    // pause the minting ability upon launch?
    // pause(true);
  }

  function setTraits(string[] memory _traits) public override onlyOwner { super.setTraits(_traits); }
  function addTrait(string memory _trait) public override onlyOwner { super.addTrait(_trait); }
  function rmTrait(string memory _trait) public override onlyOwner { super.rmTrait(_trait); }
  function toggleDisplay(uint _nftId, string memory _trait) public override onlyOwner {
    super.toggleDisplay(_nftId, _trait);
  }

  function toggleOwnerEditable(uint _nftId, string memory _trait) public override onlyOwner {
    super.toggleOwnerEditable(_nftId, _trait);
  }

  function setStrAttribute(
    uint _nftId,
    string memory _trait,
    string memory _text,
    bool _display
  ) public override authUser(_nftId, _trait) {
    super.setStrAttribute(_nftId, _trait, _text, _display);
    emit SynthNFTUpdated(_msgSender(), _nftId);
  }

  function setIntAttribute(
    uint _nftId,
    string memory _trait,
    DisplayType _dispType,
    uint _value,
    bool _display
  ) public override authUser(_nftId, _trait) {
    super.setIntAttribute(_nftId, _trait, _dispType, _value, _display);
    emit SynthNFTUpdated(_msgSender(), _nftId);
  }

  // this is for adding NUMERIC attributes with a MAXVALUE
  function setGaugeAttribute(
    uint _nftId,
    string memory _trait,
    DisplayType _dispType,
    uint _value,
    uint _maxvalue,
    bool _display
  ) public override authUser(_nftId, _trait) {
    super.setGaugeAttribute(_nftId, _trait, _dispType, _value, _maxvalue, _display);
    emit SynthNFTUpdated(_msgSender(), _nftId);
  }

  // sets new NFT ids with appropriate metadata signatures, indicating that these ids haven't been minted yet
  // upon minting, the signature is deleted and this id can no longer be minted.
  function fillMinted(uint16[] memory _nftIds, bytes32[] memory _signatures) public onlyOwner {
    for(uint i = 0; i < _nftIds.length; i++) {
      minted[_nftIds[i]] = _signatures[i];
    }
  }

  // adjusts the price/royalties/minting params of an NFT
  function setCost(uint256 _newPrice, uint8 _newMaxMintAmount, uint96 _newSellerFeeBasisPoints) public onlyOwner {
    price = _newPrice;
    maxMintAmount = _newMaxMintAmount;
    sellerFeeBasisPoints = _newSellerFeeBasisPoints;
    // console.log('Updated Costs: ', price, maxMintAmount, sellerFeeBasisPoints);
  }

  function setInfo(uint8 _id, string[] memory _info) public onlyOwner {
    infos[_id] = _info;
  }

  // only an owner of our NFT can do this
  function setMessage(uint _tokenId, string memory _message) public {
    require(ownerOf(_tokenId) == _msgSender(), "e01"); // unauthorized
    super.setStrAttribute(_tokenId, "message", _message, false);
    emit SynthNFTUpdated(_msgSender(), _tokenId);
  }

  // pause/unpause minting
  function pause(bool _state) public onlyOwner {
    paused = _state;
  }

  // same as mintSynth, but the Owner can set destination address manually
  function promoSynth(address _recipient, uint256 _tokenId, string[] memory _attrs) public onlyOwner {
    _mintNFT(_recipient, _tokenId, _attrs);
  }

  // Users can mint one or more at a time
  function mintSynth(uint256[] memory _tokenId, string[][] memory _attrs) public payable {
    uint count = _tokenId.length;

    require(!paused, "e00");                              // minting is paused!
    require(count > 0 && count <= maxMintAmount, "e02");  // Cannot mint specified number of NFTs.
    require(msg.value >= price * count, "e03");           // Not enough ether to purchase NFTs.
    for (uint i = 0; i < count; i++) {
      _mintNFT(_msgSender(), _tokenId[i], _attrs[i]);
    }
  }

  function withdraw() public payable onlyOwner {
    uint balance = address(this).balance;
    require(balance > 0, "e04"); // No ether left to withdraw
    // solhint-disable-next-line avoid-low-level-calls
    (bool success, ) = (_msgSender()).call{value: balance}("");
    require(success, "e05"); // "Transfer failed."
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
  function contractURI() public view returns (string memory) {
    return string(
      abi.encodePacked("data:application/json;base64,", Base64.encode(
        abi.encodePacked(
          "{'name':'", infos[0][0],
          "','description':'", infos[0][1],
          "','image':'", infos[0][2],
          "','external_link':'", infos[0][3],
          "','seller_fee_basis_points':", StringUtils.uint2str(sellerFeeBasisPoints),
          ", 'fee_recipient':'0x",StringUtils.toAsciiString(owner()), "'}"
          )
        )
      )
    );
  }

  function tokenURI(uint256 _tokenId) public view override returns (string memory) {
    return string(
      abi.encodePacked("data:application/json;base64,", Base64.encode(
        abi.encodePacked( // TODO: can try attributes(_tokenId, "Last Name").strValue save on space/gas??
          "{'name':'",attributes[_tokenId]["Last Name"].strValue," ",attributes[_tokenId]["First Name"].strValue,"',",
          " 'description':'",description(_tokenId),"',",
          " 'image':'data:image/svg+xml;base64,", imageURI(_tokenId), "',",
          " 'attributes':[",jsonAttributes(_tokenId),"]}"
        )
      ))
    );
  }

  // check whether a particular NFT id was already minted or not
  // Returns metadata signature hash if NFT is still NOT minted.
  function checkMinted(uint16 _id) public view onlyOwner returns (bytes32) {
    return minted[_id];
  }

  function tokensOfOwner(address _owner) public view returns (uint[] memory) {
    uint tokenCount = balanceOf(_owner); // courtesy of ERC721Enumerable
    uint[] memory tokenIds = new uint256[](tokenCount);
    for (uint i = 0; i < tokenCount; i++) {
      tokenIds[i] = tokenOfOwnerByIndex(_owner, i); // courtesy of ERC721Enumerable
    }

    return tokenIds;
  }

  // verifies the first 8 values of Attributes. These are our core, immutable attributes that should not be modified
  function checkMetadata(bytes32 _hash, string[] memory _val) public pure returns (bool valid) {
    return (
      keccak256(abi.encodePacked(_val[0], _val[1], _val[2], _val[3], _val[4], _val[5],_val[6], _val[7])) == _hash
    );
  }

  function tokensOfSender() external view returns (uint[] memory) {
    return tokensOfOwner(_msgSender());
  }

  function getBalance() external view onlyOwner returns (uint ethBalance) {
    return address(this).balance;
  }

  // configure royalties using the ERC2981 standard (services such as Mintable)
  function royaltyInfo(
    uint256 _tokenId,
    uint256 _salePrice
  ) external view returns (address receiver, uint256 royaltyAmount) {
    // these are the same that were saved for Rarible/OpenSea's ContractURI
    LibPart.Part[] memory _royalties = royalties[_tokenId];
    if(_royalties.length > 0) {
      return (_royalties[0].account, (_salePrice * _royalties[0].value) / 10000);
    }
    return (address(0), 0);
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable) returns (bool) {
      if(interfaceId == _INTERFACE_ID_ERC2981 || interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES) return true;
      return super.supportsInterface(interfaceId);
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
      abi.encodePacked(data, infos[2][3], '0x', StringUtils.toAsciiString(ownerOf(_tokenId)), infos[2][4], mintedYear)
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

  function _mintNFT(address _recipient, uint256 _tokenId, string[] memory _attrs) private {
    // metadata must match our fingerprint! Else is it corrupted? Modified?
    require(checkMetadata(minted[uint16(_tokenId)], _attrs), "e06");

    _setRoyalties(_tokenId);

    // let's save our attributes:
    uint attrsLength = _attrs.length;
    bool showOnUI = true;
    for (uint i = 1; i < traitTypes.length; i++) { // string[] traitTypes are defined in FlexAttributes
      if(i > 5) showOnUI = false;
      if(attrsLength >= i) {
        super.setStrAttribute(_tokenId, traitTypes[i], _attrs[i-1], showOnUI); // the traitTypes are offset by +1!
      }
    }

    // solhint-disable-next-line not-rely-on-time
    super.setIntAttribute(_tokenId, "minted_at", DisplayType.Date, block.timestamp, showOnUI);
    minted[uint16(_tokenId)] = ""; // clear the signature to disallow double-minting

    _safeMint(_recipient, _tokenId);
    // console.log("Minted NFT w/ tokenId %s", _tokenId);
    emit SynthNFTMinted(_recipient, _tokenId);
  }

  // configure royalties for Rarible. By accident or by design, the data structure that holds royalties' info cannot
  // be updated after creation. So, after an NFT is minted, its royalty info is locked in forever.
  function _setRoyalties(uint _tokenId) private {
    LibPart.Part[] memory _royalties = new LibPart.Part[](1);
    _royalties[0].value = sellerFeeBasisPoints;
    _royalties[0].account = payable(owner());
    _saveRoyalties(_tokenId, _royalties);
  }

  modifier authUser(uint _tokenId, string memory _trait) {
    require(
      owner() == _msgSender() ||
      ownerOf(_tokenId) == _msgSender() && getAttribute(_tokenId, _trait).nftOwnerEditable, "e01"
    );
    _;
  }
}
