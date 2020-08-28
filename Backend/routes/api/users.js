const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const { check, validationResult } = require('express-validator/check')

const User  = require('../../models/User');

router.post('/', [
    check('name','Name is Required').not().isEmpty(),
    check('email','Please include a vlaid email').isEmail(),
    check('password','Please enter a password with 6 or more characters').isLength({min:6})

],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }
  const { name, email,password} = req.body;
try{
  let user = await User.findOne({ email});
    if (user) {
      errors.email = 'Email already exists';
      return res.status(400).json({msg:'Email already exists'});
    } 
      const avatar = gravatar.url(email, {
        s: '200', // Size
        r: 'pg', // Rating
        d: 'mm' // Default
       }); 
    
    
        user = new User({
        name,
        email,
        avatar,
        password
        });
      

     const salt = await bcrypt.genSalt(10) 

     user.password = await bcrypt.hash(password, salt); 
          await user.save();
          //res.send('User registered');

          const payload = {
              user: {
                  id:user.id
              }
          }
          jwt.sign(payload, config.get('jwtToken'),
          { expiresIn: 360000},
          (err, token)=>{
              if(err) throw err;
              res.json({token});
          }
          );
    }
    catch(err) {
        console.error(err.message);
    }     
      
        }
);


module.exports = router;