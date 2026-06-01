const ABI = [
  "function goal() view returns (uint256)",
  "function totalRaised() view returns (uint256)",
  "function deadline() view returns (uint256)",
  "function getCampaignStatus() view returns (bool,bool,bool)",
  "function contribute() payable",
  "function withdrawIfGoalReached()",
  "function claimRefund()"
];

let provider;
let signer;
let contract;

const el = (id) => document.getElementById(id);
const log = (msg) => {
  el("logs").textContent = `[${new Date().toLocaleTimeString()}] ${msg}\n` + el("logs").textContent;
};

async function connect() {
  if (!window.ethereum) {
    log("MetaMask introuvable");
    return;
  }
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  el("account").textContent = await signer.getAddress();
  log("Wallet connecté");
}

function bindContract() {
  const address = el("contractAddress").value.trim();
  if (!address) throw new Error("Adresse contrat manquante");
  if (!signer) throw new Error("Connecte d'abord MetaMask");
  contract = new ethers.Contract(address, ABI, signer);
}

async function refresh() {
  try {
    bindContract();
    const [goal, raised, deadline, status] = await Promise.all([
      contract.goal(),
      contract.totalRaised(),
      contract.deadline(),
      contract.getCampaignStatus()
    ]);

    el("goal").textContent = ethers.formatEther(goal);
    el("raised").textContent = ethers.formatEther(raised);
    el("deadline").textContent = deadline.toString();

    const [isActive, isSuccessful, canRefund] = status;
    if (isActive) {
      el("status").textContent = "Campagne active";
      el("status").className = "status ok";
    } else if (isSuccessful) {
      el("status").textContent = "Objectif atteint (owner peut retirer)";
      el("status").className = "status ok";
    } else if (canRefund) {
      el("status").textContent = "Objectif non atteint (remboursement disponible)";
      el("status").className = "status warn";
    }
    log("Etat mis à jour");
  } catch (e) {
    log(`Erreur refresh: ${e.message}`);
  }
}

async function contribute() {
  try {
    bindContract();
    const amount = el("amount").value.trim();
    const tx = await contract.contribute({ value: ethers.parseEther(amount) });
    log(`Tx contribution envoyee: ${tx.hash}`);
    await tx.wait();
    log("Contribution confirmée");
    await refresh();
  } catch (e) {
    log(`Erreur contribution: ${e.shortMessage || e.message}`);
  }
}

async function withdraw() {
  try {
    bindContract();
    const tx = await contract.withdrawIfGoalReached();
    log(`Tx retrait envoyee: ${tx.hash}`);
    await tx.wait();
    log("Retrait owner confirmé");
    await refresh();
  } catch (e) {
    log(`Erreur retrait: ${e.shortMessage || e.message}`);
  }
}

async function refund() {
  try {
    bindContract();
    const tx = await contract.claimRefund();
    log(`Tx remboursement envoyee: ${tx.hash}`);
    await tx.wait();
    log("Remboursement confirmé");
    await refresh();
  } catch (e) {
    log(`Erreur remboursement: ${e.shortMessage || e.message}`);
  }
}

el("connectBtn").addEventListener("click", connect);
el("refreshBtn").addEventListener("click", refresh);
el("contributeBtn").addEventListener("click", contribute);
el("withdrawBtn").addEventListener("click", withdraw);
el("refundBtn").addEventListener("click", refund);
