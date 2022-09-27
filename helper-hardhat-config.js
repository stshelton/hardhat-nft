const { ethers } = require("hardhat")

const networkConfig = {
    31337: {
        name: "hardhat",
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", //this doesnt matter cz we are mocking it so u can do whatever here
        //dont need address cz we using a mock for local
        subscriptionId: "0",
        callbackGasLimit: "500000",
        interval: "30",
        mintFee: "10000000000000000", //0.01
    },
    5: {
        name: "goerli",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        keepersUpdateInterval: "30",
        subscriptionId: "2311",
        callbackGasLimit: "500000",
        interval: "30",
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
        mintFee: "10000000000000000",
        ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    },
}

const devChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    devChains,
}
