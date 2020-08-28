const express = require('express');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');
const router = express.Router();
const User = require('../../models/User');
const { check, validationResult } = require('express-validator/check')
const request = require('request');
const config = require('config');   
const { response } = require('express');

router.get('/me',auth,async (req,res) => {
try {
    const profile= await Profile.findOne({user: req.user.id}).populate('user',['name','avatar']);
    if(!profile){
        return res.status(400).json({msg:'there is no profile'});
    }
    res.json(profile);  
} catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
}
});

router.post('/',[auth,[
    check('status','Status required').not().isEmpty(),
    check('skills','Skills required').not().isEmpty()
]],
async (req,res)=>{

const errors = validationResult(req);
if(!errors.isEmpty()){
    return res.status(400).json({ errors:errors.array()})
}
const {company,
website,
location,
bio,
status,
githubusername,
skills,
youtube,
facebook,
twitter,
instagram,
linkein
} = req.body;

const profileFields ={};
profileFields.user = req.user.id;
    //if (req.body.handle) profileFields.handle = req.body.handle;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    
    if (skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
      }

      profileFields.social={};
      if (youtube) profileFields.social.youtube = youtube;
      if (twitter) profileFields.social.twitter = twitter;
      if (facebook) profileFields.social.facebook = facebook;
      if (instagram) profileFields.social.instagram = instagram;
      //if (Linkedin) profileFields.social.Linkedin = Linkedin;

      //console.log(profileFields.social.twitter);
      try {
        let profile  = await Profile.findOne({ user: req.user.id });
          
                  if (profile) {
              // Update
             profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true }
              );
              return res.json(profile);
             }
             //Create
             profile = new Profile(profileFields);
             await profile.save();
             res.json(profile);
      } catch (error){
          console.error(error.message);
          res.status(500).send('Server Error');
      }

 
})

router.get('/', async (req,res)=>{
    try {
        
      const profiles = await Profile.find().populate('user',['name','avatar']);
      res.json(profiles);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('server error');
    }
});

router.get('/user/:user_id', async (req,res)=>{
    try {
        
      const profile = await Profile.findOne({user: req.params.user_id}).populate('user',['name','avatar']);
      if(!profile) return res.status(400).json({msg:'No profile found'});
      res.json(profile);
    } catch (error) {
        console.error(error.message);
        if(err.kind == 'ObjectId'){
            return res.status(400).json({msg:'No profile found'});
        }
        res.status(500).send('server error');
    }
});

router.delete('/',auth, async (req,res)=>{
    try {

        await Post.deleteMany({ user: req.user.id });
        
       await Profile.findOneAndRemove({ user:req.user_id});

       await User.findByIdAndRemove({_id: req.user.id});
       res.json({msg:'Deleted'});
    } catch (error) {
        console.error(error.message);
        res.status(500).send('server error');
    }
});

router.put('/experience',[auth,[
    check('title','Title is required').not().isEmpty(),
    check('company','company is required').not().isEmpty(),
    check('from','from date is required').not().isEmpty()  
]], 
async (req,res) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({error: errors.array()});
    }
    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;
    const newExp={
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }
    try {
        const profile = await Profile.findOne({user: req.user.id});
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);
    } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error')
        
    }
}
);

router.delete(
    '/experience/:exp_id',auth,
   async (req, res) => {
       try{
     const profile =await Profile.findOne({ user: req.user.id })
                // Get remove index
          const removeIndex = profile.experience
            .map(item => item.id)
            .indexOf(req.params.exp_id);
  
          // Splice out of array
          profile.experience.splice(removeIndex, 1);
  
          // Save
         await profile.save() 
          res.json(profile);
        }
        catch(err){
            console.error(err.message);
            res.status(404).send('Server Error');
        };
    })

    router.put('/education',[auth,[
        check('school','School is required').not().isEmpty(),
        check('degree','Degree is required').not().isEmpty(),
        check('fieldofstudy','Field is required').not().isEmpty(),
        check('from','from date is required').not().isEmpty()  
    ]], 
    async (req,res) =>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({error: errors.array()});
        }
        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } = req.body;
        const newEdu={
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        }
        try {
            const profile = await Profile.findOne({user: req.user.id});
            profile.education.unshift(newEdu);
            await profile.save();
            res.json(profile);
        } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error')
            
        }
    }
    );
    
    router.delete(
        '/education/:edu_id',auth,
       async (req, res) => {
           try{
         const profile =await Profile.findOne({ user: req.user.id })
                    // Get remove index
              const removeIndex = profile.education
                .map(item => item.id)
                .indexOf(req.params.edu_id);
      
              // Splice out of array
              profile.education.splice(removeIndex, 1);
      
              // Save
             await profile.save() 
              res.json(profile);
            }
            catch(err){
                console.error(err.message);
                res.status(404).send('Server Error');
            };
        })

        router.get('/github/:username',(req,res)=>{
            try {
                const options ={
                    uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get(
                        'githubClientId')}&clientsecret=${config.get('githubSecret')}`,
                    method:'Get',
                    headers: {'user-agent':'node.js'}
                }
                    request(options,(error, response,body)=>{
                        if(error) console.error(error);

                        if(response.statusCode != 200){
                            res.status(404).json({msg: 'No profile found'});
                        }
                        res.json(JSON.parse(body));
                    })
                
            } catch (err) {
                console.error(err.message);
                res.status(404).send('Server Error');
            }
        })

module.exports = router;