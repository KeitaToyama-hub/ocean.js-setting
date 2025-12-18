// Note: Make sure .env file and config.js are created and setup correctly
const { oceanConfig } = require('./config.js');
const ethers = require("ethers");
const { getEventFromTx } = require('./utils.js');
const crypto = require("crypto");
const { createHash } = crypto;
const { ZERO_ADDRESS, NftFactory } = require('@oceanprotocol/lib');



// Define a function createFRE()
const createFRE = async () => {

    const FRE_NFT_NAME = 'Datatoken 2'
    const FRE_NFT_SYMBOL = 'DT2'

    let config = await oceanConfig();

    // Create a NFTFactory
    const factory = new NftFactory(config.nftFactoryAddress, config.publisherAccount);

    const nftParams = {
        name: FRE_NFT_NAME,
        symbol: FRE_NFT_SYMBOL,
        templateIndex: 1,
        tokenURI: '',
        transferable: true,
        owner: await config.publisherAccount.getAddress()
    }

    const datatokenParams = {
        templateIndex: 1,
        cap: '100000',
        feeAmount: '0',
        paymentCollector: ZERO_ADDRESS,
        feeToken: ZERO_ADDRESS,
        minter: await config.publisherAccount.getAddress(),
        mpFeeAddress: ZERO_ADDRESS
    }
    const freParams = {
        fixedRateAddress: config.fixedRateExchangeAddress,
        baseTokenAddress: config.oceanTokenAddress,
        owner: config.publisherAccount.address,
        marketFeeCollector: config.publisherAccount.address,
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
    const nftCreatedEvent = getEventFromTx(trxReceipt, 'NFTCreated')
    console.log('nftCreatedEvent', nftCreatedEvent);
    const nftAddressFromEvent = nftCreatedEvent.args.newTokenAddress
    console.log('nftAddressFromEvent', nftAddressFromEvent);
    const chainId = await config.publisherAccount.getChainId()
    console.log('chainId', chainId);
    const nftAddress = ethers.utils.getAddress(nftAddressFromEvent)
    console.log('nftAddress', nftAddress);
    const did = 'did:ope:' +
        createHash('sha256')
            .update(nftAddress + chainId)
            .digest('hex')
    return {
        trxReceipt,
        did
    };
};

// Call the createFRE() function 
createFRE()
    .then(({ trxReceipt, did }) => {

        console.log(`DID`, did);
        process.exit(1);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });