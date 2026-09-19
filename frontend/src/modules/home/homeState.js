// Transient navigation flag: set to true ONLY when explicitly clicking "Home" from a subpage
let returnToCompletedHome = false;

export function getReturnToCompletedHome() {
  return returnToCompletedHome;
}

export function setReturnToCompletedHome(val = true) {
  returnToCompletedHome = val;
}
