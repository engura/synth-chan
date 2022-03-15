// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// goal: allow flexible attributes allowing future mutability; can be created/modified/removed
// https://docs.opensea.io/docs/metadata-standards
// "attributes": [
//   { "trait_type": "StringValue", 
//     "value": "some text"
//   },
//   { "display_type": [number|boost_percentage|boost_number|date], 
//     "trait_type": "NumericValue", 
//     "value": 10,
//     "max_value": 1546360800 // optional
//   }]

// 1. in our contract below, a `Trait` is one of the globally accessible (by all NFTs) titles for a `Attribute`
//    and an `Attribute` is the entity that holds valuable data (like a string record or a number):
//    nftAddress: [{`trait`: `Attribute`}, {`trait`: `Attribute`}, ...]
//    `trait_type` is the actual name of the trait that is displayed on marketplaces' UIs.
// 2. there seems to be addAttr() functions, but no rmAttr()..?
//    When we remove a `trait`, it makes sense to also remove any created {`trait`: `Attribute`}s, but to loop
//    through potential thousands of records would become computationally/financially expensive. So, we can
//    leave these dangling structures in the contract's state storage, but they won't be addressable since the
//    `trait` is gone. If, however, it is added again in the future, then the old records would immediately become
//    "live" again. Is this a bug? or a feature?
contract FlexAttributes {
  error NotUnique(string name);
  error DNE();
  error BadValue();

  // `None` DisplayType is a tricky way to reserve 0-slot for all un-instanciated Attributes
  enum DisplayType {
    None,
    String,
    Number,
    Date,
    BoostNumber,
    BoostPercentage
  }
  // hold human-readable Attribute names for json output
  string[] public displayTypes = ["", "", "number", "date", "boost_number", "boost_percentage"];
  // an array to hold all existing `trait_type`s. (because we can't do something like dict.keys()
  // to get the keys from a mapping...)
  string[] public traitTypes;

  struct Attribute {
    DisplayType dispType;  // how to display a trait
    bool nftOwnerEditable; // can the NFT owner change this? (the contract owner reserves the ability to change them)
    bool display;          // whether to package/send this attribute into json for external viewing
    uint value;            // value for a numeric trait
    uint maxValue;         // optional
    string strValue;       // value for a string trait
  }

  //      ↴ specific NFT's id. ↴ string holds the trait_type (trait name)
  mapping(uint => mapping(string => Attribute)) public attributes;
  // we want a similar functionality to @openzeppelin's EnumerableMap but simpler and with less lines of code.
  // keeps track of indexes where our traitTypes are stored; no need to loop through the array to add/remove items
  mapping(string => uint) public traitIndex;

  //  traitTypes.push(""); // "reserve" the first element of the array, so we wouldn't use [0] for actual trait_types

  constructor() {
    traitTypes.push(""); // "reserve" the first element of the array, so we wouldn't use [0] for actual trait_types
  }

  function setTraits(string[] memory _traits) public {
    for (uint i=0; i<_traits.length; i++) {
      addTrait(_traits[i]);
    }
  }

  // returns all the attributes? (this method is for debug)
  // function getAttributes(uint _nftId) public view {
  //   for (uint i=0; i<traitTypes.length; i++) {
  //     Attribute memory attr = attributes[_nftId][traitTypes[i]];
  //     console.log(traitTypes[i], 'display/editable: ', attr.display, attr.nftOwnerEditable);
  //     console.log('numeric value/maxValue: ', uint(attr.value), uint(attr.maxValue));
  //     console.log('strValue: ', attr.strValue, 'dispType: ', uint(attr.dispType));
  //   }
  // }

  function jsonAttributes(uint _nftId) public view returns (string memory json){
    for (uint i=0; i<traitTypes.length; i++) {
      Attribute memory attr = attributes[_nftId][traitTypes[i]];
      if(bytes(traitTypes[i]).length == 0 || attr.dispType == DisplayType.None || !attr.display) continue;

      // { "display_type": "date", "trait_type": "title", "value": 1, "max_value": 2 }
      // { "trait_type": "title", "value": "text" }
      if(bytes(attr.strValue).length > 0) { // if we have something stored in strValue, assume that it is a STRING attr
        json = string(abi.encodePacked(json, "{'trait_type':'",traitTypes[i],"','value':'",attr.strValue,"'},"));
      } else { // handle NUMERIC values
        if(attr.maxValue > 0) { // show value with maxValue
          json = string(abi.encodePacked(json, "{'display_type':'",displayTypes[uint(attr.dispType)],
            "','trait_type':'",traitTypes[i],
            "','value':",Strings.toString(attr.value),
            ",'maxValue':",Strings.toString(attr.maxValue),"},"));
        } else {
          json = string(abi.encodePacked(json, "{'display_type':'",displayTypes[uint(attr.dispType)],
            "','trait_type':'",traitTypes[i],
            "','value':",Strings.toString(attr.value),"},"));
        }
      }
    }
    return json;
  }

  function getAttribute(uint _nftId, string memory _trait) public view returns (Attribute memory) {
    if(traitIndex[_trait] == 0) revert DNE();
    return attributes[_nftId][_trait];
  }

  // this is for adding STRING attributes
  // attributes[_nftId][_trait].strValue = _text;
  // attributes[_nftId]['string attribute'] =
  // Attribute({display: true, value: 1, maxValue: 2, strValue: 'a', dispType: DisplayType.String});
  function setStrAttribute(
    uint _nftId,
    string memory _trait,
    string memory _text,
    bool _display
  ) public {
    if(bytes(_text).length == 0 || traitIndex[_trait] == 0) revert DNE();
    Attribute storage attr = attributes[_nftId][_trait];
    attr.dispType = DisplayType.String;
    attr.display = _display;
    attr.strValue = _text;
  }

  // this is for adding NUMERIC attributes
  function setIntAttribute(
    uint _nftId,
    string memory _trait,
    DisplayType _dispType,
    uint _value,
    bool _display
  ) public {
    if(traitIndex[_trait] == 0) revert DNE();
    Attribute storage attr = attributes[_nftId][_trait];
    if(attr.maxValue > 0 && attr.maxValue < _value) revert BadValue();
    attr.dispType = _dispType;
    attr.display = _display;
    attr.value = _value;
  }

  // this is for adding NUMERIC attributes with a MAXVALUE
  function setGaugeAttribute(
    uint _nftId,
    string memory _trait,
    DisplayType _dispType,
    uint _value,
    uint _maxvalue,
    bool _display
  ) public {
    if(_value > _maxvalue) revert BadValue();
    setIntAttribute(_nftId, _trait, _dispType, _value, _display);
    Attribute storage attr = attributes[_nftId][_trait];
    attr.maxValue = _maxvalue;
  }

  function getTraits() public view returns (string[] memory) {
    return traitTypes;
  }

  function addTrait(string memory _trait) public {
    if(bytes(_trait).length == 0 || traitIndex[_trait] > 0) revert NotUnique(_trait);
    traitIndex[_trait] = traitTypes.length;
    traitTypes.push(_trait);
  }

  function rmTrait(string memory _trait) public {
    if(bytes(_trait).length == 0 || traitIndex[_trait] == 0) revert DNE();
    // Delete does not change the array length. It resets the value at index to it's default value, (in this case 0)
    // delete traitTypes[traitIndex[_trait]];
    // 1. Move the last element into the place to delete
    string memory lastElement = traitTypes[traitTypes.length - 1];
    traitTypes[traitIndex[_trait]] = lastElement;
    // 2. Remove the last element
    traitTypes.pop();
    // 3. Clean up our indeces lookup table
    traitIndex[lastElement] = traitIndex[_trait];
    traitIndex[_trait] = 0;
  }

  function toggleDisplay(uint _nftId, string memory _trait) public {
    if(bytes(_trait).length == 0 || traitIndex[_trait] == 0) revert DNE();
    Attribute storage attr = attributes[_nftId][_trait];
    attr.display = !attr.display;
  }

  function toggleOwnerEditable(uint _nftId, string memory _trait) public {
    if(bytes(_trait).length == 0 || traitIndex[_trait] == 0) revert DNE();
    Attribute storage attr = attributes[_nftId][_trait];
    attr.nftOwnerEditable = !attr.nftOwnerEditable;
  }
}
