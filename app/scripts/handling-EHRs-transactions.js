import Web3 from 'web3';
import artifact from '../../build/contracts/EHR.json';
import { handlingRecord } from '../scripts/handling-record-instances.js';
import { handlingAttachments } from '../scripts/handling-lab-attachments.js';


const d = new Date();
const App = {
    web3: null,
    accounts: null,
    instance: null,
    networkId: null,
    transactionHash: null,
    load: async () => {

        try {
            await App.loadWeb3();
            await App.loadAccount();
            await App.loadContract();
            await App.readDeployedContracts();
            await App.addRecordInstance();
            await App.addResultsLabAttachments();

        } catch (error) {
            console.log(error);

        }

    },

    loadWeb3: async () => {
        if (typeof web3 !== 'undefined') {
            App.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545/'));

        } else {
            window.alert("Please connect to Metamask.")
        }
        // Modern dapp browsers...
        if (window.ethereum) {
            window.web3 = new Web3(ethereum);
            await ethereum.enable();

            try {
                // Request account access if needed
                // Accounts now exposed
                App.web3.eth.sendTransaction({/* ... */ });
            } catch (error) {
                // User denied account access...
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {

            window.web3 = new Web3(web3.currentProvider);
            // Acccounts always exposed
            App.web3.eth.sendTransaction({/* ... */ });
        }
        // Non-dapp browsers...
        else {
            console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
        }
    },

    loadAccount: async () => {
        //set up account of blockchain
        App.accounts = await web3.eth.getAccounts();
        console.log(App.accounts);
    },

    loadContract: async () => {
        //create JS version of smart contract
        App.networkId = await web3.eth.net.getId();
        const deployedNetwork = artifact.networks[App.networkId];
        console.log(artifact);
        console.log(deployedNetwork);
        console.log(App.networkId);
        App.instance = new web3.eth.Contract(
            artifact.abi,
            deployedNetwork.address,
        );
        console.log(App.instance);
        console.log(App.instance.methods);
    },

    addRecordInstance: async () => { 
        $("#add-record-instance").off('click').on('click', async function (e) {
            e.preventDefault();
            // covert form to pdf and load file logic
            handlingRecord.encryptRecordBlob().then((encryptedRecordInstance) => {
                if(encryptedRecordInstance != null){
                    App.saveRecordInstance();
                }
            })
            
        })

    },
    addResultsLabAttachments: async () => {
        await handlingAttachments.initializeDropzoneFiles();
        await handlingAttachments.addAttachmentFiles();
        await handlingAttachments.removeAttachmentFiles();
        $("#add-lab-res").off('click').on('click', async function (e) {
            e.preventDefault();
            let encryptLabAttachments = await handlingAttachments.encryptLabAttachments();
            await App.saveLabResultsAttachments();
        })
    },
    saveLabResultsAttachments: async () => {
        handlingAttachments.patientName = $("#select-patient option:selected").html();
        handlingAttachments.patientEmail = $("#select-patient option:selected").val();
        handlingAttachments.facilitatorName = $("#facilitator-name").val();
        handlingAttachments.facilitatorEmail = $("#facilitator-email").val();
        handlingAttachments.facilitatorRole = "LabTechnician";
        let count = 0;
        for (const [index, file] of handlingAttachments.filesUploaded.entries()) {
            handlingAttachments.recordName = file.name;
            let content_hash = handlingAttachments.filesUploadedHashes[index];
            let added_date = d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate();
            App.instance.methods.add_record(handlingAttachments.patientName, handlingAttachments.patientEmail, handlingAttachments.facilitatorName, handlingAttachments.facilitatorRole,
                handlingAttachments.recordName, added_date, content_hash).send({ from: App.accounts[0], gas: 1000000, },
                    function (error, transactionHash) {
                        if(transactionHash){
                            count++;
                            App.transactionHash = transactionHash;
                        }
                        else {
                            $("<i class='p-2 mb-1 far fa-times-circle'></i>").insertBefore($('#attachment_key').find('h4'));
                            $('#attachment_key').find('h4').text( "Transaction Was Unsuccessful, Please Try Again" );

                        }
                    }).then(() => {
                        if(web3.eth.getTransactionReceipt(App.transactionHash.status)){
                            $("<i class='p-2 mb-1 far fa-check-circle'></i>").insertBefore($('#attachment_key').find('h4'));
                            $('#attachment_key').find('h4').text( "Transaction Has Been Successfully Added" );
                            
                        }
                        if(count === handlingAttachments.filesUploaded.length ){
                            location.reload();

                        }
                    })
        }

    },

    saveRecordInstance: async () => {
        try {
            let addedRecordInstance = await App.instance.methods;
            let added_date = d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate();
            //await handlingRecord.convertFormRecordToPdf();
            console.log('adding record');
            addedRecordInstance.add_record(handlingRecord.patientName, handlingRecord.patientEmail, handlingRecord.facilitatorName, "Physician",
                handlingRecord.recordName, added_date, handlingRecord.savedRecordHash).send({ from: App.accounts[0], gas: 1000000, },
                    function (error, transactionHash) {
                        if(transactionHash){

                            App.transactionHash = transactionHash;
                        }
                        else {
                            $("<i class='p-3 mb-4 far fa-times-circle'></i>").insertBefore($('#attachment_key').find('h4'));
                            $('#attachment_key').find('h4').text( "Transaction Was Unsuccessful, Please Try Again" );

                        }
                    }).then(() => {
                        if(web3.eth.getTransactionReceipt(App.transactionHash.status)){
                            $("<i class='p-3 mb-4 far fa-check-circle'></i>").insertBefore($('#attachment_key').find('h4'));
                            $('#attachment_key').find('h4').text( "Transaction Has Been Successfully Added" );
                        }
                    }) 
           

        }
        catch (error) {
            console.log(error);

        }
    },
    readDeployedContracts: async () => {
        let deployedRecordsIds = await App.instance.methods.getRecordIds.call();
        let ids = await deployedRecordsIds.call();
        console.log(ids);
        for (let i = 0; i <= deployedRecordsIds; i++) {
            renderPatientsHistory(i);
        }
    },
};



App.load();




