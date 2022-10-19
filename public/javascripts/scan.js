function onScanSuccess(qrCodeMessage) {
    document.getElementById('result').value = qrCodeMessage;
}
function onScanError(errorMessage) {
  //handle scan error
}