const dial = document.querySelector<HTMLSelectElement>("#year-dial");
const lever = document.querySelector<HTMLButtonElement>("#lever");
const tray = document.querySelector<HTMLOutputElement>("#tray-result");
const machine = document.querySelector<HTMLElement>("#machine");

const coin = document.querySelector<HTMLButtonElement>("#coin");
const coinSlot = document.querySelector<HTMLElement>(".coin-slot");
const leverHint = document.querySelector<HTMLElement>("#lever-hint");

const needle = document.querySelector<SVGLineElement>("#gauge-needle");
const yearReadout = document.querySelector<HTMLOutputElement>("#gauge-year");
const prevButton = document.querySelector<HTMLButtonElement>("#year-prev");
const nextButton = document.querySelector<HTMLButtonElement>("#year-next");
const randomButton = document.querySelector<HTMLButtonElement>("#year-random");

// Give each decorative cog its own random starting angle so the cluster
// doesn't read as five copies of the same icon frozen mid-tooth-alignment.
// The spin keyframes rotate relative to this custom property, so a lever
// pull nudges each cog from its own random rest angle rather than snapping
// everything back to 0deg.
document.querySelectorAll<SVGGElement>(".cog-spin").forEach((cog) => {
  cog.style.setProperty("--cog-base-rotate", `${Math.random() * 360}deg`);
});

const collectedTable = document.querySelector<HTMLTableElement>("#collected-table");
const collectedBody = document.querySelector<HTMLElement>("#collected-body");
const collectedStatus = document.querySelector<HTMLElement>("#collected-status");

const COLLECTED_KEY = "dollar-machine:collected";

type Collected = Record<string, string>;

function loadCollected(): Collected {
  try {
    const raw = localStorage.getItem(COLLECTED_KEY);
    return raw ? (JSON.parse(raw) as Collected) : {};
  } catch {
    return {};
  }
}

function saveCollected(collected: Collected): void {
  try {
    localStorage.setItem(COLLECTED_KEY, JSON.stringify(collected));
  } catch {
    // Private browsing / quota / disabled storage — the session still works
    // in memory, it just won't survive a reload.
  }
}

let collected = loadCollected();

function renderCollected(): void {
  if (!collectedTable || !collectedBody) return;

  const allYears = Array.from(dial?.options ?? []).map((option) => option.value);
  collectedTable.hidden = allYears.length === 0;

  collectedBody.textContent = "";
  for (const year of allYears) {
    const row = document.createElement("tr");
    const yearCell = document.createElement("td");
    yearCell.textContent = year;
    const resultCell = document.createElement("td");

    const result = collected[year];
    if (result) {
      resultCell.textContent = result;
    } else {
      resultCell.textContent = "You haven't purchased anything this year yet!";
      resultCell.classList.add("collected-unseen");
      yearCell.classList.add("collected-unseen-year");
    }

    row.append(yearCell, resultCell);
    collectedBody.append(row);
  }
}

function recordPurchase(year: string, result: string): void {
  collected = { ...collected, [year]: result };
  saveCollected(collected);
  renderCollected();
  if (collectedStatus) collectedStatus.textContent = `Added ${year} to your collection.`;
}

renderCollected();

const SCARCITY_WORDS = ["nothing", "empty", "jam", "out of stock"];
const yearCount = dial?.options.length ?? 1;
const anglePerStep = yearCount > 1 ? 180 / (yearCount - 1) : 0;

function currentResult(): string {
  const option = dial?.selectedOptions[0];
  return option?.dataset.result ?? "";
}

function isScarce(result: string): boolean {
  const lower = result.toLowerCase();
  return SCARCITY_WORDS.some((word) => lower.includes(word));
}

function setIndex(newIndex: number): void {
  if (!dial) return;

  const index = Math.min(Math.max(newIndex, 0), yearCount - 1);
  dial.selectedIndex = index;

  const year = dial.selectedOptions[0]?.value ?? "";
  if (yearReadout) yearReadout.textContent = year;

  const rotateDeg = index * anglePerStep - 90;
  if (needle) needle.style.transform = `rotate(${rotateDeg}deg)`;

  if (prevButton) prevButton.disabled = index === 0;
  if (nextButton) nextButton.disabled = index === yearCount - 1;
}

let hintTimeout: number | undefined;

function showLeverHint(): void {
  if (!leverHint) return;

  leverHint.textContent = "Insert coin first";
  leverHint.classList.add("visible");

  clearTimeout(hintTimeout);
  hintTimeout = window.setTimeout(() => leverHint.classList.remove("visible"), 2500);
}

prevButton?.addEventListener("click", () => setIndex((dial?.selectedIndex ?? 0) - 1));
nextButton?.addEventListener("click", () => setIndex((dial?.selectedIndex ?? 0) + 1));
randomButton?.addEventListener("click", () => setIndex(Math.floor(Math.random() * yearCount)));

setIndex(dial?.selectedIndex ?? 0);

coin?.addEventListener("click", () => {
  if (!coinSlot || coin.classList.contains("coin-inserted")) return;

  // Measured at click-time (not baked into CSS) because the machine's width
  // — and so the pixel gap between the coin and the slot — differs a lot
  // between the 390px and 1920px viewports this gets marked at.
  const coinRect = coin.getBoundingClientRect();
  const slotRect = coinSlot.getBoundingClientRect();
  const dx = slotRect.left + slotRect.width / 2 - (coinRect.left + coinRect.width / 2);
  const dy = slotRect.top + slotRect.height / 2 - (coinRect.top + coinRect.height / 2);

  coin.style.setProperty("--coin-dx", `${dx}px`);
  coin.style.setProperty("--coin-dy", `${dy}px`);
  coin.classList.add("coin-inserted");
});

lever?.addEventListener("click", () => {
  if (!tray) return;

  if (!coin?.classList.contains("coin-inserted")) {
    showLeverHint();
    return;
  }

  const result = currentResult();
  machine?.classList.remove("machine-dispense", "machine-jam");
  // Force a reflow so the animation replays on repeated pulls of the same year.
  void machine?.offsetWidth;
  machine?.classList.add(isScarce(result) ? "machine-jam" : "machine-dispense");

  tray.textContent = `$1 in ${dial?.value} bought: ${result}.`;
  if (dial?.value) recordPurchase(dial.value, result);

  coin.classList.remove("coin-inserted");
});
