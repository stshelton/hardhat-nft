const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { devChains, networkConfig } = require("../helper-hardhat-config")
let tokenURIs = [
    "ipfs://QmWXvFN6nuc4Sp1kQUJfS4iJZ1L7fgm8RZS8VYc9wzDXrS",
    "ipfs://QmSvwhkZEsx7nemkMRkDxFnjFBhezkpev4gx9jJSKfoZLE",
    "ipfs://QmQwDisywUH8V2hoedU1An9Famg9R1jb9hMurEN4yV58R6",
]

!devChains.includes(network.name)
    ? describe.skip
    : describe("randomNFT", async function () {
          let deployer, randomIpfsNft, vrfCoordinatorV2Mock, mintFee
          const chainId = network.config.chainId

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer

              await deployments.fixture(["all"])
              randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)

              mintFee = await randomIpfsNft.getMintFee()
          })

          describe("constructor", async function () {
              it("constructor sets values correct", async function () {
                  const tokenCouter = await randomIpfsNft.getTokenCounter()
                  const artURISCount = await randomIpfsNft.getArtTokenUrisCount()

                  console.log(tokenURIs)
                  for (var a = 0; a < artURISCount; a++) {
                      let artURI = await randomIpfsNft.getArtTokenUris(a)
                      assert.equal(artURI, tokenURIs[a])
                  }

                  assert.equal(tokenCouter, 0)
                  assert.equal(mintFee, networkConfig[chainId].mintFee)
              })
          })

          describe("mint nft", async function () {
              it("mint nft without feee", async function () {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWithCustomError(
                      randomIpfsNft,
                      "RandomIpfsNft_NeedMoreETHSent"
                  )
              })

              it("reverts if payment amount is less than the mint fee", async function () {
                  const fee = await randomIpfsNft.getMintFee()
                  await expect(
                      randomIpfsNft.requestNft({
                          value: ethers.utils.parseEther("0.000001"),
                      })
                  ).revertedWithCustomError(randomIpfsNft, "RandomIpfsNft_NeedMoreETHSent")
              })
              it("emits event on request nft", async function () {
                  await expect(randomIpfsNft.requestNft({ value: mintFee })).to.emit(
                      randomIpfsNft,
                      "NftRequested"
                  )
              })
          })

          describe("fulfillRandomWords", () => {
              it("mints NFT after random number is returned", async function () {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await randomIpfsNft.tokenURI("0")
                              const tokenCounter = await randomIpfsNft.getTokenCounter()
                              console.log(tokenCounter.toString())
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const fee = await randomIpfsNft.getMintFee()
                          const requestNftResponse = await randomIpfsNft.requestNft({
                              value: fee.toString(),
                          })
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              randomIpfsNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })

          describe("getBreedFromModdedRng", () => {
              it("should return pug if moddedRng < 10", async function () {
                  const expectedValue = await randomIpfsNft.getArtFromModdedRng(7)
                  assert.equal(0, expectedValue)
              })
              it("should return shiba-inu if moddedRng is between 10 - 39", async function () {
                  const expectedValue = await randomIpfsNft.getArtFromModdedRng(21)
                  assert.equal(1, expectedValue)
              })
              it("should return st. bernard if moddedRng is between 40 - 99", async function () {
                  const expectedValue = await randomIpfsNft.getArtFromModdedRng(77)
                  assert.equal(2, expectedValue)
              })
              it("should revert if moddedRng > 99", async function () {
                  await expect(
                      randomIpfsNft.getArtFromModdedRng(110)
                  ).to.be.revertedWithCustomError(randomIpfsNft, "RandomIpfsNft_RangeOutOfBounds")
              })
          })

          //   describe("mint", async function () {
          //       it("mint NFT", async function () {
          //           const tx = await randomIpfsNft.mintNFT()
          //           await tx.wait(1)
          //           const tokenURI = await randomIpfsNft.tokenURI(0)
          //           const counter = await randomIpfsNft.getTokenCounter()
          //           assert.equal(counter, 1)
          //           assert.equal(tokenURI, await randomIpfsNft.TOKEN_URI())
          //       })
          //   })
      })
