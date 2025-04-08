template Vote() {
  signal private input voterId;
  signal output isEligible;
  
  var legitimate = 0;
  if (voterId <= 1000 && voterId > 0) {
    legitimate = 1;
  }
  isEligible <== legitimate;
}

component main = Vote();