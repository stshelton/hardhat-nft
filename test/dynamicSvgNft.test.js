const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { devChains, networkConfig } = require("../helper-hardhat-config")
const fs = require("fs")

const highTokenUri =
    "data:application/json;base64,eyJuYW1lIjoiRHluYW1pYyBTdmcgTmZ0IiwgImRlc2NyaXB0aW9uIjoiQW4gTkZUIHRoYXQgY2hhbmdlcyBiYXNlZCBvbiB0aGUgY2hhaW5saW5rIGZlZWQiLCJhdHRyaWJ1dGVzIjogW3sidHJhaXRfdHlwZSI6ImNvb2xuZXNzIiwgInZhbHVlIjoxMDB9XSwgImltYWdlIjoiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlCMmFXVjNRbTk0UFNJd0lEQWdNakF3SURJd01DSWdkMmxrZEdnOUlqUXdNQ0lnSUdobGFXZG9kRDBpTkRBd0lpQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaVBnb2dJRHhqYVhKamJHVWdZM2c5SWpFd01DSWdZM2s5SWpFd01DSWdabWxzYkQwaWVXVnNiRzkzSWlCeVBTSTNPQ0lnYzNSeWIydGxQU0ppYkdGamF5SWdjM1J5YjJ0bExYZHBaSFJvUFNJeklpOCtDaUFnUEdjZ1kyeGhjM005SW1WNVpYTWlQZ29nSUNBZ1BHTnBjbU5zWlNCamVEMGlOakVpSUdONVBTSTRNaUlnY2owaU1USWlMejRLSUNBZ0lEeGphWEpqYkdVZ1kzZzlJakV5TnlJZ1kzazlJamd5SWlCeVBTSXhNaUl2UGdvZ0lEd3ZaejRLSUNBOGNHRjBhQ0JrUFNKdE1UTTJMamd4SURFeE5pNDFNMk11TmprZ01qWXVNVGN0TmpRdU1URWdOREl0T0RFdU5USXRMamN6SWlCemRIbHNaVDBpWm1sc2JEcHViMjVsT3lCemRISnZhMlU2SUdKc1lXTnJPeUJ6ZEhKdmEyVXRkMmxrZEdnNklETTdJaTgrQ2p3dmMzWm5QZz09In0="

!devChains.includes(network.name)
    ? describe.skip
    : describe("dynamicNFT", async function () {
          let dynamicNFT, mockV3Aggregator, deployer, highSVG, lowSVG
          let chainId = network.config.chainId

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer

              await deployments.fixture(["dynamicsvg", "mocks"])
              dynamicNFT = await ethers.getContract("DynamicSvgNft", deployer)
              mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
              lowSVG = await fs.readFileSync("./images/dynamicNft/frown.svg", {
                  encoding: "utf8",
              })
              highSVG = await fs.readFileSync("./images/dynamicNft/happy.svg", {
                  encoding: "utf8",
              })
          })

          describe("constructor", function () {
              it("svg to image uri", async function () {
                  const lowSVGURI = await dynamicNFT.svgToImageURI(lowSVG)
                  const highSVGURI = await dynamicNFT.svgToImageURI(highSVG)

                  const lowSVGURI_fromContract = await dynamicNFT.getLowImageURI()
                  const highSVGURI_fromContract = await dynamicNFT.getHighImageURI()

                  assert.equal(lowSVGURI, lowSVGURI_fromContract)
                  assert.equal(highSVGURI, highSVGURI_fromContract)
              })
          })

          describe("mintNft", () => {
              it("emits an event and creates the NFT", async function () {
                  const highValue = ethers.utils.parseEther("1") // 1 dollar per ether
                  await expect(dynamicNFT.mintNft(highValue)).to.emit(dynamicNFT, "CreatedNFT")
                  const tokenCounter = await dynamicNFT.getTokenCounter()
                  assert.equal(tokenCounter.toString(), "1")
                  const tokenURI = await dynamicNFT.tokenURI(0)
                  console.log(tokenURI)
                  console.log(highTokenUri)
                  //const highSVGURI = await dynamicNFT.svgToImageURI(highSVG)
                  assert.equal(tokenURI, highTokenUri)
              })
              it("shifts the token uri to lower when the price doesn't surpass the highvalue", async function () {
                  const highValue = ethers.utils.parseEther("100000000") // $100,000,000 dollar per ether. Maybe in the distant future this test will fail...
                  const txResponse = await dynamicNFT.mintNft(highValue)
                  await txResponse.wait(1)
                  const tokenURI = await dynamicNFT.tokenURI(0)
                  assert.equal(tokenURI, lowTokenUri)
              })
          })
      })
