import fs from 'fs'

import { ethers, formatEther, getAddress, JsonRpcProvider, Signer, toBeHex } from 'ethers'
import crypto from 'crypto-js'
import { homedir } from 'os'
import {
  approve,
  Aquarius,
  balance,
  Config,
  Datatoken,
  Dispenser,
  DispenserCreationParams,
  downloadFile,
  DatatokenCreateParams,
  Files,
  FixedRateExchange,
  FreCreationParams,
  Nft,
  NftCreateData,
  NftFactory,
  ProviderFees,
  ProviderInstance,
  transfer,
  ZERO_ADDRESS,
  sendTx,
  ConfigHelper,
  configHelperNetworks,
  amountToUnits,
  getEventFromTx,
  LoggerInstance
} from '../../src/index.js'

import { DDO, ValidateMetadata } from '@oceanprotocol/ddo-js'

let provider: JsonRpcProvider
let config: Config
let aquarius: Aquarius
let datatoken: Datatoken
let providerUrl: any
let publisherAccount: Signer
let consumerAccount: Signer
let stakerAccount: Signer
let addresses: any
let freNftAddress: string
let freDatatokenAddress: string
let freAddress: string
let freId: string
let dispenserNftAddress: string
let dispenserDatatokenAddress: string
let dispenserAddress: string
let fixedDDO: DDO

const FRE_NFT_NAME = 'Datatoken 2'
const FRE_NFT_SYMBOL = 'DT2'
const DISP_NFT_NAME = 'Datatoken 3'
const DISP_NFT_SYMBOL = 'DT3'

const ASSET_URL: Files = {
datatokenAddress: '0x0',
nftAddress: '0x0',
files: [
    {
    type: 'url',
    url: 'https://raw.githubusercontent.com/oceanprotocol/testdatasets/main/shs_dataset_test.txt',
    method: 'GET'
    }
]
}

const genericAsset: DDO = {
'@context': ['https://w3id.org/did/v1'],
id: 'did:op',
version: '4.1.0',
chainId: 8996,
nftAddress: '0x0',
metadata: {
    created: '2021-12-20T14:35:20Z',
    updated: '2021-12-20T14:35:20Z',
    type: 'dataset',
    name: 'dataset-name',
    description: 'Ocean protocol test dataset description',
    author: 'oceanprotocol-team',
    license: 'MIT',
    tags: ['white-papers'],
    additionalInformation: { 'test-key': 'test-value' },
    links: ['http://data.ceda.ac.uk/badc/ukcp09/']
},
services: [
    {
    id: 'db164c1b981e4d2974e90e61bda121512e6909c1035c908d68933ae4cfaba6b0',
    type: 'access',
    files: '',
    datatokenAddress: '0xa15024b732A8f2146423D14209eFd074e61964F3',
    serviceEndpoint: 'http://127.0.0.1:8001',
    timeout: 0
    }
]
}

  
provider = new JsonRpcProvider(
    process.env.NODE_URI || configHelperNetworks[1].nodeUri
)
publisherAccount = (await provider.getSigner(0)) as Signer
consumerAccount = (await provider.getSigner(1)) as Signer
stakerAccount = (await provider.getSigner(2)) as Signer
const config = new ConfigHelper().getConfig(
    parseInt(String((await publisherAccount.provider.getNetwork()).chainId))
)
if (process.env.NODE_URL) {
    config.oceanNodeUri = process.env.NODE_URL
}
aquarius = new Aquarius(config?.oceanNodeUri)
providerUrl = config?.oceanNodeUri
addresses = JSON.parse(
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.readFileSync(
    process.env.ADDRESS_FILE ||
        `${homedir}/.ocean/ocean-contracts/artifacts/address.json`,
    'utf8'
    )
).development

console.log(`Indexer URL: ${config.oceanNodeUri}`)
console.log(`Provider URL: ${providerUrl}`)
console.log(`Deployed contracts address: ${addresses}`)
console.log(`Publisher account address: ${await publisherAccount.getAddress()}`)
console.log(`Consumer account address: ${await consumerAccount.getAddress()}`)
console.log(`Staker account address: ${await stakerAccount.getAddress()}`)
  

const minAbi = [
    {
    constant: false,
    inputs: [
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' }
    ],
    name: 'mint',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
    }
]

const tokenContract = new ethers.Contract(addresses.Ocean, minAbi, publisherAccount)
const estGasPublisher = await tokenContract.mint.estimateGas(
    await publisherAccount.getAddress(),
    amountToUnits(null, null, '1000', 18)
)
await sendTx(
    estGasPublisher,
    publisherAccount,
    1,
    tokenContract.mint,
    await publisherAccount.getAddress(),
    amountToUnits(null, null, '1000', 18)
)

transfer(
    publisherAccount,
    config,
    addresses.Ocean,
    await consumerAccount.getAddress(),
    '100'
)
transfer(
    publisherAccount,
    config,
    addresses.Ocean,
    await stakerAccount.getAddress(),
    '100'
)
const { chainId } = await publisherAccount.provider.getNetwork()
const factory = new NftFactory(
    addresses.ERC721Factory,
    publisherAccount,
    Number(chainId)
)

const nftParams: NftCreateData = {
    name: FRE_NFT_NAME,
    symbol: FRE_NFT_SYMBOL,
    templateIndex: 1,
    tokenURI: '',
    transferable: true,
    owner: await publisherAccount.getAddress()
}

const datatokenParams: DatatokenCreateParams = {
    templateIndex: 1,
    cap: '100000',
    feeAmount: '0',
    paymentCollector: ZERO_ADDRESS,
    feeToken: ZERO_ADDRESS,
    minter: await publisherAccount.getAddress(),
    mpFeeAddress: ZERO_ADDRESS
}

const freParams: FreCreationParams = {
    fixedRateAddress: addresses.FixedPrice,
    baseTokenAddress: addresses.Ocean,
    owner: await publisherAccount.getAddress(),
    marketFeeCollector: await publisherAccount.getAddress(),
    baseTokenDecimals: 18,
    datatokenDecimals: 18,
    fixedRate: '1',
    marketFee: '0.001',
    allowedConsumer: ZERO_ADDRESS,
    withMint: true
}

const bundleNFT = await factory.createNftWithDatatokenWithFixedRate(
    nftParams,
    datatokenParams,
    freParams
)

const trxReceipt = await bundleNFT.wait()
// events have been emitted
const nftCreatedEvent = getEventFromTx(trxReceipt, 'NFTCreated')
const tokenCreatedEvent = getEventFromTx(trxReceipt, 'TokenCreated')
const newFreEvent = getEventFromTx(trxReceipt, 'NewFixedRate')

freNftAddress = nftCreatedEvent.args.newTokenAddress
freDatatokenAddress = tokenCreatedEvent.args.newTokenAddress
freAddress = newFreEvent.args.exchangeContract
freId = newFreEvent.args.exchangeId

console.log(`Fixed rate exchange NFT address: ${freNftAddress}`)
console.log(`Fixed rate exchange Datatoken address: ${freDatatokenAddress}`)
console.log(`Fixed rate exchange address: ${freAddress}`)
console.log(`Fixed rate exchange Id: ${freId}`)


const { chainId } = await publisherAccount.provider.getNetwork()
const nft = new Nft(publisherAccount, Number(chainId))

fixedDDO = { ...genericAsset }

fixedDDO.chainId = Number(chainId)
fixedDDO.id =
    'did:op:' + SHA256(getAddress(freNftAddress) + fixedDDO.chainId.toString(10))
fixedDDO.nftAddress = freNftAddress


ASSET_URL.datatokenAddress = freDatatokenAddress
ASSET_URL.nftAddress = freNftAddress
fixedDDO.services[0].files = await ProviderInstance.encrypt(
    ASSET_URL,
    fixedDDO.chainId,
    providerUrl
)
fixedDDO.services[0].datatokenAddress = freDatatokenAddress

console.log(`DID: ${fixedDDO.id}`)

const providerResponse = await ProviderInstance.encrypt(
    fixedDDO,
    fixedDDO.chainId,
    providerUrl
)
const encryptedDDO = await providerResponse

const isAssetValid: ValidateMetadata = await aquarius.validate(
    fixedDDO,
    publisherAccount,
    providerUrl
)
assert(isAssetValid.valid === true, 'Published asset is not valid')
await nft.setMetadata(
    freNftAddress,
    await publisherAccount.getAddress(),
    0,
    providerUrl,
    '',
    toBeHex(2),
    encryptedDDO,
    isAssetValid.hash
)

const { chainId } = await publisherAccount.provider.getNetwork()
const fixedRate = new FixedRateExchange(freAddress, publisherAccount, Number(chainId))
const oceanAmount = await (
    await fixedRate.calcBaseInGivenDatatokensOut(freId, '1')
).baseTokenAmount