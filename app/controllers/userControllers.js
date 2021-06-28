const User = require('../modules/User');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545'));
const artifact = require('../../build/contracts/EHR.json');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const ObjectId = require('mongodb').ObjectID;
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({ host: 'localhost', port: '5001', protocol: 'http' });
const rsaWraper = require("../scripts/rsa-wrapper")
const aesWraper = require("../scripts/aes-wrapper")
const fs = require('fs')
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer')
const path = require('path')
const rimraf = require('rimraf');
const fsExtra = require('fs-extra')
const open = require('open');
const crypto = require('crypto'), algorithm = 'aes-256-ctr';
const submittedPatientKeys = '../submittedPatientKeys';
const encryptedFileFromIPFS = '../encryptedFileFromIPFS';
const decryptedRecordInstancesDir = '../decryptedMedicalRecordInstancesDir';
const submittedFacilitatorKeys = '../submittedFacilitatorKeys';

// register functionality
const register = function (req, res) {
    let privateKeysDir = "../privateKeysDir";
    let publicKeysDir = "../publicKeysDir";
    try {
        rsaWraper.generate();
        const publicKey = fs.readFileSync(path.resolve(__dirname, publicKeysDir, 'public.pem'))
        const privateKey = fs.readFileSync(path.resolve(__dirname, privateKeysDir, 'private.pem'))
        fs.writeFileSync(path.resolve(__dirname, privateKeysDir, req.body.name + '-private.txt'), privateKey)
        console.log(req.body)
        const user = new User({
            name: req.body.name,
            sex: req.body.sex,
            dateOfBirth: req.body.bday,
            email: req.body.email,
            accessList: req.body.accessList,
            password: req.body.password,
            role: req.body.role,
            publicKey: publicKey,
            hashOfSymmetric: rsaWraper.encrypt(publicKey, aesWraper.generateKey())

        });

        // assign errors variable to array or errors
        let errors = validationResult(req).array();

        // check if there are any errors then set errors session and flash with danger 
        if (errors.length > 0) {
            req.session.errors = errors;
            req.session.success = false;
            console.log(errors);
            req.flash('danger', errors);
            res.redirect('/user/register');
        } else {
            // hash password 
            bcrypt.genSalt(8, (err, salt) => {
                bcrypt.hash(user.password, salt, (error, hash) => {
                    if (error) {
                        console.log(error);
                        req.flash('danger', 'Registration failed');
                        res.redirect('/user/register');
                    }
                    else {
                        // if hashed correctly then register account
                        user.password = hash;
                        user.save(async (err, data) => {
                            if (err) {
                                 console.log(err);
                                req.flash('danger', 'Registration' + err);
                                res.redirect('/user/register');

                            }
                            else {
                                req.flash('success', 'Registration successful please login');
                                req.session.success = true;
                                let patientName = req.body.name;
                                let privateKey = fs.readFileSync(path.resolve(__dirname, privateKeysDir, patientName + '-private.txt'), 'utf8')
                                console.log(privateKey);
                                let emailResponse = await sendUserEmail(patientName, req.body.email, privateKey);
                                console.log(emailResponse);
                                res.redirect('/user/login')

                            }
                        });
                    }
                });

            });

        }

    } catch (error) {
        console.log(error);
        req.flash('danger', 'Registration failed');
        res.redirect('/user/register');

    } finally {
        setTimeout(() => {
            rimraf.sync(path.resolve(__dirname, privateKeysDir));
            rimraf.sync(path.resolve(__dirname, publicKeysDir));
        }, 5000)
    }


};

// login functionality
const login = function (req, res, next) {

}

async function sendUserEmail(name, email, privateKey) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: 'email',
            pass: 'pass'
        }
    });
    let mailOptions = {
        from: 'email',
        to: email,
        subject: 'Registration Confirmed',
        text: 'Hi ' + name + ' thank you for your registering in our services, here is your generated '
            + 'private key please key it safe as you will not be able to use our medical functionalities '
            + 'without it.\n \n' + privateKey
    }

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            return error;
        } else {
            return 'Email sent: ' + info.response;
        }
    });
}


const update = async function (req, res) {
    let user = {};
    user.name = req.body.name;
    user.email = req.body.email;
    user.sex = req.body.sex;
    user.dateOfBirth = req.body.bday;

    let query = { _id: req.params.id };

    let errors = validationResult(req).array();
    if (errors.length > 0) {
        req.session.errors = errors;
        req.flash('danger', errors);
        res.redirect('/user/' + req.user.role + '/profile/edit/' + req.user.id);
    } else {

        if (req.user.email === req.body.email) {
            User.update(query, user, (err, data) => {
                if (err) {
                    req.flash('danger', 'Registration' + err);
                    res.redirect('/user/' + req.user.role + '/profile/edit/' + req.user.id);

                }
                else {
                    req.flash('success', 'Update was successful');
                    res.redirect('/user/' + req.user.role + '/dashboard');
                }
            });
        }
        else if (req.user.email !== req.body.email) {
            User.find({ "email": req.body.email }).then(searchedUser => {
                if (searchedUser.length > 0) {
                    req.flash('danger', 'email already exist');
                    res.redirect('/user/' + req.user.role + '/profile/edit/' + req.user.id);
                }
                else {

                    User.updateOne(query, { '$set': user }, (err, data) => {
                        if (err) {
                            req.flash('danger', 'Registration' + err);
                            res.redirect('/user/' + req.user.role + '/profile/edit/' + req.user.id);

                        }
                        else {
                            req.flash('success', 'Update was successful');
                            res.redirect('/user/' + req.user.role + '/dashboard');
                        }
                    });
                }
            });


        }
    }
}

const getFacilitators = async function (req, res, next) {
    res.locals.title = "Access-control";
    let usersWithGrantedAccess = await getFacilitatorsAccessStatus(req.user.id);
    User.find({ "role": { $nin: "patient" } }, (err, queriedFacilitators) => {
        if (err) throw err;
        else {
            res.render('access-control', {
                queriedFacilitators: queriedFacilitators,
                usersWithGrantedAccess: usersWithGrantedAccess
            });
        }
    })
}

async function getPatientsInGrantedAccessList(userId) {
    let arrayOfUsersWithGrantedAccess = await User.find({ _id: ObjectId(userId) }, { accessList: 1 });
    let usersWithGrantedAccess = arrayOfUsersWithGrantedAccess[0].accessList;
    let listOfFacilitators = new Array();

    for (let index = 0; index < usersWithGrantedAccess.length; index++) {

        userId = Object.values(usersWithGrantedAccess[index].user_id)
        joinedUserId = userId.join("");
        listOfFacilitators.push(joinedUserId)

    }

    return listOfFacilitators
}

async function getFacilitatorsAccessStatus(userId) {
    let arrayOfUsersWithGrantedAccess = await User.find({ _id: userId }, { accessList: 1 });
    let usersWithGrantedAccess = arrayOfUsersWithGrantedAccess[0].accessList;
    listOfFacilitators = new Array();
    for (let index = 0; index < usersWithGrantedAccess.length; index++) {

        if (typeof (usersWithGrantedAccess) == 'undefined') {
            req.user.id = accessList[index].user_id;
        } else {
            userId = Object.values(usersWithGrantedAccess[index].user_id)
            joinedUserId = userId.join("");
            listOfFacilitators.push(joinedUserId)
        }
    }

    return listOfFacilitators
}
const handlingGrantingAccessControl = async function (req, res, next) {
    User.find({ _id: ObjectId(req.user.id), accessList: { $eq: ObjectId(req.params.id) } }, { hashOfSymmetric: 1 }).then(async searchedUser => {
        if (searchedUser.length > 0) {
            req.flash('danger', 'Access already Granted');
            res.redirect('/user/patient/access-control');
        }
        else {
            let submittedKeysDir = '../submittedKeys';
            try {
                let patientInfo = await User.find({ _id: req.user.id });
                let facilitatorInfo = await User.find({ _id: req.params.id });
                if (!fs.existsSync(path.resolve(__dirname, submittedKeysDir))) {
                    fs.mkdirSync(path.resolve(__dirname, submittedKeysDir));
                }
                fs.writeFileSync(path.resolve(__dirname, submittedKeysDir, patientInfo[0].name + '-private.pem'), req.body.keyArea);
                const patientPrivateKey = await readFacilitatorPrivateKey(patientInfo, submittedKeysDir);
                const patientHashOfSymmetricKey = Object.values(patientInfo[0].hashOfSymmetric).join("");
                const facilitatorPublicKey = Object.values(facilitatorInfo[0].publicKey).join("");
                const plainSymmetricKey = rsaWraper.decrypt(patientPrivateKey, patientHashOfSymmetricKey)
                const hashKeyofFacilitator = rsaWraper.encrypt(facilitatorPublicKey, plainSymmetricKey)
                User.updateOne({ _id: ObjectId(req.user.id) },
                    { $addToSet: { accessList: { user_id: req.params.id, hashedkey: hashKeyofFacilitator } } }
                    , (err, data) => {
                        if (err) {
                            req.flash('danger', 'Request failed please try again');
                            res.redirect('/user/patient/access-control');
                        }
                    }).then(() => {
                        User.updateOne({ _id: ObjectId(req.params.id) },
                            { $addToSet: { accessList: { user_id: req.user.id, hashedkey: hashKeyofFacilitator } } }
                            , (err, data) => {
                                if (err) {
                                    req.flash('danger', 'Request failed please try again');
                                    res.redirect('/user/patient/access-control');
                                }
                                else {
                                    req.flash('success', 'Access successfully granted to user ' + req.params.id);
                                    res.redirect('/user/patient/access-control');
                                }
                            })
                    })
            } catch (error) {
                req.flash('danger', 'Request failed please try again');
                res.redirect('/user/patient/access-control');
            } finally {
                rimraf.sync(path.resolve(__dirname, submittedKeysDir));

            }


        }

    });
}


async function readFacilitatorPrivateKey(facilitatorInfo, submittedFacilitatorKeysDir) {
    return new Promise(async (resolve, reject) => {
        fs.readFile(path.resolve(__dirname, submittedFacilitatorKeysDir, facilitatorInfo[0].name + '-private.pem'), (err, data) => {
            resolve(data);
        });
    })
}


// upload attachments for lab technician and handle them 
const uploadLabAttachment = function (req, res) {
    const filePath = fs.readFileSync(req.files[0].path)
    let root = path.dirname(require.main.filename);
    let newPath = root + "/uploads/" + req.files[0].originalname;
    fs.writeFileSync(newPath, filePath)
    res.status(204);
    res.send();
}

const removeLabAttachment = function (req, res) {

    fs.unlinkSync(path.resolve(__dirname, '../uploads', req.params.file));
}


const handlingRemovingAccessControl = function (req, res, next) {

    User.find({ _id: ObjectId(req.user.id) }).then(searchedUser => {
        if (searchedUser.length == 0) {
            req.flash('danger', 'Access already Removed');
            res.redirect('/user/patient/access-control');
        }
        else {
            User.updateOne({ _id: ObjectId(req.user.id) },
                { $pull: { accessList: { user_id: req.params.id } } }
                , (err, data) => {
                    if (err) {
                        req.flash('danger', 'Request failed please try again');
                        res.redirect('/user/patient/access-control');
                    }
                }).then(() => {
                    User.updateOne({ _id: ObjectId(req.params.id) },
                        { $pull: { accessList: { user_id: req.user.id } } }
                        , (err, data) => {
                            if (err) {
                                req.flash('danger', 'Request failed please try again');
                                res.redirect('/user/patient/access-control');
                            }
                            else {
                                req.flash('success', 'Access successfully removed from user ' + req.params.id);
                                res.redirect('/user/patient/access-control');
                            }
                        })
                })

        }
    });
}
async function getFacilitatorAuthorizedPatients(patientsWithGrantedAccess) {

    let patientsEmails = [];
    if (patientsWithGrantedAccess.length > 0) {
        for (const patient of patientsWithGrantedAccess) {
            const queriedPatient = await User.find({ _id: ObjectId(patient) }, { name: 1, email: 1 })
            patientsEmails.push(queriedPatient[0]);
        }
    }
    return patientsEmails;
};

const retrievingPatientsEmails = async function (req, res, next) {
    try {
        let patientsWithGrantedAccess = await getPatientsInGrantedAccessList(req.user.id);
        let facilitatorAuthorizedPatientsEmails = await getFacilitatorAuthorizedPatients(patientsWithGrantedAccess);
        if (patientsWithGrantedAccess.length == 0) {
            req.flash('danger', 'No Patients Available');
            res.redirect('/user/' + req.user.role + '/dashboard/');
        }
        else {

            if (req.user.role === 'physician') {
                res.locals.title = "Create-ehr";
                res.render('create-ehr', {
                    facilitatorAuthorizedPatientsEmails: facilitatorAuthorizedPatientsEmails,
                    facilitator_name: req.user.name,
                    facilitator_email: req.user.email,
                });
            }
            else if (req.user.role === 'labTechnician') {
                res.locals.title = "Add-lab-results";
                res.render('add-lab-results', {
                    facilitatorAuthorizedPatientsEmails: facilitatorAuthorizedPatientsEmails,
                    facilitator_name: req.user.name,
                    facilitator_email: req.user.email
                });
            }
        }

    } catch (error) {
        console.log(error);
        req.flash('danger', 'No Patients Available');
        res.redirect('/user/' + req.user.role + '/dashboard/');
    }
}

async function getLengthOfAddedRecords() {
    let contractInstance = await getEHRContractInstance();
    let recordIds = await contractInstance.methods.getRecordIds().call();
    return recordIds.length;

}

async function getPatientMedicalRecords(email, recordsLength) {
    let contractInstance = await getEHRContractInstance();
    let EHR = [];
    return new Promise(async (resolve, reject) => {
        for (let i = 1; i <= recordsLength; i++) {

            if (recordsLength > 0) {
                try {

                    let patientMedicalRecordInstance = await contractInstance.methods.get_record(i).call();
                    if (patientMedicalRecordInstance[2] === email) {
                        EHR.push(patientMedicalRecordInstance);
                    }

                } catch (error) {
                    reject('No Records Found');
                }
            }

        }
        resolve(EHR);
    });


}


const retrievePatientMedicalHistory = async function (req, res, next) {
    try {

        let recordsLength = await getLengthOfAddedRecords();
        let patientEHR = await getPatientMedicalRecords(req.user.email, recordsLength);
        res.locals.title = "Patient Medical History";
        res.render('view-patient-medical-history', {
            patientEHR: patientEHR
        });

    } catch (error) {
        console.log(error);
        req.flash('danger', 'No Patients Available');
        res.redirect('/user/' + req.user.role + '/dashboard/');

    }

}


const retrievePatientsMedicalHistory = async function (req, res, next) {
    res.locals.title = "Patient Medical History";
    try {
        let patientsEHR = await loopThoughPatientMedicalRecords(req.user.id);
        if (patientsEHR[0].length > 0) {
            res.render('view-patients-medical-history', {
                patientsEHR: patientsEHR[0],
                patientsNames: patientsEHR[1]
            });
        }
        else if (patientsEHR[0].length === 0) {
            req.flash('danger', 'No Patients Available');
            res.redirect('/user/' + req.user.role + '/dashboard/');
        }

    } catch (error) {
        req.flash('danger', 'No Patients Available');
        res.redirect('/user/' + req.user.role + '/dashboard/');

    }

}

async function loopThoughPatientMedicalRecords(userId) {
    let recordsLength = await getLengthOfAddedRecords();
    let patientsInGrantedAccess = await getPatientsInGrantedAccessList(userId);
    let facilitatorAuthorizedPatientsEmails = await getFacilitatorAuthorizedPatients(patientsInGrantedAccess);
    let patientsEHR = [];
    let patientsNames = [];
    let allPatientsEHRResult = new Promise((resolve, reject) => {
        if (facilitatorAuthorizedPatientsEmails.length > 0) {
            facilitatorAuthorizedPatientsEmails.forEach(async (patient, index, array) => {
                let patientEHR = await getPatientMedicalRecords(patient.email, recordsLength);
                patientsEHR.push(patientEHR);
                patientsNames.push(patient.name);
                if (index === array.length - 1) {
                    resolve([patientsEHR, patientsNames]);
                }
            });
        }
        else {
            reject("Not found");
        }
    });

    let EHR = await allPatientsEHRResult;
    return EHR;
}

async function getEHRContractInstance() {
    let networkId = await web3.eth.net.getId();
    const deployedNetwork = artifact.networks[networkId];
    let contractInstance = new web3.eth.Contract(
        artifact.abi,
        deployedNetwork.address,
    );
    return contractInstance;

}

const encryptRecordInstance = async function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ errors: errors.array(), success: false, msg: 'Check Parameters' });
    }
    let facilitator = await User.find({ email: req.body.facilitatorEmail });
    if (!facilitator) {
        res.send({ error: "Error during creation please try again" });
    }
    else {
        let submittedPhysicianKeysDir = '../submittedPhysicianKeys';
        let recordInstancesDir = '../createdMedicalRecordInstancesDir';
        let encryptedRecordInstancesDir = '../encryptedMedicalRecordInstancesDir';
        try {
            if (!fs.existsSync(path.resolve(__dirname, submittedPhysicianKeysDir))) {
                fs.mkdirSync(path.resolve(__dirname, submittedPhysicianKeysDir));
            }
            if (!fs.existsSync(path.resolve(__dirname, recordInstancesDir))) {
                fs.mkdirSync(path.resolve(__dirname, recordInstancesDir));
            }
            if (!fs.existsSync(path.resolve(__dirname, encryptedRecordInstancesDir))) {
                fs.mkdirSync(path.resolve(__dirname, encryptedRecordInstancesDir));
            }
            let patientInfo = await User.find({ email: req.body.patientEmail });
            let selectedPatientHashedKey = await getSelectedPatientHashedKey(facilitator, patientInfo);
            fs.writeFileSync(path.resolve(__dirname, submittedPhysicianKeysDir, facilitator[0].name + '-private.pem'), req.body.keyArea);
            let physicianPrivateKey = await readFacilitatorPrivateKey(facilitator, submittedPhysicianKeysDir);
            let plainSymmetricKey = rsaWraper.decrypt(physicianPrivateKey, selectedPatientHashedKey)
            let createdRecordInstance = await convertRecordInstanceToPdf(req.body, recordInstancesDir);
            let encryptedFile = await encryptFile(plainSymmetricKey, recordInstancesDir, encryptedRecordInstancesDir, req.body.recordName)
            let recordInstanceCID = await getFileCIDFromIPFS(encryptedFile);
            res.send(recordInstanceCID);

        }
        catch (error) {
            res.send({ error: 'Key Entered Is Invalid, please try again' });
        } finally {
            rimraf.sync(path.resolve(__dirname, submittedPhysicianKeysDir));
            rimraf.sync(path.resolve(__dirname, recordInstancesDir));
            rimraf.sync(path.resolve(__dirname, encryptedRecordInstancesDir));
        }
    }
}

const viewPatientsEHR = async function (req, res, next) {
    let facilitatorInfo = await User.find({ _id: ObjectId(req.user.id) });
    let patientInfo = await User.find({ email: req.body.patientEmail });
    try {
        if (!fs.existsSync(path.resolve(__dirname, submittedFacilitatorKeys))) {
            fs.mkdirSync(path.resolve(__dirname, submittedFacilitatorKeys));
        }
        if (!fs.existsSync(path.resolve(__dirname, encryptedFileFromIPFS))) {
            fs.mkdirSync(path.resolve(__dirname, encryptedFileFromIPFS));
        }
        if (!fs.existsSync(path.resolve(__dirname, decryptedRecordInstancesDir))) {
            fs.mkdirSync(path.resolve(__dirname, decryptedRecordInstancesDir));
        }
        fs.writeFileSync(path.resolve(__dirname, submittedFacilitatorKeys, facilitatorInfo[0].name + '-private.pem'), req.body.providedKey);
        let patientEncryptedHash = await getSelectedPatientHashedKey(facilitatorInfo, patientInfo);
        let facilitatorPrivateKey = await readFacilitatorPrivateKey(facilitatorInfo, submittedFacilitatorKeys);
        let plainSymmetricKey = rsaWraper.decrypt(facilitatorPrivateKey, patientEncryptedHash);
        let encryptedFile = await getFileFromIPFS(req.body.encryptedRecordHash, req.body.recordName, encryptedFileFromIPFS);
        let decryptedRecordInstance = await decryptFile(plainSymmetricKey, req.body.recordName, encryptedFile, encryptedFileFromIPFS, decryptedRecordInstancesDir);
        open(decryptedRecordInstance[1], { wait: true });
        encryptedRecordInstance = fs.open(path.resolve(__dirname, encryptedFileFromIPFS, req.body.recordName), 'w', (err, fd) => {
            fs.close(fd, (err) => {
                try {
                    res.send('success')
                } catch (error) {
                    res.send({ error: 'Error, please close files and try again' })
                }

            })

        });
    }
    catch (error) {
        if (error.code === 'UNKNOWN') {
            res.send({ error: 'File Is Already Opened' });
        }
        else {
            res.send({ error: 'Key Entered Is Invalid, please try again' });
        }
        console.log(error)
    } finally {
        setTimeout(() => {
            try {} catch (error) {}
        }, 500);
        setTimeout(() => {
            try {
                rimraf.sync(path.resolve(__dirname, submittedPatientKeys));
            } catch (error) {
                console.log(error);
            }
        }, 2500);

    }

}

const viewPatientEHR = async function (req, res, next) {
    let patientInfo = await User.find({ email: req.body.patientEmail });
    let encryptedRecordInstance;
    try {
        if (!fs.existsSync(path.resolve(__dirname, submittedPatientKeys))) {
            fs.mkdirSync(path.resolve(__dirname, submittedPatientKeys));
        }
        if (!fs.existsSync(path.resolve(__dirname, encryptedFileFromIPFS))) {
            fs.mkdirSync(path.resolve(__dirname, encryptedFileFromIPFS));
        }
        if (!fs.existsSync(path.resolve(__dirname, decryptedRecordInstancesDir))) {
            fs.mkdirSync(path.resolve(__dirname, decryptedRecordInstancesDir));
        }
        fs.writeFileSync(path.resolve(__dirname, submittedPatientKeys, patientInfo[0].name + '-private.pem'), req.body.providedKey);
        let patientEncryptedHash = Object.values(patientInfo[0].hashOfSymmetric).join("");
        let patientPrivateKey = await readFacilitatorPrivateKey(patientInfo, submittedPatientKeys);
        let plainSymmetricKey = rsaWraper.decrypt(patientPrivateKey, patientEncryptedHash);
        let encryptedFile = await getFileFromIPFS(req.body.encryptedRecordHash, req.body.recordName, encryptedFileFromIPFS);
        let decryptedRecordInstance = await decryptFile(plainSymmetricKey, req.body.recordName, encryptedFile, encryptedFileFromIPFS, decryptedRecordInstancesDir);
        open(decryptedRecordInstance[1], { wait: true });
        encryptedRecordInstance = fs.open(path.resolve(__dirname, encryptedFileFromIPFS, req.body.recordName), 'w', (err, fd) => {
            fs.close(fd, (err) => {
                try {
                    res.send('success')
                } catch (error) {
                    res.send({ error: 'Error, please close files and try again' })
                }

            })

        });


    }
    catch (error) {
        if (error.code === 'UNKNOWN') {
            res.send({ error: 'File Is Already Opened' });
        }
        else {
            res.send({ error: 'Key Entered Is Invalid, please try again' });
        }
        console.log(error)
    } finally {
        setTimeout(() => {
            try {} catch (error) {}
        }, 500);
        setTimeout(() => {
            try {
                rimraf.sync(path.resolve(__dirname, submittedPatientKeys));
            } catch (error) {
                console.log(error);
            }
        }, 2500);

    }
}



const encryptLabAttachments = async function (req, res, next) {
    const acceptedFileExtensions = ['jpg', 'pdf', 'png', 'svg', 'jpeg'];
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ errors: errors.array(), success: false, msg: 'Check Parameters' });
    }
    if (req.files.length === 0) {
        return res.send({ error: 'No file was attached' });
    }
    if (req.files.length > 5) {
        return res.send({ error: 'Maximum lab attachments must not exceed 5' });
    }
    req.files.forEach(file => {
        if (!acceptedFileExtensions.includes(file.originalname.split(".")[1])) {
            return res.send({ error: 'One file uploaded is not of format (JPG, PDF, PNG, SVG, JPEG)' });
        }
    })

    let hashedLabAttachments = [];
    let uploadedLabAttachments = req.files;
    let facilitatorInfo = await User.find({ email: req.body.facilitatorEmail });
    let patientInfo = await User.find({ email: req.body.patientEmail });
    if (!facilitatorInfo.length > 0 && !patientInfo.length > 0) {
        res.send({ error: 'Patient/Facilitator does not exist' });
    }
    else {
        let submittedLabTechnicianKeysDir = '../submittedLabTechnicianKeys';
        let encryptedLabAttachmentsDir = '../encryptedMedicalRecordInstancesDir';
        let submittedLabTechnicianAttachments = '../uploads';
        try {
            if (!fs.existsSync(path.resolve(__dirname, submittedLabTechnicianKeysDir))) {
                fs.mkdirSync(path.resolve(__dirname, submittedLabTechnicianKeysDir));
            }
            if (!fs.existsSync(path.resolve(__dirname, encryptedLabAttachmentsDir))) {
                fs.mkdirSync(path.resolve(__dirname, encryptedLabAttachmentsDir));
            }
            let selectedPatientHashedKey = await getSelectedPatientHashedKey(facilitatorInfo, patientInfo);
            fs.writeFileSync(path.resolve(__dirname, submittedLabTechnicianKeysDir, facilitatorInfo[0].name + '-private.pem'), req.body.providedKey);
            let labTechnicianPrivateKey = await readFacilitatorPrivateKey(facilitatorInfo, submittedLabTechnicianKeysDir);
            let plainSymmetricKey = rsaWraper.decrypt(labTechnicianPrivateKey, selectedPatientHashedKey);
            for (const [index, file] of uploadedLabAttachments.entries()) {
                const labAttachment = fs.readFileSync(path.resolve(__dirname, submittedLabTechnicianAttachments, req.files[index].originalname));
                const encryptedFile = await encryptFile(plainSymmetricKey, submittedLabTechnicianAttachments, encryptedLabAttachmentsDir, req.files[index].originalname);
                let attachmentCID = await getFileCIDFromIPFS(encryptedFile);
                hashedLabAttachments.push(attachmentCID);
            }

            res.send(hashedLabAttachments);

        } catch (error) {
            console.log(error);
            res.send({ error: 'Key Entered Is Invalid, please try again' });
        } finally {
            rimraf.sync(path.resolve(__dirname, submittedLabTechnicianKeysDir));
            rimraf.sync(path.resolve(__dirname, encryptedLabAttachmentsDir));
            fsExtra.emptyDirSync(path.resolve(__dirname, submittedLabTechnicianAttachments));
        }

    }
}

async function encryptFile(KEY, recordInstancesDir, encryptedRecordInstancesDir, fileName) {
    return new Promise((resolve, reject) => {
        let encryptCipher = crypto.createCipher('aes-256-ctr', KEY);
        const readRecordInstanceStream = fs.createReadStream(path.resolve(__dirname, recordInstancesDir, fileName))
        const output = fs.createWriteStream(path.resolve(__dirname, encryptedRecordInstancesDir, fileName));
        readRecordInstanceStream.pipe(encryptCipher).pipe(output).on('finish', () => {
            const encryptRecordInstance = fs.readFileSync(path.resolve(__dirname, encryptedRecordInstancesDir, fileName));
            resolve(encryptRecordInstance);
        })

    })
}

async function convertRecordInstanceToPdf(recordInfo, recordInstancesDir) {
    return new Promise((resolve, reject) => {
        let record = fs.readFileSync(path.resolve(__dirname + '/../assets/img/pdf.png'));
        let doc = new PDFDocument({
            autoFirstPage: false,
            margins: { // by default, all are 72
                top: 10,
                bottom: 10,
                left: 125,
                right: 10
            }
        });
        let img = doc.openImage(record);
        doc.addPage({ size: [img.width, img.height] })
        doc.fontSize(30);
        doc.image(img, 0, 0)
        doc.text(recordInfo.patientName, 67, 338);
        doc.text(recordInfo.blood, 67, 448);
        doc.text(recordInfo.avgBpm, 67, 576);
        doc.text(recordInfo.activityLevel, 67, 688);
        doc.text(recordInfo.height, 563, 450);
        doc.text(recordInfo.weight, 869, 450);
        doc.text(recordInfo.bloodPressure, 563, 575);
        doc.text(recordInfo.temperature, 562, 685);
        doc.text(recordInfo.primaryDiagnosis, 67, 947, {
            width: 1008
        });
        doc.text(recordInfo.symptoms, 67, 1507, {
            width: 410
        });
        doc.text(recordInfo.illnessAndDiseases, 662, 1507, {
            width: 410
        });
        doc.text(recordInfo.diagnosisNotes, 67, 1954, {
            width: 1008
        });
        doc.text(recordInfo.labTreatments, 67, 2436, {
            width: 410
        });
        doc.text(recordInfo.medications, 621, 2438, {
            width: 410
        });
        doc.text(recordInfo.treatmentNotes, 67, 2894, {
            width: 1008
        });
        let readRecordInstanceStream = fs.createWriteStream(path.resolve(__dirname, recordInstancesDir, recordInfo.recordName))
        doc.pipe(readRecordInstanceStream);
        doc.end();
        readRecordInstanceStream.on('finish', () => {
            resolve('done');
        })

    })

}

async function getSelectedPatientHashedKey(facilitator, patientInfo) {
    let facilitatorAccessList = facilitator[0].accessList;
    let hashedKeyForSelectedPatient = "";
    facilitatorAccessList.forEach(patient => {
        if (patient.user_id == patientInfo[0]._id) {
            hashedKeyForSelectedPatient += patient.hashedkey;
        }
    })

    return hashedKeyForSelectedPatient
}

async function decryptFile(KEY, recordName, fileBLOB, encryptedFileFromIPFS, decryptedRecordInstancesDir) {
    return new Promise((resolve, reject) => {
        let decryptionCipher = crypto.createDecipher('aes-256-ctr', KEY);
        const readRecordInstanceStream = fs.createReadStream(path.resolve(__dirname, encryptedFileFromIPFS, recordName));
        const output = fs.createWriteStream(path.resolve(__dirname, decryptedRecordInstancesDir, recordName));
        readRecordInstanceStream.pipe(decryptionCipher).pipe(output).on('finish', () => {
            let decryptedRecordInstance = fs.readFileSync(path.resolve(__dirname, decryptedRecordInstancesDir, recordName));
            resolve([decryptedRecordInstance, path.resolve(__dirname, decryptedRecordInstancesDir, recordName)])

        }).on('error', error => {
            reject(error);
        });
    })
}

async function getFileCIDFromIPFS(file) {
    let asyncIterableFile = await ipfs.add(file);
    for await (let file of asyncIterableFile)
        return file.path;

}

async function getFileFromIPFS(id, recordName, encryptedFileFromIPFS) {
    const chunks = []
    for await (const chunk of ipfs.cat(id)) {
        chunks.push(chunk);
    }
    fs.writeFileSync(path.resolve(__dirname, encryptedFileFromIPFS, recordName), Buffer.concat(chunks));
    let recordInstance = fs.readFileSync(path.resolve(__dirname, encryptedFileFromIPFS, recordName));
    return recordInstance

}

function unlinkDir() {
    if (fs.existsSync(path.resolve(__dirname, submittedFacilitatorKeys))) {
        rimraf.sync(path.resolve(__dirname, submittedFacilitatorKeys));
    }
    if (fs.existsSync(path.resolve(__dirname, submittedPatientKeys))) {
        rimraf.sync(path.resolve(__dirname, submittedPatientKeys));
    }
    if (fs.existsSync(path.resolve(__dirname, encryptedFileFromIPFS))) {
        //rimraf.sync(path.resolve(__dirname, encryptedFileFromIPFS));
        rmDir(path.resolve(__dirname, encryptedFileFromIPFS));

    }
    if (fs.existsSync(path.resolve(__dirname, decryptedRecordInstancesDir))) {
        rimraf.sync(path.resolve(__dirname, decryptedRecordInstancesDir));
    }
}

rmDir = function (dirPath) {
    try {
        var files = fs.readdirSync(dirPath);
        console.log(fs.readdirSync(dirPath));
    }
    catch (e) {
        console.log(e);
        return;
    }
    if (files.length > 0) {
        for (var i = 0; i < files.length; i++) {
            var filePath = dirPath + '/' + files[i];
            try {
                if (fs.statSync(filePath).isFile()) {
                    fs.close(i);
                    fs.unlinkSync(filePath);
                }
            } catch (error) {
                console.log(error);
            }

        }
    }
};


module.exports = {
    register: register,
    login: login,
    update: update,
    getFacilitators: getFacilitators,
    retrievePatientMedicalHistory: retrievePatientMedicalHistory,
    retrievePatientsMedicalHistory: retrievePatientsMedicalHistory,
    retrievingPatientsEmails: retrievingPatientsEmails,
    uploadLabAttachment: uploadLabAttachment,
    removeLabAttachment: removeLabAttachment,
    encryptRecordInstance: encryptRecordInstance,
    encryptLabAttachments: encryptLabAttachments,
    handlingGrantingAccessControl: handlingGrantingAccessControl,
    handlingRemovingAccessControl: handlingRemovingAccessControl,
    viewPatientEHR: viewPatientEHR,
    viewPatientsEHR: viewPatientsEHR,
    unlinkDir: unlinkDir
}
