// Note: Make sure .env file and config.js are created and setup correctly
const { oceanConfig } = require('./config.js');
const { ZERO_ADDRESS, NftFactory } = require('@oceanprotocol/lib');

// Define a function createFRE()
const createFRE = async() => {

    const DISP_NFT_NAME = 'Datatoken 3'
    const DISP_NFT_SYMBOL = 'DT3'

    let config = await oceanConfig();

    // Create a NFTFactory
    const factory = new NftFactory(config.nftFactoryAddress, config.publisherAccount);

    const nftParams = {
        name: DISP_NFT_NAME,
        symbol: DISP_NFT_SYMBOL,
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

    const dispenserParams = {
        dispenserAddress: config.dispenserAddress,
        maxTokens: '1',
        maxBalance: '1',
        withMint: true,
        allowedSwapper: ZERO_ADDRESS
    }

    const bundleNFT = await factory.createNftWithDatatokenWithDispenser(
        nftParams,
        datatokenParams,
        dispenserParams
    )

    const trxReceipt = await bundleNFT.wait()

    return {
        trxReceipt
    };
};

// Call the createFRE() function 
createFRE()
    .then(({ trxReceipt }) => {
        console.log(`TX Receipt ${trxReceipt}`);
        process.exit(1);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });