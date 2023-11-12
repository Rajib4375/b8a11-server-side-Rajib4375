const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser =require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser())


console.log(process.env.DB_PASS)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kjmj59i.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

  // middleware
  const logger = async(req, res, next)=>{
    console.log('called:', req.host, req.originalUrl)
    next();
    
  }
  const verifyToken = async(req, res, next) =>{
    const token = req.cookies?.token;
    console.log('value of token middleware', token)
    if(!token){
      return res.status(401).send({message:'not authorized'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
      // error
       if(err){
        console.log(err)
        return res.status(401).send({message : 'unauthorized'})
       }
      // decoded
      console.log('value in the token', decoded)
      req.user = decoded;
      next()
    })
   
  }


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
  
  const jobsCollection = client.db('careerHub').collection('jobs');

  const jobApplyCollection = client.db('careerHub').collection('jobApplyed');


// auth related Api
app.post('/jwt', logger, async(req, res)=>{
  const user = req.body;
  console.log(user);
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
  res
  .cookie('token', token, {
    httpOnly:true,
    secure: process.env.ACCESS_TOKEN_SECRET === 'production',
    sameSite: process.env.ACCESS_TOKEN_SECRET === 'production'? 'none' :'strict'
  })
  .send({success: true})
})


// jobs related api
  app.get('/jobs/:job_category', async(req, res)=>{
    const jobCategory = req.params.job_category;
    const coursor = jobsCollection.find({job_category:jobCategory});
    const result = await coursor.toArray();
    res.send(result)

  })


  app.get('/jobs', logger,  async(req,res)=>{
    const coursor = jobsCollection.find();
    const result = await coursor.toArray();
    res.send(result)
  })

 app.get('/job/:id', async(req, res)=>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await jobsCollection.findOne(query);
  res.send(result)
 })
 


  app.post('/jobs', async(req, res)=>{
    const newJobs = req.body;
    console.log(newJobs);
   const result = await jobsCollection.insertOne(newJobs);
   res.send(result);

  });
  app.put('/jobs/:id', async(req, res)=>{
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)}
    const options = {upsert: true}
    const updatedJob = req.body;
    const Job = {
      $set:{
        company_name: updatedJob.company_name,
         job_title: updatedJob.job_title, 
         job_category: updatedJob.job_category,
          job_posting_date: updatedJob.job_posting_date,
           application_deadline: updatedJob.application_deadline,
           compony_logo: updatedJob.compony_logo,
            salary_range: updatedJob.salary_range
      }
    }
     const result = await jobsCollection.updateOne(filter, Job, options);
     res.send(result);
  })

  app.delete('/jobs/:id', async(req, res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await jobsCollection.deleteOne(query);
    res.send(result);
  })

  // job apply

  app.get('/jobApplyed', logger, verifyToken, async(req, res)=>{
    console.log(req.query.email);
    // console.log('token', req.cookies.token)
    console.log('valid token', req.user)
    if(req.query.email !== req.user.email){
      return res.status(403).send({message: 'forbidden access'})
    }
    let query ={};
    if(req.query?.email){
      query={email: req.query.email}
    }
    
    const result = await jobApplyCollection.find(query).toArray();
    res.send(result)
  })



  app.post('/jobApplyed', verifyToken, async(req, res)=>{
     const jobApply = req.body;
     console.log(jobApply)
     const result = await jobApplyCollection.insertOne(jobApply);
     res.send(result)
  })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req, res)=>{
    res.send('career is running')
})


app.listen(port, ()=>{
    console.log(`career server is running on port ${port}`)
})
