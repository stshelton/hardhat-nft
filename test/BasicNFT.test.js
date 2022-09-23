const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { devChains } = require("../helper-hardhat-config")

!devChains.includes(network.name)
    ? describe.skip
    : describe("BasicNFT", async function () {
          let deployer
          let basicNft

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer

              await deployments.fixture(["all"])
              basicNft = await ethers.getContract("BasicNFT", deployer)
          })

          describe("constructor", async function () {
              it("sets name and symbole", async function () {
                  const name = await basicNft.name()
                  const symbol = await basicNft.symbol()
                  const counter = await basicNft.getTokenCounter()

                  console.log(name)

                  assert.equal(name, "Zombie Horde")
                  assert.equal(symbol, "ZH")
                  assert.equal(counter, 0)
              })
          })

          describe("mint", async function () {
              it("mint NFT", async function () {
                  const tx = await basicNft.mintNFT()
                  await tx.wait(1)
                  const tokenURI = await basicNft.tokenURI(0)
                  const counter = await basicNft.getTokenCounter()
                  assert.equal(counter, 1)
                  assert.equal(tokenURI, await basicNft.TOKEN_URI())
              })
          })
      })
