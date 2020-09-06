const LocalStrategy = require('passport-local').Strategy;
const User = require('../modules/User');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
let urlencodedParser = bodyParser.urlencoded({ extended: false })



module.exports = function(passport){
    // Establish login local strategy
    passport.use( new LocalStrategy 
        (
        function(username, password, done) {
        // Match email
        let query = {email:username};
        User.findOne(query, function(err, user){
            if(err) throw err;
            // if user not exist return msg not found
            if(!user){
                return done(null, false, {
                    message: "Incorrect email/password"
                });
                
            }
            
            // Match password 
            bcrypt.compare(password, user.password,(err, isMatch) => {
                if(err) throw err;
                if(isMatch){
                    return done(null, user);
                } else {
                    return done(null, false, {
                        message: "Incorrect email/password"
                    });
                }

            });
        });

    }));
    
    passport.serializeUser(function(user, done) {
        done(null, user.id);
      });
      
      passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
          done(err, user);
        });
      });

}