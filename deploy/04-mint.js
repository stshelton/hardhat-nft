const { network, ethers } = require("hardhat")
const { devChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    //mint basic nft
    const basicNft = await ethers.getContract("BasicNFT", deployer)
    const basicMintTx = await basicNft.mintNFT()
    await basicMintTx.wait(1)
    console.log(`Basic NFT index 0 has tokenURI ${await basicNft.tokenURI(0)}`)

    //random ipfs nft
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
    const mintFee = await randomIpfsNft.getMintFee()
    await new Promise(async (resolve, reject) => {
        setTimeout(resolve, 300000)
        randomIpfsNft.once("NftMinted", async function () {
            resolve()
        })
        const randomIpfsNftMintTx = await randomIpfsNft.requestNft({ value: mintFee.toString() })
        const randomIpfsMintTxReceipt = await randomIpfsNftMintTx.wait(1)
        if (devChains.includes(network.name)) {
            const requestId = randomIpfsMintTxReceipt.events[1].args.requestId.toString()
            const vrfCoordintatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await vrfCoordintatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address)
        }
    })

    console.log(`random ipfs nft index 0 tokenURI ${await randomIpfsNft.tokenURI(0)}`)

    // dynamic svg nft
    const highValue = ethers.utils.parseEther("40000")
    const dynamicSVGNft = await ethers.getContract("DynamicSvgNft", deployer)
    const dynamicSvgNftMintTx = await dynamicSVGNft.mintNft(highValue.toString())
    await dynamicSvgNftMintTx.wait(1)
    console.log(`Dynamic svg nft index 0 tokenURI: ${await dynamicSVGNft.tokenURI(0)}`)
}

module.exports.tags = ["all", "mint"]
