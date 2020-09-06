const express = require('express');
const router = express.Router();
const User = require('../modules/User');
const userControllers = require('../controllers/userControllers');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const moment = require('moment');
let urlencodedParser = bodyParser.urlencoded({ extended: false })
const passport = require('passport');
const multer = require('multer');
const path = require('path')
const fs = require('fs');
const rimraf = require('rimraf');

//general routes for all users
router.get('/register', (req, res) => {
    res.locals.title = "Registration";
    res.render('registration');
});

router.get('/login', (req, res) => {
    res.locals.title = "Login";
    res.render('login');
    
});
router.get('/logout', (req, res) => {
    try {
        userControllers.unlinkDir()
        req.logout();
        req.flash('success', 'You are logged out');
        res.redirect('/user/login');
        
    } catch (error) {
        req.flash('danger', 'Please Close All Opened Files');
        res.redirect('/user/'+ req.user.role + '/dashboard');

    }
  
    
});


router.post('/register', urlencodedParser, [
    
    //front-end validation
    
    //check name
    check('name')
    .not()
    .isEmpty()
    .withMessage('Name is required'),
    // email must be an email
    check('email')
    .isEmail()
    .withMessage('must be a valid email'),
    // password must be at least 8 chars long, not common, and contain characters
    check('password')
    .not().isIn(['123', 'password', 'god'])
    .withMessage('Do not use a common word as the password')
    .isLength({ min: 8, max:8 })
    .withMessage('The password must be 8 chars long and contain a number')
    .matches(/\d/),
    
    // check if password is same
    check('password')
    .custom((val, { req, loc, path}) => {
        if( val !== req.body.confirm) {
            throw new Error("Password do not match!");
        }
        else {
            return true;
        }
    }),
    // check if role is selected
    check('role')
    .isIn(['patient', 'physician', 'labTechnician'])
    .withMessage('Role is not selected'),  
    // check if sex is selected
    check('sex')
    .isIn(['male', 'female'])
    .withMessage('Sex is not selected'),      
    
    // backend validation //
    
    //check if email exist
    check('email').custom(value => {
        return User.find({ "email": value}).then(user => {
            if(user.length > 0) {
                return Promise.reject('Email already exist');
            }
            else {
                return true;
            }
        });
    }),
    
], userControllers.register);


router.post('/login', urlencodedParser,  
    passport.authenticate('local',  { failureRedirect: '/user/login/', failureFlash: true}),
    function(req,res,next){

        if (req.user.role === "patient") {
            res.locals.title = "Dashboard";
            res.redirect('/user/patient/dashboard');
        }
        else if(req.user.role === 'physician'){
            res.locals.title = "Dashboard";
            res.redirect('/user/physician/dashboard');
            
        }
        else if(req.user.role === 'labTechnician'){
            res.locals.title = "Dashboard";
            res.redirect('/user/labTechnician/dashboard');
            
        }
    
    
});

//patient routes

router.get('/patient/dashboard', ensureAuthentication, ensurePatientRole,  (req, res) => {
    res.locals.title = "Dashboard";
    if(req.user.role === "patient")
    res.render('patient-dashboard');
});

router.get('/patient/profile/:id', ensureAuthentication, ensurePatientRole, (req,res) => {
    res.locals.title = "Profile";
    res.render('view-profile', {
        moment:moment
    });
});

router.get('/patient/profile/edit/:id', ensureAuthentication, ensurePatientRole, (req,res) => {
    res.locals.title = "Profile";
    res.render('edit-profile', {
        moment:moment
    });
});

router.post('/patient/profile/edit/:id',ensureAuthentication, ensurePatientRole, urlencodedParser,[
    
    //front-end validation
    
        //check name
        check('name')
        .not()
    .isEmpty()
        .withMessage('Name is required'),
        // email must be an email
      check('email')
        .isEmail()
        .withMessage('must be a valid email'),
        // check if sex is selected
        check('sex')
            .isIn(['male', 'female'])
            .withMessage('Sex is not selected'),      

    ], userControllers.update);

router.get('/patient/access-control/', ensureAuthentication, ensurePatientRole, userControllers.getFacilitators, (req, res,next) => {
});

router.post('/patient/access-control/grantAccess/:id', ensureAuthentication, ensurePatientRole, urlencodedParser, userControllers.handlingGrantingAccessControl, (req, res, next) => {
});

router.post('/patient/access-control/removeAccess/:id', ensureAuthentication, ensurePatientRole, userControllers.handlingRemovingAccessControl, (req, res, next) => {
});

router.get('/patient/patient-medical-history/:id', ensureAuthentication, ensurePatientRole, userControllers.retrievePatientMedicalHistory, (req, res) => {
    /* res.locals.title = "Patient Medical History";
    res.render('view-medical-history'); */
});
router.post('/patient/view_decrypted_record',ensureAuthentication, ensurePatientRole, urlencodedParser, userControllers.viewPatientEHR)

//physician routes

router.get('/physician/profile/:id', ensureAuthentication, ensurePhysicianRole, (req,res) => {
    res.locals.title = "Profile";
    res.render('view-profile', {
        moment:moment
    });
});

router.get('/physician/profile/edit/:id', ensureAuthentication, ensurePhysicianRole, (req,res) => {
    res.locals.title = "Profile";
    res.render('edit-profile', {
        moment:moment
    });
});


router.get('/physician/dashboard', ensureAuthentication, ensurePhysicianRole,  (req, res) => {
    res.locals.title = "Dashboard";
    if(req.user.role === "physician")
    res.render('physician-dashboard');
});

router.get('/physician/create-ehr', ensureAuthentication, ensurePhysicianRole,userControllers.retrievingPatientsEmails, (req, res, next) => {
    /* res.locals.title = "Create EHR";
    res.render('create-ehr', {
        facilitator_name:req.user.name,
    }); */
});


router.get('/physician/patient-medical-history/:id', ensureAuthentication, ensurePhysicianRole, userControllers.retrievePatientsMedicalHistory, (req, res, next) => {
    
});

router.get('/physician/view_decrypted_record',ensureAuthentication, ensurePhysicianRole, urlencodedParser, userControllers.viewPatientsEHR)

router.post('/physician/profile/edit/:id',ensureAuthentication, ensurePhysicianRole, urlencodedParser,[
    
    //back-end validation
        //check name
    check('name')
        .not()
        .isEmpty()
        .withMessage('Name is required'),
        // email must be an email
    check('email')
        .isEmail()
        .withMessage('must be a valid email'),
        // check if sex is selected
    check('sex')
        .isIn(['male', 'female'])
        .withMessage('Sex is not selected'),      

    ], userControllers.update);

router.post('/physician/create-ehr/encryptRecordInstance', ensureAuthentication, ensurePhysicianRole, urlencodedParser,[
    check('recordName')
        .not()
        .isEmpty()
        .withMessage('Record name is required'),
    check('patientEmail')
        .isEmail()
        .withMessage('Patient selection is required'),
    check('avgBpm')
        .not()
        .isEmpty()
        .withMessage('Average BPM is required'),
    check('blood')
        .isIn(['A+', 'A-', 'B+','B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Blood type selection is required'),
    check('weight')
        .not()
        .isEmpty()
        .withMessage('Weight selection is required'),
    check('activityLevel')
        .not()
        .isIn('')
        .withMessage('Activity level selection is required'),
    check('height')
        .not()
        .isEmpty()        
        .withMessage('Height is required'),
    check('bloodPressure')
        .not()
        .isEmpty()        
        .withMessage('Blood pressure is required'),
    check('temperature')
        .not()
        .isEmpty()        
        .withMessage('Temperature is required'),
    check('primaryDiagnosis')
        .not()
        .isEmpty()        
        .withMessage('Primary diagnosis is required'),
    check('illnessAndDiseases')
        .not()
        .isEmpty()        
        .withMessage('Illnesses amd diseases are required'),
    check('symptoms')
        .not()
        .isEmpty()        
        .withMessage('Symptoms are required'),
    check('labTreatments')
        .not()
        .isEmpty()        
        .withMessage('Lab treatments are required'),
    check('medications')
        .not()
        .isEmpty()        
        .withMessage('Medications are required'),
    
], userControllers.encryptRecordInstance);
    
router.post('/physician/view_decrypted_record',ensureAuthentication, ensurePhysicianRole, urlencodedParser, userControllers.viewPatientsEHR)

//lab technician routes


router.get('/labTechnician/dashboard', ensureAuthentication, ensureLabTecRole, (req, res) => {
    res.locals.title = "Dashboard";
    if(req.user.role === "labTechnician")
    res.render('labTech-dashboard');
});
router.get('/labTechnician/patient-medical-history/:id', ensureAuthentication, ensureLabTecRole, userControllers.retrievePatientsMedicalHistory, (req, res, next) => {
    
});

router.get('/labTechnician/view_decrypted_record',ensureAuthentication, ensureLabTecRole, urlencodedParser,userControllers.viewPatientsEHR)

router.get('/labTechnician/profile/:id', ensureAuthentication, ensureLabTecRole, (req,res) => {
    res.locals.title = "Profile";
    res.render('view-profile', {
        moment:moment
    });
});

router.get('/labTechnician/profile/edit/:id', ensureAuthentication, ensureLabTecRole, (req,res) => {
    res.locals.title = "Profile";
    res.render('edit-profile', {
        moment:moment
    });
});


router.get('/labTechnician/add-lab-results', ensureAuthentication, ensureLabTecRole,userControllers.retrievingPatientsEmails, (req, res) => {
    res.locals.title = "Attach-Lab-Results";
    res.render('add-lab-results', {

    });
});

router.get('/labTechnician/remove-lab-results/:file', ensureAuthentication,ensureLabTecRole, userControllers.removeLabAttachment);

router.get('/labTechnician/patient-medical-history/:id', ensureAuthentication, ensureLabTecRole, (req, res) => {
    res.locals.title = "Patient Medical History";
    res.render('view-medical-history');
});

router.post('/labTechnician/profile/edit/:id',ensureAuthentication, ensureLabTecRole, urlencodedParser,[
    
    //back-end validation
    
        //check name
      check('name')
            .not()
            .isEmpty()
            .withMessage('Name is required'),
        // email must be an email
      check('email')
            .isEmail()
            .withMessage('must be a valid email'),
        // check if sex is selected
      check('sex')
            .isIn(['male', 'female'])
            .withMessage('Sex is not selected'),      

    ], userControllers.update);

router.post('/labTechnician/add-lab-results', ensureAuthentication,ensureLabTecRole, userControllers.uploadLabAttachment);

router.post('/labTechnician/add-lab-results/encryptLabAttachments', ensureAuthentication,ensureLabTecRole, urlencodedParser, [    
    //back-end validation
    //check patient Email
    check('patientEmail')
        .isEmail()
        .withMessage('Patient selection is required'),
        
], userControllers.encryptLabAttachments);

router.post('/labTechnician/view_decrypted_record',ensureAuthentication, ensureLabTecRole, urlencodedParser, userControllers.viewPatientsEHR)


function ensureAuthentication(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    else {
        req.flash('danger', 'Please login');
        res.redirect('/user/login')
    }
}

function ensurePatientRole(req, res, next){
    if(req.user.role === 'patient'){
        return next();
    }
    else {
        req.logout();
        req.flash('danger', 'Please login');
        res.redirect('/user/login')
    }
}

function ensurePhysicianRole(req, res, next){
    if(req.user.role === 'physician'){
        return next();
    }
    else {
        req.logout();
        req.flash('danger', 'Please login');
        res.redirect('/user/login')
    }
}

function ensureLabTecRole(req, res, next){
    if(req.user.role === 'labTechnician'){
        return next();
    }
    else {
        req.logout();
        req.flash('danger', 'Please login');
        res.redirect('/user/login')
    }
}





module.exports = router;
