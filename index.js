const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

  const jobsCollection = client.db('careerHub').collection('jobs');

  const jobApplyCollection = client.db('careerHub').collection('jobApplyed')


  app.get('/jobs/:job_category', async(req, res)=>{
    const jobCategory = req.params.job_category;
    const coursor = jobsCollection.find({job_category:jobCategory});
    const result = await coursor.toArray();
    res.send(result)

  })


  app.get('/jobs', async(req,res)=>{
    const coursor = jobsCollection.find();
    const result = await coursor.toArray();
    res.send(result)
  })

  app.post('/jobs', async(req, res)=>{
    const newJobs = req.body;
    console.log(newJobs);
   const result = await jobsCollection.insertOne(newJobs);
   res.send(result);

  })

  // job apply
  app.post('/jobApplyed', async(req, res)=>{
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
