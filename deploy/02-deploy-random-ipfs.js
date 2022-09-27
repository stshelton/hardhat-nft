const { network, ethers } = require("hardhat")
const { devChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")

require("dotenv").config()

const imagesLocation = "./images/randomNft"

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "DR",
            value: 100,
        },
    ],
}

let tokenURIs = [
    "ipfs://QmWXvFN6nuc4Sp1kQUJfS4iJZ1L7fgm8RZS8VYc9wzDXrS",
    "ipfs://QmSvwhkZEsx7nemkMRkDxFnjFBhezkpev4gx9jJSKfoZLE",
    "ipfs://QmQwDisywUH8V2hoedU1An9Famg9R1jb9hMurEN4yV58R6",
]

const FUND_AMOUNT = ethers.utils.parseEther("10")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId

    let vrfCoordinatorV2Address, subscriptionId

    //get the ipfs hashes of our images
    console.log("Uploading to IPFS")
    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenURIs = await handletokenUris()
    }

    // 1. With our own IPFS node. https://docs.ipfs.io/
    // Pinata https://www.pinata.cloud/
    // nft storage https://nft.storage/

    if (devChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const tx = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await tx.wait(1)
        subscriptionId = txReceipt.events[0].args.subId
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }

    log("----------------------------")
    // await storeImages(imagesLocation)
    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
        tokenURIs,
        networkConfig[chainId].mintFee,
    ]

    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (devChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        await vrfCoordinatorV2Mock.addConsumer(subscriptionId, randomIpfsNft.address)
    }

    log("------------------------")
    if (!devChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("verifying....")
        await verify(randomIpfsNft.address, args)
    }
}

async function handletokenUris() {
    tokenURIs = []
    //store the imagine in ipfs
    //store the metadata in ipfs
    //responses will have the hash of stored files on pinata
    const { responses: imageUploadResponse, files } = await storeImages(imagesLocation)

    for (imageUploadResponseIndex in imageUploadResponse) {
        //create metadata
        //upload metadata
        let tokenUriMetadata = { ...metadataTemplate }
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "")
        tokenUriMetadata.description = `Art ${tokenUriMetadata.name}`
        tokenUriMetadata.image = `ipfs://${imageUploadResponse[imageUploadResponseIndex].IpfsHash}`
        console.log(`Uploading ${tokenUriMetadata.name}....`)
        //store the json to pinata / ipfs
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenURIs.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    console.log("Token URIs uplaoded! they are:")
    console.log(tokenURIs)
    return tokenURIs
}

module.exports.tags = ["all", "randomipfs", "main"]
