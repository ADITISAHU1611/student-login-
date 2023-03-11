const express = require('express')
const bodyparser = require('body-parser')
const fs = require('fs');
const path = require('path')
const mysql = require('mysql')
const multer = require('multer')
const csv = require('fast-csv');
 
const app = express()
app.use(express.static("./public"))
app.use(express.static(path.join(__dirname, '/static')));
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({
    extended: true
}))
var storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './uploads/')    
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
 
var upload = multer({
    storage: storage
});
// Database connection
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "Student"
})
pool.getConnection(function(err)
{
    if(err)
    {
        throw err;

    }
    console.log("connected");
})
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html');
  });
app.post('/auth',function(req,res){
    let username=req.body.username;
    let password=req.body.password;
    if(username && password)
    {
        res.redirect('/login');
    }
    else{
        res.send('Missing Username or Password');
        res.end();
    }
});
app.get('/login',function(req,res)
{
    res.write('<h1>Student</h1>');
   
    res.write("List of All Students in DataBase");
    
   fetchData(res);
   res.write('<br>');
   console.log('Display');
   
});
app.get('/import', (req, res) => {
    
    res.sendFile(__dirname + '/index.html');
    
  });
 
  
  function executeQuery(sql,cb)
  {
    pool.query(sql,function(error,result,fields){
        if(error)
        {
            throw error;
        }
        cb(result);
    })
  }
  function fetchData(res)
  {
    executeQuery("Select * from student_info",function(result){
       console.log(result); 
       res.write('<table border="1" style="width:50%"><tr>');
       for(var column in result[0])
       {
        res.write('<th>'+column+'</th>');
        
       }
       for(var row in result)
       {
        res.write('<tr>');
        for(var column in result[row])
        {
            res.write('</tr>');
            res.write('<td><label>'+result[row][column]+'<lable></td');
            
        }
        res.write('</tr>');
       }
       res.end('</table>');

    })
   // res.sendFile(__dirname + '/index.html');
  }
  app.post('/import-csv', upload.single("import-csv"), (req, res) =>{
    console.log(req.file.path)
    uploadCsv(__dirname + '/uploads/' + req.file.filename);
    res.send("data imported")
});
function uploadCsv(uriFile){
    let stream = fs.createReadStream(uriFile);
    let csvDataColl = [];
    let fileStream = csv
        .parse()
        .on("data", function (data) {
            csvDataColl.push(data);
        })
        .on("end", function () {
            csvDataColl.shift();
            
            pool.getConnection((error,connection) => {
                if (error) {
                    console.error(error);
                } else {
                    let query = 'INSERT INTO student_info (Name,Roll_No,Address,Institute,Course) VALUES ?';
                    connection.query(query, [csvDataColl], (error, res) => {
                        console.log(error || res);
                    });
                }
            });

            fs.unlinkSync(uriFile)
            
        });
  
    stream.pipe(fileStream);
}
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Node app serving on port: ${PORT}`))