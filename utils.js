
function getEventFromTx(
  txReceipt,
  eventName
) {
  if (!txReceipt || !txReceipt.logs) {
    return undefined
  }
  const foundLog = txReceipt.events.filter((log) => {
    return log && log.event === eventName
  })[0]

  return foundLog
}


module.exports = {
  getEventFromTx,
};