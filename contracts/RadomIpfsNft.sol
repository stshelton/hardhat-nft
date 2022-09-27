// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error RandomIpfsNft_RangeOutOfBounds();
error RandomIpfsNft_NeedMoreETHSent();
error RandomIpfsNft_TransferFailed();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    // Type declaration
    enum Art {
        ZOMBIE,
        VADER,
        GROGU
    }

    //when we mint an NFT, we will trigger a chainlink VRF call to get us a random number
    //using that number , we will get a random NFT
    // pug, shiba inu, st. benard
    //pug super rare
    // shiba sort of rare
    // st.benard common
    VRFCoordinatorV2Interface private immutable i_vrfCoorinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    //VRF helpers
    mapping(uint256 => address) public s_requestIdToSender;

    //NFT variables //should probably be private
    uint256 public s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_tokenURIs;
    uint256 internal i_mintFee;

    //events
    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(Art art, address minter);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        string[3] memory tokenUris,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
        i_vrfCoorinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        s_tokenURIs = tokenUris;
        i_mintFee = mintFee;
    }

    function requestNft() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNft_NeedMoreETHSent();
        }
        //we want who ever request this nft to get nft
        requestId = i_vrfCoorinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        //so how we save the account that called this we need to store in mapping
        //so we can give them the nft
        s_requestIdToSender[requestId] = msg.sender;

        //create some events to tell that we minted
        emit NftRequested(requestId, msg.sender);
    }

    //now we need a way to get the owner to retreive funds from minting
    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNft_TransferFailed();
        }
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address nftOwner = s_requestIdToSender[requestId];
        uint256 newTokenId = s_tokenCounter;

        //what does this token look like?

        // with % always getting a number bewteen 0-99
        // 7 -> PUG
        //88 -> ST.Benard
        //12 -> shiba inu
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
        s_tokenCounter = s_tokenCounter + 1;
        Art art = getArtFromModdedRng(moddedRng);
        _safeMint(nftOwner, newTokenId);
        _setTokenURI(newTokenId, s_tokenURIs[uint256(art)]);
        emit NftMinted(art, nftOwner);
    }

    function getArtFromModdedRng(uint256 moddedRng) public pure returns (Art) {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();
        for (uint256 i = 0; i < chanceArray.length; i++) {
            if (moddedRng >= cumulativeSum && moddedRng < chanceArray[i]) {
                return Art(i);
            }
            cumulativeSum += chanceArray[i];
        }

        revert RandomIpfsNft_RangeOutOfBounds();
    }

    //used to create rarity of nfts
    //index 0 has a 10 percent chance of happening, index 1 has 20 percent chance of happening, index 2 is gonna have a 60 percent chance of that
    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE];
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getArtTokenUris(uint256 index) public view returns (string memory) {
        return s_tokenURIs[index];
    }

    function getArtTokenUrisCount() public view returns (uint256) {
        return s_tokenURIs.length;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
