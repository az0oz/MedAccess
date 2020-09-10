# MedAccess
Graduation project focused on developing a decentralized application using Web3.js, IPFS, Metamak, (IPFS), jQuery, Bootstrap, NodeJS, MongoDB and webpack. The project utlized an off-chain solution (IPFS) to reduce medical records overall costs, by having the actual content of each medical record stored on the IPFS using IPFS-HTTP-CLIENT NodeJS library, then the reference of the content of the CID yielded by the IPFS, is stored in the blockchain in a form of smart contracts via Web3. Each record instance is created/attached by physicians or lab-technician, then signed via metamask by web3 and stored locally on Ganache. Consequently, the record is encrypted using the symmetric AES-256-bit encryption handled in NodeJs backend using the crypto.js library. Moreover, a public-key RSA cryptography would then be applied to govern an asymmetric key encryption. Hence, facilitators e.g. physician/lab technicians of the system would be able to view the medical record only if patients with possessed private key can grant or remove access from desired facilitators. The project was developed in a local blockchain enviroment using Ganache and truffle mimicking an actual real blockchain enviroment.

## Prerequisites

```
Install node-JS.
Install Git (optional for cloning).
Install MongoDB with any provider.
Install Metamask in Chrome or Firefox
```

## Installing

```
In Git Bash you need to run the following command
git clone https://gitlab.com/Abdulaziz_Lamoli/medacess.git
Or you can download the project as zip directly.
```

```
once the project downloaded into the system you need to run the following command:
npm install
create .env file and type DB_CONNECTION=<mongo_connection_link>
```

## Deployment


All the project is served from the ./app dir folder, to deploy the project in your computer you need to open 4 CLI terminals and run the following commands:

```
The first terminal:
cd app
npm run dev
```

```
The second terminal:
cd app
download go-ipfs cli https://dist.ipfs.io/#go-ipfs
paste inside app dir then
cd go-ipfs    
.\ipfs daemon
"this command to run as a peer in the ipfs network"
```

```
The third terminal:
cd app
truffle develop "this command generate ten free accounts with 100ETH for testing the blockchain"
```

```
The fourth terminal:
truffle migrate
```

```
After running these commands, you need to go the browser and type 
http://localhost:2000/home
Then you will see the Metamask provider prompt you to connect the blockchain with your accounts, you must agree to this connection to facilitate the smart contracts manipulations with the local blockchain.
In the fourth terminal there are 10 generated accounts with privates keys, you can take any and and add it to your Metamask account via import account option.
```
