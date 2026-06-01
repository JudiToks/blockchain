# Mini-Projet Blockchain (Crowdfunding On-Chain)

## 1. Informations generales

### Sujet choisi
**Crowdfunding on-chain**: collecte de fonds en ETH avec objectif et deadline.

### Regles metier
- Les utilisateurs contribuent en ETH avant la date limite.
- Si l'objectif est atteint apres la deadline: le owner retire les fonds.
- Si l'objectif n'est pas atteint: chaque contributeur recupere sa contribution.

### Contrat deployee (Sepolia)
- **Adresse contrat**: `0x57C059B53e733221317B6fE58d36d4A3d121a852`
- **Lien Etherscan**: https://sepolia.etherscan.io/address/0x57C059B53e733221317B6fE58d36d4A3d121a852

---

## 2. Critere 1 - Conception du contrat

### Ce qui est implemente
- Contrat principal: `contracts/Crowdfunding.sol`
- Variables d'etat claires:
  - `owner`, `goal`, `deadline`, `totalRaised`, `ownerWithdrawn`
  - `mapping(address => uint256) contributions`
- Fonctions metier bien separees:
  - `contribute()`
  - `withdrawIfGoalReached()`
  - `claimRefund()`
  - `getCampaignStatus()`
- Evenements pour tracer les actions importantes:
  - `ContributionReceived`
  - `OwnerWithdrawal`
  - `RefundClaimed`

### Pourquoi la conception est correcte
- La logique suit exactement le besoin metier du sujet.
- Les etats de campagne sont explicites (active, succes, remboursement).
- Les roles sont bien definis (owner vs contributeurs).

---

## 3. Critere 2 - Securite

### Mesures de securite appliquees
- Modifier `onlyOwner` pour proteger le retrait final.
- Verifications des preconditions (deadline, objectif, montant nul, double retrait).
- Gestion explicite des erreurs avec `custom errors`:
  - `NotOwner`, `CampaignEnded`, `CampaignNotEnded`, `GoalNotReached`, etc.
- Pattern **CEI** dans `claimRefund()`:
  - Checks -> Effects -> Interactions
  - Remise a zero de la contribution avant transfert.
- Verification du succes des transferts ETH via `call`.

### Risques limites par ce design
- Evite les retraits non autorises.
- Evite le double remboursement.
- Evite les appels invalides hors fenetre temporelle.

---

## 4. Critere 3 - Front-end fonctionnel

### Ce qui est implemente
- Front: `front/index.html` + `front/app.js`
- Connexion wallet via bouton **Connecter MetaMask**.
- Lecture contrat:
  - objectif
  - total leve
  - deadline
  - statut campagne
- Ecriture contrat:
  - contribution (`contribute`)
  - retrait owner (`withdrawIfGoalReached`)
  - remboursement (`claimRefund`)
- Zone de logs pour l'utilisateur:
  - hash des transactions
  - confirmations
  - messages d'erreurs lisibles

### UX
- Interface simple et claire.
- Bouton de rafraichissement d'etat.
- Separation des actions par sections.

---

## 5. Critere 4 - README & Repository

### Structure du repository
- `contracts/` : smart contract
- `test/` : tests unitaires Hardhat
- `scripts/` : script de deploiement
- `front/` : interface DApp
- `screenshots/` : captures ecran de preuve

### Instructions principales
```bash
npm install
npm run compile
npm test
npm run deploy:sepolia
```

### Configuration
- Fichier `.env`:
  - `SEPOLIA_RPC_URL`
  - `PRIVATE_KEY`

---

## 6. Bonus realises
- Tests unitaires Hardhat (`test/Crowdfunding.test.js`).
