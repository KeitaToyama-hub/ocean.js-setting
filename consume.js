// Note: Make sure .env file and config.js are created and setup correctly
const { oceanConfig } = require("./config.js");
const { getEventFromTx } = require('./utils.js');

const {
    ZERO_ADDRESS,
    NftFactory,
    getHash,
    ProviderFees,
    Datatoken,
    ProviderInstance,
    Nft,
    FixedRateExchange,
    approve,
    Aquarius
} = require("@oceanprotocol/lib");

// replace the did here
const did = "did:ope:d2f6714c6dc2e8ec2fe3b812033951fc39e25452fe0e1a297d824c10e415e701";

// This function takes did as a parameter and updates the data NFT information
const consumeAsset = async (did) => {
    const config = await oceanConfig();
    const consumer = config.consumerAccount;

    // Fetch ddo from Aquarius
    const aquarius = new Aquarius('https://ocean-node-vm3.oceanenterprise.io');
    console.log('aquarius', aquarius);
    console.log("Consuming asset with DID:", did);
    const asset = await aquarius.waitForIndexer(did, null, null, 4000, 100);
    console.log("Asset to consume:", asset);

    await approve(
        consumer,
        config,
        consumer.address,
        config.oceanTokenAddress,
        config.fixedRateExchangeAddress,
        "1"
    );

    console.log("Approved 1 OCEAN token for Fixed Rate Exchange");
    console.log("Creating FixedRateExchange instance...", config.fixedRateExchangeAddress);
    const fixedRate = new FixedRateExchange(
        config.fixedRateExchangeAddress,
        consumer
    );

    console.log('config.fixedRateId', config.fixedRateId);

    const txBuyDt = await fixedRate.buyDatatokens(
        config.fixedRateId,
        "1",
        "2"
    );

    console.log("Datatokens purchased, transaction:", txBuyDt);

    const initializeData = await ProviderInstance.initialize(
        asset.id,
        asset.services[0].id,
        0,
        consumer.address,
        config.providerUri
    );

    const providerFees = {
        providerFeeAddress: initializeData.providerFee.providerFeeAddress,
        providerFeeToken: initializeData.providerFee.providerFeeToken,
        providerFeeAmount: initializeData.providerFee.providerFeeAmount,
        v: initializeData.providerFee.v,
        r: initializeData.providerFee.r,
        s: initializeData.providerFee.s,
        providerData: initializeData.providerFee.providerData,
        validUntil: initializeData.providerFee.validUntil,
    };

    const datatoken = new Datatoken(consumer);

    const tx = await datatoken.startOrder(
        config.fixedRateExchangeAddress,
        consumer.address,
        0,
        providerFees
    );

    const orderTx = await tx.wait();
    const orderStartedTx = getEventFromTx(orderTx, "OrderStarted");
    console.log('orderStartedTx', orderStartedTx);
    const downloadURL = await ProviderInstance.getDownloadUrl(
        asset.id,
        asset.services[0].id,
        0,
        orderTx.transactionHash,
        config.providerUri,
        consumer
    );
    console.log("Download URL:", downloadURL);
};

// Call setMetadata(...) function defined above
consumeAsset(did).then(() => {
    process.exit();
}).catch((err) => {
    console.error(err);
    process.exit(1);
});