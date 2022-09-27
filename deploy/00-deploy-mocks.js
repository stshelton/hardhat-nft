const { network, ethers } = require("hardhat")
const { devChains } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25") //0.25 is the premium. It costs 0.25 LINK to make a request https://docs.chain.link/docs/vrf/v2/supported-networks/ (under premium)
const GAS_PRICE_LINK = 1e9 //1000000000  //Link Per gas CALCULATED value based on the gas price of the chain

//example^ lets say eth price become a cool millie
//Chainlink nodes pay the gas fees to give us randomness and do external execution
//So they price of request change based on the price of gas

const DECIMALS = "18"
const INITIAL_PRICE = ethers.utils.parseUnits("2000", "ether")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (devChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")
        //deploy a mock vrfcoordinator...
        //args (base fee, gaspriceLink)
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })

        await deploy("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_PRICE],
        })

        log("mocks deployed!!")
        log("-----------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
