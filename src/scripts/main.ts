const dial = document.querySelector<HTMLSelectElement>("#year-dial");
const lever = document.querySelector<HTMLButtonElement>("#lever");
const tray = document.querySelector<HTMLOutputElement>("#tray-result");
const machine = document.querySelector<HTMLElement>("#machine");

const SCARCITY_WORDS = ["nothing", "empty", "jam", "out of stock"];

function currentResult(): string {
  const option = dial?.selectedOptions[0];
  return option?.dataset.result ?? "";
}

function isScarce(result: string): boolean {
  const lower = result.toLowerCase();
  return SCARCITY_WORDS.some((word) => lower.includes(word));
}

lever?.addEventListener("click", () => {
  if (!tray) return;

  const result = currentResult();
  machine?.classList.remove("machine-dispense", "machine-jam");
  // Force a reflow so the animation replays on repeated pulls of the same year.
  void machine?.offsetWidth;
  machine?.classList.add(isScarce(result) ? "machine-jam" : "machine-dispense");

  tray.textContent = `$1 in ${dial?.value} bought: ${result}.`;
});
