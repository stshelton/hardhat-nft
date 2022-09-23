const { ethers } = require("hardhat")

const networkConfig = {
    31337: {
        name: "hardhat",
        lendingPoolAddress: "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        wethTokenAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        daiEthDataFeed: "0x773616E4d11A78F511299002da57A0a94577F1f4",
        daiTokenAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", //this doesnt matter cz we are mocking it so u can do whatever here
        //dont need address cz we using a mock for local
        subscriptionId: "0",
        callbackGasLimit: "500000",
        interval: "30",
    },
}

const devChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    devChains,
}
