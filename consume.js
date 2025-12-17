// Note: Make sure .env file and config.js are created and setup correctly
const { oceanConfig } = require("./config.js");
const {
    ZERO_ADDRESS,
    NftFactory,
    getHash,
    ProviderFees,
    Datatoken,
    ProviderInstance,
    Nft,
    FixedRateExchange,
    approve
} = require("@oceanprotocol/lib");

// replace the did here
const did = "did:op:a419f07306d71f3357f8df74807d5d12bddd6bcd738eb0b461470c64859d6f0f";

// This function takes did as a parameter and updates the data NFT information
const consumeAsset = async(did) => {
    const consumer = await oceanConfig.consumerAccount.getAddress();

    // Fetch ddo from Aquarius
    const asset = await await oceanConfig.aquarius.resolve(did);

    const nft = new Nft(consumer);

    await approve(
        Error,
        oceanConfig,
        await consumer.getAddress(),
        oceanConfig.Ocean,
        oceanConfig.fixedRateExchangeAddress,
        "1"
    );

    const fixedRate = new FixedRateExchange(
        oceanConfig.fixedRateExchangeAddress,
        consumer
    );

    const txBuyDt = await fixedRate.buyDatatokens(
        oceanConfig.fixedRateId,
        "1",
        "2"
    );

    const initializeData = await ProviderInstance.initialize(
        asset.id,
        asset.services[0].id,
        0,
        await consumer.getAddress(),
        oceanConfig.providerUri
    );

    const providerFees: ProviderFees = {
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
        oceanConfig.fixedRateExchangeAddress,
        await consumer.getAddress(),
        0,
        providerFees
    );

    const orderTx = await tx.wait();
    const orderStartedTx = getEventFromTx(orderTx, "OrderStarted");

    const downloadURL = await ProviderInstance.getDownloadUrl(
        asset.id,
        asset.services[0].id,
        0,
        orderTx.transactionHash,
        oceanConfig.providerUri,
        consumer
    );
};

// Call setMetadata(...) function defined above
consumeAsset(did).then(() => {
    process.exit();
}).catch((err) => {
    console.error(err);
    process.exit(1);
});